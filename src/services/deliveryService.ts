// Lazy import Supabase to avoid initialization during module load
import { Order } from '../types';

// Import Supabase lazily - only when needed
function getSupabase() {
  return require('./supabase').supabase;
}

export type DeliveryStatus = 'scheduled' | 'in_transit' | 'delivered' | 'cancelled' | 'failed';

export interface DeliverySchedule {
  id: string;
  order_id: string;
  delivery_date: string;
  status: DeliveryStatus;
  pickup_point_id?: string;
  estimated_time?: string;
  actual_delivery_time?: string;
  delivery_person_name?: string;
  delivery_person_phone?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  order?: Order;
  pickup_point?: {
    id: string;
    name: string;
    address: string;
  };
  customer?: {
    id: string;
    name?: string;
    email: string;
    phone?: string;
  };
}

export interface CreateDeliveryScheduleData {
  order_id: string;
  delivery_date: string;
  pickup_point_id?: string;
  estimated_time?: string;
  delivery_person_name?: string;
  delivery_person_phone?: string;
  notes?: string;
}

export interface UpdateDeliveryScheduleData {
  status?: DeliveryStatus;
  delivery_date?: string;
  estimated_time?: string;
  actual_delivery_time?: string;
  delivery_person_name?: string;
  delivery_person_phone?: string;
  notes?: string;
}

export const deliveryService = {
  /**
   * Get all delivery schedules (Admin only)
   */
  async getDeliverySchedules(filters?: {
    status?: DeliveryStatus;
    delivery_date?: string;
    country?: 'germany' | 'denmark';
  }): Promise<DeliverySchedule[]> {
    try {
      const supabase = getSupabase();
      let query = supabase
        .from('delivery_schedule')
        .select(`
          *,
          order:orders(*),
          pickup_point:pickup_points(id, name, address)
        `)
        .order('delivery_date', { ascending: true })
        .order('estimated_time', { ascending: true });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.delivery_date) {
        query = query.eq('delivery_date', filters.delivery_date);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Filter by country if specified
      let schedules = (data || []) as DeliverySchedule[];
      if (filters?.country) {
        schedules = schedules.filter(
          (schedule) => schedule.order?.country === filters.country
        );
      }

      // Fetch customer data for each order
      const schedulesWithCustomers = await Promise.all(
        schedules.map(async (schedule) => {
          if (schedule.order?.user_id) {
            const { data: userData } = await supabase
              .from('users')
              .select('id, name, email, phone')
              .eq('id', schedule.order.user_id)
              .single();

            if (userData) {
              schedule.customer = userData;
            }
          }
          return schedule;
        })
      );

      return schedulesWithCustomers;
    } catch (error) {
      console.error('Error fetching delivery schedules:', error);
      throw error;
    }
  },

  /**
   * Get delivery schedule by ID
   */
  async getDeliveryScheduleById(scheduleId: string): Promise<DeliverySchedule | null> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('delivery_schedule')
        .select(`
          *,
          order:orders(*),
          pickup_point:pickup_points(id, name, address)
        `)
        .eq('id', scheduleId)
        .single();

      if (error) {
        throw error;
      }

      if (!data) return null;

      const schedule = data as DeliverySchedule;

      // Fetch customer data
      if (schedule.order?.user_id) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, name, email, phone')
          .eq('id', schedule.order.user_id)
          .single();

        if (userData) {
          schedule.customer = userData;
        }
      }

      return schedule;
    } catch (error) {
      console.error('Error fetching delivery schedule:', error);
      throw error;
    }
  },

  /**
   * Get delivery schedule for an order
   */
  async getDeliveryScheduleByOrderId(orderId: string): Promise<DeliverySchedule | null> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('delivery_schedule')
        .select(`
          *,
          order:orders(*),
          pickup_point:pickup_points(id, name, address)
        `)
        .eq('order_id', orderId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        throw error;
      }

      if (!data) return null;

      const schedule = data as DeliverySchedule;

      // Fetch customer data
      if (schedule.order?.user_id) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, name, email, phone')
          .eq('id', schedule.order.user_id)
          .single();

        if (userData) {
          schedule.customer = userData;
        }
      }

      return schedule;
    } catch (error) {
      console.error('Error fetching delivery schedule by order ID:', error);
      throw error;
    }
  },

  /**
   * Create a delivery schedule (Admin only)
   */
  async createDeliverySchedule(
    scheduleData: CreateDeliveryScheduleData
  ): Promise<DeliverySchedule> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('delivery_schedule')
        .insert(scheduleData)
        .select(`
          *,
          order:orders(*),
          pickup_point:pickup_points(id, name, address)
        `)
        .single();

      if (error) {
        throw error;
      }

      const schedule = data as DeliverySchedule;

      // Fetch customer data
      if (schedule.order?.user_id) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, name, email, phone')
          .eq('id', schedule.order.user_id)
          .single();

        if (userData) {
          schedule.customer = userData;
        }
      }

      return schedule;
    } catch (error) {
      console.error('Error creating delivery schedule:', error);
      throw error;
    }
  },

  /**
   * Update delivery schedule (Admin only)
   */
  async updateDeliverySchedule(
    scheduleId: string,
    updates: UpdateDeliveryScheduleData
  ): Promise<DeliverySchedule> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('delivery_schedule')
        .update(updates)
        .eq('id', scheduleId)
        .select(`
          *,
          order:orders(*),
          pickup_point:pickup_points(id, name, address)
        `)
        .single();

      if (error) {
        throw error;
      }

      const schedule = data as DeliverySchedule;

      // Fetch customer data
      if (schedule.order?.user_id) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, name, email, phone')
          .eq('id', schedule.order.user_id)
          .single();

        if (userData) {
          schedule.customer = userData;
        }
      }

      // Update order status if delivery is completed
      if (updates.status === 'delivered' && schedule.order) {
        await supabase
          .from('orders')
          .update({ status: 'delivered' })
          .eq('id', schedule.order_id);
      } else if (updates.status === 'in_transit' && schedule.order) {
        await supabase
          .from('orders')
          .update({ status: 'out_for_delivery' })
          .eq('id', schedule.order_id);
      }

      return schedule;
    } catch (error) {
      console.error('Error updating delivery schedule:', error);
      throw error;
    }
  },

  /**
   * Delete delivery schedule (Admin only)
   */
  async deleteDeliverySchedule(scheduleId: string): Promise<void> {
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('delivery_schedule')
        .delete()
        .eq('id', scheduleId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error deleting delivery schedule:', error);
      throw error;
    }
  },
};

