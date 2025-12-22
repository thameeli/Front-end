import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Order } from '../types';

// Lazy import Supabase to avoid initialization during module load
function getSupabase() {
  return require('../services/supabase').supabase;
}

/**
 * Hook to set up real-time order updates
 */
export const useOrderRealtime = (userId: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    try {
      // Subscribe to order changes for this user
      const supabase = getSupabase();
      
      // Check if channel method exists
      if (!supabase || typeof supabase.channel !== 'function') {
        console.warn('⚠️ [useOrderRealtime] Supabase channel method not available. Realtime updates disabled.');
        return;
      }

      const channel = supabase
        .channel(`orders:${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `user_id=eq.${userId}`,
          },
          (payload: any) => {
            console.log('Order update received:', payload);

            // Invalidate and refetch orders
            queryClient.invalidateQueries({ queryKey: ['orders', userId] });

            // If it's an update to a specific order, invalidate that too
            if (payload.new && 'id' in payload.new) {
              queryClient.invalidateQueries({
                queryKey: ['order', (payload.new as Order).id],
              });
            }
          }
        )
        .subscribe();

      return () => {
        try {
          const supabaseClient = getSupabase();
          if (supabaseClient && typeof supabaseClient.removeChannel === 'function') {
            supabaseClient.removeChannel(channel);
          }
        } catch (error) {
          console.warn('⚠️ [useOrderRealtime] Error removing channel:', error);
        }
      };
    } catch (error) {
      console.error('❌ [useOrderRealtime] Error setting up realtime subscription:', error);
    }
  }, [userId, queryClient]);
};

