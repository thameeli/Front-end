/**
 * Progressive Image Loading Component
 * Enhanced with blur-up effect, better placeholders, error fallbacks, and lazy loading
 */

import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { Image, ImageProps } from 'expo-image';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors } from '../theme';
import { useTheme } from '../hooks/useTheme';
import SkeletonLoader from './SkeletonLoader';

const AnimatedImage = Animated.createAnimatedComponent(Image);
const AnimatedView = Animated.createAnimatedComponent(View);

interface ProgressiveImageProps {
  source: { uri: string } | number;
  placeholder?: 'skeleton' | 'blur' | 'icon' | 'blur-up';
  style?: ViewStyle;
  containerStyle?: ViewStyle;
  cachePolicy?: 'none' | 'disk' | 'memory' | 'memory-disk';
  priority?: 'low' | 'normal' | 'high';
  contentFit?: ImageProps['contentFit'];
  transition?: number;
  onLoadEnd?: () => void;
  onError?: () => void;
  lazy?: boolean; // Enable lazy loading
  blurRadius?: number; // Blur radius for blur-up effect
  errorFallback?: React.ReactNode; // Custom error fallback
}

const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  source,
  placeholder = 'skeleton',
  style,
  containerStyle,
  cachePolicy = 'memory-disk',
  priority = 'normal',
  lazy = false,
  blurRadius = 10,
  errorFallback,
  ...props
}) => {
  const { colors: themeColors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(!lazy);
  const opacity = useSharedValue(0);
  const blur = useSharedValue(blurRadius);
  
  // Memoize image source to prevent unnecessary re-renders
  const imageSource = useMemo(() => {
    if (typeof source === 'object' && 'uri' in source) {
      return {
        uri: source.uri,
        cachePolicy,
        priority,
      };
    }
    return source;
  }, [source, cachePolicy, priority]);

  // Lazy loading: Load when component is visible
  useEffect(() => {
    if (lazy && !shouldLoad) {
      // Simple intersection observer simulation
      const timer = setTimeout(() => {
        setShouldLoad(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [lazy, shouldLoad]);

  const handleLoadEnd = () => {
    setLoading(false);
    opacity.value = withTiming(1, { duration: 300 });
    if (placeholder === 'blur-up') {
      blur.value = withTiming(0, { duration: 300 });
    }
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  const imageStyle = useAnimatedStyle(() => {
    const blurValue = placeholder === 'blur-up' ? blur.value : 0;
    return {
      opacity: opacity.value,
      // Blur effect for blur-up placeholder
      ...(blurValue > 0 && {
        filter: `blur(${blurValue}px)`,
      }),
    };
  });

  const renderPlaceholder = () => {
    if (error) {
      if (errorFallback) {
        return errorFallback;
      }
      return (
        <View style={[styles.placeholder, { backgroundColor: themeColors.neutral[100] }]}>
          <Icon name="image-off" size={32} color={themeColors.neutral[400]} />
          <Text style={[styles.errorText, { color: themeColors.text.secondary }]}>
            Failed to load image
          </Text>
        </View>
      );
    }

    switch (placeholder) {
      case 'skeleton':
        return <SkeletonLoader width="100%" height="100%" borderRadius={0} />;
      case 'blur':
      case 'blur-up':
        return (
          <View style={[styles.placeholder, { backgroundColor: themeColors.neutral[200] }]}>
            <Icon name="image" size={32} color={themeColors.neutral[400]} />
          </View>
        );
      case 'icon':
      default:
        return (
          <View style={[styles.placeholder, { backgroundColor: themeColors.neutral[100] }]}>
            <Icon name="image-outline" size={32} color={themeColors.neutral[400]} />
          </View>
        );
    }
  };

  return (
    <View style={containerStyle} className="relative overflow-hidden">
      {/* Placeholder */}
      {loading && (
        <View className="absolute inset-0">
          {renderPlaceholder()}
        </View>
      )}

      {/* Actual Image */}
      {shouldLoad && (
        <AnimatedImage
          source={imageSource}
          style={[style as any, imageStyle]}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          contentFit={props.contentFit || "cover"}
          transition={props.transition || 300}
          cachePolicy={cachePolicy}
          priority={priority}
          {...props}
        />
      )}
    </View>
  );
};

const styles = {
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 12,
    marginTop: 8,
  },
};

export default ProgressiveImage;

