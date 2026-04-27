import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../common/Icon.jsx';
import { useCartStore } from '../../stores/cartStore.js';
import { formatPrice } from '../../utils/formatPrice.js';
import { useT } from '../../locales/useT.js';

const overlay = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };
const sheet   = { initial: { y: 80, opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: { y: 80, opacity: 0 } };

export default function FinalSummaryModal({ open, onClose }) {
  const t = useT();
  const items = useCartStore((s) => s.cartItems);
  const total = useCartStore((s) => s.getTotal());
  const tableNumber = useCartStore((s) => s.tableNumber);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end md:items-center justify-center p-4"
          {...overlay}
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            {...sheet}
            transition= type: 'spring', stiffness: 360, damping: 30 
            className="glass-strong w-full max-w-md rounded-3xl p-5 grid gap-3 relative"
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 btn-icon"
              aria-label="Close"
            >
              <Icon name="close" size={14} />
            </button>
            <div className="text-center pt-1">
              <div className="font-display text-xl gold-text">{t('common.showWaiter')}</div>
              {tableNumber && (
                <div className="text-xs text-white/60 tracking-wider mt-1">{t('common.table')} · #{tableNumber}</div>
              )}
            </div>
            <div className="divider-gold" />
            <div className="divide-y divide-white/10 max-h-72 overflow-auto">
              {items.map((i) => (
                <div key={i.id} className="py-2 flex justify-between text-sm gap-3">
                  <span className="truncate">{i.name} × {i.quantity}</span>
                  <span className="gold-text font-medium tabular-nums shrink-0">{formatPrice(i.price * i.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-medium border-t border-white/10 pt-2">
              <span>{t('common.total')}</span>
              <span className="gold-text text-lg">{formatPrice(total)}</span>
            </div>
            <p className="text-center text-white/85 text-sm bg-gold/10 border border-gold/30 rounded-xl px-3 py-3">
              {t('common.finalMessage')}
            </p>
            <button onClick={onClose} className="btn-gold !py-3">OK</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
