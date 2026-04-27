import { motion } from 'framer-motion';

const container = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 } };
const pulse     = { animate: { opacity: [0.55, 1, 0.55] }, transition: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' } };
const bar       = { initial: { width: '0%' }, animate: { width: '100%' }, transition: { duration: 1.4, repeat: Infinity, repeatType: 'reverse' } };

export default function LoadingLogo({ fullscreen = false }) {
  return (
    <div className={`${fullscreen ? 'min-h-screen' : 'p-10'} bg-restaurant flex items-center justify-center`}>
      <motion.div {...container} className="text-center px-6">
        <div className="mb-4 inline-flex w-14 h-14 items-center justify-center rounded-2xl border border-gold/30 bg-gold/5">
          <span className="font-display gold-text text-2xl">SG</span>
        </div>
        <motion.h1 className="font-display text-4xl md:text-5xl gold-text" {...pulse}>Sharq Gavhari</motion.h1>
        <p className="mt-2 text-white/45 text-xs tracking-[0.32em] uppercase">Premium Cuisine</p>
        <div className="mt-7 mx-auto h-0.5 w-28 overflow-hidden rounded-full bg-white/10">
          <motion.div className="h-full bg-gradient-to-r from-gold/40 via-gold to-gold/40" {...bar} />
        </div>
      </motion.div>
    </div>
  );
}
