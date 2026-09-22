/**
 * Centralized Unit Helper for Chocair Fresh
 * Supported units: 1kg, 500g, 200g, bunch, piece, pack
 */

export const ALLOWED_UNITS = [
  { value: '1kg', label: '1kg', fullLabel: 'Per 1kg', type: 'weight', baseKg: 1.0 },
  { value: '500g', label: '500g', fullLabel: 'Per 500g', type: 'weight', baseKg: 0.5 },
  { value: '200g', label: '200g', fullLabel: 'Per 200g', type: 'weight', baseKg: 0.2 },
  { value: 'bunch', label: 'bunch', fullLabel: 'Per Bunch', type: 'count', plural: 'bunches' },
  { value: 'piece', label: 'piece', fullLabel: 'Per Piece', type: 'count', plural: 'pieces' },
  { value: 'pack', label: 'pack', fullLabel: 'Per Pack', type: 'count', plural: 'packs' },
];

/**
 * Normalizes any incoming unit string to one of the 6 allowed units:
 * '1kg', '500g', '200g', 'bunch', 'piece', 'pack'
 */
export const normalizeUnit = (rawUnit) => {
  if (!rawUnit) return '1kg';
  const u = String(rawUnit).trim().toLowerCase();

  // 1kg mappings
  if (u === '1kg' || u === '1 kg' || u === 'kg' || u === 'kilogram' || u === 'kilograms' || u === 'kilo') {
    return '1kg';
  }

  // 500g mappings
  if (u === '500g' || u === '500 g' || u === '0.5kg' || u === 'half kg' || u === 'half kilo' || u === 'g') {
    return '500g';
  }

  // 200g mappings
  if (u === '200g' || u === '200 g' || u === '0.2kg' || u === '250g' || u === '250 g' || u === 'quarter kg') {
    return '200g';
  }

  // bunch mappings
  if (u === 'bunch' || u === 'bunches' || u === 'bundle' || u === 'bundles') {
    return 'bunch';
  }

  // piece mappings (handles piece/peice/pcs/pc)
  if (u === 'piece' || u === 'peice' || u === 'pieces' || u === 'peices' || u === 'pcs' || u === 'pc' || u === 'unit' || u === 'item' || u === 'each') {
    return 'piece';
  }

  // pack mappings
  if (u === 'pack' || u === 'packs' || u === 'box' || u === 'boxes' || u === 'jar' || u === 'jars' || u === 'bottle' || u === 'bottles' || u === 'bag' || u === 'tray') {
    return 'pack';
  }

  return '1kg';
};

/**
 * Returns clean display label for unit (e.g., "1kg", "500g", "200g", "bunch", "piece", "pack")
 */
export const formatUnitLabel = (unit) => {
  return normalizeUnit(unit);
};

/**
 * Formats unit rate display (e.g., "$3.50 / 1kg", "$1.20 / 500g")
 */
export const formatUnitRate = (price, unit) => {
  const norm = normalizeUnit(unit);
  const formattedPrice = Number(price || 0).toFixed(2);
  return `$${formattedPrice} / ${norm}`;
};

/**
 * Formats quantity along with unit for display in carts, checkout, invoices, and orders
 * Example:
 * 2 × 1kg -> "2 × 1kg (2kg)"
 * 2 × 500g -> "2 × 500g (1kg)"
 * 3 × 200g -> "3 × 200g (600g)"
 * 3 × bunch -> "3 bunches"
 * 2 × piece -> "2 pieces"
 * 4 × pack -> "4 packs"
 */
export const formatQuantityWithUnit = (quantity, unit) => {
  const norm = normalizeUnit(unit);
  const qty = Number(quantity) || 1;

  switch (norm) {
    case '1kg':
      return qty === 1 ? '1kg' : `${qty} × 1kg (${qty}kg)`;
    case '500g': {
      const totalKg = qty * 0.5;
      const weightStr = totalKg >= 1 ? `${totalKg % 1 === 0 ? totalKg.toFixed(0) : totalKg.toFixed(1)}kg` : `${qty * 500}g`;
      return qty === 1 ? '500g' : `${qty} × 500g (${weightStr})`;
    }
    case '200g': {
      const totalG = qty * 200;
      const weightStr = totalG >= 1000 ? `${(totalG / 1000).toFixed(1)}kg` : `${totalG}g`;
      return qty === 1 ? '200g' : `${qty} × 200g (${weightStr})`;
    }
    case 'bunch':
      return `${qty} ${qty === 1 ? 'bunch' : 'bunches'}`;
    case 'piece':
      return `${qty} ${qty === 1 ? 'piece' : 'pieces'}`;
    case 'pack':
      return `${qty} ${qty === 1 ? 'pack' : 'packs'}`;
    default:
      return `${qty} ${norm}`;
  }
};

/**
 * Preset quantity options for the product details page
 */
export const getPresetOptions = (unit) => {
  const norm = normalizeUnit(unit);
  switch (norm) {
    case '1kg':
      return [
        { qty: 1, label: '1 kg' },
        { qty: 2, label: '2 kg' },
        { qty: 3, label: '3 kg' },
        { qty: 5, label: '5 kg' },
        { qty: 10, label: '10 kg' },
      ];
    case '500g':
      return [
        { qty: 1, label: '500g (1x)' },
        { qty: 2, label: '1 kg (2x)' },
        { qty: 3, label: '1.5 kg (3x)' },
        { qty: 4, label: '2 kg (4x)' },
        { qty: 6, label: '3 kg (6x)' },
      ];
    case '200g':
      return [
        { qty: 1, label: '200g (1x)' },
        { qty: 2, label: '400g (2x)' },
        { qty: 3, label: '600g (3x)' },
        { qty: 4, label: '800g (4x)' },
        { qty: 5, label: '1 kg (5x)' },
      ];
    case 'bunch':
      return [
        { qty: 1, label: '1 bunch' },
        { qty: 2, label: '2 bunches' },
        { qty: 3, label: '3 bunches' },
        { qty: 5, label: '5 bunches' },
        { qty: 10, label: '10 bunches' },
      ];
    case 'piece':
      return [
        { qty: 1, label: '1 piece' },
        { qty: 2, label: '2 pieces' },
        { qty: 3, label: '3 pieces' },
        { qty: 5, label: '5 pieces' },
        { qty: 10, label: '10 pieces' },
      ];
    case 'pack':
      return [
        { qty: 1, label: '1 pack' },
        { qty: 2, label: '2 packs' },
        { qty: 3, label: '3 packs' },
        { qty: 5, label: '5 packs' },
        { qty: 10, label: '10 packs' },
      ];
    default:
      return [
        { qty: 1, label: '1' },
        { qty: 2, label: '2' },
        { qty: 3, label: '3' },
        { qty: 5, label: '5' },
      ];
  }
};
