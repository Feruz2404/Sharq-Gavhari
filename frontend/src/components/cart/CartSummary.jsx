import { useCartStore } from '../../stores/cartStore.js';
import { formatPrice } from '../../utils/formatPrice.js';
import { useT } from '../../locales/useT.js';

export default function CartSummary() {
  const t = useT();
  const total = useCartStore((s) => s.getTotal());
  const tableNumber = useCartStore((s) => s.tableNumber);
  return (
    <div className="glass p-4 grid gap-2">
      {tableNumber && (
        <div className="flex justify-between text-sm">
          <span className="text-white/60">{t('common.table')}</span>
          <span>{tableNumber}</span>
        </div>
      )}
      <div className="flex justify-between">
        <span className="text-white/60">{t('common.total')}</span>
        <span className="gold-text font-semibold text-lg">{formatPrice(total)}</span>
      </div>
    </div>
  );
}
