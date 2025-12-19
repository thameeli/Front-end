/**
 * Progressive Image Loading Component
 * Shows placeholder while loading, then fades in the actual image
 */

import React, { useState, useMemo } from 'react';
import { View, ViewStyle } from 'react-native';
import { Image, ImageProps } from 'expo-image';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors } from '../theme';
import SkeletonLoader from './SkeletonLoader';

const AnimatedImage = Animated.createAnimatedComponent(Image);
const AnimatedView = Animated.createAnimatedComponent(View);

interface ProgressiveImageProps {
  source: { uri: string } | number;
  placeholder?: 'skeleton' | 'blur' | 'icon';
  style?: ViewStyle;
  containerStyle?: ViewStyle;
  cachePolicy?: 'none' | 'disk' | 'memory' | 'memory-disk';
  priority?: 'low' | 'normal' | 'high';
  contentFit?: ImageProps['contentFit'];
  transition?: number;
  onLoadEnd?: () => void;
  onError?: () => void;
}

const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  source,
  placeholder = 'skeleton',
  style,
  containerStyle,
  cachePolicy = 'memory-disk',
  priority = 'normal',
  ...props
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const opacity = useSharedValue(0);
  
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

  const handleLoadEnd = () => {
    setLoading(false);
    opacity.value = withTiming(1, { duration: 300 });
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  const imageStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const renderPlaceholder = () => {
    if (error) {
      return (
        <View className="w-full h-full bg-neutral-100 justify-center items-center">
          <Icon name="image-off" size={32} color={colors.neutral[400]} />
        </View>
      );
    }

    switch (placeholder) {
      case 'skeleton':
        return <SkeletonLoader width={100} height={100} borderRadius={0} />;
      case 'blur':
        return (
          <View className="w-full h-full bg-neutral-200 justify-center items-center">
            <Icon name="image" size={32} color={colors.neutral[400]} />
          </View>
        );
      case 'icon':
      default:
        return (
          <View className="w-full h-full bg-neutral-100 justify-center items-center">
            <Icon name="image-outline" size={32} color={colors.neutral[400]} />
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
      <AnimatedImage
        source={imageSource}
        style={[style as any, imageStyle]}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        contentFit="cover"
        transition={300}
        cachePolicy={cachePolicy}
        priority={priority}
        {...props}
      />
    </View>
  );
};

export default ProgressiveImage;

