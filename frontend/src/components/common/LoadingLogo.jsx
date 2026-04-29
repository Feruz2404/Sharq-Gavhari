import { motion } from 'framer-motion';
import { useT } from '../../locales/useT.js';

// Premium branded loader. Used as the initial /splash screen and as an
// inline fallback while routes/data are still loading. Visual identity:
//   - dark cinematic backdrop (.app-bg)
//   - SG monogram inside a soft glass disc with rotating gold ring
//   - ornate gold divider ornament
//   - three pulsing dots for activity feedback
// All copy goes through useT() so the language always matches the user.

const fadeIn = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: 'easeOut' },
};
const monogramPulse = {
  animate: { scale: [1, 1.04, 1], opacity: [0.94, 1, 0.94] },
  transition: { duration: 2.6, repeat: Infinity, ease: 'easeInOut' },
};
const ringSpin = {
  animate: { rotate: 360 },
  transition: { duration: 9, repeat: Infinity, ease: 'linear' },
};
const haloPulse = {
  animate: { opacity: [0.45, 0.85, 0.45], scale: [1, 1.06, 1] },
  transition: { duration: 2.8, repeat: Infinity, ease: 'easeInOut' },
};
const dotAnim = (delay) => ({
  animate: { opacity: [0.25, 1, 0.25], y: [0, -2, 0] },
  transition: { duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay },
});

export default function LoadingLogo({ fullscreen = false }) {
  const t = useT();
  const wrapperCls =
    (fullscreen ? 'min-h-screen ' : 'p-12 ') +
    'app-bg flex items-center justify-center';
  return (
    <div className={wrapperCls}>
      <motion.div {...fadeIn} className="relative text-center px-6 max-w-sm w-full">
        {/* Monogram with halo + rotating gold ring */}
        <div className="relative mx-auto w-28 h-28 mb-7">
          <motion.span
            {...haloPulse}
            className="absolute inset-0 rounded-full bg-gold/25 blur-2xl"
            aria-hidden="true"
          />
          <motion.div
            {...ringSpin}
            className="absolute inset-0"
            aria-hidden="true"
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <defs>
                <linearGradient id="sgRing" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%"  stopColor="rgba(212,175,55,0)" />
                  <stop offset="50%" stopColor="rgba(212,175,55,0.95)" />
                  <stop offset="100%" stopColor="rgba(212,175,55,0)" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(212,175,55,0.12)" strokeWidth="1.2" />
              <circle
                cx="50" cy="50" r="46"
                fill="none" stroke="url(#sgRing)" strokeWidth="1.6"
                strokeLinecap="round" strokeDasharray="60 230"
              />
            </svg>
          </motion.div>
          <motion.div
            {...monogramPulse}
            className="absolute inset-3 rounded-full border border-gold/30 bg-black/45 backdrop-blur-md grid place-items-center shadow-[inset_0_0_28px_rgba(212,175,55,0.22)]"
          >
            <span className="font-display gold-text text-[28px] tracking-wider">SG</span>
          </motion.div>
        </div>

        {/* Brand wordmark */}
        <h1 className="font-display text-3xl md:text-4xl gold-text leading-[1.05] text-balance">
          Sharq Gavhari
        </h1>

        {/* Ornate divider */}
        <div className="mt-3 flex items-center justify-center gap-2.5" aria-hidden="true">
          <span className="h-px w-10 bg-gradient-to-r from-transparent via-gold/45 to-gold/75" />
          <span className="w-1.5 h-1.5 rounded-full bg-gold/85 shadow-[0_0_10px_rgba(212,175,55,0.7)]" />
          <span className="h-px w-10 bg-gradient-to-l from-transparent via-gold/45 to-gold/75" />
        </div>

        {/* Tagline */}
        <p className="mt-3 text-white/60 text-[11px] tracking-[0.32em] uppercase">
          {t('brand.tagline')}
        </p>

        {/* Three-dot loader */}
        <div className="mt-7 flex items-center justify-center gap-2.5" aria-hidden="true">
          <motion.span {...dotAnim(0)}    className="w-1.5 h-1.5 rounded-full bg-gold" />
          <motion.span {...dotAnim(0.2)}  className="w-1.5 h-1.5 rounded-full bg-gold" />
          <motion.span {...dotAnim(0.4)}  className="w-1.5 h-1.5 rounded-full bg-gold" />
        </div>

        {/* Caption */}
        <p className="mt-4 text-white/40 text-[11px]">{t('common.loadingTagline')}</p>
      </motion.div>
    </div>
  );
}
