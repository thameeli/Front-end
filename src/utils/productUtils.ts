import { Product, ProductCategory } from '../types';
import { COUNTRIES } from '../constants';
import type { Country } from '../constants';
import { formatCurrency } from './regionalFormatting';

/**
 * Format price for a specific country (uses regional formatting)
 */
export const formatPrice = (price: number | null | undefined, country: Country): string => {
  return formatCurrency(price, country);
};

/**
 * Get product price for a specific country
 * Inlined to avoid importing productService which causes "property is not configurable" errors
 * Returns 0 if price is not set or invalid
 */
export const getProductPrice = (product: Product, country: Country): number => {
  const price = country === COUNTRIES.GERMANY ? product.price_germany : product.price_denmark;
  // Validate price - return 0 if null, undefined, or NaN
  if (price === null || price === undefined || isNaN(price) || price < 0) {
    console.warn(`Product ${product.id} has invalid price for ${country}:`, price);
    return 0;
  }
  return price;
};

/**
 * Get product stock for a specific country
 */
export const getProductStock = (product: Product, country: Country): number => {
  return country === COUNTRIES.GERMANY ? product.stock_germany : product.stock_denmark;
};

/**
 * Check if product is in stock for a specific country
 */
export const isInStock = (product: Product, country: Country): boolean => {
  return getProductStock(product, country) > 0;
};

/**
 * Filter products by category
 */
export const filterByCategory = (
  products: Product[],
  category: ProductCategory | 'all'
): Product[] => {
  if (category === 'all') {
    return products;
  }
  return products.filter((product) => product.category === category);
};

/**
 * Sort products
 */
export const sortProducts = (
  products: Product[],
  sortBy: 'name' | 'price_asc' | 'price_desc',
  country: Country
): Product[] => {
  const sorted = [...products];

  switch (sortBy) {
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'price_asc':
      return sorted.sort(
        (a, b) =>
          getProductPrice(a, country) - getProductPrice(b, country)
      );
    case 'price_desc':
      return sorted.sort(
        (a, b) =>
          getProductPrice(b, country) - getProductPrice(a, country)
      );
    default:
      return sorted;
  }
};

/**
 * Search products by name or description
 */
export const searchProducts = (
  products: Product[],
  searchQuery: string
): Product[] => {
  if (!searchQuery.trim()) {
    return products;
  }

  const query = searchQuery.toLowerCase();
  return products.filter(
    (product) =>
      product.name.toLowerCase().includes(query) ||
      (product.description &&
        product.description.toLowerCase().includes(query))
  );
};

/**
 * Get filtered and sorted products
 */
export const getFilteredProducts = (
  products: Product[],
  options: {
    category?: ProductCategory | 'all';
    searchQuery?: string;
    sortBy?: 'name' | 'price_asc' | 'price_desc';
    country: Country;
  }
): Product[] => {
  let filtered = products;

  // Filter by category
  if (options.category) {
    filtered = filterByCategory(filtered, options.category);
  }

  // Search
  if (options.searchQuery) {
    filtered = searchProducts(filtered, options.searchQuery);
  }

  // Sort
  if (options.sortBy) {
    filtered = sortProducts(filtered, options.sortBy, options.country);
  }

  return filtered;
};
