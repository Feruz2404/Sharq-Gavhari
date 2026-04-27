import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ImageWithFallback from '../common/ImageWithFallback.jsx';
import Price from '../common/Price.jsx';
import Icon from '../common/Icon.jsx';
import { getLocalizedField } from '../../utils/getLocalizedField.js';
import { useLanguageStore } from '../../stores/languageStore.js';
import { useCartStore } from '../../stores/cartStore.js';
import { useT } from '../../locales/useT.js';

const hover = {
  y: -3,
};

const cardTransition = {
  type: 'spring',
  stiffness: 320,
  damping: 24,
};

export default function ProductCard({ product, basePath = '/product' }) {
  const lang = useLanguageStore((s) => s.language);
  const t = useT();
  const addItem = useCartStore((s) => s.addItem);
  const name = getLocalizedField(product, 'name', lang);
  const desc = getLocalizedField(product, 'description', lang);
  const unavailable = !product.is_available;

  return (
    <motion.div whileHover={hover} transition={cardTransition}
      className="group glass overflow-hidden flex flex-col">
      <Link to={`${basePath}/${product.id}`} className="block relative">
        <div className="relative aspect-[4/3] overflow-hidden">
          <ImageWithFallback src={product.image_url} alt={name} className="w-full h-full object-cover transition duration-500 group-hover:scale-[1.04]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition" />
          {unavailable && (
            <span className="absolute top-2 left-2 text-[10px] uppercase tracking-wider bg-red-600/85 text-white px-2 py-1 rounded-md">
              {t('common.unavailable')}
            </span>
          )}
          {product.discount_price && Number(product.discount_price) > 0 && Number(product.discount_price) < Number(product.price) && (
            <span className="absolute top-2 right-2 text-[10px] uppercase tracking-wider bg-gold text-black px-2 py-1 rounded-md font-semibold">
              Sale
            </span>
          )}
        </div>
        <div className="p-3.5">
          <div className="font-display text-base text-white truncate">{name}</div>
          {desc && <p className="text-white/55 text-xs mt-1 line-clamp-2">{desc}</p>}
        </div>
      </Link>
      <div className="px-3.5 pb-3.5 mt-auto flex items-center justify-between gap-2">
        <Price value={product.price} discount={product.discount_price} />
        <button
          onClick={() => !unavailable && addItem(product, 1, '', lang)}
          disabled={unavailable}
          aria-label={t('common.addToCart')}
          className="btn-gold !py-1.5 !px-3 text-sm"
        >
          <Icon name="plus" size={14} />
          <span>{t('common.add')}</span>
        </button>
      </div>
    </motion.div>
  );
}
