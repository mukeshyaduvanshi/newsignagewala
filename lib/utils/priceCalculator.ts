interface PriceCalculatorItem {
  elemQty?: number | string;
  elemPrice?: number | string;
  elemWidth?: number | string;
  elemHeight?: number | string;
  mUnit?: string;
  calcUnit?: string;
  quantity?: number | string;
  rate?: number | string;
  width?: number | string;
  height?: number | string;
  measurementUnit?: string;
  calculateUnit?: string;
}

export function priceCalculator(item: PriceCalculatorItem): string {
  // Support both naming conventions: elemQty/quantity, elemPrice/rate, etc.
  const qty = parseFloat((item.elemQty || item.quantity)?.toString() || '1');
  const price = parseFloat((item.elemPrice || item.rate)?.toString() || '0');
  const width = parseFloat((item.elemWidth || item.width)?.toString() || '0');
  const height = parseFloat((item.elemHeight || item.height)?.toString() || '0');
  const measurementUnit = item.mUnit || item.measurementUnit || '';
  const calculateUnit = item.calcUnit || item.calculateUnit || '';

  if (!qty || !price) return '0.00';

  let amount = 0;

  if (calculateUnit === 'pcs') {
    amount = qty * price;
  } else if (measurementUnit === 'feet' && calculateUnit === 'sqft') {
    amount = width * height * qty * price;
  } else if (measurementUnit === 'inch' && calculateUnit === 'sqft') {
    amount = (width / 12) * (height / 12) * qty * price;
  } else if (measurementUnit === 'feet' && calculateUnit === 'sqin') {
    amount = (width * 12) * (height * 12) * qty * price;
  } else if (measurementUnit === 'inch' && calculateUnit === 'sqin') {
    amount = width * height * qty * price;
  } else {
    // Default fallback
    amount = qty * price;
  }
  return amount.toFixed(2);
}

export function priceCalculatorNumber(item: PriceCalculatorItem): number {
  return parseFloat(priceCalculator(item));
}
