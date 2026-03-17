import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Plant, User } from '@workspace/api-client-react';

interface CartItem {
  plant: Plant;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (plant: Plant, quantity?: number) => void;
  removeItem: (plantId: number) => void;
  updateQuantity: (plantId: number, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (plant, quantity = 1) => {
        set((state) => {
          const existingItem = state.items.find((i) => i.plant.id === plant.id);
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.plant.id === plant.id
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, { plant, quantity }] };
        });
      },
      removeItem: (plantId) => {
        set((state) => ({
          items: state.items.filter((i) => i.plant.id !== plantId),
        }));
      },
      updateQuantity: (plantId, quantity) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.plant.id === plantId ? { ...i, quantity: Math.max(1, quantity) } : i
          ),
        }));
      },
      clearCart: () => set({ items: [] }),
      getTotal: () => {
        return get().items.reduce((total, item) => total + item.plant.price * item.quantity, 0);
      },
    }),
    { name: 'nursery-cart' }
  )
);

interface AuthStore {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => {
        set({ token: null, user: null });
        // Clean up client fetch headers if needed, though they usually check localStorage
      },
    }),
    { name: 'nursery-auth' }
  )
);
