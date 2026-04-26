import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ImageWithFallback from '../../components/common/ImageWithFallback.jsx';
import Price from '../../components/common/Price.jsx';
import LoadingLogo from '../../components/common/LoadingLogo.jsx';
import { productService } from '../../services/productService.js';
import { useLanguageStore } from '../../stores/languageStore.js';
import { getLocalizedField } from '../../utils/getLocalizedField.js';
import { useCartStore } from '../../stores/cartStore.js';
import { useT } from '../../locales/useT.js';

export default function ProductDetailPage() {
  const { id } = useParams();
  const lang = useLanguageStore((s) => s.language);
  const t = useT();
  const [p, setP] = useState(null);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    productService.get(id).then(setP).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingLogo fullscreen />;
  if (!p) return <div className="p-10 text-center">{t('common.empty')}</div>;

  const name = getLocalizedField(p, 'name', lang);
  const desc = getLocalizedField(p, 'description', lang);
  const ing  = getLocalizedField(p, 'ingredients', lang);
  const unavailable = !p.is_available;

  return (
    <div className="min-h-screen pb-28">
      <div className="max-w-3xl mx-auto px-4 py-4">
        <Link to="/menu" className="btn-ghost !py-1 !px-2 text-sm">{t('nav.back')}</Link>
      </div>
      <motion.div initial= opacity: 0  animate= opacity: 1  className="max-w-3xl mx-auto px-4 grid gap-4">
        <ImageWithFallback src={p.image_url} alt={name} className="w-full aspect-[16/10] object-cover rounded-2xl" />
        <div className="glass p-4 grid gap-3">
          <div className="flex justify-between items-start gap-3">
            <h1 className="font-display gold-text text-2xl">{name}</h1>
            <Price value={p.price} discount={p.discount_price} className="text-lg" />
          </div>
          {desc && <p className="text-white/80">{desc}</p>}
          {ing  && <p className="text-white/60 text-sm"><span className="text-white/40">• </span>{ing}</p>}
          <div className="flex flex-wrap gap-3 text-xs text-white/60">
            {p.weight && <span>⚖ {p.weight}</span>}
            {p.preparation_time && <span>⏱ {p.preparation_time}</span>}
          </div>
          <div className="flex items-center gap-3">
            <span className="label">{t('common.quantity')}</span>
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="btn-ghost !py-1 !px-3">−</button>
            <span className="w-8 text-center">{qty}</span>
            <button onClick={() => setQty(qty + 1)} className="btn-ghost !py-1 !px-3">+</button>
          </div>
          <div>
            <label className="label">{t('common.note')}</label>
            <input className="input mt-1" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <button
            disabled={unavailable}
            onClick={() => addItem(p, qty, note, lang)}
            className="btn-gold w-full"
          >
            {unavailable ? t('common.unavailable') : `+ ${t('common.addToCart')}`}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
