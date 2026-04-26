import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ImageWithFallback from '../common/ImageWithFallback.jsx';
import Price from '../common/Price.jsx';
import { getLocalizedField } from '../../utils/getLocalizedField.js';
import { useLanguageStore } from '../../stores/languageStore.js';
import { useCartStore } from '../../stores/cartStore.js';
import { useT } from '../../locales/useT.js';

export default function ProductCard({ product, basePath = '/product' }) {
  const lang = useLanguageStore((s) => s.language);
  const t = useT();
  const addItem = useCartStore((s) => s.addItem);
  const name = getLocalizedField(product, 'name', lang);
  const desc = getLocalizedField(product, 'description', lang);
  const unavailable = !product.is_available;

  return (
    <motion.div whileHover= y: -2  className="glass overflow-hidden flex flex-col">
      <Link to={`${basePath}/${product.id}`} className="block">
        <div className="relative">
          <ImageWithFallback src={product.image_url} alt={name} className="w-full aspect-[4/3] object-cover" />
          {unavailable && (
            <span className="absolute top-2 right-2 text-[10px] uppercase tracking-wider bg-red-600/80 text-white px-2 py-1 rounded-md">
              {t('common.unavailable')}
            </span>
          )}
        </div>
        <div className="p-3">
          <div className="font-display text-base text-white truncate">{name}</div>
          {desc && <p className="text-white/60 text-xs mt-1 line-clamp-2">{desc}</p>}
        </div>
      </Link>
      <div className="px-3 pb-3 mt-auto flex items-center justify-between gap-2">
        <Price value={product.price} discount={product.discount_price} />
        <button
          onClick={() => !unavailable && addItem(product, 1, '', lang)}
          disabled={unavailable}
          className="btn-gold !py-1.5 !px-3 text-sm"
        >
          + {t('common.add')}
        </button>
      </div>
    </motion.div>
  );
}
