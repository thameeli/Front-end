import { CartItem } from '../types';
import { PickupPoint } from '../types';
import { COUNTRIES } from '../constants';
import type { Country } from '../constants';
import { formatPrice } from './productUtils';

/**
 * Calculate item subtotal
 */
export const calculateItemSubtotal = (
  item: CartItem,
  country: Country
): number => {
  const price = country === COUNTRIES.GERMANY
    ? item.product.price_germany
    : item.product.price_norway;
  return price * item.quantity;
};

/**
 * Calculate cart subtotal (sum of all items)
 */
export const calculateCartSubtotal = (
  items: CartItem[],
  country: Country
): number => {
  return items.reduce((total, item) => {
    return total + calculateItemSubtotal(item, country);
  }, 0);
};

/**
 * Calculate delivery fee
 */
export const calculateDeliveryFee = (
  pickupPoint: PickupPoint | null,
  isHomeDelivery: boolean
): number => {
  if (isHomeDelivery) {
    // Home delivery fee (can be configured)
    return 5.0; // Default home delivery fee
  }
  return pickupPoint?.delivery_fee || 0;
};

/**
 * Calculate final total (subtotal + delivery fee)
 */
export const calculateFinalTotal = (
  items: CartItem[],
  country: Country,
  pickupPoint: PickupPoint | null,
  isHomeDelivery: boolean
): number => {
  const subtotal = calculateCartSubtotal(items, country);
  const deliveryFee = calculateDeliveryFee(pickupPoint, isHomeDelivery);
  return subtotal + deliveryFee;
};

/**
 * Format cart summary for display
 */
export const formatCartSummary = (
  items: CartItem[],
  country: Country,
  pickupPoint: PickupPoint | null,
  isHomeDelivery: boolean
): {
  subtotal: string;
  deliveryFee: string;
  total: string;
  subtotalValue: number;
  deliveryFeeValue: number;
  totalValue: number;
} => {
  const subtotalValue = calculateCartSubtotal(items, country);
  const deliveryFeeValue = calculateDeliveryFee(pickupPoint, isHomeDelivery);
  const totalValue = subtotalValue + deliveryFeeValue;

  return {
    subtotal: formatPrice(subtotalValue, country),
    deliveryFee: formatPrice(deliveryFeeValue, country),
    total: formatPrice(totalValue, country),
    subtotalValue,
    deliveryFeeValue,
    totalValue,
  };
};

