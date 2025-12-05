import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  image: string;
  slug: string;
  quantity: number;
  variant?: {
    name: string;
    options?: Record<string, string>;
  };
}

interface CartState {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  
  // Actions
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  
  // Computed
  getItem: (productId: string, variantId?: string) => CartItem | undefined;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      itemCount: 0,
      subtotal: 0,

      addItem: (item) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (i) => i.productId === item.productId && i.variantId === item.variantId
          );

          let newItems: CartItem[];
          
          if (existingIndex > -1) {
            // Update existing item
            newItems = [...state.items];
            newItems[existingIndex] = {
              ...newItems[existingIndex],
              quantity: newItems[existingIndex].quantity + (item.quantity || 1),
            };
          } else {
            // Add new item
            newItems = [...state.items, { ...item, quantity: item.quantity || 1 }];
          }

          const itemCount = newItems.reduce((sum, i) => sum + i.quantity, 0);
          const subtotal = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

          return { items: newItems, itemCount, subtotal };
        });
      },

      removeItem: (productId, variantId) => {
        set((state) => {
          const newItems = state.items.filter(
            (i) => !(i.productId === productId && i.variantId === variantId)
          );
          
          const itemCount = newItems.reduce((sum, i) => sum + i.quantity, 0);
          const subtotal = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

          return { items: newItems, itemCount, subtotal };
        });
      },

      updateQuantity: (productId, quantity, variantId) => {
        set((state) => {
          if (quantity < 1) {
            return state;
          }

          const newItems = state.items.map((item) => {
            if (item.productId === productId && item.variantId === variantId) {
              return { ...item, quantity };
            }
            return item;
          });

          const itemCount = newItems.reduce((sum, i) => sum + i.quantity, 0);
          const subtotal = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

          return { items: newItems, itemCount, subtotal };
        });
      },

      clearCart: () => {
        set({ items: [], itemCount: 0, subtotal: 0 });
      },

      getItem: (productId, variantId) => {
        return get().items.find(
          (i) => i.productId === productId && i.variantId === variantId
        );
      },
    }),
    {
      name: 'zamane-cart',
    }
  )
);
