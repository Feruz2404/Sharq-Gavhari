import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CartItem from '../../components/cart/CartItem.jsx';
import CartSummary from '../../components/cart/CartSummary.jsx';
import FinalSummaryModal from '../../components/cart/FinalSummaryModal.jsx';
import LanguageSwitcher from '../../components/common/LanguageSwitcher.jsx';
import { useCartStore } from '../../stores/cartStore.js';
import { useSettingsStore } from '../../stores/settingsStore.js';
import { useT } from '../../locales/useT.js';

export default function TabletCartPage() {
  const t = useT();
  const items = useCartStore((s) => s.cartItems);
  const clearCart = useCartStore((s) => s.clearCart);
  const settings = useSettingsStore((s) => s.settings);
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);
  const [showFinal, setShowFinal] = useState(false);

  // Ensure settings (including the service charge %) are loaded for the
  // tablet cart even if the menu page hasn't fetched them yet.
  useEffect(() => {
    if (!settings) fetchSettings();
  }, [settings, fetchSettings]);

  return (
    <div className="min-h-screen pb-28">
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-black/30 border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link to="/tablet/menu" className="btn-ghost !py-1 !px-2 text-sm">{t('nav.back')}</Link>
          <div className="font-display gold-text">{t('nav.cart')}</div>
          <LanguageSwitcher />
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-5 grid gap-3">
        {items.length === 0 && <div className="glass p-8 text-center text-white/60">{t('common.empty')}</div>}
        {items.map((i) => <CartItem key={i.id} item={i} />)}
        {items.length > 0 && <CartSummary />}
        {items.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setShowFinal(true)} className="btn-gold">{t('common.showWaiter')}</button>
            <button onClick={clearCart} className="btn-ghost">{t('common.nextCustomer')}</button>
          </div>
        )}
      </main>
      <FinalSummaryModal open={showFinal} onClose={() => { setShowFinal(false); clearCart(); }} />
    </div>
  );
}
