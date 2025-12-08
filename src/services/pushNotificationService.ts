// This service uses lazy loading to prevent Expo Go conflicts
// No module-level code execution - everything is lazy-loaded

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'expo_push_token';

// Module state (initialized to null, no module-level code execution)
let notificationHandlerSet = false;
let NotificationsModule: any = null;
let isInitialized = false;

/**
 * Check if we should skip notifications (Expo Go compatibility)
 * In Expo Go, expo-notifications can cause "property is not configurable" errors
 * So we'll skip it entirely to prevent runtime errors
 * 
 * This check happens synchronously to prevent any module resolution attempts
 */
const shouldSkipNotifications = (): boolean => {
  // Always skip in development/Expo Go to prevent the error
  // This prevents Metro from even trying to resolve expo-notifications
  if (__DEV__) {
    return true;
  }
  
  try {
    // Check if we're in Expo Go by checking for expo-constants
    // In Expo Go, executionEnvironment is 'storeClient'
    const Constants = require('expo-constants');
    const executionEnvironment = Constants?.executionEnvironment;
    
    // Skip in Expo Go (storeClient)
    if (executionEnvironment === 'storeClient') {
      return true;
    }
    
    // For standalone builds, allow notifications
    return false;
  } catch (error) {
    // If expo-constants is not available, assume Expo Go and skip
    // This prevents errors during module resolution
    return true;
  }
};

/**
 * Safely initialize expo-notifications module
 * This prevents module-level initialization issues in Expo Go
 * Metro config redirects expo-notifications to our safe wrapper/mock
 */
const initNotificationsModule = async (): Promise<boolean> => {
  if (isInitialized) {
    return NotificationsModule !== null;
  }
  
  isInitialized = true;
  
  // In development, Metro config redirects expo-notifications to our mock wrapper
  // The mock is safe and won't cause the "property is not configurable" error
  // So we can use it even in development
  try {
    // Import expo-notifications - Metro will redirect to our wrapper
    // The wrapper provides a safe mock in development
    const module = await import('expo-notifications');
    
    // Get the module (could be default export or named)
    const notificationsModule = module.default || module;
    
    if (notificationsModule && typeof notificationsModule === 'object') {
      NotificationsModule = notificationsModule;
      // In development, this will be the mock, which is fine
      return true;
    }
    
    NotificationsModule = null;
    return false;
  } catch (error: any) {
    // Silently fail - notifications are optional
    // Log warning in development for debugging
    if (__DEV__) {
      console.warn('Failed to load expo-notifications:', error?.message || error);
    }
    NotificationsModule = null;
    return false;
  }
};

/**
 * Initialize notification handler (called automatically when needed)
 * This is safe to call even if expo-notifications is not available
 */
const ensureNotificationHandler = async () => {
  if (notificationHandlerSet) {
    return;
  }
  
  try {
    const available = await initNotificationsModule();
    if (!available || !NotificationsModule) {
      return; // Silently fail - notifications not available
    }
    
    NotificationsModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
    notificationHandlerSet = true;
  } catch (error) {
    // Silently fail - notifications are optional
  }
};

/**
 * Public export for manual initialization if needed
 * Note: This will be called automatically when service methods are used
 */
export const initializeNotificationHandler = ensureNotificationHandler;

// Export service object (no code execution here, just object definition)
export const pushNotificationService = {
  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      // Ensure handler is set up first
      await ensureNotificationHandler();
      
      const available = await initNotificationsModule();
      if (!available || !NotificationsModule) {
        return false;
      }
      
      const { status: existingStatus } = await NotificationsModule.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await NotificationsModule.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  },

  /**
   * Get Expo push token
   */
  async getPushToken(): Promise<string | null> {
    try {
      const available = await initNotificationsModule();
      if (!available || !NotificationsModule) {
        return null;
      }
      
      // Check if we have a cached token
      const cachedToken = await AsyncStorage.getItem(STORAGE_KEY);
      if (cachedToken) {
        return cachedToken;
      }

      // Request permissions first
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      // Get the push token
      // Note: In Expo Go, projectId is optional
      const tokenOptions: { projectId?: string } = {};
      
      // Only set projectId if available (for standalone builds)
      if (typeof process !== 'undefined' && process.env?.EXPO_PROJECT_ID) {
        tokenOptions.projectId = process.env.EXPO_PROJECT_ID;
      }
      
      const tokenData = await NotificationsModule.getExpoPushTokenAsync(tokenOptions);
      const token = tokenData.data;
      
      // Cache the token
      await AsyncStorage.setItem(STORAGE_KEY, token);

      return token;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  },

  /**
   * Register push token with backend
   */
  async registerToken(userId: string): Promise<void> {
    try {
      const token = await this.getPushToken();
      if (!token) {
        throw new Error('Failed to get push token');
      }

      // TODO: Send token to Supabase/backend
      console.log('Push token registered:', token);
    } catch (error) {
      console.error('Error registering push token:', error);
      throw error;
    }
  },

  /**
   * Set up notification listeners
   */
  async setupListeners(
    onNotificationReceived: (notification: any) => void,
    onNotificationTapped: (response: any) => void
  ) {
    const available = await initNotificationsModule();
    if (!available || !NotificationsModule) {
      return () => {}; // Return empty cleanup function
    }
    
    // Listener for notifications received while app is foregrounded
    const receivedListener = NotificationsModule.addNotificationReceivedListener(
      onNotificationReceived
    );

    // Listener for when user taps on notification
    const responseListener = NotificationsModule.addNotificationResponseReceivedListener(
      onNotificationTapped
    );

    return () => {
      NotificationsModule.removeNotificationSubscription(receivedListener);
      NotificationsModule.removeNotificationSubscription(responseListener);
    };
  },

  /**
   * Schedule a local notification (for testing)
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<string> {
    try {
      const available = await initNotificationsModule();
      if (!available || !NotificationsModule) {
        throw new Error('expo-notifications not available');
      }
      
      const notificationId = await NotificationsModule.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: null, // Show immediately
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  },
};
