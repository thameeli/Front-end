// Lazy import Supabase to avoid initialization during module load
import { Order, OrderItem, OrderStatus, PaymentMethod, PaymentStatus } from '../types';

// Import Supabase lazily - only when needed
function getSupabase() {
  return require('./supabase').supabase;
}

export interface CreateOrderData {
  user_id: string;
  country: 'germany' | 'norway';
  payment_method: PaymentMethod;
  pickup_point_id?: string;
  delivery_address?: string;
  delivery_fee?: number;
  items: Array<{
    product_id: string;
    quantity: number;
    price: number;
  }>;
}

export const orderService = {
  /**
   * Get all orders for a user
   */
  async getOrders(userId: string): Promise<Order[]> {
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
  },

  /**
   * Get all orders (Admin only)
   */
  async getAllOrders(filters?: { status?: OrderStatus }): Promise<Order[]> {
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
  },

  /**
   * Get a single order by ID
   */
  async getOrderById(orderId: string): Promise<Order | null> {
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
  },

  /**
   * Get order items for an order
   */
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
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
  },

  /**
   * Create a new order
   */
  async createOrder(orderData: CreateOrderData): Promise<Order> {
    try {
      // Calculate subtotal from items
      const subtotal = orderData.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      
      // Add delivery fee to total
      const totalAmount = subtotal + (orderData.delivery_fee || 0);

      // Create order
      const supabase = getSupabase();
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: orderData.user_id,
          country: orderData.country,
          payment_method: orderData.payment_method,
          payment_status: orderData.payment_method === 'cod' ? 'pending' : 'pending',
          total_amount: totalAmount,
          status: 'pending',
          pickup_point_id: orderData.pickup_point_id,
          delivery_address: orderData.delivery_address,
        })
        .select()
        .single();

      if (orderError) {
        throw orderError;
      }

      // Create order items
      const orderItems = orderData.items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        throw itemsError;
      }

      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
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
