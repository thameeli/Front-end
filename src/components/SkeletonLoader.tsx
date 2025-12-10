/**
 * Shimmer Loading Effect Component
 * Uses NativeWind for styling and react-native-reanimated for smooth shimmer animation
 * Safe for Expo Go with fallbacks
 */

import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

// Safe import of reanimated with fallback
let Animated: any;
let useAnimatedStyle: any;
let useSharedValue: any;
let withRepeat: any;
let withTiming: any;
let interpolate: any;
let Easing: any;

try {
  const Reanimated = require('react-native-reanimated');
  Animated = Reanimated.default || Reanimated;
  useAnimatedStyle = Reanimated.useAnimatedStyle;
  useSharedValue = Reanimated.useSharedValue;
  withRepeat = Reanimated.withRepeat;
  withTiming = Reanimated.withTiming;
  interpolate = Reanimated.interpolate;
  Easing = Reanimated.Easing;
} catch (e) {
  // Reanimated not available, will use fallback
  console.log('⚠️ [SkeletonLoader] Reanimated not available, using fallback');
}

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
  className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
  className = '',
}) => {
  // Check if reanimated is available
  const hasReanimated = Boolean(Animated && useAnimatedStyle && useSharedValue);
  
  // Fallback: Use React state for simple animations
  const [opacity, setOpacity] = useState(0.3);
  
  // Reanimated values
  const shimmer = hasReanimated ? useSharedValue(0) : null;

  useEffect(() => {
    if (hasReanimated && shimmer && withRepeat && withTiming && Easing) {
      shimmer.value = withRepeat(
        withTiming(1, {
          duration: 1500,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    } else {
      // Fallback animation using React state
      const interval = setInterval(() => {
        setOpacity((prev) => (prev === 0.3 ? 0.7 : 0.3));
      }, 750);
      return () => clearInterval(interval);
    }
  }, [hasReanimated]);

  // Create animated style
  const animatedStyle = hasReanimated && useAnimatedStyle && shimmer && interpolate
    ? useAnimatedStyle(() => {
        const opacityValue = interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.7, 0.3]);
        return {
          opacity: opacityValue,
        };
      })
    : {
        opacity,
      };

  // Always use View directly to avoid displayName issues with NativeWind
  // When reanimated is available, we'll apply the animated style through the style prop
  // When not available, we use the fallback opacity style
  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#E0E0E0',
        },
        animatedStyle,
        style,
      ]}
      className={className}
    />
  );
};

// Set displayName for better debugging
SkeletonLoader.displayName = 'SkeletonLoader';

export default SkeletonLoader;
