// Lazy import Supabase to avoid initialization during module load
import {
  Notification,
  NotificationPreferences,
  NotificationTemplate,
  WhatsAppNotification,
} from '../types/notifications';

// Import Supabase lazily - only when needed
function getSupabase() {
  return require('./supabase').supabase;
}

export const notificationService = {
  /**
   * Get all notifications for a user
   */
  async getNotifications(userId: string): Promise<Notification[]> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  /**
   * Mark notification as read
   */
  async markAsRead(userId: string, notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  /**
   * Get notification preferences
   */
  async getPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No preferences found, return default
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      throw error;
    }
  },

  /**
   * Update notification preferences
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  },

  /**
   * Get WhatsApp notification history (Admin)
   */
  async getWhatsAppHistory(filters?: {
    order_id?: string;
    status?: string;
  }): Promise<WhatsAppNotification[]> {
    try {
      const supabase = getSupabase();
      let query = supabase
        .from('whatsapp_notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.order_id) {
        query = query.eq('order_id', filters.order_id);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching WhatsApp history:', error);
      throw error;
    }
  },

  /**
   * Send WhatsApp notification (Admin)
   */
  async sendWhatsAppNotification(
    orderId: string,
    phoneNumber: string,
    message: string
  ): Promise<void> {
    try {
      // This will trigger a Vercel function via Supabase webhook
      const supabase = getSupabase();
      const { error } = await supabase.rpc('send_whatsapp_notification', {
        p_order_id: orderId,
        p_phone_number: phoneNumber,
        p_message: message,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error sending WhatsApp notification:', error);
      throw error;
    }
  },
};

