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
  // Store capacity: 2 prep stations and 2 delivery drivers
  CONCURRENT_PREP_STATIONS: 2, // 2 active orders packed concurrently in store
  CONCURRENT_DELIVERY_DRIVERS: 2, // 2 delivery drivers for store deliveries
  MIN_PREP_MINUTES: 7,         // Minimum preparation time (7 min)
  MAX_PREP_MINUTES: 20,        // Maximum preparation time (20 min)
  BASE_PREP_MINUTES: 4,        // Order box, invoice, packaging setup & QA inspection
  ITEM_BASE_MINUTES: 1.2,      // Picking & inspection per unique line item
  WEIGHED_UNIT_PER_KG: 0.40,   // Additional time per kg for precision weighing
  PACKAGED_UNIT_RATE: 0.20,    // Additional time per packaged unit
  SPECIAL_NOTE_MINUTES: 1.5,   // Time to review and execute custom customer instruction

  // Transit & dispatch parameters
  DELIVERY_HANDOFF_BUFFER: 6,  // Courier pickup, packing onto bike/van, building access & handoff
  MINUTES_PER_KM: 2.8,         // Average transit speed in local urban/suburban terrain (~21 km/h)
  MIN_DELIVERY_MINUTES: 5,     // Minimum transit time even for immediate neighbors
  DRIVER_ROUNDTRIP_FACTOR: 1.6, // Round-trip transit factor before courier is back at store
};

/**
 * Calculate preparation time in minutes based on actual items in the basket/order.
 * Strictly bounded between 7 and 20 minutes.
 * @param {Array} items - Array of order items ({ qty, unit, instruction, ... })
 * @returns {number} Estimated prep time in integer minutes (7 to 20 mins)
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

  return Math.min(ETA_CONFIG.MAX_PREP_MINUTES, Math.max(ETA_CONFIG.MIN_PREP_MINUTES, Math.round(totalPrep)));
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
 * Calculate the store queue wait time using a dual-resource parallel scheduling algorithm:
 * - 2 Preparation Stations
 * - 2 Delivery Couriers / Drivers
 * Accurately accounts for driver availability when multiple orders are in queue.
 *
 * @param {Array} activeOrders - Array of active order objects (sorted FIFO)
 * @param {string|null} beforeOrderId - If provided, returns queue wait time for this specific order
 * @param {number|null} newOrderPrepMins - Optional prep minutes for new order
 * @returns {number} Queue wait time in minutes before preparation/dispatch
 */
export const calculateQueueWaitMinutes = (activeOrders = [], beforeOrderId = null, newOrderPrepMins = null) => {
  if (!Array.isArray(activeOrders) || activeOrders.length === 0) {
    return 0;
  }

  const now = Date.now();
  // Timelines (in minutes from now)
  const prepStations = [0, 0];       // 2 Prep packing stations
  const deliveryDrivers = [0, 0];    // 2 Delivery drivers

  // If beforeOrderId was specified and it's already in 'Preparing' or 'On the Way', queue wait is 0
  if (beforeOrderId) {
    const targetOrder = activeOrders.find(o => String(o._id || o.id || '') === String(beforeOrderId));
    if (targetOrder && (targetOrder.status === 'Preparing' || targetOrder.status === 'On the Way')) {
      return 0;
    }
  }

  // 1. Schedule orders currently 'On the Way' (occupying delivery drivers)
  for (const order of activeOrders) {
    const status = order.status || 'Pending';
    if (status !== 'On the Way') continue;

    const dispatchTime = order.dispatchedAt ? new Date(order.dispatchedAt).getTime() : now;
    const elapsedMinutes = Math.max(0, Math.floor((now - dispatchTime) / 60000));
    const dist = order.customerInfo?.distanceKm ?? order.distanceKm ?? null;
    const delivMins = Number(order.estimatedDeliveryMinutes || calculateDeliveryMinutes(dist) || 10);
    const roundTripMins = Math.round(delivMins * ETA_CONFIG.DRIVER_ROUNDTRIP_FACTOR);
    const remainingDriverTime = Math.max(1, roundTripMins - elapsedMinutes);

    // Occupy earliest available driver
    const driverIdx = deliveryDrivers[0] <= deliveryDrivers[1] ? 0 : 1;
    deliveryDrivers[driverIdx] += remainingDriverTime;
  }

  // 2. Schedule orders currently 'Preparing' (occupying prep stations, then requesting drivers)
  for (const order of activeOrders) {
    const status = order.status || 'Pending';
    if (status !== 'Preparing') continue;

    const items = order.orderItems || order.items || [];
    const estimatedPrep = Number(order.estimatedPrepMinutes || order.eta?.prepMinutes || calculateOrderPrepMinutes(items));
    const prepStart = order.prepStartedAt || order.eta?.prepStartedAt ? new Date(order.prepStartedAt || order.eta?.prepStartedAt).getTime() : now;
    const elapsedMinutes = Math.max(0, Math.floor((now - prepStart) / 60000));
    const remainingPrep = Math.max(1, estimatedPrep - elapsedMinutes);

    // Occupy earliest prep station
    const stationIdx = prepStations[0] <= prepStations[1] ? 0 : 1;
    prepStations[stationIdx] += remainingPrep;
    const readyTime = prepStations[stationIdx];

    // Assign driver once ready
    const driverIdx = deliveryDrivers[0] <= deliveryDrivers[1] ? 0 : 1;
    const dispatchTime = Math.max(readyTime, deliveryDrivers[driverIdx]);
    const dist = order.customerInfo?.distanceKm ?? order.distanceKm ?? null;
    const delivMins = Number(order.estimatedDeliveryMinutes || calculateDeliveryMinutes(dist) || 10);
    deliveryDrivers[driverIdx] = dispatchTime + Math.round(delivMins * ETA_CONFIG.DRIVER_ROUNDTRIP_FACTOR);
  }

  // 3. Schedule 'Pending' orders in FIFO sequence
  for (const order of activeOrders) {
    const status = order.status || 'Pending';
    if (status !== 'Pending') continue;

    const orderIdStr = String(order._id || order.id || '');
    const items = order.orderItems || order.items || [];
    const estimatedPrep = Number(order.estimatedPrepMinutes || order.eta?.prepMinutes || calculateOrderPrepMinutes(items));

    // Earliest prep station available
    const stationIdx = prepStations[0] <= prepStations[1] ? 0 : 1;
    const prepStartTime = prepStations[stationIdx];
    const readyTime = prepStartTime + estimatedPrep;

    // Earliest driver available
    const driverIdx = deliveryDrivers[0] <= deliveryDrivers[1] ? 0 : 1;
    const dispatchTime = Math.max(readyTime, deliveryDrivers[driverIdx]);

    if (beforeOrderId && orderIdStr === String(beforeOrderId)) {
      // Return queue wait delay before this order is dispatched (beyond its prep)
      const queueWait = Math.max(0, dispatchTime - estimatedPrep);
      return Math.round(queueWait);
    }

    // Update timelines for this pending order
    prepStations[stationIdx] = readyTime;
    const dist = order.customerInfo?.distanceKm ?? order.distanceKm ?? null;
    const delivMins = Number(order.estimatedDeliveryMinutes || calculateDeliveryMinutes(dist) || 10);
    deliveryDrivers[driverIdx] = dispatchTime + Math.round(delivMins * ETA_CONFIG.DRIVER_ROUNDTRIP_FACTOR);
  }

  // 4. For a new order (e.g. at Checkout)
  const targetPrep = newOrderPrepMins != null ? Number(newOrderPrepMins) : ETA_CONFIG.MIN_PREP_MINUTES;
  const prepStartTime = Math.min(prepStations[0], prepStations[1]);
  const readyTime = prepStartTime + targetPrep;
  const driverAvailableTime = Math.min(deliveryDrivers[0], deliveryDrivers[1]);
  const dispatchTime = Math.max(readyTime, driverAvailableTime);
  const newOrderQueueWait = Math.max(0, dispatchTime - targetPrep);

  return Math.round(newOrderQueueWait);
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
