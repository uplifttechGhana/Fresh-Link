/**
 * Cart store — holds produce items keyed by UUID from the API.
 * Replaces the legacy numeric-id cart in store.ts for all buyer screens
 * that are wired to real data.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;           // ProduceListing UUID
  title: string;
  farmer: string;
  farmerId: string;
  pricePerUnit: number;
  qty: number;
  image: string;
  unit: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'qty'>) => void;
  updateQty: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (item) =>
        set((s) => {
          const existing = s.items.find((i) => i.id === item.id);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.id === item.id ? { ...i, qty: i.qty + 1 } : i,
              ),
            };
          }
          return { items: [...s.items, { ...item, qty: 1 }] };
        }),

      updateQty: (id, delta) =>
        set((s) => ({
          items: s.items
            .map((i) => (i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i)),
        })),

      removeItem: (id) =>
        set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

      clearCart: () => set({ items: [] }),
    }),
    { name: 'freshlink-cart' },
  ),
);
