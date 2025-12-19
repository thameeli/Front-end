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
  hasCompletedOnboarding: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name?: string, phone?: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  updateCountryPreference: (country: Country) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  completeOnboarding: () => Promise<void>;
  checkOnboardingStatus: () => Promise<void>;
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
        console.error('❌ [authStore] Auth object not available');
        return { success: false, error: 'Authentication service not available' };
      }
      
      // Supabase v1.x uses signIn, not signInWithPassword
      const auth = supabase.auth as any;
      
      console.log('🔵 [authStore] Attempting login for:', email);
      console.log('🔵 [authStore] Available auth methods:', {
        hasSignIn: typeof auth.signIn === 'function',
        hasSignInWithPassword: typeof auth.signInWithPassword === 'function',
        hasSignInWithEmail: typeof auth.signInWithEmail === 'function',
        authMethods: Object.keys(auth).filter(key => typeof auth[key] === 'function'),
      });
      
      // Try signInWithPassword first (some v1.x versions support it)
      // Then fallback to signIn
      let response;
      if (typeof auth.signInWithPassword === 'function') {
        console.log('🔵 [authStore] Using signInWithPassword...');
        response = await auth.signInWithPassword({
          email,
          password,
        });
      } else if (typeof auth.signIn === 'function') {
        console.log('🔵 [authStore] Using signIn...');
        // Try different formats for v1.x
        try {
          response = await auth.signIn({
            email,
            password,
          });
        } catch (signInError: any) {
          // Try alternative format
          console.log('🔵 [authStore] Trying alternative signIn format...');
          response = await auth.signIn(email, password);
        }
      } else {
        return { success: false, error: 'Authentication method not available' };
      }

      console.log('🔵 [authStore] SignIn response:', {
        hasData: !!response.data,
        hasError: !!response.error,
        dataKeys: response.data ? Object.keys(response.data) : [],
        errorMessage: response.error?.message,
        errorStatus: response.error?.status,
        errorCode: response.error?.code,
      });

      if (response.error) {
        console.error('❌ [authStore] Login error:', {
          message: response.error.message,
          status: response.error.status,
          code: response.error.code,
        });
        
        // Provide more helpful error messages
        let errorMessage = response.error.message;
        if (response.error.status === 400) {
          if (response.error.message?.includes('Invalid login credentials')) {
            errorMessage = 'Invalid email or password. Please check your credentials.';
          } else if (response.error.message?.includes('Email not confirmed')) {
            errorMessage = 'Please confirm your email address before logging in.';
          } else {
            errorMessage = response.error.message || 'Invalid login credentials';
          }
        }
        
        return { success: false, error: errorMessage };
      }

      // Handle different response structures for Supabase v1.x
      // Response might be: { data: { user, session } } or { user, session } or just the data
      let user = null;
      let session = null;

      // Try different response structures
      if (response.data) {
        user = response.data.user || response.data;
        session = response.data.session;
      } else if (response.user) {
        user = response.user;
        session = response.session;
      } else {
        // Response might be the data directly
        user = response.user || response;
        session = response.session;
      }

      console.log('🔵 [authStore] Extracted user and session:', {
        hasUser: !!user,
        hasSession: !!session,
        userId: user?.id,
        userEmail: user?.email,
      });

      if (!user || !user.id) {
        console.error('❌ [authStore] No user in response:', {
          responseKeys: Object.keys(response),
          responseDataKeys: response.data ? Object.keys(response.data) : [],
        });
        return { success: false, error: 'Login failed: No user data received' };
      }

      // If no session in response, try to get it from auth (Supabase persists it)
      let finalSession = session;
      if (!finalSession || !finalSession.access_token) {
        console.log('🔵 [authStore] No session in response, trying to get from auth storage...');
        try {
          // Wait a bit for Supabase to persist the session
          await new Promise(resolve => setTimeout(resolve, 100));
          
          if (typeof auth.getSession === 'function') {
            const sessionResponse = await auth.getSession();
            console.log('🔵 [authStore] getSession response:', {
              hasData: !!sessionResponse?.data,
              hasSession: !!sessionResponse?.session,
              keys: sessionResponse ? Object.keys(sessionResponse) : [],
            });
            finalSession = sessionResponse?.data?.session || sessionResponse?.session || sessionResponse?.data || sessionResponse;
          } else if (typeof auth.session === 'function') {
            finalSession = await auth.session();
          } else if (auth.session) {
            finalSession = auth.session;
          }
          
          // Also try to get from AsyncStorage directly
          if (!finalSession || !finalSession.access_token) {
            const storedToken = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
            if (storedToken) {
              console.log('🔵 [authStore] Found token in storage, creating session object');
              finalSession = { access_token: storedToken };
            }
          }
        } catch (sessionError) {
          console.warn('⚠️ [authStore] Could not get session:', sessionError);
        }
      }

      if (!finalSession || !finalSession.access_token) {
        console.error('❌ [authStore] No session or access token:', {
          hasSession: !!finalSession,
          sessionKeys: finalSession ? Object.keys(finalSession) : [],
          responseStructure: JSON.stringify(response).substring(0, 200),
        });
        return { success: false, error: 'Login failed: No session token received. Please try again.' };
      }

      console.log('✅ [authStore] User and session received, fetching profile...');

      // Fetch user profile from database
      // Use RPC call as fallback if direct query fails due to RLS issues
      let profile: any = null;
      let profileError: any = null;
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        
        profile = data;
        profileError = error;
      } catch (err: any) {
        profileError = err;
        console.warn('⚠️ [authStore] Profile fetch error, trying alternative method:', err.message);
        
        // Try alternative: use a stored procedure or direct query
        // For now, we'll use user metadata as fallback
        try {
          // Try to get from user metadata if available
          if (user.user_metadata?.role) {
            profile = { role: user.user_metadata.role };
          }
        } catch (metaErr) {
          console.warn('⚠️ [authStore] Could not get role from metadata');
        }
      }

      if (profileError && !profile) {
        console.warn('⚠️ [authStore] Profile fetch error (continuing anyway):', profileError?.message || 'Unknown error');
      }

      const userData: User = {
        id: user.id,
        email: user.email || email,
        phone: user.phone || profile?.phone,
        name: profile?.name || user.user_metadata?.name || user.email?.split('@')[0],
        role: profile?.role || user.user_metadata?.role || 'customer',
        country_preference: profile?.country_preference || user.user_metadata?.country_preference,
        created_at: user.created_at,
      };

      console.log('✅ [authStore] Setting user data:', {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
      });

      // Set user and token in storage first
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
      await AsyncStorage.setItem(STORAGE_KEYS.USER_TOKEN, finalSession.access_token);

      // Set user and token in state
      get().setUser(userData);
      get().setToken(finalSession.access_token);
      
      // Force state update to trigger navigation
      set({ 
        isAuthenticated: true, 
        user: userData, 
        token: finalSession.access_token,
        isLoading: false,
      });
      
      // Verify state was updated
      const currentState = get();
      console.log('✅ [authStore] Login successful, state updated:', {
        isAuthenticated: currentState.isAuthenticated,
        hasUser: !!currentState.user,
        hasToken: !!currentState.token,
        userId: currentState.user?.id,
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('❌ [authStore] Login exception:', error);
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
          // Disable email confirmation redirect for mobile app
          // Users will be auto-logged in if email confirmation is disabled in Supabase
          emailRedirectTo: undefined, // Don't set redirect URL for mobile
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
      
      // Clear all auth state
      set({ 
        user: null, 
        token: null, 
        isAuthenticated: false 
      });
      
      // Clear storage
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER_TOKEN,
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.CART,
      ]);
      
      console.log('✅ Logout successful - state cleared');
    } catch (error) {
      console.error('❌ Error logging out:', error);
      // Still clear local state even if signOut fails
      set({ 
        user: null, 
        token: null, 
        isAuthenticated: false 
      });
    }
  },

  loadSession: async () => {
    try {
      set({ isLoading: true });
      const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      const onboardingCompleted = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);

      if (token && userData) {
        const user = JSON.parse(userData);
        set({ user, token, isAuthenticated: true });
      }

      set({ hasCompletedOnboarding: onboardingCompleted === 'true' });

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

  completeOnboarding: async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
      set({ hasCompletedOnboarding: true });
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  },

  checkOnboardingStatus: async () => {
    try {
      const completed = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
      set({ hasCompletedOnboarding: completed === 'true' });
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      set({ hasCompletedOnboarding: false });
    }
  },
}));
