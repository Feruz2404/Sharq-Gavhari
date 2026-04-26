export function formatPrice(amount) {
  const n = Number(amount || 0);
  try {
    return new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 0 }).format(n) + ' soʻm';
  } catch (e) {
    return n.toFixed(0) + ' soʻm';
  }
}
