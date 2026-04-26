import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ImageWithFallback from '../common/ImageWithFallback.jsx';
import { getLocalizedField } from '../../utils/getLocalizedField.js';
import { useLanguageStore } from '../../stores/languageStore.js';

const hoverProps = { scale: 1.02 };
const tapProps   = { scale: 0.98 };

export default function CategoryCard({ category, basePath = '/category' }) {
  const lang = useLanguageStore((s) => s.language);
  const slug = category.slug || category.id;
  return (
    <motion.div whileHover={hoverProps} whileTap={tapProps}>
      <Link to={`${basePath}/${slug}`} className="glass block overflow-hidden">
        <ImageWithFallback src={category.image_url} alt={getLocalizedField(category, 'name', lang)} className="w-full aspect-[4/3] object-cover" />
        <div className="p-3">
          <div className="font-display gold-text text-lg truncate">{getLocalizedField(category, 'name', lang)}</div>
        </div>
      </Link>
    </motion.div>
  );
}
