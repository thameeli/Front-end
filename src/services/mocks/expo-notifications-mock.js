/**
 * Mock module for expo-notifications in Expo Go
 * This prevents "property is not configurable" errors
 * by providing a stub implementation that does nothing
 */

console.log('🔵 [expo-notifications-mock] Creating mock module...');

// Mock implementation that returns safe defaults
const mockNotifications = {
  setNotificationHandler: () => {
    // Silent - no console log to avoid noise
  },
  
  getPermissionsAsync: async () => ({
    status: 'undetermined',
    granted: false,
    canAskAgain: false,
  }),
  
  requestPermissionsAsync: async () => ({
    status: 'undetermined',
    granted: false,
    canAskAgain: false,
  }),
  
  getExpoPushTokenAsync: async () => ({
    data: 'mock-token-expo-go',
  }),
  
  addNotificationReceivedListener: () => ({
    remove: () => {},
  }),
  
  addNotificationResponseReceivedListener: () => ({
    remove: () => {},
  }),
  
  removeNotificationSubscription: () => {},
  
  scheduleNotificationAsync: async () => 'mock-notification-id',
  
  cancelScheduledNotificationAsync: async () => {},
  
  cancelAllScheduledNotificationsAsync: async () => {},
  
  getBadgeCountAsync: async () => 0,
  
  setBadgeCountAsync: async () => {},
  
  dismissNotificationAsync: async () => {},
  
  dismissAllNotificationsAsync: async () => {},
  
  getAllScheduledNotificationsAsync: async () => [],
  
  getPresentedNotificationsAsync: async () => [],
};

// Simple exports - NO Object.defineProperty to avoid "not configurable" errors
// Just use regular object assignment
console.log('✅ [expo-notifications-mock] Mock created');

module.exports = mockNotifications;
module.exports.default = mockNotifications;

console.log('✅ [expo-notifications-mock] Module exported');
