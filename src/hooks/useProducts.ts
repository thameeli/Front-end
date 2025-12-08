import { useQuery } from '@tanstack/react-query';
import { productService, ProductFilters } from '../services/productService';
import { Product } from '../types';

export const useProducts = (filters?: ProductFilters) => {
  return useQuery<Product[]>({
    queryKey: ['products', filters],
    queryFn: () => productService.getProducts(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useProduct = (productId: string) => {
  return useQuery<Product | null>({
    queryKey: ['product', productId],
    queryFn: () => productService.getProductById(productId),
    enabled: !!productId,
  });
};

