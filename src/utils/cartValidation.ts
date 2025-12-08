import { CartItem } from '../types';
import { Product } from '../types';

/**
 * Validate if product is in stock
 */
export const validateStock = (product: Product, quantity: number): {
  isValid: boolean;
  error?: string;
} => {
  if (product.stock === 0) {
    return {
      isValid: false,
      error: `${product.name} is out of stock`,
    };
  }

  if (quantity > product.stock) {
    return {
      isValid: false,
      error: `Only ${product.stock} available for ${product.name}`,
    };
  }

  return { isValid: true };
};

/**
 * Validate cart item quantity
 */
export const validateQuantity = (
  quantity: number,
  min: number = 1,
  max?: number
): {
  isValid: boolean;
  error?: string;
} => {
  if (quantity < min) {
    return {
      isValid: false,
      error: `Minimum quantity is ${min}`,
    };
  }

  if (max && quantity > max) {
    return {
      isValid: false,
      error: `Maximum quantity is ${max}`,
    };
  }

  return { isValid: true };
};

/**
 * Validate entire cart
 */
export const validateCart = (items: CartItem[]): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (items.length === 0) {
    errors.push('Cart is empty');
    return { isValid: false, errors };
  }

  items.forEach((item) => {
    // Check stock
    const stockValidation = validateStock(item.product, item.quantity);
    if (!stockValidation.isValid && stockValidation.error) {
      errors.push(stockValidation.error);
    }

    // Check quantity
    const quantityValidation = validateQuantity(
      item.quantity,
      1,
      item.product.stock
    );
    if (!quantityValidation.isValid && quantityValidation.error) {
      errors.push(quantityValidation.error);
    }

    // Check if product is still active
    if (!item.product.active) {
      errors.push(`${item.product.name} is no longer available`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Remove out-of-stock items from cart
 */
export const removeOutOfStockItems = (items: CartItem[]): {
  validItems: CartItem[];
  removedItems: CartItem[];
} => {
  const validItems: CartItem[] = [];
  const removedItems: CartItem[] = [];

  items.forEach((item) => {
    if (item.product.stock > 0 && item.product.active) {
      // Adjust quantity if it exceeds stock
      if (item.quantity > item.product.stock) {
        validItems.push({
          ...item,
          quantity: item.product.stock,
        });
      } else {
        validItems.push(item);
      }
    } else {
      removedItems.push(item);
    }
  });

  return { validItems, removedItems };
};

/**
 * Update cart items based on current product data
 */
export const updateCartWithProductData = (
  cartItems: CartItem[],
  products: Product[]
): CartItem[] => {
  return cartItems
    .map((cartItem) => {
      const updatedProduct = products.find(
        (p) => p.id === cartItem.product.id
      );

      if (!updatedProduct) {
        return null; // Product no longer exists
      }

      if (!updatedProduct.active) {
        return null; // Product is inactive
      }

      // Update product data and adjust quantity if needed
      const quantity = Math.min(
        cartItem.quantity,
        updatedProduct.stock
      );

      return {
        ...cartItem,
        product: updatedProduct,
        quantity: quantity > 0 ? quantity : 1,
      };
    })
    .filter((item): item is CartItem => item !== null);
};

