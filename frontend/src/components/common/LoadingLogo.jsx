import { motion } from 'framer-motion';

const containerInit  = { opacity: 0, y: 10 };
const containerAnim  = { opacity: 1, y: 0 };
const containerTrans = { duration: 0.6 };
const titleAnim      = { opacity: [0.6, 1, 0.6] };
const titleTrans     = { duration: 2, repeat: Infinity };
const barInit        = { width: '0%' };
const barAnim        = { width: '100%' };
const barTrans       = { duration: 1.4, repeat: Infinity, repeatType: 'reverse' };

export default function LoadingLogo({ fullscreen = false }) {
  return (
    <div className={`${fullscreen ? 'min-h-screen' : 'p-10'} bg-restaurant flex items-center justify-center`}>
      <motion.div initial={containerInit} animate={containerAnim} transition={containerTrans} className="text-center">
        <motion.h1
          className="font-display text-5xl md:text-6xl gold-text"
          animate={titleAnim}
          transition={titleTrans}
        >
          Sharq Gavhari
        </motion.h1>
        <p className="mt-3 text-white/50 text-sm tracking-wider">PREMIUM CUISINE</p>
        <div className="mt-6 mx-auto h-0.5 w-24 overflow-hidden rounded-full bg-white/10">
          <motion.div className="h-full bg-gold" initial={barInit} animate={barAnim} transition={barTrans} />
        </div>
      </motion.div>
    </div>
  );
}
