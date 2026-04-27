import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ImageWithFallback from '../common/ImageWithFallback.jsx';
import { getLocalizedField } from '../../utils/getLocalizedField.js';
import { useLanguageStore } from '../../stores/languageStore.js';

const hover = {
  y: -3,
  scale: 1.01,
};

const tap = {
  scale: 0.98,
};

const cardTransition = {
  type: 'spring',
  stiffness: 320,
  damping: 22,
};

export default function CategoryCard({ category, basePath = '/category' }) {
  const lang = useLanguageStore((s) => s.language);
  const slug = category.slug || category.id;
  const name = getLocalizedField(category, 'name', lang);

  return (
    <motion.div whileHover={hover} whileTap={tap} transition={cardTransition}>
      <Link to={`${basePath}/${slug}`} className="group glass block overflow-hidden relative">
        <div className="relative aspect-[4/3] overflow-hidden">
          <ImageWithFallback src={category.image_url} alt={name} className="w-full h-full object-cover transition duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-3">
            <div className="font-display text-white text-lg leading-tight truncate">{name}</div>
            <div className="mt-0.5 h-px w-8 bg-gold/70 group-hover:w-12 transition-all duration-300" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
