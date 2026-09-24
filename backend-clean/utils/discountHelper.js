/**
 * Centralized Discount Calculation Utility for Chocair Fresh
 * Supports percentage discounts, fixed amount discounts, active/inactive states,
 * and optional validity start/end date ranges.
 */

export const calculateProductDiscount = (product) => {
  const basePrice = Number(product?.price || 0);
  const discount = product?.discount || {};

  const defaultResult = {
    isDiscounted: false,
    originalPrice: basePrice,
    finalPrice: basePrice,
    discountPercent: 0,
    discountAmount: 0,
    discountType: discount.type || 'percentage',
    discountValue: Number(discount.value || 0),
    startDate: discount.startDate || null,
    endDate: discount.endDate || null,
  };

  if (!discount.isActive || !discount.value || Number(discount.value) <= 0) {
    return defaultResult;
  }

  const now = new Date();

  // Validate start date if provided
  if (discount.startDate) {
    const start = new Date(discount.startDate);
    if (!isNaN(start.getTime()) && now < start) {
      return defaultResult;
    }
  }

  // Validate end date if provided
  if (discount.endDate) {
    const end = new Date(discount.endDate);
    if (!isNaN(end.getTime())) {
      const endOfDay = new Date(end);
      if (endOfDay.getHours() === 0 && endOfDay.getMinutes() === 0 && endOfDay.getSeconds() === 0) {
        endOfDay.setHours(23, 59, 59, 999);
      }
      if (now > endOfDay) {
        return defaultResult;
      }
    }
  }

  const val = Number(discount.value);
  let finalPrice = basePrice;
  let discountPercent = 0;
  let discountAmount = 0;

  if (discount.type === 'fixed') {
    discountAmount = Math.min(basePrice, Math.max(0, val));
    finalPrice = Math.max(0, basePrice - discountAmount);
    discountPercent = basePrice > 0 ? Math.round((discountAmount / basePrice) * 100) : 0;
  } else {
    // percentage (default)
    const pct = Math.min(100, Math.max(0, val));
    discountAmount = (basePrice * pct) / 100;
    finalPrice = Math.max(0, basePrice - discountAmount);
    discountPercent = Math.round(pct);
  }

  finalPrice = Number(finalPrice.toFixed(2));
  discountAmount = Number(discountAmount.toFixed(2));

  return {
    isDiscounted: discountAmount > 0 && finalPrice < basePrice,
    originalPrice: basePrice,
    finalPrice,
    discountPercent,
    discountAmount,
    discountType: discount.type || 'percentage',
    discountValue: val,
    startDate: discount.startDate || null,
    endDate: discount.endDate || null,
  };
};

export const applyDiscountToProductDoc = (doc) => {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  const calc = calculateProductDiscount(obj);
  return {
    ...obj,
    originalPrice: calc.originalPrice,
    finalPrice: calc.finalPrice,
    price: calc.finalPrice,
    basePrice: calc.originalPrice,
    isDiscounted: calc.isDiscounted,
    discountPercent: calc.discountPercent,
    discountAmount: calc.discountAmount,
    discount: {
      isActive: Boolean(obj.discount?.isActive),
      type: obj.discount?.type || 'percentage',
      value: Number(obj.discount?.value || 0),
      startDate: obj.discount?.startDate || null,
      endDate: obj.discount?.endDate || null,
    },
  };
};
