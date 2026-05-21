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

// Drawer is up to 720px wide on xl, ~680px on lg, full-width on mobile.
const DRAWER_SIZES = '(min-width: 1280px) 720px, (min-width: 1024px) 680px, 100vw';

// Safe-area-aware padding so the action bar sits clear of the iOS home indicator.
const ACTION_PB_CLS =
  'pb-[calc(env(safe-area-inset-bottom,_0px)_+_1rem)] md:pb-5';

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

  // Panel shell.
  //   Desktop (>= lg): right-side drawer, ~680px on lg / 720px on xl.
  //   Mobile / iPad portrait (< lg): bottom sheet pinned to 94dvh so the
  //     image is dominant and the sheet opens near the top of the viewport.
  const panelClass = isDesktop
    ? 'fixed top-0 right-0 bottom-0 w-full lg:w-[680px] xl:w-[720px] max-w-[720px] z-50 flex flex-col bg-[#0B0B0B]/95 backdrop-blur-xl border-l border-white/10 shadow-[-24px_0_60px_-20px_rgba(0,0,0,0.7)]'
    : 'fixed inset-x-0 bottom-0 z-50 flex flex-col h-[94dvh] max-h-[94dvh] rounded-t-[32px] bg-[#0B0B0B]/95 backdrop-blur-xl border-t border-white/10 shadow-2xl overflow-hidden';

  const panelInitial = isDesktop ? desktopInitial : mobileInitial;
  const panelAnimate = isDesktop ? desktopAnimate : mobileAnimate;
  const panelExit = isDesktop ? desktopExit : mobileExit;

  // Hero image — sized to occupy ~50% of the panel so the photo dominates
  // and the empty black gap below the info block stays small.
  //   Desktop / iPad landscape (>= lg): 50vh, clamped 420..600px.
  //   Mobile baseline: 52dvh, clamped 380..560px.
  //   Tablet portrait (md): 54dvh, clamped 440..580px.
  //   Small phones (<= 390px): 48dvh, min 320px.
  const imageWrapCls = isDesktop
    ? 'relative flex-none w-full overflow-hidden bg-white/[0.02] h-[50vh] min-h-[420px] max-h-[600px]'
    : 'relative flex-none w-full overflow-hidden bg-white/[0.02] h-[52dvh] min-h-[380px] max-h-[560px] max-[390px]:h-[48dvh] max-[390px]:min-h-[320px] md:h-[54dvh] md:min-h-[440px] md:max-h-[580px]';

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
            {/* Close button — floating over the hero image, 48x48 tap target. */}
            <button
              type="button"
              onClick={onClose}
              aria-label={t('common.close')}
              className="absolute top-5 right-5 z-20 w-12 h-12 rounded-full bg-black/60 hover:bg-black/85 hover:text-gold text-white/95 flex items-center justify-center border border-white/10 transition shadow-lg shadow-black/40 backdrop-blur-sm"
            >
              <Icon name="close" size={18} />
            </button>

            {/* Hero image — flex-none so it never shrinks. */}
            <div className={imageWrapCls}>
              <ImageWithFallback
                src={drawerImg}
                alt={name}
                fallback={FALLBACK_GRADIENT}
                eager
                sizes={DRAWER_SIZES}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black to-transparent pointer-events-none" />
              {!isDesktop && (
                <div
                  aria-hidden="true"
                  className="absolute top-3 left-1/2 -translate-x-1/2 z-20 w-12 h-1.5 rounded-full bg-white/40"
                />
              )}
            </div>

            {/* Product info — flex-none with natural height. We deliberately
                do NOT use flex-1 here: when a product has only a short
                description the block must stay compact instead of stretching
                into a huge empty black area before the add-to-cart bar.
                The footer below uses mt-auto so it still pins to the bottom
                of the sheet regardless of how short this block is. */}
            <div className="flex-none px-6 py-6 space-y-5">
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

              {(desc || ingredients) && (
                /* Long-text region. If description / ingredients overflow the
                   sheet, this block scrolls internally instead of bursting
                   the layout or forcing the whole sheet to scroll. */
                <div className="max-h-[24dvh] overflow-y-auto pr-1 space-y-4">
                  {desc && (
                    <p className="text-white/80 text-sm md:text-base leading-relaxed text-pretty">
                      {desc}
                    </p>
                  )}
                  {ingredients && (
                    <div>
                      <div className="text-[10.5px] uppercase tracking-[0.22em] text-gold/80 mb-1.5">
                        {t('menu.ingredients')}
                      </div>
                      <p className="text-white/70 text-sm leading-relaxed">{ingredients}</p>
                    </div>
                  )}
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

            {/* Add-to-cart bar — mt-auto pins it to the bottom of the panel
                regardless of how short the info block above is, flex-none
                so it never shrinks, safe-area inset on mobile. */}
            <div
              className={`mt-auto flex-none border-t border-white/10 px-4 pt-4 md:px-5 md:pt-5 flex items-center gap-3 bg-black/90 backdrop-blur-xl ${ACTION_PB_CLS}`}
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
