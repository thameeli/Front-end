// Lazy import Supabase to avoid initialization during module load
import { User } from '../types';

// Import Supabase lazily - only when needed
function getSupabase() {
  return require('./supabase').supabase;
}

export const userService = {
  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<User | null> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  /**
   * Update user profile
   */
  async updateUserProfile(
    userId: string,
    updates: Partial<User>
  ): Promise<User> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  /**
   * Update country preference
   */
  async updateCountryPreference(
    userId: string,
    country: 'germany' | 'denmark'
  ): Promise<User> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('users')
        .update({ country_preference: country })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating country preference:', error);
      throw error;
    }
  },
};
