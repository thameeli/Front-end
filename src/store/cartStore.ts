import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem, Product } from '../types';
import { STORAGE_KEYS } from '../constants';
import { validateStock, validateQuantity } from '../utils/cartValidation';

interface CartState {
  items: CartItem[];
  selectedCountry: 'germany' | 'denmark' | null;
  countrySelected: boolean;
  addItem: (product: Product, quantity: number, country: 'germany' | 'denmark') => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
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

  addItem: (product, quantity, country) => {
    // Validate stock
    const stockValidation = validateStock(product, quantity);
    if (!stockValidation.isValid) {
      console.warn(stockValidation.error);
      return;
    }

    // Validate quantity
    const quantityValidation = validateQuantity(quantity, 1, product.stock);
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
        if (newQuantity > product.stock) {
          console.warn(`Cannot add more than ${product.stock} items`);
          return state;
        }
        const updatedItems = state.items.map((item) =>
          item.product.id === product.id && item.selectedCountry === country
            ? { ...item, quantity: newQuantity }
            : item
        );
        get().saveCart();
        return { items: updatedItems };
      } else {
        const newItems = [...state.items, { product, quantity, selectedCountry: country }];
        get().saveCart();
        return { items: newItems };
      }
    });
  },

  removeItem: (productId) => {
    set((state) => {
      const filteredItems = state.items.filter((item) => item.product.id !== productId);
      get().saveCart();
      return { items: filteredItems };
    });
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }

    set((state) => {
      const item = state.items.find((item) => item.product.id === productId);
      if (!item) return state;

      // Validate stock
      if (quantity > item.product.stock) {
        console.warn(`Cannot set quantity to ${quantity}, max is ${item.product.stock}`);
        return state;
      }

      // Validate quantity
      const quantityValidation = validateQuantity(quantity, 1, item.product.stock);
      if (!quantityValidation.isValid) {
        console.warn(quantityValidation.error);
        return state;
      }

      const updatedItems = state.items.map((item) =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      );
      get().saveCart();
      return { items: updatedItems };
    });
  },

  clearCart: () => {
    set({ items: [] });
    AsyncStorage.removeItem(STORAGE_KEYS.CART);
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
