import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../common/Icon.jsx';
import { useCartStore } from '../../stores/cartStore.js';
import { formatPrice } from '../../utils/formatPrice.js';
import { useT } from '../../locales/useT.js';

const hidden  = { y: 100, opacity: 0 };
const visible = { y: 0,   opacity: 1 };

export default function FloatingCartButton({ to = '/cart' }) {
  const t = useT();
  const count = useCartStore((s) => s.getItemCount());
  const total = useCartStore((s) => s.getTotal());

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={hidden} animate={visible} exit={hidden}
          transition= type: 'spring', stiffness: 380, damping: 32 
          className="fixed bottom-4 inset-x-4 z-30 flex justify-center pointer-events-none"
        >
          <Link
            to={to}
            className="btn-gold pointer-events-auto !py-3 !px-5 shadow-gold gap-3"
            aria-label={`${t('nav.cart')} (${count})`}
          >
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-black/25 text-xs font-bold tabular-nums">
              {count}
            </span>
            <Icon name="cart" size={16} />
            <span className="font-semibold">{t('nav.cart')}</span>
            <span className="opacity-80">· {formatPrice(total)}</span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
