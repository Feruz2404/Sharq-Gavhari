import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ImageWithFallback from '../../components/common/ImageWithFallback.jsx';
import Price from '../../components/common/Price.jsx';
import Icon from '../../components/common/Icon.jsx';
import LoadingLogo from '../../components/common/LoadingLogo.jsx';
import LanguageSwitcher from '../../components/common/LanguageSwitcher.jsx';
import AdminAccessButton from '../../components/common/AdminAccessButton.jsx';
import { useToast } from '../../components/common/Toast.jsx';
import { productService } from '../../services/productService.js';
import { useLanguageStore } from '../../stores/languageStore.js';
import { getLocalizedField } from '../../utils/getLocalizedField.js';
import { useCartStore } from '../../stores/cartStore.js';
import { useT } from '../../locales/useT.js';

const slide = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35 } };

export default function ProductDetailPage() {
  const { id } = useParams();
  const lang = useLanguageStore((s) => s.language);
  const t = useT();
  const toast = useToast();
  const [p, setP] = useState(null);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    productService.get(id).then(setP).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingLogo fullscreen />;
  if (!p) {
    return (
      <div className="min-h-screen grid place-items-center p-10 text-center">
        <div className="glass p-8">{t('common.empty')}</div>
      </div>
    );
  }

  const name = getLocalizedField(p, 'name', lang);
  const desc = getLocalizedField(p, 'description', lang);
  const ing  = getLocalizedField(p, 'ingredients', lang);
  const unavailable = !p.is_available;

  const handleAdd = () => {
    if (unavailable) return;
    addItem(p, qty, note, lang);
    toast.success(`${name} · ×${qty}`);
  };

  return (
    <div className="min-h-screen pb-32">
      <header className="surface-header">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link to="/menu" className="btn-icon" aria-label={t('nav.back')}>
            <Icon name="back" size={16} />
          </Link>
          <div className="font-display gold-text truncate text-base">{name}</div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <AdminAccessButton />
          </div>
        </div>
      </header>

      <motion.div {...slide} className="max-w-4xl mx-auto px-4 pt-5 grid gap-5 md:grid-cols-2">
        <div className="glass overflow-hidden">
          <div className="aspect-[4/3] relative">
            <ImageWithFallback src={p.image_url} alt={name} className="w-full h-full object-cover" />
            {unavailable && (
              <span className="absolute top-3 left-3 text-xs uppercase tracking-wider bg-red-600/90 text-white px-2.5 py-1 rounded-md">
                {t('common.unavailable')}
              </span>
            )}
          </div>
        </div>

        <div className="glass p-5 grid gap-4">
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-display gold-text text-2xl md:text-3xl leading-tight">{name}</h1>
            <Price value={p.price} discount={p.discount_price} className="text-base shrink-0" />
          </div>
          {desc && <p className="text-white/80 leading-relaxed">{desc}</p>}
          {ing && (
            <div>
              <div className="label">{`Ingredients · ${lang.toUpperCase()}`}</div>
              <p className="text-white/65 text-sm">{ing}</p>
            </div>
          )}

          {(p.weight || p.preparation_time) && (
            <div className="flex flex-wrap gap-2">
              {p.weight && <span className="pill">⚖ {p.weight}</span>}
              {p.preparation_time && <span className="pill">⏱ {p.preparation_time}</span>}
            </div>
          )}

          <div className="divider-gold my-1" />

          <div className="flex items-center justify-between">
            <span className="label !mb-0">{t('common.quantity')}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="btn-icon" aria-label="−"><Icon name="minus" size={14} /></button>
              <span className="w-9 text-center tabular-nums">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="btn-icon" aria-label="+"><Icon name="plus" size={14} /></button>
            </div>
          </div>

          <div>
            <label className="label">{t('common.note')}</label>
            <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="" />
          </div>

          <button
            disabled={unavailable}
            onClick={handleAdd}
            className="btn-gold w-full !py-3"
          >
            <Icon name="plus" size={16} />
            {unavailable ? t('common.unavailable') : t('common.addToCart')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
