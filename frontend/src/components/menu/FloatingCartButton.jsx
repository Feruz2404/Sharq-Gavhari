import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../../stores/cartStore.js';
import { formatPrice } from '../../utils/formatPrice.js';
import { useT } from '../../locales/useT.js';

const hidden  = { y: 80, opacity: 0 };
const visible = { y: 0,  opacity: 1 };

export default function FloatingCartButton({ to = '/cart' }) {
  const t = useT();
  const count = useCartStore((s) => s.getItemCount());
  const total = useCartStore((s) => s.getTotal());
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={hidden} animate={visible} exit={hidden}
          className="fixed bottom-4 inset-x-4 z-30 flex justify-center pointer-events-none"
        >
          <Link to={to} className="btn-gold pointer-events-auto !py-3 !px-5 shadow-glass">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-black/20 text-xs font-bold">{count}</span>
            <span>{t('nav.cart')}</span>
            <span className="opacity-80">· {formatPrice(total)}</span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
