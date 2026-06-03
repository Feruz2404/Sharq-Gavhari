import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CartItem from '../../components/cart/CartItem.jsx';
import CartSummary from '../../components/cart/CartSummary.jsx';
import FinalSummaryModal from '../../components/cart/FinalSummaryModal.jsx';
import LanguageSwitcher from '../../components/common/LanguageSwitcher.jsx';
import Icon from '../../components/common/Icon.jsx';
import { useCartStore } from '../../stores/cartStore.js';
import { useSettingsStore } from '../../stores/settingsStore.js';
import { useT } from '../../locales/useT.js';

// Safe-area-aware top inset for the sticky header. Tailwind arbitrary
// values use underscores in place of spaces inside CSS calc() / max().
const HEADER_PT_CLS =
  'pt-[max(0.75rem,_calc(env(safe-area-inset-top,_0px)_+_0.5rem))]';

export default function CartPage() {
  const t = useT();
  const navigate = useNavigate();
  const items = useCartStore((s) => s.cartItems);
  const clearCart = useCartStore((s) => s.clearCart);
  const settings = useSettingsStore((s) => s.settings);
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);
  const [showFinal, setShowFinal] = useState(false);

  // Ensure settings (including the service charge %) are loaded even when a
  // customer lands directly on /cart without first visiting the menu page.
  useEffect(() => {
    if (!settings) fetchSettings();
  }, [settings, fetchSettings]);

  // Smart back — always client-side React Router navigation:
  //   1. Prefer navigate(-1) so the menu page re-uses its existing component
  //      tree (and the in-memory _menuCache in MenuPage avoids any refetch).
  //   2. If the cart was opened as the entry route (history length === 1),
  //      fall back to navigate('/menu', { replace: true }) so the URL bar
  //      doesn't have a dangling /cart entry.
  // No window.location, no <a href>, no location.reload anywhere.
  const handleBack = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/menu', { replace: true });
  }, [navigate]);

  const isEmpty = items.length === 0;

  return (
    <div className="min-h-[100dvh] flex flex-col pb-28">
      {/* Sticky header. Safe-area top padding keeps the back button below the
          iOS status bar / browser chrome. backdrop-blur + dark tint keeps it
          legible above the page background image. */}
      <header
        className={`sticky top-0 z-20 backdrop-blur-xl bg-black/45 border-b border-white/5 ${HEADER_PT_CLS} pb-3`}
      >
        <div className="max-w-3xl mx-auto px-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="btn-ghost !py-1.5 !px-3 text-sm inline-flex items-center gap-1.5"
            aria-label={t('nav.back')}
          >
            <Icon name="back" size={14} />
            <span>{t('nav.back')}</span>
          </button>
          <div className="font-display gold-text">{t('nav.cart')}</div>
          <LanguageSwitcher />
        </div>
      </header>

      {/* Main column. flex-1 + flex-col so EmptyCart can vertically centre
          itself within the remaining viewport height instead of clinging to
          the top of the page on tablet / desktop. */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 pt-6 md:pt-10 pb-6 flex flex-col gap-3">
        {isEmpty ? (
          <EmptyCart t={t} onBack={handleBack} />
        ) : (
          <>
            {items.map((i) => (
              <CartItem key={i.id} item={i} />
            ))}
            <CartSummary />
            <div className="grid grid-cols-2 gap-3 mt-2">
              <button onClick={() => setShowFinal(true)} className="btn-gold">
                {t('common.showWaiter')}
              </button>
              <button onClick={clearCart} className="btn-ghost">
                {t('common.clear')}
              </button>
            </div>
          </>
        )}
      </main>

      <FinalSummaryModal open={showFinal} onClose={() => setShowFinal(false)} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty state — vertically centred premium glass card                        */
/* -------------------------------------------------------------------------- */
function EmptyCart({ t, onBack }) {
  return (
    <div className="flex-1 grid place-items-center py-8 md:py-16">
      <div className="glass max-w-[560px] w-full mx-auto px-6 py-10 md:px-10 md:py-14 text-center">
        <div className="mx-auto w-14 h-14 md:w-16 md:h-16 rounded-full bg-gold/[0.08] ring-1 ring-gold/25 grid place-items-center shadow-[0_0_30px_-8px_rgba(212,175,55,0.45)]">
          <Icon name="cart" size={24} className="text-gold" />
        </div>
        <h2 className="mt-5 font-display text-xl md:text-2xl gold-text">
          {t('common.empty')}
        </h2>
        <p className="mt-3 text-white/65 text-sm md:text-base max-w-sm mx-auto leading-relaxed">
          {t('menu.chooseCategory')}
        </p>
        <button
          type="button"
          onClick={onBack}
          className="btn-gold mt-6 inline-flex items-center gap-2"
        >
          <Icon name="back" size={14} />
          <span>{t('nav.back')}</span>
        </button>
      </div>
    </div>
  );
}
