import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole } from '../types';
import { STORAGE_KEYS } from '../constants';
// Lazy import Supabase to avoid initialization during module load
import { userService } from '../services';

// Import Supabase lazily - only when needed
function getSupabase() {
  return require('../services/supabase').supabase;
}
import type { Country } from '../constants';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name?: string, phone?: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  updateCountryPreference: (country: Country) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,

  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
    if (user) {
      AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    } else {
      AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
    }
  },

  setToken: (token) => {
    set({ token });
    if (token) {
      AsyncStorage.setItem(STORAGE_KEYS.USER_TOKEN, token);
    } else {
      AsyncStorage.removeItem(STORAGE_KEYS.USER_TOKEN);
    }
  },

  login: async (email, password) => {
    try {
      set({ isLoading: true });
      const supabase = getSupabase();
      
      // Verify auth object exists
      if (!supabase.auth) {
        return { success: false, error: 'Authentication service not available' };
      }
      
      // Supabase v1.x uses signIn, not signInWithPassword
      const auth = supabase.auth as any;
      
      // Use signIn for v1.x (signInWithPassword is for v2.x)
      const { data, error } = await auth.signIn({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user && data.session) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        const user: User = {
          id: data.user.id,
          email: data.user.email || email,
          phone: data.user.phone || profile?.phone,
          name: profile?.name || data.user.user_metadata?.name,
          role: profile?.role || 'customer',
          country_preference: profile?.country_preference,
          created_at: data.user.created_at,
        };

        get().setUser(user);
        get().setToken(data.session.access_token);
        
        // Force state update to trigger navigation
        set({ isAuthenticated: true, user, token: data.session.access_token });
        
        return { success: true };
      }

      return { success: false, error: 'Login failed' };
    } catch (error: any) {
      return { success: false, error: error.message || 'An error occurred' };
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (email, password, name, phone, role = 'customer') => {
    try {
      set({ isLoading: true });
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, phone },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Insert user profile into users table
        await supabase.from('users').insert({
          id: data.user.id,
          email: email,
          name: name,
          phone: phone,
          role: role, // Allow role selection for testing
        });

        // If session exists, use it (email confirmation disabled)
        // Otherwise, sign in automatically to get a session
        let session = data.session;
        if (!session) {
          // Auto-login after registration
          // Supabase v1.x uses signIn, not signInWithPassword
          const auth = supabase.auth as any;
          if (auth && typeof auth.signIn === 'function') {
            const { data: signInData, error: signInError } = await auth.signIn({
              email,
              password,
            });
            
            if (signInError) {
              console.warn('Auto-login after registration failed:', signInError.message);
              // Still return success - user is registered, they can login manually
              return { success: true };
            }
            
            session = signInData?.session || null;
          } else {
            console.warn('Auto-login skipped: signIn method not available');
            // User is registered, they can login manually
            return { success: true };
          }
        }

        if (session) {
          // Fetch user profile from database
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

          const user: User = {
            id: data.user.id,
            email: email,
            phone: phone || profile?.phone,
            name: name || profile?.name,
            role: profile?.role || role,
            country_preference: profile?.country_preference,
            created_at: data.user.created_at,
          };

          get().setUser(user);
          get().setToken(session.access_token);
          
          // Force state update to trigger navigation
          set({ isAuthenticated: true, user, token: session.access_token });
        }

        return { success: true };
      }

      return { success: false, error: 'Registration failed' };
    } catch (error: any) {
      return { success: false, error: error.message || 'An error occurred' };
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      const supabase = getSupabase();
      const auth = supabase.auth as any;
      await auth.signOut();
      get().setUser(null);
      get().setToken(null);
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER_TOKEN,
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.CART,
      ]);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  },

  loadSession: async () => {
    try {
      set({ isLoading: true });
      const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);

      if (token && userData) {
        const user = JSON.parse(userData);
        set({ user, token, isAuthenticated: true });
      }

      // Get Supabase client directly (not through Proxy) to ensure getSession works
      const supabase = getSupabase();
      const auth = supabase.auth as any;
      
      // In v1.x, getSession might not exist, try session() or session property
      let session = null;
      try {
        if (typeof auth.getSession === 'function') {
          const sessionResponse = await auth.getSession();
          session = sessionResponse?.data?.session || sessionResponse?.session || null;
        } else if (typeof auth.session === 'function') {
          session = await auth.session();
        } else if (auth.session) {
          session = auth.session;
        }
      } catch (error) {
        console.warn('Error getting session:', error);
      }
      
      if (session) {
        // Refresh user profile from database
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          const user: User = {
            id: profile.id,
            email: profile.email,
            phone: profile.phone,
            name: profile.name,
            role: profile.role,
            country_preference: profile.country_preference,
            created_at: profile.created_at,
          };
          get().setUser(user);
        }
        get().setToken(session.access_token);
      } else {
        get().setUser(null);
        get().setToken(null);
      }
    } catch (error: any) {
      console.error('Error loading session:', error?.message || error);
      // Don't clear user data on error - keep cached session
      // get().setUser(null);
      // get().setToken(null);
    } finally {
      set({ isLoading: false });
    }
  },

  updateProfile: async (updates) => {
    try {
      const { user } = get();
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      set({ isLoading: true });
      const updatedUser = await userService.updateUserProfile(user.id, updates);
      get().setUser(updatedUser);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to update profile' };
    } finally {
      set({ isLoading: false });
    }
  },

  updateCountryPreference: async (country) => {
    try {
      const { user } = get();
      if (!user) return;

      set({ isLoading: true });
      const updatedUser = await userService.updateCountryPreference(user.id, country);
      get().setUser(updatedUser);
    } catch (error) {
      console.error('Error updating country preference:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    try {
      const { user } = get();
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      set({ isLoading: true });

      // Verify current password
      const supabase = getSupabase();
      const auth = supabase.auth as any;
      const { error: verifyError } = await auth.signIn({
        email: user.email,
        password: currentPassword,
      });

      if (verifyError) {
        return { success: false, error: 'Current password is incorrect' };
      }

      // Update password - try updateUser first, fallback to update
      let updateError = null;
      if (typeof auth.updateUser === 'function') {
        const result = await auth.updateUser({ password: newPassword });
        updateError = result.error;
      } else if (typeof auth.update === 'function') {
        const result = await auth.update({ password: newPassword });
        updateError = result.error;
      } else {
        return { success: false, error: 'Password update method not available' };
      }

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to change password' };
    } finally {
      set({ isLoading: false });
    }
  },
}));
