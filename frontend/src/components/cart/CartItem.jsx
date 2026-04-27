import ImageWithFallback from '../common/ImageWithFallback.jsx';
import Icon from '../common/Icon.jsx';
import { formatPrice } from '../../utils/formatPrice.js';
import { useCartStore } from '../../stores/cartStore.js';

export default function CartItem({ item }) {
  const inc = useCartStore((s) => s.increaseQuantity);
  const dec = useCartStore((s) => s.decreaseQuantity);
  const remove = useCartStore((s) => s.removeItem);

  return (
    <div className="glass p-3 flex gap-3 items-center">
      <ImageWithFallback src={item.image_url} alt={item.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="truncate font-medium">{item.name}</div>
        <div className="text-xs text-white/55 mt-0.5">{formatPrice(item.price)} × {item.quantity}</div>
        {item.note && <div className="text-xs text-white/40 italic mt-1 truncate">“{item.note}”</div>}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={() => dec(item.id)} aria-label="−" className="btn-icon !w-8 !h-8"><Icon name="minus" size={14} /></button>
        <span className="w-7 text-center tabular-nums text-sm">{item.quantity}</span>
        <button onClick={() => inc(item.id)} aria-label="+" className="btn-icon !w-8 !h-8"><Icon name="plus" size={14} /></button>
        <button onClick={() => remove(item.id)} aria-label="Remove" className="btn-icon !w-8 !h-8 !text-red-400 hover:!bg-red-500/10 hover:!border-red-500/30">
          <Icon name="trash" size={14} />
        </button>
      </div>
    </div>
  );
}
