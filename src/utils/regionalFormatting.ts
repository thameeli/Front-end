/**
 * Regional Formatting Utilities
 * Handles currency, date, number, phone, and postal code formatting
 * for Germany and Denmark markets
 */

import { COUNTRIES } from '../constants';
import type { Country } from '../constants';

/**
 * Format currency based on country
 * Germany: EUR (€)
 * Denmark: DKK (kr)
 */
export const formatCurrency = (
  amount: number | null | undefined,
  country: Country
): string => {
  // Validate amount - if invalid, return placeholder
  if (amount === null || amount === undefined || isNaN(amount) || amount < 0) {
    const symbol = country === COUNTRIES.GERMANY ? '€' : 'kr';
    return `${symbol} 0,00`;
  }

  if (country === COUNTRIES.GERMANY) {
    // German format: € 12,34 (comma as decimal separator)
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } else {
    // Danish/Norwegian format: 12,34 kr (space before currency, comma as decimal)
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }
};

/**
 * Format date based on country
 * Germany: DD.MM.YYYY
 * Denmark: DD/MM/YYYY
 */
export const formatDate = (
  date: Date | string,
  country: Country
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (country === COUNTRIES.GERMANY) {
    // German format: DD.MM.YYYY
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(dateObj);
  } else {
    // Danish format: DD/MM/YYYY
    return new Intl.DateTimeFormat('da-DK', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(dateObj);
  }
};

/**
 * Format date with time
 */
export const formatDateTime = (
  date: Date | string,
  country: Country
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (country === COUNTRIES.GERMANY) {
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  } else {
    return new Intl.DateTimeFormat('da-DK', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  }
};

/**
 * Format number with proper separators
 * Germany: 1.234,56 (dot for thousands, comma for decimals)
 * Denmark: 1.234,56 (dot for thousands, comma for decimals)
 */
export const formatNumber = (
  number: number,
  country: Country,
  decimals: number = 2
): string => {
  if (country === COUNTRIES.GERMANY) {
    return new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(number);
  } else {
    return new Intl.NumberFormat('da-DK', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(number);
  }
};

/**
 * Format phone number
 * Germany: +49 123 4567890
 * Denmark: +45 12 34 56 78
 */
export const formatPhoneNumber = (
  phone: string,
  country: Country
): string => {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  if (country === COUNTRIES.GERMANY) {
    // German format: +49 123 4567890
    if (digits.startsWith('49')) {
      const withoutCountry = digits.substring(2);
      return `+49 ${withoutCountry.substring(0, 3)} ${withoutCountry.substring(3)}`;
    }
    return phone;
  } else {
    // Danish format: +45 12 34 56 78
    if (digits.startsWith('45')) {
      const withoutCountry = digits.substring(2);
      return `+45 ${withoutCountry.match(/.{1,2}/g)?.join(' ') || withoutCountry}`;
    }
    return phone;
  }
};

/**
 * Validate postal code
 * Germany: 5 digits (e.g., 10115)
 * Denmark: 4 digits (e.g., 2100)
 */
export const validatePostalCode = (
  postalCode: string,
  country: Country
): { isValid: boolean; error?: string } => {
  const digits = postalCode.replace(/\D/g, '');
  
  if (country === COUNTRIES.GERMANY) {
    // German postal codes: 5 digits
    if (digits.length === 5) {
      return { isValid: true };
    }
    return {
      isValid: false,
      error: 'German postal codes must be 5 digits',
    };
  } else {
    // Danish postal codes: 4 digits
    if (digits.length === 4) {
      return { isValid: true };
    }
    return {
      isValid: false,
      error: 'Danish postal codes must be 4 digits',
    };
  }
};

/**
 * Get currency symbol
 */
export const getCurrencySymbol = (country: Country): string => {
  return country === COUNTRIES.GERMANY ? '€' : 'kr';
};

/**
 * Get currency code
 */
export const getCurrencyCode = (country: Country): string => {
  return country === COUNTRIES.GERMANY ? 'EUR' : 'DKK';
};

