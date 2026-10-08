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
  CONCURRENT_PREP_STATIONS: 2,
  BASE_PREP_MINUTES: 3,
  ITEM_BASE_MINUTES: 1.0,
  WEIGHED_UNIT_PER_KG: 0.35,
  PACKAGED_UNIT_RATE: 0.15,
  SPECIAL_NOTE_MINUTES: 1.5,
  DELIVERY_HANDOFF_BUFFER: 6,
  MINUTES_PER_KM: 2.8,
  MIN_DELIVERY_MINUTES: 5,
  MIN_PREP_MINUTES: 5,
};

/**
 * Calculate preparation time in minutes based on items in the cart or order.
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

  return Math.max(ETA_CONFIG.MIN_PREP_MINUTES, Math.round(totalPrep));
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
 * Calculate queue wait time from active orders.
 */
export const calculateQueueWaitMinutes = (activeOrders = [], beforeOrderId = null) => {
  if (!Array.isArray(activeOrders) || activeOrders.length === 0) {
    return 0;
  }

  const now = Date.now();
  let remainingWorkloadMinutes = 0;

  for (const order of activeOrders) {
    const orderIdStr = String(order._id || order.id || '');
    if (beforeOrderId && orderIdStr === String(beforeOrderId)) {
      break;
    }

    const status = order.status || 'Pending';
    if (status === 'Cancelled' || status === 'Delivered' || status === 'On the Way') {
      continue;
    }

    const items = order.orderItems || order.items || [];
    const estimatedPrep = Number(order.estimatedPrepMinutes || order.eta?.prepMinutes || calculateOrderPrepMinutes(items));

    if (status === 'Preparing') {
      const prepStart = order.prepStartedAt || order.eta?.prepStartedAt ? new Date(order.prepStartedAt || order.eta?.prepStartedAt).getTime() : now;
      const elapsedMinutes = Math.max(0, Math.floor((now - prepStart) / 60000));
      const remainingPrep = Math.max(1, estimatedPrep - elapsedMinutes);
      remainingWorkloadMinutes += remainingPrep;
    } else if (status === 'Pending') {
      remainingWorkloadMinutes += estimatedPrep;
    }
  }

  const waitMinutes = Math.round(remainingWorkloadMinutes / ETA_CONFIG.CONCURRENT_PREP_STATIONS);
  return Math.max(0, waitMinutes);
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
