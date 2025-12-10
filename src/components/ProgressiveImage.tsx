/**
 * Progressive Image Loading Component
 * Shows placeholder while loading, then fades in the actual image
 */

import React, { useState } from 'react';
import { View, ViewStyle } from 'react-native';
import { Image, ImageProps } from 'expo-image';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors } from '../theme';
import { SkeletonLoader } from './SkeletonLoader';

const AnimatedImage = Animated.createAnimatedComponent(Image);
const AnimatedView = Animated.createAnimatedComponent(View);

interface ProgressiveImageProps extends Omit<ImageProps, 'source'> {
  source: { uri: string } | number;
  placeholder?: 'skeleton' | 'blur' | 'icon';
  style?: ViewStyle;
  containerStyle?: ViewStyle;
}

const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  source,
  placeholder = 'skeleton',
  style,
  containerStyle,
  ...props
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const opacity = useSharedValue(0);

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
        return <SkeletonLoader width="100%" height="100%" borderRadius={0} />;
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
        source={source}
        style={[style, imageStyle]}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        contentFit="cover"
        transition={300}
        {...props}
      />
    </View>
  );
};

export default ProgressiveImage;

