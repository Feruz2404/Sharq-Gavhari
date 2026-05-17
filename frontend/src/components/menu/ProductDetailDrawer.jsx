import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ImageWithFallback from '../common/ImageWithFallback.jsx';
import Price from '../common/Price.jsx';
import Icon from '../common/Icon.jsx';
import { getLocalizedField } from '../../utils/getLocalizedField.js';
import { useLanguageStore } from '../../stores/languageStore.js';
import { useCartStore } from '../../stores/cartStore.js';
import { useT } from '../../locales/useT.js';
import { detailImage } from '../../lib/menuImage.js';

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

const DRAWER_SIZES = '(min-width: 1024px) 480px, 100vw';

// Safe-area-aware Tailwind arbitrary value. On mobile we want
// padding-bottom = env(safe-area-inset-bottom) + 16px so the action bar
// always sits clear of the iOS home indicator. On md+ we go back to 1.25rem.
const ACTION_PB_CLS =
  'pb-[calc(env(safe-area-inset-bottom,_0px)_+_1rem)] md:pb-5';
const CLOSE_TOP_CLS =
  'top-[max(12px,_calc(env(safe-area-inset-top,_0px)_+_4px))]';

const FALLBACK_GRADIENT = (
  <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-amber-900/25 to-zinc-950 flex items-center justify-center">
    <span className="font-display text-6xl text-gold/40 drop-shadow-[0_2px_12px_rgba(212,175,55,0.25)]">SG</span>
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

export default function ProductDetailDrawer({ product, categoryName, open, onClose }) {
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

  const drawerImg = safeProduct ? detailImage(safeProduct) : null;

  const handleAdd = () => {
    if (!safeProduct || unavailable) return;
    addItem(safeProduct, qty, '', lang);
    if (onClose) onClose();
  };

  // Desktop = right-side drawer (>= lg). Mobile = bottom sheet capped at
  // 92dvh with a 32px top corner radius and a safe-area-aware action bar.
  const panelClass = isDesktop
    ? 'fixed top-0 right-0 bottom-0 w-full max-w-[480px] z-50 flex flex-col bg-[#0B0B0B]/95 backdrop-blur-xl border-l border-white/10 shadow-[-24px_0_60px_-20px_rgba(0,0,0,0.7)]'
    : 'fixed inset-x-0 bottom-0 z-50 flex flex-col max-h-[92dvh] rounded-t-[32px] bg-[#0B0B0B]/95 backdrop-blur-xl border-t border-white/10 shadow-2xl overflow-hidden';

  const panelInitial = isDesktop ? desktopInitial : mobileInitial;
  const panelAnimate = isDesktop ? desktopAnimate : mobileAnimate;
  const panelExit = isDesktop ? desktopExit : mobileExit;

  // Image: mobile caps the hero around 38vh so content + action bar always fit.
  const imageWrapCls = isDesktop
    ? 'relative aspect-[16/10] w-full overflow-hidden bg-white/[0.02]'
    : 'relative w-full overflow-hidden bg-white/[0.02] h-[38vh] max-h-[320px] min-h-[220px]';

  const closeTopCls = isDesktop ? 'top-3' : CLOSE_TOP_CLS;

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
            {/* Close button — 44x44 tap target. */}
            <button
              type="button"
              onClick={onClose}
              aria-label={t('common.close')}
              className={`absolute right-3 z-10 w-11 h-11 rounded-full bg-black/70 hover:bg-black/90 hover:text-gold text-white/90 flex items-center justify-center border border-white/10 transition shadow-lg shadow-black/40 ${closeTopCls}`}
            >
              <Icon name="close" size={16} />
            </button>

            <div className="overflow-y-auto flex-1">
              <div className={imageWrapCls}>
                <ImageWithFallback
                  src={drawerImg}
                  alt={name}
                  fallback={FALLBACK_GRADIENT}
                  eager
                  sizes={DRAWER_SIZES}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent pointer-events-none" />
                {!isDesktop && (
                  <div
                    aria-hidden="true"
                    className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full bg-white/40"
                  />
                )}
              </div>

              <div className="p-5 md:p-6 space-y-5">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] uppercase tracking-[0.24em] text-gold/80">
                      {t('menu.productDetails')}
                    </span>
                    {categoryName && (
                      <>
                        <span aria-hidden="true" className="text-white/30 text-[10px]">•</span>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-white/55">
                          {categoryName}
                        </span>
                      </>
                    )}
                  </div>
                  <h2 className="mt-2.5 font-display text-2xl md:text-3xl gold-text leading-[1.1] text-balance">
                    {name}
                  </h2>
                  <div className="mt-2.5 h-px w-12 bg-gradient-to-r from-gold/80 via-gold/40 to-transparent" />
                </div>

                {desc && (
                  <p className="text-white/80 text-sm md:text-base leading-relaxed text-pretty">{desc}</p>
                )}

                {ingredients && (
                  <div>
                    <div className="text-[10.5px] uppercase tracking-[0.22em] text-gold/80 mb-1.5">
                      {t('menu.ingredients')}
                    </div>
                    <p className="text-white/70 text-sm leading-relaxed">{ingredients}</p>
                  </div>
                )}

                {(weight || prepTime) && (
                  <div className="grid grid-cols-2 gap-3">
                    {weight && (
                      <div className="glass p-3 rounded-xl">
                        <div className="text-[10px] uppercase tracking-[0.18em] text-white/45">
                          {t('menu.weight')}
                        </div>
                        <div className="text-white text-sm mt-1">{weight}</div>
                      </div>
                    )}
                    {prepTime && (
                      <div className="glass p-3 rounded-xl">
                        <div className="text-[10px] uppercase tracking-[0.18em] text-white/45">
                          {t('menu.prepTime')}
                        </div>
                        <div className="text-white text-sm mt-1">{prepTime}</div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="min-w-0 flex-1">
                    <Price
                      value={safeProduct.price}
                      discount={safeProduct.discount_price}
                      secondary={safeProduct.secondary_price}
                      className="text-lg"
                    />
                  </div>
                  {unavailable && (
                    <span className="shrink-0 text-[10.5px] uppercase tracking-[0.2em] bg-zinc-800/80 ring-1 ring-white/15 text-white/85 px-2 py-1 rounded-md">
                      {t('common.unavailable')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Sticky add-to-cart bar. Mobile gets safe-area inset so the
                button never sits under the iOS home indicator. */}
            <div
              className={`border-t border-white/10 px-4 pt-4 md:px-5 md:pt-5 flex items-center gap-3 bg-black/55 backdrop-blur-xl ${ACTION_PB_CLS}`}
            >
              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] shrink-0">
                <button
                  type="button"
                  onClick={() => setQty((v) => Math.max(1, v - 1))}
                  aria-label={t('common.decrease') || 'minus'}
                  className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-gold transition"
                  disabled={qty <= 1}
                >
                  <Icon name="minus" size={14} />
                </button>
                <div className="w-8 text-center text-white text-sm tabular-nums">{qty}</div>
                <button
                  type="button"
                  onClick={() => setQty((v) => v + 1)}
                  aria-label={t('common.increase') || 'plus'}
                  className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-gold transition"
                >
                  <Icon name="plus" size={14} />
                </button>
              </div>
              <button
                type="button"
                onClick={handleAdd}
                disabled={unavailable}
                className="btn-gold flex-1 justify-center whitespace-nowrap min-w-0 min-h-[44px]"
              >
                <Icon name="plus" size={16} />
                <span className="truncate">{t('common.addToCart')}</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
