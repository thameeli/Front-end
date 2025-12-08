import { PaymentMethod } from '../types';
import { PickupPoint } from '../types';

export interface CheckoutFormData {
  isHomeDelivery: boolean;
  pickupPointId: string | null;
  deliveryAddress: {
    street: string;
    city: string;
    postalCode: string;
    phone: string;
    instructions?: string;
  };
  paymentMethod: PaymentMethod | null;
  paymentDetails: {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    cardholderName: string;
  };
}

/**
 * Validate checkout form
 */
export const validateCheckout = (
  formData: CheckoutFormData
): {
  isValid: boolean;
  errors: Record<string, string>;
} => {
  const errors: Record<string, string> = {};

  // Validate delivery method
  if (!formData.isHomeDelivery && !formData.pickupPointId) {
    errors.deliveryMethod = 'Please select a delivery method';
  }

  // Validate delivery address if home delivery
  if (formData.isHomeDelivery) {
    if (!formData.deliveryAddress.street.trim()) {
      errors.street = 'Street address is required';
    }
    if (!formData.deliveryAddress.city.trim()) {
      errors.city = 'City is required';
    }
    if (!formData.deliveryAddress.postalCode.trim()) {
      errors.postalCode = 'Postal code is required';
    }
    if (!formData.deliveryAddress.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/.test(formData.deliveryAddress.phone)) {
      errors.phone = 'Invalid phone number format';
    }
  }

  // Validate payment method
  if (!formData.paymentMethod) {
    errors.paymentMethod = 'Please select a payment method';
  }

  // Validate payment details if online payment
  if (formData.paymentMethod === 'online') {
    if (!formData.paymentDetails.cardholderName.trim()) {
      errors.cardholderName = 'Cardholder name is required';
    }
    const cardNumber = formData.paymentDetails.cardNumber.replace(/\s/g, '');
    if (!cardNumber || cardNumber.length < 13 || cardNumber.length > 19) {
      errors.cardNumber = 'Invalid card number';
    }
    if (!formData.paymentDetails.expiryDate || !/^\d{2}\/\d{2}$/.test(formData.paymentDetails.expiryDate)) {
      errors.expiryDate = 'Invalid expiry date (MM/YY)';
    }
    if (!formData.paymentDetails.cvv || formData.paymentDetails.cvv.length < 3) {
      errors.cvv = 'Invalid CVV';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate pickup point selection
 */
export const validatePickupPoint = (
  pickupPointId: string | null,
  isHomeDelivery: boolean
): {
  isValid: boolean;
  error?: string;
} => {
  if (isHomeDelivery) {
    return { isValid: true };
  }

  if (!pickupPointId) {
    return {
      isValid: false,
      error: 'Please select a pickup point',
    };
  }

  return { isValid: true };
};

/**
 * Validate delivery address
 */
export const validateDeliveryAddress = (
  address: CheckoutFormData['deliveryAddress']
): {
  isValid: boolean;
  errors: Record<string, string>;
} => {
  const errors: Record<string, string> = {};

  if (!address.street.trim()) {
    errors.street = 'Street address is required';
  }

  if (!address.city.trim()) {
    errors.city = 'City is required';
  }

  if (!address.postalCode.trim()) {
    errors.postalCode = 'Postal code is required';
  }

  if (!address.phone.trim()) {
    errors.phone = 'Phone number is required';
  } else if (!/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/.test(address.phone)) {
    errors.phone = 'Invalid phone number format';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate payment method selection
 */
export const validatePaymentMethod = (
  paymentMethod: PaymentMethod | null
): {
  isValid: boolean;
  error?: string;
} => {
  if (!paymentMethod) {
    return {
      isValid: false,
      error: 'Please select a payment method',
    };
  }

  return { isValid: true };
};

