// Lazy import Supabase to avoid initialization during module load
// This prevents "property is not configurable" errors
import { Product, ProductCategory } from '../types';
import { withTimeout, DEFAULT_TIMEOUTS } from '../utils/requestTimeout';

// Import Supabase lazily - only when needed
function getSupabase() {
  return require('./supabase').supabase;
}

export interface ProductFilters {
  category?: ProductCategory;
  active?: boolean;
  search?: string;
}

export const productService = {
  /**
   * Get all products with optional filters
   * Supports request cancellation via AbortSignal
   * Note: Supabase doesn't natively support AbortSignal, but we check for cancellation
   * before and after the request to prevent processing cancelled requests
   */
  async getProducts(filters?: ProductFilters, signal?: AbortSignal): Promise<Product[]> {
    // Check if already cancelled before starting
    if (signal?.aborted) {
      const abortError = new Error('Request aborted');
      abortError.name = 'AbortError';
      throw abortError;
    }

    try {
      const supabase = getSupabase();
      let query = supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.active !== undefined) {
        query = query.eq('active', filters.active);
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await withTimeout(
        query,
        {
          timeout: DEFAULT_TIMEOUTS.MEDIUM,
          errorMessage: 'Failed to fetch products: request timed out',
        }
      );

      // Check if cancelled after request completes
      if (signal?.aborted) {
        const abortError = new Error('Request aborted');
        abortError.name = 'AbortError';
        throw abortError;
      }

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error: any) {
      // If it was an abort, re-throw as AbortError
      if (signal?.aborted || error?.name === 'AbortError') {
        const abortError = new Error('Request aborted');
        abortError.name = 'AbortError';
        throw abortError;
      }
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  /**
   * Get a single product by ID
   * Supports request cancellation via AbortSignal
   * Note: Supabase doesn't natively support AbortSignal, but we check for cancellation
   * before and after the request to prevent processing cancelled requests
   */
  async getProductById(productId: string, signal?: AbortSignal): Promise<Product | null> {
    // Check if already cancelled before starting
    if (signal?.aborted) {
      const abortError = new Error('Request aborted');
      abortError.name = 'AbortError';
      throw abortError;
    }

    try {
      const supabase = getSupabase();
      const { data, error } = await withTimeout(
        supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single(),
        {
          timeout: DEFAULT_TIMEOUTS.MEDIUM,
          errorMessage: 'Failed to fetch product: request timed out',
        }
      );

      // Check if cancelled after request completes
      if (signal?.aborted) {
        const abortError = new Error('Request aborted');
        abortError.name = 'AbortError';
        throw abortError;
      }

      if (error) {
        throw error;
      }

      return data;
    } catch (error: any) {
      // If it was an abort, re-throw as AbortError
      if (signal?.aborted || error?.name === 'AbortError') {
        const abortError = new Error('Request aborted');
        abortError.name = 'AbortError';
        throw abortError;
      }
      console.error('Error fetching product:', error);
      throw error;
    }
  },

  /**
   * Create a new product (Admin only)
   */
  async createProduct(product: Omit<Product, 'id' | 'created_at'>): Promise<Product> {
    return withTimeout(
      (async () => {
        try {
          const supabase = getSupabase();
          const { data, error } = await supabase
            .from('products')
            .insert(product)
            .select()
            .single();

          if (error) {
            throw error;
          }

          return data;
        } catch (error) {
          console.error('Error creating product:', error);
          throw error;
        }
      })(),
      {
        timeout: DEFAULT_TIMEOUTS.LONG,
        errorMessage: 'Failed to create product: request timed out',
      }
    );
  },

  /**
   * Update a product (Admin only)
   */
  async updateProduct(productId: string, updates: Partial<Product>): Promise<Product> {
    return withTimeout(
      (async () => {
        try {
          const supabase = getSupabase();
          const { data, error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', productId)
            .select()
            .single();

          if (error) {
            throw error;
          }

          return data;
        } catch (error) {
          console.error('Error updating product:', error);
          throw error;
        }
      })(),
      {
        timeout: DEFAULT_TIMEOUTS.LONG,
        errorMessage: 'Failed to update product: request timed out',
      }
    );
  },

  /**
   * Delete a product (Admin only)
   */
  async deleteProduct(productId: string): Promise<void> {
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },

  /**
   * Get product price for a specific country
   * Returns 0 if price is not set or invalid
   */
  getProductPrice(product: Product, country: 'germany' | 'denmark'): number {
    const price = country === 'germany' ? product.price_germany : product.price_denmark;
    // Validate price - return 0 if null, undefined, or NaN
    if (price === null || price === undefined || isNaN(price) || price < 0) {
      console.warn(`Product ${product.id} has invalid price for ${country}:`, price);
      return 0;
    }
    return price;
  },

  /**
   * Upload product image to Supabase Storage
   * @param imageUri - The local URI of the image to upload
   * @param onProgress - Optional callback to track upload progress (0-100)
   */
  async uploadProductImage(
    imageUri: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    return withTimeout(
      (async () => {
        try {
          const supabase = getSupabase();
          // Generate unique filename
          const filename = `product_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
          const filePath = `products/${filename}`;

          // Convert image URI to blob
          const response = await fetch(imageUri);
          const blob = await response.blob();

          // Simulate progress for blob conversion (10%)
          onProgress?.(10);

          // Upload to Supabase Storage with progress tracking
          // Note: Supabase Storage doesn't natively support progress callbacks,
          // so we simulate progress based on upload stages
          onProgress?.(30);

          const { data, error } = await supabase.storage
            .from('product-images')
            .upload(filePath, blob, {
              contentType: 'image/jpeg',
              upsert: false,
            });

          onProgress?.(80);

          if (error) {
            throw error;
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath);

          onProgress?.(100);

          return urlData.publicUrl;
        } catch (error) {
          console.error('Error uploading product image:', error);
          throw error;
        }
      })(),
      {
        timeout: DEFAULT_TIMEOUTS.VERY_LONG, // Image uploads can take longer
        errorMessage: 'Failed to upload image: request timed out',
      }
    );
  },
};
