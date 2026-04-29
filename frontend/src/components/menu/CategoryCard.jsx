import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ImageWithFallback from '../common/ImageWithFallback.jsx';
import { getLocalizedField } from '../../utils/getLocalizedField.js';
import { useLanguageStore } from '../../stores/languageStore.js';

const hover = { y: -4, scale: 1.012 };
const tap   = { scale: 0.97 };
const cardTransition = { type: 'spring', stiffness: 320, damping: 22 };

// Deterministic gradient fallback when a category has no image.
const GRADIENTS = [
  'from-amber-900/45 via-yellow-700/20 to-zinc-900',
  'from-rose-900/45  via-amber-700/20 to-zinc-900',
  'from-emerald-900/45 via-amber-700/20 to-zinc-900',
  'from-indigo-900/45 via-amber-700/20 to-zinc-900',
];
function pickGradient(key) {
  const k = key || '';
  let h = 0;
  for (let i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) | 0;
  return GRADIENTS[Math.abs(h) % GRADIENTS.length];
}

export default function CategoryCard({ category, basePath = '/category', onClick, count }) {
  const lang = useLanguageStore((s) => s.language);
  const slug = category.slug || category.id;
  const name = getLocalizedField(category, 'name', lang);
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  const gradient = pickGradient(slug);
  const showCount = typeof count === 'number' && count > 0;

  const fallback = (
    <div className={'w-full h-full bg-gradient-to-br ' + gradient + ' flex items-center justify-center'}>
      <span className="font-display text-5xl text-gold/85 drop-shadow-[0_2px_12px_rgba(212,175,55,0.35)]">
        {initial}
      </span>
    </div>
  );

  const innerCls =
    'group block w-full text-left relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl ' +
    'ring-1 ring-transparent hover:ring-gold/35 hover:border-gold/20 ' +
    'hover:shadow-[0_22px_50px_-22px_rgba(212,175,55,0.55)] transition-all';

  const inner = (
    <div className="relative aspect-[4/3] overflow-hidden">
      <ImageWithFallback
        src={category.image_url}
        alt={name}
        fallback={fallback}
        className="w-full h-full object-cover transition duration-700 group-hover:scale-[1.07]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/35 to-black/5" />
      {showCount && (
        <span className="absolute top-2.5 right-2.5 inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-medium tabular-nums bg-black/55 backdrop-blur-sm border border-white/10 text-white/80">
          {count}
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 p-3.5 md:p-4">
        <h3 className="font-display text-white text-base md:text-lg leading-tight truncate drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)]">
          {name}
        </h3>
        <div className="mt-1.5 h-px w-9 bg-gold/75 group-hover:w-16 transition-all duration-300" />
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
        <Link to={basePath + '/' + slug} className={innerCls} aria-label={name}>
          {inner}
        </Link>
      )}
    </motion.div>
  );
}
