/**
 * AnimatedView - Reusable animation wrapper component
 * Compatible with react-native-reanimated 3.x for Expo Go
 * Falls back to regular View if reanimated is not available
 */

import React, { ReactNode, useState, useEffect } from 'react';
import { View, ViewStyle, TouchableOpacity } from 'react-native';

// Safe import of reanimated with fallback
let Animated: any;
let useAnimatedStyle: any;
let useSharedValue: any;
let withSpring: any;
let withTiming: any;

try {
  const Reanimated = require('react-native-reanimated');
  Animated = Reanimated.default || Reanimated;
  useAnimatedStyle = Reanimated.useAnimatedStyle;
  useSharedValue = Reanimated.useSharedValue;
  withSpring = Reanimated.withSpring;
  withTiming = Reanimated.withTiming;
} catch (e) {
  // Reanimated not available, will use fallback
  console.log('⚠️ [AnimatedView] Reanimated not available, using fallback');
}

interface AnimatedViewProps {
  children: ReactNode;
  style?: ViewStyle;
  animation?: 'fade' | 'slide' | 'zoom' | 'none';
  delay?: number;
  duration?: number;
  enterFrom?: 'top' | 'bottom' | 'left' | 'right';
  onPress?: () => void;
  className?: string; // Deprecated - use style prop instead
}

const AnimatedView: React.FC<AnimatedViewProps> = ({
  children,
  style,
  animation = 'fade',
  delay = 0,
  duration = 250,
  enterFrom = 'bottom',
  onPress,
  className = '',
}) => {
  // Check if reanimated is available
  const hasReanimated = Boolean(Animated && useAnimatedStyle && useSharedValue);

  // Fallback: Use React state for simple animations
  const [opacity, setOpacity] = useState(animation === 'fade' ? 0 : 1);
  const [translateY, setTranslateY] = useState(enterFrom === 'bottom' ? 20 : enterFrom === 'top' ? -20 : 0);
  const [scale, setScale] = useState(animation === 'zoom' ? 0.9 : 1);

  // Reanimated version
  if (hasReanimated) {
    const opacityValue = useSharedValue(animation === 'fade' ? 0 : 1);
    const translateYValue = useSharedValue(enterFrom === 'bottom' ? 20 : enterFrom === 'top' ? -20 : 0);
    const scaleValue = useSharedValue(animation === 'zoom' ? 0.9 : 1);

    useEffect(() => {
      const timer = setTimeout(() => {
        opacityValue.value = withTiming(1, { duration });
        translateYValue.value = withTiming(0, { duration });
        scaleValue.value = withSpring(1, { damping: 15, stiffness: 150 });
      }, delay);

      return () => clearTimeout(timer);
    }, [delay, duration]);

    const animatedStyle = useAnimatedStyle(() => {
      if (animation === 'none') {
        return {};
      }

      return {
        opacity: opacityValue.value,
        transform: [
          { translateY: translateYValue.value },
          { scale: scaleValue.value },
        ],
      };
    });

    // Use Animated.View directly if available, otherwise create animated component
    let AnimatedComponent: any;
    try {
      if (Animated && Animated.View) {
        AnimatedComponent = Animated.View;
      } else if (Animated && Animated.createAnimatedComponent) {
        AnimatedComponent = Animated.createAnimatedComponent(View);
        // Ensure displayName exists
        if (AnimatedComponent) {
          AnimatedComponent.displayName = AnimatedComponent.displayName || 'AnimatedView';
        }
      } else {
        // Fallback to regular View
        AnimatedComponent = View;
      }
    } catch (e) {
      console.warn('⚠️ [AnimatedView] Failed to create animated component, using fallback:', e);
      AnimatedComponent = View;
    }

    // Safety check: if AnimatedComponent is undefined or null, use View
    if (!AnimatedComponent) {
      AnimatedComponent = View;
    }

    // Don't pass className to AnimatedComponent - use StyleSheet instead
    const props: any = {
      style: [animatedStyle, style],
    };
    
    if (onPress) {
      props.onTouchEnd = onPress;
    }

    // Ensure AnimatedComponent has displayName
    if (AnimatedComponent && !AnimatedComponent.displayName) {
      AnimatedComponent.displayName = 'AnimatedView';
    }

    return (
      <AnimatedComponent {...props}>
        {children}
      </AnimatedComponent>
    );
  }

  // Fallback: Simple React state animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setOpacity(1);
      setTranslateY(0);
      setScale(1);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const fallbackStyle: ViewStyle = {
    opacity,
    transform: [
      { translateY },
      { scale },
    ],
  };

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      style={[fallbackStyle, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {children}
    </Component>
  );
};

// Set displayName for better debugging
AnimatedView.displayName = 'AnimatedView';

export default AnimatedView;
