/**
 * Animated Toast Notification Component
 * Compatible with react-native-reanimated 3.x for Expo Go
 */

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { colors } from '../theme';
import { ANIMATION_DURATION, EASING } from '../utils/animations';

const AnimatedView = Animated.createAnimatedComponent(View);

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onDismiss?: () => void;
  position?: 'top' | 'bottom';
  action?: {
    label: string;
    onPress: () => void;
  };
}

const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 3000,
  onDismiss,
  position = 'bottom',
  action,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(position === 'bottom' ? 100 : -100);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: ANIMATION_DURATION.normal });
    translateY.value = withSpring(0, EASING.spring);

    const timer = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    opacity.value = withTiming(0, { duration: ANIMATION_DURATION.fast });
    translateY.value = withTiming(
      position === 'bottom' ? 100 : -100,
      { duration: ANIMATION_DURATION.fast }
    );
    setTimeout(() => {
      onDismiss?.();
    }, ANIMATION_DURATION.fast);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const getTypeClasses = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-success-500',
          icon: 'check-circle',
          iconColor: colors.success[500],
        };
      case 'error':
        return {
          bg: 'bg-error-500',
          icon: 'alert-circle',
          iconColor: colors.error[500],
        };
      case 'warning':
        return {
          bg: 'bg-warning-500',
          icon: 'alert',
          iconColor: colors.warning[500],
        };
      case 'info':
      default:
        return {
          bg: 'bg-primary-500',
          icon: 'information',
          iconColor: colors.primary[500],
        };
    }
  };

  const typeClasses = getTypeClasses();

  return (
    <AnimatedView
      style={[
        animatedStyle,
        {
          position: 'absolute',
          [position]: 20,
          left: 16,
          right: 16,
          zIndex: 9999,
        },
      ]}
      className={`
        ${typeClasses.bg}
        rounded-lg
        px-4
        py-3
        flex-row
        items-center
        shadow-lg
      `}
    >
      <Icon name={typeClasses.icon as any} size={20} color="#fff" />
      <Text className="flex-1 ml-3 text-white text-base font-medium">
        {message}
      </Text>
      {action && (
        <TouchableOpacity onPress={action.onPress} className="ml-2">
          <Text className="text-white text-base font-semibold underline">
            {action.label}
          </Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={handleDismiss} className="ml-2">
        <Icon name="close" size={20} color="#fff" />
      </TouchableOpacity>
    </AnimatedView>
  );
};

// Toast Manager Hook
export const useToast = () => {
  const [toasts, setToasts] = React.useState<Array<ToastProps & { id: string }>>([]);

  const showToast = (toast: ToastProps) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const ToastContainer = () => (
    <View pointerEvents="box-none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onDismiss={() => dismissToast(toast.id)}
        />
      ))}
    </View>
  );

  return { showToast, dismissToast, ToastContainer };
};

export default Toast;
