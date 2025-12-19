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

    // Subscribe to order changes for this user
    const supabase = getSupabase();
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
      getSupabase().removeChannel(channel);
    };
  }, [userId, queryClient]);
};

