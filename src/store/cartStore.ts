import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem, Product } from '../types';
import { STORAGE_KEYS } from '../constants';
import { validateStock, validateQuantity } from '../utils/cartValidation';
import { getProductStock } from '../utils/productUtils';
import { COUNTRIES } from '../constants';

// Mutex to prevent concurrent cart operations
let cartMutex = false;
let cartMutexQueue: Array<() => void> = [];

const acquireCartMutex = async (): Promise<() => void> => {
  return new Promise((resolve) => {
    if (!cartMutex) {
      cartMutex = true;
      resolve(() => {
        cartMutex = false;
        if (cartMutexQueue.length > 0) {
          const next = cartMutexQueue.shift();
          if (next) next();
        }
      });
    } else {
      cartMutexQueue.push(() => {
        cartMutex = true;
        resolve(() => {
          cartMutex = false;
          if (cartMutexQueue.length > 0) {
            const next = cartMutexQueue.shift();
            if (next) next();
          }
        });
      });
    }
  });
};

interface CartState {
  items: CartItem[];
  selectedCountry: 'germany' | 'denmark' | null;
  countrySelected: boolean;
  addItem: (product: Product, quantity: number, country: 'germany' | 'denmark') => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getTotal: () => number;
  getItemCount: () => number;
  loadCart: () => Promise<void>;
  saveCart: () => Promise<void>;
  setSelectedCountry: (country: 'germany' | 'denmark') => Promise<void>;
  loadCountry: () => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  selectedCountry: null,
  countrySelected: false,

  addItem: async (product, quantity, country) => {
    const release = await acquireCartMutex();
    try {
      const stock = getProductStock(product, country);
      // Validate stock
      const stockValidation = validateStock(product, quantity, country);
      if (!stockValidation.isValid) {
        console.warn(stockValidation.error);
        return;
      }

      // Validate quantity
      const quantityValidation = validateQuantity(quantity, 1, stock);
      if (!quantityValidation.isValid) {
        console.warn(quantityValidation.error);
        return;
      }

      set((state) => {
        const existingItem = state.items.find(
          (item) => item.product.id === product.id && item.selectedCountry === country
        );

        if (existingItem) {
          const newQuantity = existingItem.quantity + quantity;
          // Check if new quantity exceeds stock
          if (newQuantity > stock) {
            console.warn(`Cannot add more than ${stock} items`);
            return state;
          }
          const updatedItems = state.items.map((item) =>
            item.product.id === product.id && item.selectedCountry === country
              ? { ...item, quantity: newQuantity }
              : item
          );
          // Save cart asynchronously but don't wait
          get().saveCart().catch(console.error);
          return { items: updatedItems };
        } else {
          const newItems = [...state.items, { product, quantity, selectedCountry: country }];
          // Save cart asynchronously but don't wait
          get().saveCart().catch(console.error);
          return { items: newItems };
        }
      });
    } finally {
      release();
    }
  },

  removeItem: async (productId) => {
    const release = await acquireCartMutex();
    try {
      set((state) => {
        const filteredItems = state.items.filter((item) => item.product.id !== productId);
        // Save cart asynchronously but don't wait
        get().saveCart().catch(console.error);
        return { items: filteredItems };
      });
    } finally {
      release();
    }
  },

  updateQuantity: async (productId, quantity) => {
    if (quantity <= 0) {
      await get().removeItem(productId);
      return;
    }

    const release = await acquireCartMutex();
    try {
      set((state) => {
        const item = state.items.find((item) => item.product.id === productId);
        if (!item) return state;

        const stock = getProductStock(item.product, item.selectedCountry);
        // Validate stock
        if (quantity > stock) {
          console.warn(`Cannot set quantity to ${quantity}, max is ${stock}`);
          return state;
        }

        // Validate quantity
        const quantityValidation = validateQuantity(quantity, 1, stock);
        if (!quantityValidation.isValid) {
          console.warn(quantityValidation.error);
          return state;
        }

        const updatedItems = state.items.map((item) =>
          item.product.id === productId
            ? { ...item, quantity }
            : item
        );
        // Save cart asynchronously but don't wait
        get().saveCart().catch(console.error);
        return { items: updatedItems };
      });
    } finally {
      release();
    }
  },

  clearCart: async () => {
    const release = await acquireCartMutex();
    try {
      set({ items: [] });
      await AsyncStorage.removeItem(STORAGE_KEYS.CART);
    } finally {
      release();
    }
  },

  getTotal: () => {
    const { items, selectedCountry } = get();
    if (!selectedCountry) return 0;
    return items.reduce((total, item) => {
      const price = selectedCountry === 'germany' 
        ? item.product.price_germany 
        : item.product.price_denmark;
      return total + price * item.quantity;
    }, 0);
  },

  getItemCount: () => {
    return get().items.reduce((count, item) => count + item.quantity, 0);
  },

  loadCart: async () => {
    try {
      const cartData = await AsyncStorage.getItem(STORAGE_KEYS.CART);
      const countryData = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_COUNTRY);
      
      if (cartData) {
        const items = JSON.parse(cartData);
        set({ items });
      }
      
      if (countryData) {
        set({ 
          selectedCountry: countryData as 'germany' | 'denmark',
          countrySelected: true,
        });
      } else {
        set({ countrySelected: false });
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  },

  saveCart: async () => {
    try {
      const { items, selectedCountry } = get();
      await AsyncStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(items));
      if (selectedCountry) {
        await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_COUNTRY, selectedCountry);
      }
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  },

  setSelectedCountry: async (country) => {
    set({ selectedCountry: country, countrySelected: true });
    await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_COUNTRY, country);
  },

  loadCountry: async () => {
    try {
      const countryData = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_COUNTRY);
      if (countryData) {
        set({ 
          selectedCountry: countryData as 'germany' | 'denmark',
          countrySelected: true,
        });
      } else {
        set({ countrySelected: false });
      }
    } catch (error) {
      console.error('Error loading country:', error);
      set({ countrySelected: false });
    }
  },
}));
