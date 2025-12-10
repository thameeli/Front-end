/**
 * Animation Utilities for Thamili App
 * Reusable animation configurations using react-native-reanimated
 * Safe wrapper for Expo Go compatibility
 */

// Use safe wrapper to prevent NullPointerException in Expo Go
let withTimingFn: any;
let withSpringFn: any;
let EasingObj: any;

try {
  const Reanimated = require('react-native-reanimated');
  withTimingFn = Reanimated.withTiming;
  withSpringFn = Reanimated.withSpring;
  EasingObj = Reanimated.Easing;
} catch (e) {
  // Fallbacks if reanimated not available
  withTimingFn = (value: any) => value;
  withSpringFn = (value: any) => value;
  EasingObj = {
    linear: (t: number) => t,
    ease: (t: number) => t,
    in: (easing: any) => easing,
    out: (easing: any) => easing,
    inOut: (easing: any) => easing,
  };
}

const withTiming = withTimingFn;
const withSpring = withSpringFn;
const Easing = EasingObj;
type SharedValue = any;

// Animation durations (in milliseconds)
export const ANIMATION_DURATION = {
  fast: 150,
  normal: 250,
  slow: 350,
  slower: 500,
} as const;

// Easing functions
export const EASING = {
  linear: Easing.linear,
  easeIn: Easing.in(Easing.ease),
  easeOut: Easing.out(Easing.ease),
  easeInOut: Easing.inOut(Easing.ease),
  // Spring-like easing
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
} as const;

/**
 * Animation helper functions
 * These return animated values that can be used in useAnimatedStyle
 */

/**
 * Create fade in animated value
 */
export const createFadeIn = (duration: number = ANIMATION_DURATION.normal) => {
  return withTiming(1, {
    duration,
    easing: EASING.easeOut,
  });
};

/**
 * Create fade out animated value
 */
export const createFadeOut = (duration: number = ANIMATION_DURATION.normal) => {
  return withTiming(0, {
    duration,
    easing: EASING.easeIn,
  });
};

/**
 * Create slide up animated value
 */
export const createSlideUp = (
  fromValue: number = 20,
  duration: number = ANIMATION_DURATION.normal
) => {
  return withTiming(0, {
    duration,
    easing: EASING.easeOut,
  });
};

/**
 * Create slide down animated value
 */
export const createSlideDown = (
  toValue: number = 20,
  duration: number = ANIMATION_DURATION.normal
) => {
  return withTiming(toValue, {
    duration,
    easing: EASING.easeIn,
  });
};

/**
 * Create scale animated value
 */
export const createScale = (
  scaleValue: number = 0.95,
  duration: number = ANIMATION_DURATION.fast
) => {
  return withSpring(scaleValue, EASING.spring);
};

/**
 * Create scale normal animated value
 */
export const createScaleNormal = () => {
  return withSpring(1, EASING.spring);
};

/**
 * Spring animation for smooth interactions
 */
export const spring = (
  toValue: number,
  config: {
    damping?: number;
    stiffness?: number;
    mass?: number;
  } = EASING.spring
) => {
  return withSpring(toValue, config);
};

/**
 * Timing animation with custom easing
 */
export const timing = (
  toValue: number,
  duration: number = ANIMATION_DURATION.normal,
  easing: typeof EASING.easeOut = EASING.easeOut
) => {
  return withTiming(toValue, { duration, easing });
};

/**
 * Button press animation
 */
export const buttonPress = {
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.8,
  },
  default: {
    transform: [{ scale: 1 }],
    opacity: 1,
  },
};

/**
 * Card press animation
 */
export const cardPress = {
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  default: {
    transform: [{ scale: 1 }],
  },
};

/**
 * Shimmer animation for loading states
 */
export const createShimmer = () => {
  return withTiming(0.5, {
    duration: 1000,
    easing: EASING.easeInOut,
  });
};

