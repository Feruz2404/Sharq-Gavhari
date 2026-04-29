import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ImageWithFallback from '../common/ImageWithFallback.jsx';
import Price from '../common/Price.jsx';
import Icon from '../common/Icon.jsx';
import { getLocalizedField } from '../../utils/getLocalizedField.js';
import { useLanguageStore } from '../../stores/languageStore.js';
import { useCartStore } from '../../stores/cartStore.js';
import { useT } from '../../locales/useT.js';

const overlayInitial = { opacity: 0 };
const overlayAnimate = { opacity: 1 };
const overlayExit = { opacity: 0 };
const overlayTransition = { duration: 0.2 };

const desktopInitial = { x: '100%' };
const desktopAnimate = { x: 0 };
const desktopExit = { x: '100%' };

const mobileInitial = { y: '100%' };
const mobileAnimate = { y: 0 };
const mobileExit = { y: '100%' };

const panelTransition = { type: 'spring', stiffness: 320, damping: 32 };

const FALLBACK_GRADIENT = (
  <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-amber-900/20 to-zinc-950 flex items-center justify-center">
    <span className="font-display text-5xl text-gold/40">SG</span>
  </div>
);

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia('(min-width: 1024px)').matches;
  });
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = (e) => setIsDesktop(e.matches);
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else mq.removeListener(onChange);
    };
  }, []);
  return isDesktop;
}

export default function ProductDetailDrawer({ product, open, onClose }) {
  const lang = useLanguageStore((s) => s.language);
  const t = useT();
  const addItem = useCartStore((s) => s.addItem);
  const isDesktop = useIsDesktop();
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (open) setQty(1);
  }, [open, product]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  const safeProduct = product || null;
  const name = safeProduct ? getLocalizedField(safeProduct, 'name', lang) : '';
  const desc = safeProduct ? getLocalizedField(safeProduct, 'description', lang) : '';
  const ingredients = safeProduct ? getLocalizedField(safeProduct, 'ingredients', lang) : '';
  const unavailable = safeProduct ? !safeProduct.is_available : false;
  const weight = safeProduct ? safeProduct.weight : null;
  const prepTime = safeProduct ? safeProduct.preparation_time : null;

  const handleAdd = () => {
    if (!safeProduct || unavailable) return;
    addItem(safeProduct, qty, '', lang);
    if (onClose) onClose();
  };

  const panelClass = isDesktop
    ? 'fixed top-0 right-0 bottom-0 w-full max-w-md z-50 flex flex-col bg-bg/95 backdrop-blur-xl border-l border-white/10 shadow-2xl'
    : 'fixed inset-x-0 bottom-0 z-50 flex flex-col max-h-[92vh] rounded-t-3xl bg-bg/95 backdrop-blur-xl border-t border-white/10 shadow-2xl';

  const panelInitial = isDesktop ? desktopInitial : mobileInitial;
  const panelAnimate = isDesktop ? desktopAnimate : mobileAnimate;
  const panelExit = isDesktop ? desktopExit : mobileExit;

  return (
    <AnimatePresence>
      {open && safeProduct && (
        <>
          <motion.div
            key="sg-detail-overlay"
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            initial={overlayInitial}
            animate={overlayAnimate}
            exit={overlayExit}
            transition={overlayTransition}
          />
          <motion.div
            key="sg-detail-panel"
            className={panelClass}
            role="dialog"
            aria-modal="true"
            aria-label={t('menu.productDetails')}
            initial={panelInitial}
            animate={panelAnimate}
            exit={panelExit}
            transition={panelTransition}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label={t('common.close')}
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center border border-white/10"
            >
              <span aria-hidden className="text-base leading-none">\u2715</span>
            </button>

            <div className="overflow-y-auto flex-1">
              <div className="relative aspect-[16/10] w-full overflow-hidden">
                <ImageWithFallback
                  src={safeProduct.image_url}
                  alt={name}
                  fallback={FALLBACK_GRADIENT}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                {!isDesktop && (
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1.5 rounded-full bg-white/30" />
                )}
              </div>

              <div className="p-5 md:p-6 space-y-5">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-gold/70 mb-1">
                    {t('menu.productDetails')}
                  </div>
                  <h2 className="font-display text-2xl md:text-3xl gold-text">{name}</h2>
                  <div className="mt-2 h-px w-10 bg-gold/60" />
                </div>

                {desc && (
                  <p className="text-white/75 text-sm md:text-base leading-relaxed">{desc}</p>
                )}

                {ingredients && (
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.18em] text-gold/80 mb-1.5">
                      {t('menu.ingredients')}
                    </div>
                    <p className="text-white/65 text-sm leading-relaxed">{ingredients}</p>
                  </div>
                )}

                {(weight || prepTime) && (
                  <div className="grid grid-cols-2 gap-3">
                    {weight && (
                      <div className="glass-soft p-3 rounded-xl border border-white/5">
                        <div className="text-[10px] uppercase tracking-wider text-white/45">
                          {t('menu.weight')}
                        </div>
                        <div className="text-white text-sm mt-0.5">{weight}</div>
                      </div>
                    )}
                    {prepTime && (
                      <div className="glass-soft p-3 rounded-xl border border-white/5">
                        <div className="text-[10px] uppercase tracking-wider text-white/45">
                          {t('menu.prepTime')}
                        </div>
                        <div className="text-white text-sm mt-0.5">{prepTime}</div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <Price
                    value={safeProduct.price}
                    discount={safeProduct.discount_price}
                    className="text-lg"
                  />
                  {unavailable && (
                    <span className="text-[11px] uppercase tracking-wider bg-red-600/85 text-white px-2 py-1 rounded-md">
                      {t('common.unavailable')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 p-4 md:p-5 flex items-center gap-3 bg-black/40">
              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5">
                <button
                  type="button"
                  onClick={() => setQty((v) => Math.max(1, v - 1))}
                  aria-label="-"
                  className="w-9 h-9 flex items-center justify-center text-white/80 hover:text-gold"
                >
                  <span aria-hidden className="text-base leading-none">\u2212</span>
                </button>
                <div className="w-8 text-center text-white text-sm">{qty}</div>
                <button
                  type="button"
                  onClick={() => setQty((v) => v + 1)}
                  aria-label="+"
                  className="w-9 h-9 flex items-center justify-center text-white/80 hover:text-gold"
                >
                  <Icon name="plus" size={14} />
                </button>
              </div>
              <button
                type="button"
                onClick={handleAdd}
                disabled={unavailable}
                className="btn-gold flex-1 justify-center"
              >
                <Icon name="plus" size={16} />
                <span>{t('common.addToCart')}</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
