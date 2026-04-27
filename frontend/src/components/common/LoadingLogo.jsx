import { motion } from 'framer-motion';
import { useT } from '../../locales/useT.js';

const container = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 } };
const pulse     = { animate: { opacity: [0.55, 1, 0.55] }, transition: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' } };
const bar       = { initial: { width: '0%' }, animate: { width: '100%' }, transition: { duration: 1.4, repeat: Infinity, repeatType: 'reverse' } };
const glowPulse = { animate: { boxShadow: ['0 0 40px rgba(212,175,55,0.10)', '0 0 80px rgba(212,175,55,0.22)', '0 0 40px rgba(212,175,55,0.10)'] }, transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } };

/**
 * Branded fullscreen / inline loading state. All copy goes through `useT` so
 * the load screen always matches the active language.
 */
export default function LoadingLogo({ fullscreen = false }) {
  const t = useT();
  return (
    <div className={`${fullscreen ? 'min-h-screen' : 'p-10'} app-bg flex items-center justify-center`}>
      <motion.div {...container} className="text-center px-6">
        <motion.div
          {...glowPulse}
          className="mb-5 inline-flex w-16 h-16 items-center justify-center rounded-2xl border border-gold/30 bg-gold/5"
        >
          <span className="font-display gold-text text-2xl">SG</span>
        </motion.div>
        <motion.h1 className="font-display text-4xl md:text-5xl gold-text" {...pulse}>
          Sharq Gavhari
        </motion.h1>
        <p className="mt-2 text-white/55 text-[11px] tracking-[0.32em] uppercase">
          {t('brand.tagline')}
        </p>
        <div className="mt-7 mx-auto h-0.5 w-32 overflow-hidden rounded-full bg-white/10">
          <motion.div className="h-full bg-gradient-to-r from-gold/40 via-gold to-gold/40" {...bar} />
        </div>
        <p className="mt-4 text-white/40 text-xs">{t('common.loadingTagline')}</p>
      </motion.div>
    </div>
  );
}
