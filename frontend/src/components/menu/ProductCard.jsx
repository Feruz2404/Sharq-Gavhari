import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ImageWithFallback from '../common/ImageWithFallback.jsx';
import Price from '../common/Price.jsx';
import Icon from '../common/Icon.jsx';
import { getLocalizedField } from '../../utils/getLocalizedField.js';
import { useLanguageStore } from '../../stores/languageStore.js';
import { useCartStore } from '../../stores/cartStore.js';
import { useT } from '../../locales/useT.js';

const hover = { y: -4 };
const cardTransition = { type: 'spring', stiffness: 320, damping: 24 };

const FALLBACK_GRADIENT = (
  <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-amber-900/25 to-zinc-950 flex items-center justify-center">
    <span className="font-display text-3xl text-gold/40">SG</span>
  </div>
);

export default function ProductCard({ product, basePath = '/product', onOpen }) {
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

  const handleAdd = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!unavailable) addItem(product, 1, '', lang);
  };

  const body = (
    <>
      <div className="relative aspect-[4/3] overflow-hidden">
        <ImageWithFallback
          src={product.image_url}
          alt={name}
          fallback={FALLBACK_GRADIENT}
          className="w-full h-full object-cover transition duration-700 group-hover:scale-[1.06]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
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
      <div className="px-4 pt-3.5 pb-2">
        <h3 className="font-display text-[15px] md:text-base text-white leading-tight truncate">
          {name}
        </h3>
        {desc ? (
          <p className="text-white/55 text-[12.5px] leading-snug mt-1 line-clamp-2">{desc}</p>
        ) : (
          <p className="text-transparent text-[12.5px] mt-1 select-none" aria-hidden="true">.</p>
        )}
      </div>
    </>
  );

  return (
    <motion.div
      whileHover={hover}
      transition={cardTransition}
      className="group glass overflow-hidden flex flex-col ring-1 ring-transparent hover:ring-gold/25 hover:shadow-[0_22px_50px_-22px_rgba(212,175,55,0.45)] transition-shadow"
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
      <div className="px-4 pb-4 mt-auto flex items-center justify-between gap-2">
        <Price
          value={product.price}
          discount={product.discount_price}
          secondary={product.secondary_price}
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={unavailable}
          aria-label={t('common.addToCart') || t('common.add')}
          className="btn-gold !py-1.5 !px-3 text-[13px] !rounded-lg"
        >
          <Icon name="plus" size={14} />
          <span>{t('common.add')}</span>
        </button>
      </div>
    </motion.div>
  );
}
