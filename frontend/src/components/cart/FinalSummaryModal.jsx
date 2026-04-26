import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../../stores/cartStore.js';
import { formatPrice } from '../../utils/formatPrice.js';
import { useT } from '../../locales/useT.js';

const fadeHidden  = { opacity: 0 };
const fadeVisible = { opacity: 1 };
const sheetHidden  = { y: 80, opacity: 0 };
const sheetVisible = { y: 0,  opacity: 1 };

export default function FinalSummaryModal({ open, onClose }) {
  const t = useT();
  const items = useCartStore((s) => s.cartItems);
  const total = useCartStore((s) => s.getTotal());
  const tableNumber = useCartStore((s) => s.tableNumber);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end md:items-center justify-center p-4"
          initial={fadeHidden} animate={fadeVisible} exit={fadeHidden}
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={sheetHidden} animate={sheetVisible} exit={sheetHidden}
            className="glass-strong w-full max-w-md rounded-3xl p-5 grid gap-3"
          >
            <h2 className="font-display text-xl gold-text text-center">{t('common.showWaiter')}</h2>
            {tableNumber && <div className="text-center text-sm text-white/70">{t('common.table')} #{tableNumber}</div>}
            <div className="divide-y divide-white/10 max-h-72 overflow-auto">
              {items.map((i) => (
                <div key={i.id} className="py-2 flex justify-between text-sm">
                  <span className="truncate">{i.name} × {i.quantity}</span>
                  <span className="gold-text font-medium">{formatPrice(i.price * i.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-medium border-t border-white/10 pt-2">
              <span>{t('common.total')}</span>
              <span className="gold-text">{formatPrice(total)}</span>
            </div>
            <p className="text-center text-white/80 text-sm bg-white/5 border border-white/10 rounded-xl px-3 py-3">
              {t('common.finalMessage')}
            </p>
            <button onClick={onClose} className="btn-gold">OK</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
