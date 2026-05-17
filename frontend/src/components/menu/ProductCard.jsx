import { memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ImageWithFallback from '../common/ImageWithFallback.jsx';
import Price from '../common/Price.jsx';
import Icon from '../common/Icon.jsx';
import { getLocalizedField } from '../../utils/getLocalizedField.js';
import { useLanguageStore } from '../../stores/languageStore.js';
import { useCartStore } from '../../stores/cartStore.js';
import { useT } from '../../locales/useT.js';
import { cardImage } from '../../lib/menuImage.js';

const hover = { y: -4 };
const cardTransition = { type: 'spring', stiffness: 320, damping: 24 };

// `sizes` for the responsive thumbnail. Mirrors the grid: 1 col on tiny
// phones, 2 cols on phones, then auto-fit ~280-320px from md+. Lets the
// browser pick the right asset.
const CARD_SIZES = '(min-width: 1280px) 300px, (min-width: 768px) 33vw, (min-width: 390px) 48vw, 92vw';

// Premium dark-gradient fallback for cards that don't have an image yet.
// Same aspect ratio as a real image (the parent fixes aspect-[4/3]).
// Adds: gradient base, soft inner gold ring, SG monogram, and a tiny brand
// caption so an empty card still looks intentional.
const FALLBACK_GRADIENT = (
  <div className="relative w-full h-full bg-gradient-to-br from-zinc-900 via-amber-900/15 to-zinc-950 overflow-hidden">
    <div
      aria-hidden="true"
      className="absolute inset-2 rounded-xl ring-1 ring-gold/15 shadow-[inset_0_0_40px_-10px_rgba(212,175,55,0.30)]"
    />
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
      <span className="font-display text-4xl md:text-5xl text-gold/55 drop-shadow-[0_2px_14px_rgba(212,175,55,0.55)]">
        SG
      </span>
      <span className="text-[9px] uppercase tracking-[0.3em] text-gold/45">Sharq Gavhari</span>
    </div>
  </div>
);

function ProductCardImpl({ product, basePath = '/product', onOpen }) {
  const lang = useLanguageStore((s) => s.language);
  const t = useT();
  const addItem = useCartStore((s) => s.addItem);
  const name = getLocalizedField(product, 'name', lang);
  const desc = getLocalizedField(product, 'description', lang);
  const unavailable = !product.is_available;
  const onSale =
    product.discount_price &&
    Number(product.discount_price) > 0 &&
    Number(product.discount_price) < Number(product.price);
  const hasDualPrice =
    product.secondary_price != null &&
    Number(product.secondary_price) > 0 &&
    Number(product.secondary_price) !== Number(product.price);

  const handleAdd = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!unavailable) addItem(product, 1, '', lang);
  };

  // Public cards/lists prefer the optimized thumbnail (image_thumb_url) and
  // fall back to the legacy thumbnail_url / image_url. Original (private) is
  // never referenced here.
  const imgSrc = cardImage(product);

  const body = (
    <>
      <div className="relative aspect-[4/3] overflow-hidden bg-white/[0.02]">
        <ImageWithFallback
          src={imgSrc}
          alt={name}
          fallback={FALLBACK_GRADIENT}
          sizes={CARD_SIZES}
          className="w-full h-full object-cover transition duration-700 group-hover:scale-[1.06]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />
        {unavailable && (
          <span className="absolute top-2.5 left-2.5 text-[10px] font-medium uppercase tracking-[0.18em] bg-black/65 backdrop-blur-sm text-white/85 border border-white/10 px-2 py-1 rounded-md">
            {t('common.unavailable')}
          </span>
        )}
        {onSale && (
          <span className="absolute top-2.5 right-2.5 text-[10px] font-bold uppercase tracking-[0.2em] bg-gold text-black px-2 py-1 rounded-md shadow-gold">
            {t('menu.sale') || '%'}
          </span>
        )}
      </div>
      {/* Title + description sit in their own flex column so the footer can
          flex its own min-height area without competing for vertical space. */}
      <div className="px-4 pt-4 pb-2 flex flex-col flex-1">
        <h3 className="font-display text-base md:text-[17px] text-white leading-tight line-clamp-2 min-h-[2.5em]">
          {name}
        </h3>
        {desc ? (
          <p className="text-white/65 text-[13px] md:text-sm leading-snug mt-1.5 line-clamp-2">{desc}</p>
        ) : (
          <p className="text-transparent text-[13px] mt-1.5 select-none" aria-hidden="true">.</p>
        )}
      </div>
    </>
  );

  // Footer.
  //   * Single-price (the common case): `flex items-center justify-between
  //     gap-3 flex-wrap`. Price wrapper is `flex-1 min-w-0` so it can shrink
  //     before wrapping; button is `shrink-0 min-w-[116px]`. If the card is
  //     ever narrow enough that the two cannot fit side-by-side, flex-wrap
  //     drops the button onto its own line full-width — they NEVER overlap,
  //     no absolute positioning anywhere.
  //   * Dual-price: stacked, because the dual price block is already two
  //     lines tall and looks better with a full-width button below it.
  const footerClass = hasDualPrice
    ? 'mt-auto px-4 pb-4 pt-1 flex flex-col gap-2.5'
    : 'mt-auto px-4 pb-4 pt-1 flex items-center justify-between gap-3 flex-wrap';
  const priceWrapClass = hasDualPrice ? 'min-w-0' : 'min-w-0 flex-1';
  const buttonClass = hasDualPrice
    ? 'btn-gold w-full justify-center shrink-0 whitespace-nowrap min-h-10 rounded-2xl px-4 text-sm'
    : 'btn-gold shrink-0 inline-flex items-center justify-center gap-1.5 whitespace-nowrap min-w-[116px] min-h-10 rounded-2xl px-4 text-sm';

  return (
    <motion.div
      whileHover={hover}
      transition={cardTransition}
      className="group glass h-full overflow-hidden flex flex-col ring-1 ring-transparent hover:ring-gold/25 hover:shadow-[0_22px_50px_-22px_rgba(212,175,55,0.45)] transition-shadow content-visibility-auto"
    >
      {onOpen ? (
        <button
          type="button"
          onClick={() => onOpen(product)}
          className="block relative text-left w-full"
          aria-label={name}
        >
          {body}
        </button>
      ) : (
        <Link to={basePath + '/' + product.id} className="block relative" aria-label={name}>
          {body}
        </Link>
      )}
      <div className={footerClass}>
        <div className={priceWrapClass}>
          <Price
            value={product.price}
            discount={product.discount_price}
            secondary={product.secondary_price}
          />
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={unavailable}
          aria-label={t('common.addToCart') || t('common.add')}
          className={buttonClass}
        >
          <Icon name="plus" size={14} />
          <span>{t('common.add')}</span>
        </button>
      </div>
    </motion.div>
  );
}

function areEqual(prev, next) {
  return (
    prev.product === next.product &&
    prev.basePath === next.basePath &&
    prev.onOpen === next.onOpen
  );
}

export default memo(ProductCardImpl, areEqual);
