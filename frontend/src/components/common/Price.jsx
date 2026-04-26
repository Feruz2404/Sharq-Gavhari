import { formatPrice } from '../../utils/formatPrice.js';

export default function Price({ value, discount, className = '' }) {
  if (discount != null && Number(discount) > 0 && Number(discount) < Number(value)) {
    return (
      <div className={`flex items-baseline gap-2 ${className}`}>
        <span className="gold-text font-semibold">{formatPrice(discount)}</span>
        <span className="text-white/40 text-xs line-through">{formatPrice(value)}</span>
      </div>
    );
  }
  return <span className={`gold-text font-semibold ${className}`}>{formatPrice(value)}</span>;
}
