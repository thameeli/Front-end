/**
 * Modern Animated Error Message Component
 * Beautiful error messages with animations and retry functionality
 */

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { colors } from '../theme';
import { EASING, ANIMATION_DURATION } from '../utils/animations';
import Button from './Button';

const AnimatedView = Animated.createAnimatedComponent(View);

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  type?: 'error' | 'warning' | 'info' | 'network';
  style?: any;
  className?: string;
  showIcon?: boolean;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  onDismiss,
  type = 'error',
  style,
  className = '',
  showIcon = true,
}) => {
  const { t } = useTranslation();
  const [retrying, setRetrying] = useState(false);

  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  const iconRotation = useSharedValue(0);
  const iconScale = useSharedValue(0.8);

  useEffect(() => {
    // Entrance animation
    scale.value = withSpring(1, EASING.spring);
    opacity.value = withTiming(1, { duration: ANIMATION_DURATION.normal });
    
    // Icon animation
    iconScale.value = withSequence(
      withSpring(1.2, { damping: 8, stiffness: 200 }),
      withSpring(1, EASING.spring)
    );
    iconRotation.value = withSequence(
      withTiming(-10, { duration: 100 }),
      withSpring(0, EASING.spring)
    );
  }, []);

  const handleRetry = async () => {
    if (onRetry && !retrying) {
      setRetrying(true);
      try {
        await onRetry();
      } finally {
        setTimeout(() => setRetrying(false), 1000);
      }
    }
  };

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotation.value}deg` },
    ],
  }));

  const getTypeConfig = () => {
    switch (type) {
      case 'warning':
        return {
          icon: 'alert',
          bgColor: colors.warning[50],
          borderColor: colors.warning[200],
          textColor: colors.warning[700],
          iconColor: colors.warning[500],
        };
      case 'info':
        return {
          icon: 'information',
          bgColor: colors.primary[50],
          borderColor: colors.primary[200],
          textColor: colors.primary[700],
          iconColor: colors.primary[500],
        };
      case 'network':
        return {
          icon: 'wifi-off',
          bgColor: colors.error[50],
          borderColor: colors.error[200],
          textColor: colors.error[700],
          iconColor: colors.error[500],
        };
      case 'error':
      default:
        return {
          icon: 'alert-circle',
          bgColor: colors.error[50],
          borderColor: colors.error[200],
          textColor: colors.error[700],
          iconColor: colors.error[500],
        };
    }
  };

  const config = getTypeConfig();

  return (
    <AnimatedView
      style={[containerStyle, style]}
      className={`
        flex-row items-center p-4 rounded-xl border-2 mb-4
        ${className}
      `}
      style={{
        backgroundColor: config.bgColor,
        borderColor: config.borderColor,
      }}
    >
      {showIcon && (
        <AnimatedView style={iconStyle} className="mr-3">
          <Icon
            name={config.icon as any}
            size={24}
            color={config.iconColor}
          />
        </AnimatedView>
      )}

      <View className="flex-1">
        <Text
          className="text-base font-semibold mb-1"
          style={{ color: config.textColor }}
        >
          {message}
        </Text>

        {type === 'network' && (
          <Text
            className="text-sm mb-3"
            style={{ color: config.textColor, opacity: 0.8 }}
          >
            {t('errors.checkConnection') || 'Please check your internet connection and try again.'}
          </Text>
        )}

        <View className="flex-row gap-2 mt-2">
          {onRetry && (
            <Button
              title={retrying ? (t('common.loading') || 'Loading...') : (t('errors.tryAgain') || 'Try Again')}
              onPress={handleRetry}
              disabled={retrying}
              loading={retrying}
              variant="outline"
              size="sm"
              style={{
                borderColor: config.borderColor,
              }}
              textStyle={{ color: config.textColor }}
            />
          )}
          {onDismiss && (
            <TouchableOpacity
              onPress={onDismiss}
              className="p-2"
            >
              <Icon name="close" size={20} color={config.textColor} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </AnimatedView>
  );
};

export default ErrorMessage;
