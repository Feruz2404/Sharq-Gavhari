import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getLocalizedField } from '../utils/getLocalizedField.js';

export const useCartStore = create(persist(
  (set, get) => ({
    cartItems: [],   // [{ id, name, image_url, price, quantity, note }]
    tableNumber: '',

    setTableNumber: (tableNumber) => set({ tableNumber: tableNumber || '' }),

    addItem: (product, quantity = 1, note = '', lang = 'uz') => {
      const items = get().cartItems.slice();
      const idx = items.findIndex((i) => i.id === product.id);
      const price = product.discount_price ?? product.price;
      if (idx >= 0) {
        items[idx] = { ...items[idx], quantity: items[idx].quantity + quantity, note: note || items[idx].note };
      } else {
        items.push({
          id: product.id,
          name: getLocalizedField(product, 'name', lang),
          image_url: product.image_url || '',
          price,
          quantity,
          note,
        });
      }
      set({ cartItems: items });
    },

    removeItem: (productId) =>
      set({ cartItems: get().cartItems.filter((i) => i.id !== productId) }),

    increaseQuantity: (productId) =>
      set({ cartItems: get().cartItems.map((i) => i.id === productId ? { ...i, quantity: i.quantity + 1 } : i) }),

    decreaseQuantity: (productId) =>
      set({
        cartItems: get().cartItems
          .map((i) => i.id === productId ? { ...i, quantity: i.quantity - 1 } : i)
          .filter((i) => i.quantity > 0),
      }),

    clearCart: () => set({ cartItems: [] }),

    getTotal: () => get().cartItems.reduce((s, i) => s + i.price * i.quantity, 0),
    getItemCount: () => get().cartItems.reduce((s, i) => s + i.quantity, 0),

    // Intentionally NO submitCart / sendOrder. Cart is local-only.
  }),
  { name: 'sg_cart' }
));
