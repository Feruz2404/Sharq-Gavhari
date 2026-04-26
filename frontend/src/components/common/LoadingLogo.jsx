import { motion } from 'framer-motion';

export default function LoadingLogo({ fullscreen = false }) {
  return (
    <div className={`${fullscreen ? 'min-h-screen' : 'p-10'} bg-restaurant flex items-center justify-center`}>
      <motion.div
        initial= opacity: 0, scale: 0.9 
        animate= opacity: 1, scale: 1 
        transition= duration: 0.8, ease: 'easeOut' 
        className="text-center"
      >
        <motion.h1
          className="font-display text-5xl md:text-6xl gold-text"
          animate= letterSpacing: ['0.05em', '0.12em', '0.05em'] 
          transition= duration: 2.4, repeat: Infinity 
        >
          Sharq Gavhari
        </motion.h1>
        <p className="mt-3 text-white/50 text-sm tracking-wider">PREMIUM CUISINE</p>
        <div className="mt-6 mx-auto h-0.5 w-24 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full bg-gold"
            initial= x: '-100%' 
            animate= x: '100%' 
            transition= duration: 1.4, repeat: Infinity, ease: 'easeInOut' 
          />
        </div>
      </motion.div>
    </div>
  );
}
