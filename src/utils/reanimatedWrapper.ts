/**
 * Safe Reanimated Wrapper for Expo Go
 * Handles cases where reanimated native module might not be available
 * This prevents NullPointerException errors in Expo Go
 */

let reanimatedAvailable = false;
let Reanimated: any = null;

// Try to load reanimated, but don't crash if it fails
try {
  Reanimated = require('react-native-reanimated');
  // Check if the module is actually available (not just the JS side)
  if (Reanimated && typeof Reanimated.useSharedValue === 'function') {
    // Try to create a test shared value to verify native module works
    try {
      const testValue = Reanimated.useSharedValue(0);
      if (testValue && typeof testValue.value !== 'undefined') {
        reanimatedAvailable = true;
        console.log('✅ react-native-reanimated is available');
      }
    } catch (e) {
      console.warn('⚠️ react-native-reanimated native module not available, using fallbacks');
      reanimatedAvailable = false;
    }
  }
} catch (error: any) {
  console.warn('⚠️ react-native-reanimated not available, using fallbacks:', error?.message);
  reanimatedAvailable = false;
}

// Create a simple mock for shared values
class MockSharedValue {
  _value: any;
  constructor(value: any) {
    this._value = value;
  }
  get value() {
    return this._value;
  }
  set value(newValue: any) {
    this._value = newValue;
  }
}

// Export safe wrappers
export const useSharedValue = (value: any) => {
  if (!reanimatedAvailable || !Reanimated) {
    return new MockSharedValue(value) as any;
  }
  try {
    return Reanimated.useSharedValue(value);
  } catch (error) {
    console.warn('⚠️ useSharedValue failed, using fallback');
    return new MockSharedValue(value) as any;
  }
};

export const useAnimatedStyle = (factory: () => any) => {
  if (!reanimatedAvailable || !Reanimated) {
    return {};
  }
  try {
    return Reanimated.useAnimatedStyle(factory);
  } catch (error) {
    console.warn('⚠️ useAnimatedStyle failed, using fallback');
    return {};
  }
};

export const withTiming = (toValue: any, config?: any) => {
  if (!reanimatedAvailable || !Reanimated) {
    return toValue;
  }
  try {
    return Reanimated.withTiming(toValue, config);
  } catch (error) {
    console.warn('⚠️ withTiming failed, using fallback');
    return toValue;
  }
};

export const withSpring = (toValue: any, config?: any) => {
  if (!reanimatedAvailable || !Reanimated) {
    return toValue;
  }
  try {
    return Reanimated.withSpring(toValue, config);
  } catch (error) {
    console.warn('⚠️ withSpring failed, using fallback');
    return toValue;
  }
};

export const createAnimatedComponent = (Component: any) => {
  if (!reanimatedAvailable || !Reanimated) {
    return Component;
  }
  try {
    return Reanimated.default?.createAnimatedComponent?.(Component) || Component;
  } catch (error) {
    console.warn('⚠️ createAnimatedComponent failed, using fallback');
    return Component;
  }
};

// Export Easing if available
export const Easing = reanimatedAvailable && Reanimated?.Easing 
  ? Reanimated.Easing 
  : {
      linear: (t: number) => t,
      ease: (t: number) => t,
      in: (easing: any) => easing,
      out: (easing: any) => easing,
      inOut: (easing: any) => easing,
    };

// Export the module itself if available
export default Reanimated;
