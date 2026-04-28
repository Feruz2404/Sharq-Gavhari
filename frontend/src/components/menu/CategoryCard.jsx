import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ImageWithFallback from '../common/ImageWithFallback.jsx';
import { getLocalizedField } from '../../utils/getLocalizedField.js';
import { useLanguageStore } from '../../stores/languageStore.js';

const hover = { y: -4, scale: 1.015 };
const tap   = { scale: 0.97 };
const cardTransition = { type: 'spring', stiffness: 320, damping: 22 };

// Stable, deterministic gold gradient family used when an image is missing
// \u2014 picked from the slug so each category gets a distinct look.
const GRADIENTS = [
  'from-amber-900/40 via-yellow-700/20 to-zinc-900',
  'from-rose-900/40  via-amber-700/20 to-zinc-900',
  'from-emerald-900/40 via-amber-700/20 to-zinc-900',
  'from-indigo-900/40 via-amber-700/20 to-zinc-900',
];
function pickGradient(key) {
  const k = key || '';
  let h = 0;
  for (let i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) | 0;
  return GRADIENTS[Math.abs(h) % GRADIENTS.length];
}

/**
 * CategoryCard
 *
 * - Default mode: renders as a <Link> to `${basePath}/${slug}` (deep-link to
 *   the dedicated category page).
 * - When `onClick` is provided: renders as a <button>. Useful for in-page
 *   filtering (e.g. customer MenuPage with sidebar layout).
 */
export default function CategoryCard({ category, basePath = '/category', onClick }) {
  const lang = useLanguageStore((s) => s.language);
  const slug = category.slug || category.id;
  const name = getLocalizedField(category, 'name', lang);
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  const gradient = pickGradient(slug);

  const fallback = (
    <div className={'w-full h-full bg-gradient-to-br ' + gradient + ' flex items-center justify-center'}>
      <span className="font-display text-5xl text-gold/80 drop-shadow-[0_2px_12px_rgba(212,175,55,0.25)]">
        {initial}
      </span>
    </div>
  );

  const innerCls =
    'group glass block overflow-hidden relative ring-1 ring-transparent ' +
    'hover:ring-gold/30 hover:shadow-[0_18px_40px_-18px_rgba(212,175,55,0.45)] ' +
    'transition-shadow w-full text-left';

  const inner = (
    <div className="relative aspect-[4/3] overflow-hidden">
      <ImageWithFallback
        src={category.image_url}
        alt={name}
        fallback={fallback}
        className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-3 md:p-4">
        <div className="font-display text-white text-base md:text-lg leading-tight truncate drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
          {name}
        </div>
        <div className="mt-1 h-px w-8 bg-gold/70 group-hover:w-14 transition-all duration-300" />
      </div>
    </div>
  );

  return (
    <motion.div whileHover={hover} whileTap={tap} transition={cardTransition}>
      {onClick ? (
        <button type="button" onClick={onClick} className={innerCls} aria-label={name}>
          {inner}
        </button>
      ) : (
        <Link to={basePath + '/' + slug} className={innerCls}>
          {inner}
        </Link>
      )}
    </motion.div>
  );
}
