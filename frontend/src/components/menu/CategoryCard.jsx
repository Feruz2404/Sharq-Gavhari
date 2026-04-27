import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ImageWithFallback from '../common/ImageWithFallback.jsx';
import { getLocalizedField } from '../../utils/getLocalizedField.js';
import { useLanguageStore } from '../../stores/languageStore.js';

const hover = { y: -3, scale: 1.01 };
const tap   = { scale: 0.98 };
const cardTransition = { type: 'spring', stiffness: 320, damping: 22 };

// Stable, deterministic gold gradient family used when an image is missing
// — picked from the slug so each category gets a distinct look.
const GRADIENTS = [
  'from-amber-900/40 via-yellow-700/20 to-zinc-900',
  'from-rose-900/40  via-amber-700/20 to-zinc-900',
  'from-emerald-900/40 via-amber-700/20 to-zinc-900',
  'from-indigo-900/40 via-amber-700/20 to-zinc-900',
];
function pickGradient(key = '') {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return GRADIENTS[Math.abs(h) % GRADIENTS.length];
}

export default function CategoryCard({ category, basePath = '/category' }) {
  const lang = useLanguageStore((s) => s.language);
  const slug = category.slug || category.id;
  const name = getLocalizedField(category, 'name', lang);
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  const gradient = pickGradient(slug);

  const fallback = (
    <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
      <span className="font-display text-5xl text-gold/80 drop-shadow-[0_2px_12px_rgba(212,175,55,0.25)]">
        {initial}
      </span>
    </div>
  );

  return (
    <motion.div whileHover={hover} whileTap={tap} transition={cardTransition}>
      <Link to={`${basePath}/${slug}`} className="group glass block overflow-hidden relative">
        <div className="relative aspect-[4/3] overflow-hidden">
          <ImageWithFallback
            src={category.image_url}
            alt={name}
            fallback={fallback}
            className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
          />
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
