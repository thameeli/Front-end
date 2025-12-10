/**
 * Content Fade-In Animation Wrapper
 * Smooth fade-in animation for content when it loads
 */

import React, { useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { ANIMATION_DURATION, EASING } from '../utils/animations';

const AnimatedView = Animated.createAnimatedComponent(View);

interface ContentFadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: ViewStyle;
  className?: string;
}

const ContentFadeIn: React.FC<ContentFadeInProps> = ({
  children,
  delay = 0,
  duration = ANIMATION_DURATION.normal,
  style,
  className = '',
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    const timer = setTimeout(() => {
      opacity.value = withTiming(1, {
        duration,
        easing: EASING.easeOut,
      });
      translateY.value = withTiming(0, {
        duration,
        easing: EASING.easeOut,
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <AnimatedView style={[animatedStyle, style]} className={className}>
      {children}
    </AnimatedView>
  );
};

export default ContentFadeIn;

