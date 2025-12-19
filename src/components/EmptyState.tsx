/**
 * Beautiful Empty State Component with Illustrations
 * Enhanced with better animations and helpful CTAs
 * Compatible with react-native-reanimated 3.x for Expo Go
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { colors } from '../theme';
import { ANIMATION_DURATION, EASING } from '../utils/animations';
import Button from './Button';

// Safe import of reanimated with fallback
let AnimatedView: any;
try {
  const Reanimated = require('react-native-reanimated');
  AnimatedView = Reanimated.default?.View 
    ? Reanimated.default.createAnimatedComponent(View)
    : Reanimated.createAnimatedComponent(View);
} catch (e) {
  AnimatedView = View;
}

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: any;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  illustration?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'inbox-outline',
  title,
  message,
  actionLabel,
  onAction,
  style,
  secondaryActionLabel,
  onSecondaryAction,
  illustration,
}) => {
  const containerOpacity = useSharedValue(0);
  const iconScale = useSharedValue(0.8);
  const textOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  React.useEffect(() => {
    // Staggered entrance animation
    containerOpacity.value = withTiming(1, { duration: 300 });
    
    // Icon bounce animation
    iconScale.value = withSequence(
      withSpring(1.2, { damping: 8, stiffness: 200 }),
      withSpring(1, EASING.spring)
    );
    
    setTimeout(() => {
      textOpacity.value = withTiming(1, { duration: 300 });
    }, 200);
    
    setTimeout(() => {
      buttonOpacity.value = withTiming(1, { duration: 300 });
    }, 400);
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  return (
    <AnimatedView
      style={[containerStyle, style]}
      className="flex-1 justify-center items-center px-8 py-12"
      accessibilityRole="text"
      accessibilityLabel={`${title}. ${message || ''}`}
    >
      <AnimatedView style={iconStyle}>
        {illustration ? (
          <View className="mb-6">
            {illustration}
          </View>
        ) : (
          <View className="w-24 h-24 rounded-full bg-neutral-100 justify-center items-center mb-6">
            <Icon
              name={icon as any}
              size={48}
              color={colors.neutral[400]}
            />
          </View>
        )}
      </AnimatedView>

      <AnimatedView style={textStyle}>
        <Text className="text-xl font-bold text-neutral-900 text-center mb-2">
          {title}
        </Text>
        {message && (
          <Text className="text-base text-neutral-500 text-center mb-6">
            {message}
          </Text>
        )}
      </AnimatedView>

      {(actionLabel || secondaryActionLabel) && (
        <AnimatedView style={buttonStyle} className="w-full items-center gap-3">
          {actionLabel && onAction && (
            <Button
              title={actionLabel}
              onPress={onAction}
              variant="primary"
              size="md"
              icon={<Icon name="arrow-right" size={18} color="white" />}
              fullWidth
            />
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button
              title={secondaryActionLabel}
              onPress={onSecondaryAction}
              variant="outline"
              size="md"
              fullWidth
            />
          )}
        </AnimatedView>
      )}
    </AnimatedView>
  );
};

export default EmptyState;
