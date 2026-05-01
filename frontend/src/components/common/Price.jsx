import { formatPrice } from '../../utils/formatPrice.js';

/**
 * Price renderer.
 *
 *   value     -> primary price (shot / glass / single serving / 0.5 L)
 *   discount  -> optional sale price; when valid, renders strike-through value
 *   secondary -> optional second price (bottle / large size). When provided
 *                AND no discount is active, renders "value / secondary" so the
 *                bar items (vodka, whiskey, lemonades, etc.) display both
 *                tariffs cleanly.
 *
 * Rules:
 *   - discount wins over secondary; we never render strike-through next to a
 *     dual-price layout (would be visually noisy and is not used in the bar).
 *   - When `secondary` is missing / null / 0, behaviour is identical to before
 *     so existing food products are unaffected.
 */
export default function Price({ value, discount, secondary, className = '' }) {
  const numValue = Number(value);
  const numDiscount = discount != null ? Number(discount) : null;
  const numSecondary = secondary != null ? Number(secondary) : null;

  const hasDiscount =
    numDiscount != null && numDiscount > 0 && numDiscount < numValue;
  const hasSecondary =
    !hasDiscount && numSecondary != null && numSecondary > 0 && numSecondary !== numValue;

  if (hasDiscount) {
    return (
      <div className={`flex items-baseline gap-2 ${className}`}>
        <span className="gold-text font-semibold">{formatPrice(numDiscount)}</span>
        <span className="text-white/40 text-xs line-through">{formatPrice(numValue)}</span>
      </div>
    );
  }

  if (hasSecondary) {
    return (
      <div
        className={`flex items-baseline gap-1.5 whitespace-nowrap ${className}`}
        aria-label={`${formatPrice(numValue)} / ${formatPrice(numSecondary)}`}
      >
        <span className="gold-text font-semibold tabular-nums">{formatPrice(numValue)}</span>
        <span className="text-gold/45 text-[0.85em] font-light" aria-hidden="true">/</span>
        <span className="text-gold/85 font-medium tabular-nums">{formatPrice(numSecondary)}</span>
      </div>
    );
  }

  return <span className={`gold-text font-semibold ${className}`}>{formatPrice(numValue)}</span>;
}
