// Lazy import Supabase to avoid initialization during module load
import { Order, OrderItem, OrderStatus, PaymentMethod, PaymentStatus } from '../types';
import { withTimeout, DEFAULT_TIMEOUTS } from '../utils/requestTimeout';
import { offlineQueue } from '../utils/offlineQueue';
import { isOnline } from '../utils/networkUtils';
import { queueRequest } from '../utils/requestQueue';

// Import Supabase lazily - only when needed
function getSupabase() {
  return require('./supabase').supabase;
}

export interface CreateOrderData {
  user_id: string;
  country: 'germany' | 'denmark';
  payment_method: PaymentMethod;
  pickup_point_id?: string;
  delivery_address?: string;
  delivery_fee?: number;
  items: Array<{
    product_id: string;
    quantity: number;
    price: number;
  }>;
  idempotency_key?: string; // Optional idempotency key to prevent duplicate orders
}

export const orderService = {
  /**
   * Get all orders for a user
   */
  async getOrders(userId: string): Promise<Order[]> {
    return withTimeout(
      (async () => {
        try {
          const supabase = getSupabase();
          const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          if (error) {
            throw error;
          }

          return data || [];
        } catch (error) {
          console.error('Error fetching orders:', error);
          throw error;
        }
      })(),
      {
        timeout: DEFAULT_TIMEOUTS.MEDIUM,
        errorMessage: 'Failed to fetch orders: request timed out',
      }
    );
  },

  /**
   * Get all orders (Admin only)
   */
  async getAllOrders(filters?: { status?: OrderStatus }): Promise<Order[]> {
    return withTimeout(
      (async () => {
        try {
          const supabase = getSupabase();
          let query = supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

          if (filters?.status) {
            query = query.eq('status', filters.status);
          }

          const { data, error } = await query;

          if (error) {
            throw error;
          }

          return data || [];
        } catch (error) {
          console.error('Error fetching all orders:', error);
          throw error;
        }
      })(),
      {
        timeout: DEFAULT_TIMEOUTS.MEDIUM,
        errorMessage: 'Failed to fetch orders: request timed out',
      }
    );
  },

  /**
   * Get a single order by ID
   */
  async getOrderById(orderId: string): Promise<Order | null> {
    return withTimeout(
      (async () => {
        try {
          const supabase = getSupabase();
          const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

          if (error) {
            throw error;
          }

          return data;
        } catch (error) {
          console.error('Error fetching order:', error);
          throw error;
        }
      })(),
      {
        timeout: DEFAULT_TIMEOUTS.MEDIUM,
        errorMessage: 'Failed to fetch order: request timed out',
      }
    );
  },

  /**
   * Get order items for an order
   */
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return withTimeout(
      (async () => {
        try {
          const supabase = getSupabase();
          const { data, error } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', orderId);

          if (error) {
            throw error;
          }

          return data || [];
        } catch (error) {
          console.error('Error fetching order items:', error);
          throw error;
        }
      })(),
      {
        timeout: DEFAULT_TIMEOUTS.MEDIUM,
        errorMessage: 'Failed to fetch order items: request timed out',
      }
    );
  },

  /**
   * Create a new order atomically with stock reservation
   * Uses database function to ensure atomicity and prevent duplicate orders
   * Supports offline queueing if network is unavailable
   * Uses request queue for critical operation management
   */
  async createOrder(orderData: CreateOrderData): Promise<Order> {
    // Queue this critical operation with high priority
    return queueRequest(
      async () => {
        return this.createOrderInternal(orderData);
      },
      'high'
    );
  },

  /**
   * Internal order creation logic (not queued, called by createOrder)
   * @private
   */
  async createOrderInternal(orderData: CreateOrderData): Promise<Order> {
      // Calculate subtotal from items
      const subtotal = orderData.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      
      // Add delivery fee to total
      const totalAmount = subtotal + (orderData.delivery_fee || 0);

      // Generate idempotency key if not provided
      const idempotencyKey = orderData.idempotency_key || 
        `${orderData.user_id}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      // Prepare items as JSONB for database function
      const itemsJson = orderData.items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      }));

      const supabase = getSupabase();
      
      // Use atomic database function to create order with timeout
      const { data: orderId, error: functionError } = await withTimeout(
        supabase.rpc(
          'create_order_atomic',
          {
            p_user_id: orderData.user_id,
            p_country: orderData.country,
            p_payment_method: orderData.payment_method,
            p_total_amount: totalAmount,
            p_items: itemsJson as any,
            p_pickup_point_id: orderData.pickup_point_id || null,
            p_delivery_address: orderData.delivery_address || null,
            p_delivery_fee: orderData.delivery_fee || 0,
            p_idempotency_key: idempotencyKey,
          }
        ),
        {
          timeout: DEFAULT_TIMEOUTS.LONG,
          errorMessage: 'Order creation timed out',
        }
      );

      if (functionError) {
        // If it's a duplicate order (idempotency key conflict), fetch the existing order
        if (functionError.message?.includes('duplicate') || functionError.code === '23505') {
          const { data: existingOrder } = await supabase
            .from('orders')
            .select('*')
            .eq('idempotency_key', idempotencyKey)
            .single();
          
          if (existingOrder) {
            return existingOrder;
          }
        }
        throw functionError;
      }

      if (!orderId) {
        throw new Error('Order creation failed: No order ID returned');
      }

      // Fetch the created order with all details
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (fetchError || !order) {
        throw fetchError || new Error('Failed to fetch created order');
      }

      return order;
  },

  /**
   * Update order status (Admin only)
   */
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    orderId: string,
    paymentStatus: PaymentStatus
  ): Promise<Order> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('orders')
        .update({ payment_status: paymentStatus })
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  },
};
