import { useCartStore } from '../../stores/cartStore.js';
import { formatPrice } from '../../utils/formatPrice.js';
import { useT } from '../../locales/useT.js';

export default function CartSummary() {
  const t = useT();
  const total = useCartStore((s) => s.getTotal());
  const count = useCartStore((s) => s.getItemCount());
  const tableNumber = useCartStore((s) => s.tableNumber);
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
      <div className="flex justify-between items-baseline">
        <span className="text-white/70">{t('common.total')}</span>
        <span className="gold-text font-semibold text-xl">{formatPrice(total)}</span>
      </div>
    </div>
  );
}
