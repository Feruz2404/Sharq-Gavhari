import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../common/Icon.jsx';
import { useCartStore } from '../../stores/cartStore.js';
import { useSettingsStore } from '../../stores/settingsStore.js';
import { formatPrice } from '../../utils/formatPrice.js';
import { useT } from '../../locales/useT.js';

const overlay = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit:    { opacity: 0 },
};

const sheet = {
  initial: { y: 80, opacity: 0 },
  animate: { y: 0,  opacity: 1 },
  exit:    { y: 80, opacity: 0 },
};

const sheetTransition = {
  type: 'spring',
  stiffness: 360,
  damping: 30,
};

export default function FinalSummaryModal({ open, onClose }) {
  const t = useT();
  const items = useCartStore((s) => s.cartItems);
  const subtotal = useCartStore((s) => s.getTotal());
  const tableNumber = useCartStore((s) => s.tableNumber);
  const settings = useSettingsStore((s) => s.settings);

  // Service charge percentage from admin settings (never hardcoded). Falls
  // back to 20 only while settings are still loading.
  const pct =
    settings && settings.service_charge_percent != null
      ? Number(settings.service_charge_percent)
      : 20;
  const serviceCharge = subtotal * pct / 100;
  const grandTotal = subtotal + serviceCharge;

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
            transition={sheetTransition}
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
            <div className="border-t border-white/10 pt-2 grid gap-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-white/70">{t('common.productsTotal')}</span>
                <span className="tabular-nums">{formatPrice(subtotal)}</span>
              </div>
              {pct > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">{t('common.serviceCharge')} ({pct}%)</span>
                  <span className="tabular-nums">{formatPrice(serviceCharge)}</span>
                </div>
              )}
              <div className="flex justify-between font-medium pt-1">
                <span>{t('common.finalTotal')}</span>
                <span className="gold-text text-lg">{formatPrice(grandTotal)}</span>
              </div>
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
