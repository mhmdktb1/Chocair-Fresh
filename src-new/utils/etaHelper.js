/**
 * ===================================================================
 * DYNAMIC DELIVERY ETA HELPER (Frontend)
 * ===================================================================
 *
 * Provides real-time dynamic ETA calculation, formatting, and live countdown timers:
 * - Prep time based on basket contents, quantities, weighing, & instructions
 * - Delivery time based on distance in km
 * - 15-minute window generation (e.g. "30–45 min")
 * - Live preparation and transit countdown timers
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
 * Calculate preparation time in minutes based on items in the cart or order.
 * Strictly bounded between 7 and 20 minutes.
 */
export const calculateOrderPrepMinutes = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    return ETA_CONFIG.MIN_PREP_MINUTES;
  }

  let totalPrep = ETA_CONFIG.BASE_PREP_MINUTES;

  for (const item of items) {
    totalPrep += ETA_CONFIG.ITEM_BASE_MINUTES;

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

    const note = (item.instruction || item.instructions || item.specialInstructions || item.note || '').trim();
    if (note.length > 0) {
      totalPrep += ETA_CONFIG.SPECIAL_NOTE_MINUTES;
    }
  }

  return Math.min(ETA_CONFIG.MAX_PREP_MINUTES, Math.max(ETA_CONFIG.MIN_PREP_MINUTES, Math.round(totalPrep)));
};

/**
 * Calculate delivery transit time based on distance in km.
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
 * Calculate 15-minute ETA window (e.g., 30–45 min).
 */
export const calculateEtaWindow = (totalMinutes) => {
  if (totalMinutes == null || isNaN(Number(totalMinutes)) || totalMinutes <= 0) {
    return null;
  }

  const rounded = Number(totalMinutes);
  const min = Math.max(10, Math.round((rounded - 7.5) / 5) * 5);
  const max = min + 15;

  return {
    min,
    max,
    text: `${min}–${max} min`,
  };
};

/**
 * Calculate queue wait time using a dual-resource parallel scheduling algorithm:
 * - 2 Preparation Stations
 * - 2 Delivery Couriers / Drivers
 * Accurately accounts for driver availability when multiple orders are in queue.
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
 * Format total seconds into MM:SS string.
 */
export const formatCountdownTimer = (totalSeconds) => {
  if (totalSeconds == null || isNaN(totalSeconds) || totalSeconds <= 0) {
    return '00:00';
  }
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  const formattedMins = String(mins).padStart(2, '0');
  const formattedSecs = String(secs).padStart(2, '0');
  return `${formattedMins}:${formattedSecs}`;
};

/**
 * Format expected arrival time range (e.g. "5:15 PM – 5:30 PM").
 */
export const formatArrivalTimeWindow = (minMinutes, maxMinutes) => {
  if (minMinutes == null || maxMinutes == null) return '';
  const now = new Date();
  const minTime = new Date(now.getTime() + minMinutes * 60000);
  const maxTime = new Date(now.getTime() + maxMinutes * 60000);

  const formatTime = (d) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${formatTime(minTime)} – ${formatTime(maxTime)}`;
};

/**
 * Get remaining preparation countdown seconds for an active order.
 */
export const getRemainingPrepSeconds = (order) => {
  if (!order || order.status !== 'Preparing') return 0;
  const items = order.orderItems || order.items || [];
  const prepMinutes = Number(order.estimatedPrepMinutes || order.eta?.prepMinutes || calculateOrderPrepMinutes(items));
  const prepStart = order.prepStartedAt || order.eta?.prepStartedAt ? new Date(order.prepStartedAt || order.eta?.prepStartedAt).getTime() : Date.now();
  const elapsedSecs = Math.max(0, Math.floor((Date.now() - prepStart) / 1000));
  const totalSecs = prepMinutes * 60;
  return Math.max(0, totalSecs - elapsedSecs);
};

/**
 * Get remaining delivery countdown seconds for an order in transit ("On the Way").
 */
export const getRemainingDeliverySeconds = (order) => {
  if (!order || order.status !== 'On the Way') return 0;
  const dist = order.customerInfo?.distanceKm ?? order.distanceKm ?? null;
  const deliveryMinutes = Number(order.estimatedDeliveryMinutes || order.eta?.deliveryMinutes || calculateDeliveryMinutes(dist) || 10);
  const dispatchTime = order.dispatchedAt || order.eta?.dispatchedAt ? new Date(order.dispatchedAt || order.eta?.dispatchedAt).getTime() : Date.now();
  const elapsedSecs = Math.max(0, Math.floor((Date.now() - dispatchTime) / 1000));
  const totalSecs = deliveryMinutes * 60;
  return Math.max(0, totalSecs - elapsedSecs);
};
