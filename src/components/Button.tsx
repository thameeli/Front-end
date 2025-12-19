/**
 * Modern Button Component with Press Animations
 * Uses NativeWind for styling and react-native-reanimated for smooth animations
 * Safe for Expo Go with fallbacks
 */

import React, { useState } from 'react';
import { Text, ActivityIndicator, ViewStyle, TextStyle, Pressable, View } from 'react-native';

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
  console.log('⚠️ [Button] Reanimated not available, using fallback');
}

import { colors } from '../theme';
import { ANIMATION_DURATION, EASING } from '../utils/animations';
import { mediumHaptic } from '../utils/hapticFeedback';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: React.ReactNode;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: 'button' | 'link' | 'none';
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = false,
  size = 'md',
  icon,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
}) => {
  // Check if reanimated is available
  const hasReanimated = Boolean(Animated && useAnimatedStyle && useSharedValue);

  // Fallback: Use React state for simple animations
  const [pressed, setPressed] = useState(false);
  
  // Reanimated values (only if available)
  const scale = hasReanimated ? useSharedValue(1) : null;
  const opacity = hasReanimated ? useSharedValue(1) : null;
  const rippleScale = hasReanimated ? useSharedValue(0) : null;
  const rippleOpacity = hasReanimated ? useSharedValue(0) : null;

  const handlePressIn = () => {
    if (hasReanimated && scale && opacity && rippleScale && rippleOpacity) {
      scale.value = withSpring(0.97, EASING.spring);
      opacity.value = withTiming(0.8, { duration: ANIMATION_DURATION.fast });
      
      // Ripple effect
      rippleScale.value = withTiming(1, { duration: 400 });
      rippleOpacity.value = withTiming(0.3, { duration: 200 }, () => {
        rippleOpacity.value = withTiming(0, { duration: 200 });
      });
    } else {
      setPressed(true);
    }
  };

  const handlePressOut = () => {
    if (hasReanimated && scale && opacity && rippleScale) {
      scale.value = withSpring(1, EASING.spring);
      opacity.value = withTiming(1, { duration: ANIMATION_DURATION.fast });
      rippleScale.value = withTiming(0, { duration: 200 });
    } else {
      setPressed(false);
    }
  };

  const handlePress = (e?: any) => {
    // Stop event propagation to prevent triggering parent interactive elements (especially on web)
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    if (!disabled && !loading) {
      mediumHaptic();
      onPress();
    }
  };

  // Use regular style object for fallback, animated style for reanimated
  const baseStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    overflow: 'hidden',
    opacity: disabled || loading ? 0.5 : (pressed ? 0.8 : 1),
    transform: [{ scale: pressed ? 0.97 : 1 }],
  };

  if (fullWidth) {
    baseStyle.width = '100%';
  }

  const animatedStyle = hasReanimated && useAnimatedStyle && scale && opacity
    ? useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
      }))
    : undefined;

  const rippleStyle = hasReanimated && useAnimatedStyle && rippleScale && rippleOpacity
    ? useAnimatedStyle(() => ({
        transform: [{ scale: rippleScale.value }],
        opacity: rippleOpacity.value,
      }))
    : {
        transform: [{ scale: pressed ? 1 : 0 }],
        opacity: pressed ? 0.3 : 0,
      };

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary-500';
      case 'secondary':
        return 'bg-secondary-500';
      case 'outline':
        return 'bg-transparent border-2 border-primary-500';
      case 'danger':
        return 'bg-error-500';
      case 'ghost':
        return 'bg-transparent';
      default:
        return 'bg-primary-500';
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'outline':
        return 'text-primary-500';
      case 'ghost':
        return 'text-primary-500';
      default:
        return 'text-white';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-4 py-2 min-h-[44px]'; // WCAG minimum touch target
      case 'md':
        return 'px-6 py-3 min-h-[48px]';
      case 'lg':
        return 'px-8 py-4 min-h-[56px]';
      case 'xl':
        return 'px-10 py-5 min-h-[64px]';
      default:
        return 'px-6 py-3 min-h-[48px]';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm':
        return 'text-sm'; // 14px - minimum WCAG requirement
      case 'md':
        return 'text-base'; // 16px
      case 'lg':
        return 'text-lg'; // 18px
      case 'xl':
        return 'text-xl'; // 20px
      default:
        return 'text-base';
    }
  };

  // Always use Pressable directly to avoid displayName issues
  const containerStyle = [
    baseStyle,
    animatedStyle,
    style,
  ].filter(Boolean);

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={containerStyle}
      className={`
        ${getVariantClasses()}
        ${getSizeClasses()}
      `}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading }}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} // Extra touch area
    >
      {/* Ripple Effect */}
      {hasReanimated && Animated && Animated.View ? (
        <Animated.View
          style={[
            rippleStyle,
            {
              position: 'absolute',
              width: '200%',
              height: '200%',
              borderRadius: 999,
              backgroundColor: variant === 'outline' || variant === 'ghost' 
                ? colors.primary[200] 
                : 'rgba(255, 255, 255, 0.3)',
              top: '50%',
              left: '50%',
              marginTop: '-100%',
              marginLeft: '-100%',
            },
          ]}
        />
      ) : pressed ? (
        <View
          style={{
            position: 'absolute',
            width: '200%',
            height: '200%',
            borderRadius: 999,
            backgroundColor: variant === 'outline' || variant === 'ghost' 
              ? colors.primary[200] 
              : 'rgba(255, 255, 255, 0.3)',
            top: '50%',
            left: '50%',
            marginTop: '-100%',
            marginLeft: '-100%',
            opacity: 0.3,
            transform: [{ scale: 1 }],
          }}
        />
      ) : null}
      
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? colors.primary[500] : '#fff'}
          size="small"
        />
      ) : (
        <>
          {icon && <Text className="mr-2">{icon}</Text>}
          <Text
            className={`
              ${getTextColor()}
              ${getTextSize()}
              font-semibold
            `}
            style={textStyle}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
};

// Set displayName for better debugging
Button.displayName = 'Button';

export default Button;
