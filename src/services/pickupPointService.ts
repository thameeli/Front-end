// Lazy import Supabase to avoid initialization during module load
import { PickupPoint } from '../types';
import { withTimeout, DEFAULT_TIMEOUTS } from '../utils/requestTimeout';

// Import Supabase lazily - only when needed
function getSupabase() {
  return require('./supabase').supabase;
}

export const pickupPointService = {
  /**
   * Get all pickup points
   */
  async getPickupPoints(country?: 'germany' | 'denmark'): Promise<PickupPoint[]> {
    try {
      const supabase = getSupabase();
      let query = supabase
        .from('pickup_points')
        .select('*')
        .eq('active', true)
        .order('name', { ascending: true });

      if (country) {
        query = query.eq('country', country);
      }

      const { data, error } = await withTimeout(
        query,
        {
          timeout: DEFAULT_TIMEOUTS.MEDIUM,
          errorMessage: 'Failed to fetch pickup points: request timed out',
        }
      );

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching pickup points:', error);
      throw error;
    }
  },

  /**
   * Get a single pickup point by ID
   */
  async getPickupPointById(pickupPointId: string): Promise<PickupPoint | null> {
    try {
      const supabase = getSupabase();
      const { data, error } = await withTimeout(
        supabase
          .from('pickup_points')
          .select('*')
          .eq('id', pickupPointId)
          .single(),
        {
          timeout: DEFAULT_TIMEOUTS.MEDIUM,
          errorMessage: 'Failed to fetch pickup point: request timed out',
        }
      );

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching pickup point:', error);
      throw error;
    }
  },

  /**
   * Create a new pickup point (Admin only)
   */
  async createPickupPoint(
    pickupPoint: Omit<PickupPoint, 'id' | 'created_at'>
  ): Promise<PickupPoint> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('pickup_points')
        .insert(pickupPoint)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error creating pickup point:', error);
      throw error;
    }
  },

  /**
   * Update a pickup point (Admin only)
   */
  async updatePickupPoint(
    pickupPointId: string,
    updates: Partial<PickupPoint>
  ): Promise<PickupPoint> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('pickup_points')
        .update(updates)
        .eq('id', pickupPointId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating pickup point:', error);
      throw error;
    }
  },

  /**
   * Delete a pickup point (Admin only)
   */
  async deletePickupPoint(pickupPointId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('pickup_points')
        .delete()
        .eq('id', pickupPointId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error deleting pickup point:', error);
      throw error;
    }
  },
};
