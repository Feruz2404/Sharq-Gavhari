import { useCartStore } from '../../stores/cartStore.js';
import { useSettingsStore } from '../../stores/settingsStore.js';
import { formatPrice } from '../../utils/formatPrice.js';
import { useT } from '../../locales/useT.js';

export default function CartSummary() {
  const t = useT();
  const subtotal = useCartStore((s) => s.getTotal());
  const count = useCartStore((s) => s.getItemCount());
  const tableNumber = useCartStore((s) => s.tableNumber);
  const settings = useSettingsStore((s) => s.settings);

  // Service charge percentage comes from admin settings (never hardcoded).
  // Fall back to 20 only while settings are still loading.
  const pct =
    settings && settings.service_charge_percent != null
      ? Number(settings.service_charge_percent)
      : 20;
  const serviceCharge = subtotal * pct / 100;
  const grandTotal = subtotal + serviceCharge;

  return (
    <div className="glass-strong p-4 grid gap-2.5">
      {tableNumber && (
        <div className="flex justify-between text-sm">
          <span className="text-white/55">{t('common.table')}</span>
          <span className="font-medium">#{tableNumber}</span>
        </div>
      )}
      <div className="flex justify-between text-sm">
        <span className="text-white/55">{t('common.quantity')}</span>
        <span className="font-medium tabular-nums">{count}</span>
      </div>
      <div className="divider-gold my-1" />
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
      <div className="divider-gold my-1" />
      <div className="flex justify-between items-baseline">
        <span className="text-white/70">{t('common.finalTotal')}</span>
        <span className="gold-text font-semibold text-xl">{formatPrice(grandTotal)}</span>
      </div>
    </div>
  );
}
