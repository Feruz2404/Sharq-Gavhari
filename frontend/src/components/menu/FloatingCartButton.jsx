import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../common/Icon.jsx';
import { useCartStore } from '../../stores/cartStore.js';
import { useSettingsStore } from '../../stores/settingsStore.js';
import { formatPrice } from '../../utils/formatPrice.js';
import { useT } from '../../locales/useT.js';

const hidden = {
  y: 100,
  opacity: 0,
};

const visible = {
  y: 0,
  opacity: 1,
};

const cartTransition = {
  type: 'spring',
  stiffness: 380,
  damping: 32,
};

export default function FloatingCartButton({ to = '/cart' }) {
  const t = useT();
  const count = useCartStore((s) => s.getItemCount());
  // Subscribe to the subtotal so the breakdown recomputes whenever the cart
  // changes. The service-charge / grand-total helpers below read the same
  // live store value at call time.
  const subtotal = useCartStore((s) => s.getTotal());
  const getServiceCharge = useCartStore((s) => s.getServiceCharge);
  const getGrandTotal = useCartStore((s) => s.getGrandTotal);
  const settings = useSettingsStore((s) => s.settings);

  // Service charge percentage comes from admin settings (never hardcoded).
  // This mirrors CartSummary exactly so the floating mini-cart preview and
  // the full CartPage always show identical numbers. Falls back to 20 only
  // while settings are still loading.
  const pct =
    settings && settings.service_charge_percent != null
      ? Number(settings.service_charge_percent)
      : 20;

  // Reuse the shared cartStore helpers - no manual recalculation here.
  const serviceCharge = getServiceCharge(pct);
  const grandTotal = getGrandTotal(pct);

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={hidden} animate={visible} exit={hidden}
          transition={cartTransition}
          className="fixed bottom-4 inset-x-4 z-30 flex justify-center pointer-events-none"
        >
          <div className="pointer-events-auto w-full max-w-sm glass-strong rounded-2xl p-3.5 shadow-gold">
            {/* Pricing breakdown - identical to the CartPage summary so the
                numbers always match across every cart surface. */}
            <div className="grid gap-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-white/55">{t('common.productsTotal')}</span>
                <span className="font-medium tabular-nums">{formatPrice(subtotal)}</span>
              </div>
              {pct > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-white/55">{t('common.serviceCharge')} ({pct}%)</span>
                  <span className="font-medium tabular-nums">{formatPrice(serviceCharge)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline">
                <span className="text-white/70 text-sm">{t('common.finalTotal')}</span>
                <span className="gold-text font-semibold text-lg tabular-nums">{formatPrice(grandTotal)}</span>
              </div>
            </div>

            <Link
              to={to}
              className="btn-gold w-full justify-center gap-2.5 mt-3 !py-2.5"
              aria-label={`${t('nav.cart')} (${count})`}
            >
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-black/25 text-xs font-bold tabular-nums">
                {count}
              </span>
              <Icon name="cart" size={16} />
              <span className="font-semibold">{t('nav.cart')}</span>
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
