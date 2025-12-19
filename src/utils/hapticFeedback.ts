/**
 * Haptic Feedback Utilities
 * Provides haptic feedback for better UX
 * Safe wrapper for Expo Go compatibility
 */

import * as Haptics from 'expo-haptics';

/**
 * Light haptic feedback (for subtle interactions)
 */
export const lightHaptic = () => {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (error) {
    // Haptics not available, silently fail
  }
};

/**
 * Medium haptic feedback (for standard interactions)
 */
export const mediumHaptic = () => {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (error) {
    // Haptics not available, silently fail
  }
};

/**
 * Heavy haptic feedback (for important interactions)
 */
export const heavyHaptic = () => {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch (error) {
    // Haptics not available, silently fail
  }
};

/**
 * Success haptic feedback
 */
export const successHaptic = () => {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    // Haptics not available, silently fail
  }
};

/**
 * Warning haptic feedback
 */
export const warningHaptic = () => {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch (error) {
    // Haptics not available, silently fail
  }
};

/**
 * Error haptic feedback
 */
export const errorHaptic = () => {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch (error) {
    // Haptics not available, silently fail
  }
};

/**
 * Selection haptic feedback (for pickers, switches, etc.)
 */
export const selectionHaptic = () => {
  try {
    Haptics.selectionAsync();
  } catch (error) {
    // Haptics not available, silently fail
  }
};

