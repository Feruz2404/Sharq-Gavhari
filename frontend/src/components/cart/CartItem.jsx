import ImageWithFallback from '../common/ImageWithFallback.jsx';
import { formatPrice } from '../../utils/formatPrice.js';
import { useCartStore } from '../../stores/cartStore.js';

export default function CartItem({ item }) {
  const inc = useCartStore((s) => s.increaseQuantity);
  const dec = useCartStore((s) => s.decreaseQuantity);
  const remove = useCartStore((s) => s.removeItem);
  return (
    <div className="glass p-3 flex gap-3 items-center">
      <ImageWithFallback src={item.image_url} alt={item.name} className="w-16 h-16 rounded-xl object-cover" />
      <div className="flex-1 min-w-0">
        <div className="truncate font-medium">{item.name}</div>
        <div className="text-xs text-white/60">{formatPrice(item.price)} × {item.quantity}</div>
        {item.note && <div className="text-xs text-white/40 italic mt-0.5">“{item.note}”</div>}
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => dec(item.id)} className="btn-ghost !py-1 !px-2">−</button>
        <span className="w-6 text-center">{item.quantity}</span>
        <button onClick={() => inc(item.id)} className="btn-ghost !py-1 !px-2">+</button>
        <button onClick={() => remove(item.id)} className="btn-ghost !py-1 !px-2 !text-red-400">×</button>
      </div>
    </div>
  );
}
