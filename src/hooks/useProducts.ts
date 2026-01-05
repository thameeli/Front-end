import { useQuery } from '@tanstack/react-query';
import { productService, ProductFilters } from '../services/productService';
import { Product } from '../types';
import { withTimeout, DEFAULT_TIMEOUTS } from '../utils/requestTimeout';

export const useProducts = (filters?: ProductFilters) => {
  return useQuery<Product[]>({
    queryKey: ['products', filters],
    queryFn: async ({ signal }) => {
      return withTimeout(
        productService.getProducts(filters, signal),
        {
          timeout: DEFAULT_TIMEOUTS.MEDIUM,
          errorMessage: 'Failed to fetch products: request timed out',
        }
      );
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useProduct = (productId: string) => {
  return useQuery<Product | null>({
    queryKey: ['product', productId],
    queryFn: async ({ signal }) => {
      return withTimeout(
        productService.getProductById(productId, signal),
        {
          timeout: DEFAULT_TIMEOUTS.MEDIUM,
          errorMessage: 'Failed to fetch product: request timed out',
        }
      );
    },
    enabled: !!productId,
  });
};

