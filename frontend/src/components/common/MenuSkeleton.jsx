import { motion } from 'framer-motion';

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.3 },
};

/**
 * Premium loading skeleton for the customer menu page.
 *
 * Mirrors the real layout (hero banner + categories grid) with subtle gold
 * shimmer panels so the perceived load feels instant and on-brand instead of
 * showing a fullscreen spinner.
 */
export default function MenuSkeleton() {
  return (
    <motion.div {...fade} className="grid gap-7 md:gap-9" aria-hidden="true">
      {/* Hero skeleton */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 shadow-soft min-h-[280px] md:min-h-[400px]">
        <div className="absolute inset-0 shimmer" />
        <div className="absolute inset-0 bg-gradient-to-tr from-black via-black/65 to-black/15" />
        <div className="pointer-events-none absolute -right-10 -top-10 w-72 h-72 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative z-10 p-6 md:p-12 h-full flex flex-col justify-end gap-3">
          <div className="h-3 w-32 rounded-full shimmer opacity-70" />
          <div className="h-9 md:h-12 w-3/4 max-w-md rounded-xl shimmer" />
          <div className="h-3 w-2/3 max-w-sm rounded-full shimmer opacity-70" />
          <div className="flex gap-2 mt-2">
            <div className="h-7 w-24 rounded-full shimmer opacity-70" />
            <div className="h-7 w-28 rounded-full shimmer opacity-70" />
            <div className="h-7 w-24 rounded-full shimmer opacity-70" />
          </div>
        </div>
      </div>

      {/* Categories title + grid skeleton */}
      <div>
        <div className="flex items-end justify-between mb-3 md:mb-4">
          <div className="h-6 w-32 rounded-full shimmer" />
          <div className="divider-gold flex-1 ml-4 mb-2 opacity-30" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/10 overflow-hidden bg-white/[0.03]"
            >
              <div className="aspect-[4/3] shimmer" />
              <div className="p-3 grid gap-2">
                <div className="h-4 w-3/4 rounded-full shimmer" />
                <div className="h-2.5 w-1/3 rounded-full shimmer opacity-60" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
