// Lazy import Supabase to avoid initialization during module load
// This prevents "property is not configurable" errors
import { Product, ProductCategory } from '../types';

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
   */
  async getProducts(filters?: ProductFilters): Promise<Product[]> {
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

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  /**
   * Get a single product by ID
   */
  async getProductById(productId: string): Promise<Product | null> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  },

  /**
   * Create a new product (Admin only)
   */
  async createProduct(product: Omit<Product, 'id' | 'created_at'>): Promise<Product> {
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
  },

  /**
   * Update a product (Admin only)
   */
  async updateProduct(productId: string, updates: Partial<Product>): Promise<Product> {
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
   */
  getProductPrice(product: Product, country: 'germany' | 'denmark'): number {
    return country === 'germany' ? product.price_germany : product.price_denmark;
  },

  /**
   * Upload product image to Supabase Storage
   */
  async uploadProductImage(imageUri: string): Promise<string> {
    try {
      const supabase = getSupabase();
      // Generate unique filename
      const filename = `product_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const filePath = `products/${filename}`;

      // Convert image URI to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading product image:', error);
      throw error;
    }
  },
};
