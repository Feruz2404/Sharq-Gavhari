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
 * Layout rules:
 *   - The wrapper is allowed to wrap onto two lines (`flex-wrap`) when the
 *     parent doesn't have enough horizontal room \u2014 this is what keeps
 *     dual-price products like \"\u041C\u043E\u0445\u0438\u0442\u043E\" from pushing the
 *     \"Add\" button outside the card on iPad / RU language.
 *   - Each numeric token keeps `whitespace-nowrap` internally so a single price
 *     never breaks mid-number; only the slash boundary may break.
 *   - `min-w-0` lets a parent flex item shrink this container below the
 *     intrinsic width of its longest child.
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
      <div className={`flex flex-wrap items-baseline gap-x-2 gap-y-0.5 min-w-0 ${className}`}>
        <span className="gold-text font-semibold tabular-nums whitespace-nowrap">
          {formatPrice(numDiscount)}
        </span>
        <span className="text-white/40 text-xs line-through tabular-nums whitespace-nowrap">
          {formatPrice(numValue)}
        </span>
      </div>
    );
  }

  if (hasSecondary) {
    return (
      <div
        className={`flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 min-w-0 ${className}`}
        aria-label={`${formatPrice(numValue)} / ${formatPrice(numSecondary)}`}
      >
        <span className="gold-text font-semibold tabular-nums whitespace-nowrap">
          {formatPrice(numValue)}
        </span>
        <span className="text-gold/45 text-[0.85em] font-light" aria-hidden="true">/</span>
        <span className="text-gold/85 font-medium tabular-nums whitespace-nowrap">
          {formatPrice(numSecondary)}
        </span>
      </div>
    );
  }

  return (
    <span className={`gold-text font-semibold tabular-nums whitespace-nowrap ${className}`}>
      {formatPrice(numValue)}
    </span>
  );
}
