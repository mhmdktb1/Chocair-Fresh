/**
 * ===================================================================
 * DYNAMIC DELIVERY ETA CALCULATION ENGINE (Chocair Fresh)
 * ===================================================================
 *
 * Fully dynamic ETA engine based on real-world workload:
 * 1. Preparation Time: Calculated from item types, quantities, weighing needs & custom notes.
 * 2. Queue Wait Time: Calculated from all active orders currently in Pending/Preparing states.
 * 3. Delivery Time: Calculated from exact distance using urban transit speeds & handoff buffer.
 * 4. 15-Minute Window: Formatted bracket e.g. "30–45 min".
 * 5. Lifecycle Synchronization: Live countdowns during "Preparing" and "On the Way".
 */

export const ETA_CONFIG = {
  // Store prep capacity
  CONCURRENT_PREP_STATIONS: 2, // 2 active orders packed concurrently in store
  BASE_PREP_MINUTES: 3,        // Order box, invoice, packaging setup & QA inspection
  ITEM_BASE_MINUTES: 1.0,      // Picking & inspection per unique line item
  WEIGHED_UNIT_PER_KG: 0.35,   // Additional time per kg for precision weighing
  PACKAGED_UNIT_RATE: 0.15,    // Additional time per packaged unit
  SPECIAL_NOTE_MINUTES: 1.5,   // Time to review and execute custom customer instruction

  // Transit & dispatch parameters
  DELIVERY_HANDOFF_BUFFER: 6,  // Courier pickup, packing onto bike/van, building access & handoff
  MINUTES_PER_KM: 2.8,         // Average transit speed in local urban/suburban terrain (~21 km/h)
  MIN_DELIVERY_MINUTES: 5,     // Minimum transit time even for immediate neighbors
  MIN_PREP_MINUTES: 5,         // Minimum prep time for any valid order
};

/**
 * Calculate preparation time in minutes based on actual items in the basket/order.
 * @param {Array} items - Array of order items ({ qty, unit, instruction, ... })
 * @returns {number} Estimated prep time in integer minutes
 */
export const calculateOrderPrepMinutes = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    return ETA_CONFIG.MIN_PREP_MINUTES;
  }

  let totalPrep = ETA_CONFIG.BASE_PREP_MINUTES;

  for (const item of items) {
    // 1. Line item base pick time
    totalPrep += ETA_CONFIG.ITEM_BASE_MINUTES;

    // 2. Quantity & unit weighting scaling
    const qty = Number(item.qty || item.quantity || 1);
    const unit = String(item.unit || '').toLowerCase();
    const isWeighed = unit.includes('kg') || unit.includes('500g') || unit.includes('200g') || unit.includes('g');

    if (qty > 1) {
      if (isWeighed) {
        totalPrep += Math.min(6, (qty - 1) * ETA_CONFIG.WEIGHED_UNIT_PER_KG);
      } else {
        totalPrep += Math.min(3, (qty - 1) * ETA_CONFIG.PACKAGED_UNIT_RATE);
      }
    }

    // 3. Special customer instruction overhead
    const note = (item.instruction || item.instructions || item.specialInstructions || item.note || '').trim();
    if (note.length > 0) {
      totalPrep += ETA_CONFIG.SPECIAL_NOTE_MINUTES;
    }
  }

  return Math.max(ETA_CONFIG.MIN_PREP_MINUTES, Math.round(totalPrep));
};

/**
 * Calculate delivery transit time in minutes based on distance from store.
 * @param {number|null} distanceKm - Distance in kilometers
 * @returns {number|null} Estimated delivery transit time in minutes, or null if distance is unknown
 */
export const calculateDeliveryMinutes = (distanceKm) => {
  if (distanceKm == null || isNaN(Number(distanceKm))) {
    return null;
  }

  const dist = Math.max(0.1, Number(distanceKm));
  const transitTime = ETA_CONFIG.DELIVERY_HANDOFF_BUFFER + (dist * ETA_CONFIG.MINUTES_PER_KM);
  return Math.max(ETA_CONFIG.MIN_DELIVERY_MINUTES, Math.round(transitTime));
};

/**
 * Compute the 15-minute ETA window (e.g., "30–45 min").
 * @param {number|null} totalMinutes - Total estimated minutes
 * @returns {{ min: number, max: number, text: string } | null}
 */
export const calculateEtaWindow = (totalMinutes) => {
  if (totalMinutes == null || isNaN(Number(totalMinutes)) || totalMinutes <= 0) {
    return null;
  }

  const rounded = Number(totalMinutes);
  // Center the 15-minute window nicely around totalMinutes rounded to steps of 5
  const min = Math.max(10, Math.round((rounded - 7.5) / 5) * 5);
  const max = min + 15;

  return {
    min,
    max,
    text: `${min}–${max} min`,
  };
};

/**
 * Calculate the store queue wait time using a discrete 2-station parallel scheduling algorithm.
 * Simulates real store packing stations to calculate the exact minute
 * an active or new order can begin preparation.
 *
 * @param {Array} activeOrders - Array of active order objects (sorted FIFO)
 * @param {string|null} beforeOrderId - If provided, returns wait time until this specific order starts
 * @returns {number} Queue wait time in minutes until preparation starts
 */
export const calculateQueueWaitMinutes = (activeOrders = [], beforeOrderId = null) => {
  if (!Array.isArray(activeOrders) || activeOrders.length === 0) {
    return 0;
  }

  const now = Date.now();
  // Array tracking when each station (Station 1, Station 2) will next become idle (in minutes from now)
  const stationAvailability = [0, 0];

  // If beforeOrderId was specified and it's already in 'Preparing' status, its wait time is 0
  if (beforeOrderId) {
    const targetOrder = activeOrders.find(o => String(o._id || o.id || '') === String(beforeOrderId));
    if (targetOrder && targetOrder.status === 'Preparing') {
      return 0;
    }
  }

  // 1. First schedule all currently "Preparing" orders to their active stations
  for (const order of activeOrders) {
    const status = order.status || 'Pending';
    if (status !== 'Preparing') continue;

    const items = order.orderItems || order.items || [];
    const estimatedPrep = Number(order.estimatedPrepMinutes || order.eta?.prepMinutes || calculateOrderPrepMinutes(items));
    const prepStart = order.prepStartedAt || order.eta?.prepStartedAt ? new Date(order.prepStartedAt || order.eta?.prepStartedAt).getTime() : now;
    const elapsedMinutes = Math.max(0, Math.floor((now - prepStart) / 60000));
    const remainingPrep = Math.max(1, estimatedPrep - elapsedMinutes);

    // Assign to the station that becomes free first
    const earliestStationIdx = stationAvailability[0] <= stationAvailability[1] ? 0 : 1;
    stationAvailability[earliestStationIdx] += remainingPrep;
  }

  // 2. Schedule "Pending" orders in strict FIFO sequence
  for (const order of activeOrders) {
    const status = order.status || 'Pending';
    if (status !== 'Pending') continue;

    const orderIdStr = String(order._id || order.id || '');
    // If target order reached, its wait time is when the next station opens
    if (beforeOrderId && orderIdStr === String(beforeOrderId)) {
      const waitTime = Math.min(stationAvailability[0], stationAvailability[1]);
      return Math.max(0, Math.round(waitTime));
    }

    const items = order.orderItems || order.items || [];
    const estimatedPrep = Number(order.estimatedPrepMinutes || order.eta?.prepMinutes || calculateOrderPrepMinutes(items));

    // Order begins at earliest available station
    const earliestStationIdx = stationAvailability[0] <= stationAvailability[1] ? 0 : 1;
    stationAvailability[earliestStationIdx] += estimatedPrep;
  }

  // 3. For a new order (e.g. at Checkout), its wait time is when the next station becomes free
  const newOrderWaitTime = Math.min(stationAvailability[0], stationAvailability[1]);
  return Math.max(0, Math.round(newOrderWaitTime));
};

/**
 * Calculate real-time dynamic ETA for an existing order.
 * @param {Object} order - The order document
 * @param {Array} activeOrders - Current active orders list for queue calculation
 * @returns {Object} Enriched dynamic ETA data
 */
export const computeDynamicOrderEta = (order, activeOrders = []) => {
  if (!order) return null;

  const items = order.orderItems || order.items || [];
  const distanceKm = order.customerInfo?.distanceKm ?? order.distanceKm ?? null;
  const status = order.status || 'Pending';
  const now = Date.now();

  const prepMinutes = Number(order.estimatedPrepMinutes || calculateOrderPrepMinutes(items));
  const deliveryMinutes = Number(order.estimatedDeliveryMinutes || calculateDeliveryMinutes(distanceKm));

  let queueMinutes = 0;
  let remainingMinutes = null;
  let window = null;
  let prepRemainingSeconds = 0;
  let deliveryRemainingSeconds = 0;

  if (status === 'Pending') {
    queueMinutes = calculateQueueWaitMinutes(activeOrders, order._id || order.id);
    if (deliveryMinutes != null) {
      const totalMinutes = queueMinutes + prepMinutes + deliveryMinutes;
      window = calculateEtaWindow(totalMinutes);
      remainingMinutes = totalMinutes;
    }
  } else if (status === 'Preparing') {
    queueMinutes = 0;
    const prepStart = order.prepStartedAt ? new Date(order.prepStartedAt).getTime() : now;
    const elapsedSecs = Math.max(0, Math.floor((now - prepStart) / 1000));
    const totalPrepSecs = prepMinutes * 60;
    prepRemainingSeconds = Math.max(0, totalPrepSecs - elapsedSecs);
    const remainingPrepMins = Math.ceil(prepRemainingSeconds / 60);

    if (deliveryMinutes != null) {
      const totalMinutes = remainingPrepMins + deliveryMinutes;
      window = calculateEtaWindow(Math.max(10, totalMinutes));
      remainingMinutes = totalMinutes;
    } else {
      remainingMinutes = remainingPrepMins;
    }
  } else if (status === 'On the Way') {
    queueMinutes = 0;
    prepRemainingSeconds = 0;
    const dispatchTime = order.dispatchedAt ? new Date(order.dispatchedAt).getTime() : (order.prepCompletedAt ? new Date(order.prepCompletedAt).getTime() : now);
    const elapsedSecs = Math.max(0, Math.floor((now - dispatchTime) / 1000));
    const targetDeliveryMins = deliveryMinutes || 10;
    const totalDeliverySecs = targetDeliveryMins * 60;
    deliveryRemainingSeconds = Math.max(0, totalDeliverySecs - elapsedSecs);
    const remainingDeliveryMins = Math.max(1, Math.ceil(deliveryRemainingSeconds / 60));

    remainingMinutes = remainingDeliveryMins;
    window = calculateEtaWindow(Math.max(10, remainingDeliveryMins + 5));
  } else if (status === 'Delivered') {
    remainingMinutes = 0;
    window = { min: 0, max: 0, text: 'Delivered' };
  } else if (status === 'Cancelled') {
    remainingMinutes = 0;
    window = { min: 0, max: 0, text: 'Cancelled' };
  }

  return {
    prepMinutes,
    queueMinutes,
    deliveryMinutes,
    totalMinutes: remainingMinutes,
    remainingMinutes,
    windowText: window ? window.text : null,
    minWindowMinutes: window ? window.min : null,
    maxWindowMinutes: window ? window.max : null,
    prepRemainingSeconds,
    deliveryRemainingSeconds,
    prepStartedAt: order.prepStartedAt || null,
    prepCompletedAt: order.prepCompletedAt || null,
    dispatchedAt: order.dispatchedAt || null,
    deliveredAt: order.deliveredAt || null,
    actualPrepMinutes: order.actualPrepMinutes || null,
    status,
  };
};

/**
 * Preview dynamic ETA for checkout before order is placed.
 * @param {Array} cartItems - Items in checkout cart
 * @param {number|null} distanceKm - Calculated distance in km
 * @param {Array} activeOrders - Current active orders in system
 * @returns {Object}
 */
export const previewCheckoutEta = (cartItems = [], distanceKm = null, activeOrders = []) => {
  const prepMinutes = calculateOrderPrepMinutes(cartItems);
  const queueMinutes = calculateQueueWaitMinutes(activeOrders);
  const deliveryMinutes = calculateDeliveryMinutes(distanceKm);

  let totalMinutes = null;
  let window = null;

  if (deliveryMinutes != null) {
    totalMinutes = queueMinutes + prepMinutes + deliveryMinutes;
    window = calculateEtaWindow(totalMinutes);
  }

  return {
    hasLocation: deliveryMinutes != null,
    prepMinutes,
    queueMinutes,
    deliveryMinutes,
    totalMinutes,
    windowText: window ? window.text : null,
    minWindowMinutes: window ? window.min : null,
    maxWindowMinutes: window ? window.max : null,
    activeOrdersCount: activeOrders.length,
  };
};
