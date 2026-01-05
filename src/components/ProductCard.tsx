/**
 * Modern ProductCard with Image Overlay and Smooth Transitions
 * Compatible with react-native-reanimated 3.x for Expo Go
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import ProgressiveImage from './ProgressiveImage';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Product } from '../types';
import Button from './Button';
import DiscountBadge from './DiscountBadge';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { productService } from '../services';
import { COUNTRIES } from '../constants';
import type { Country } from '../constants';
import { colors } from '../theme';
import { EASING, ANIMATION_DURATION } from '../utils/animations';
import { mediumHaptic } from '../utils/hapticFeedback';
import { formatCurrency } from '../utils/regionalFormatting';
import RatingDisplay from './RatingDisplay';

// Use Pressable instead of TouchableOpacity to avoid button nesting on web
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedView = Animated.createAnimatedComponent(View);

interface ProductCardProps {
  product: Product;
  country?: Country;
  onPress?: () => void;
  onAddToCart?: () => void;
  index?: number;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  country,
  onPress,
  onAddToCart,
  index = 0,
}) => {
  const { addItem } = useCartStore();
  const { user } = useAuthStore();
  const selectedCountry = country || (user?.country_preference || COUNTRIES.GERMANY) as Country;
  const price = productService.getProductPrice(product, selectedCountry);
  // Ensure originalPrice is valid, fallback to price if invalid
  const originalPriceRaw = selectedCountry === COUNTRIES.GERMANY
    ? (product.original_price_germany || product.price_germany)
    : (product.original_price_denmark || product.price_denmark);
  const originalPrice = (originalPriceRaw && !isNaN(originalPriceRaw) && originalPriceRaw > 0) 
    ? originalPriceRaw 
    : price;
  const hasDiscount = originalPrice > price;
  const discountPercentage = hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : (product.discount_percentage || 0);
  const stock = selectedCountry === COUNTRIES.GERMANY 
    ? product.stock_germany 
    : product.stock_denmark;
  const isInStock = stock > 0;

  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    // Staggered entrance animation
    setTimeout(() => {
      opacity.value = withTiming(1, { duration: ANIMATION_DURATION.normal });
    }, index * 50);
  }, []);

  const handlePressIn = () => {
    scale.value = withSpring(0.98, EASING.spring);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, EASING.spring);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handleAddToCart = (e?: any) => {
    // Stop event propagation to prevent triggering parent TouchableOpacity
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    if (isInStock) {
      mediumHaptic();
      if (onAddToCart) {
        onAddToCart();
      } else {
        // Fire and forget - don't block UI
        addItem(product, 1, selectedCountry).catch((error) => {
          console.error('Error adding to cart:', error);
        });
      }
    }
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        animatedStyle,
        {
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          borderRadius: 16,
          marginBottom: 16,
          overflow: 'hidden',
          borderWidth: 1.5,
          borderColor: 'rgba(58, 181, 209, 0.3)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 16,
          elevation: 6,
          minHeight: 380, // Fixed minimum height for consistency
          flex: 1, // Allow flex to fill available space in grid
        },
      ]}
      accessibilityRole="none"
      accessibilityLabel={`${product.name}, ${formatCurrency(price, selectedCountry)}, ${isInStock ? 'in stock' : 'out of stock'}`}
      accessibilityHint={isInStock ? 'Double tap to view product details' : 'Product is currently out of stock'}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <AnimatedView className="relative" style={{ flex: 1, flexDirection: 'column' }}>
            <View className="w-full h-48 relative" accessibilityRole="image" accessibilityLabel={`${product.name} product image`}>
              {product.image_url ? (
                <ProgressiveImage
                  source={{ uri: product.image_url }}
                  placeholder="skeleton"
                  style={{ width: '100%', height: '100%' }}
                  containerStyle={{ width: '100%', height: '100%' }}
                />
              ) : (
                <View className="w-full h-full bg-neutral-100 justify-center items-center">
                  <Icon name="image-off" size={40} color={colors.neutral[400]} />
                </View>
              )}

          {/* Category Badge */}
          <View className="absolute top-2 left-2">
            <View
              className={`
                px-2 py-1 rounded-md
                ${product.category === 'fresh' ? 'bg-success-500' : 'bg-primary-500'}
              `}
            >
              <Text className="text-xs font-semibold text-white capitalize">
                {product.category}
              </Text>
            </View>
          </View>

          {/* Discount Badge */}
          {discountPercentage > 0 && (
            <DiscountBadge discount={discountPercentage} />
          )}

          {/* Out of Stock Overlay */}
          {!isInStock && (
            <View className="absolute inset-0 bg-black/50 justify-center items-center">
              <View className="bg-white/90 px-4 py-2 rounded-lg">
                <Text className="text-base font-bold text-neutral-900">Out of Stock</Text>
              </View>
            </View>
          )}
        </View>

        <View className="p-4" style={{ flex: 1, justifyContent: 'space-between', flexDirection: 'column' }}>
          <View style={{ flex: 1 }}>
            <Text 
              className="text-base font-semibold text-neutral-900 mb-1" 
              numberOfLines={2}
              accessibilityRole="header"
              accessibilityLabel={`Product name: ${product.name}`}
              style={{ minHeight: 40 }} // Fixed height for 2 lines
            >
              {product.name}
            </Text>

            <View className="mb-3">
              <View className="flex-row items-center mb-1">
                <Text 
                  className="text-xl font-bold text-primary-500"
                  accessibilityLabel={`Price: ${formatCurrency(price, selectedCountry)}`}
                >
                  {formatCurrency(price, selectedCountry)}
                </Text>
                {hasDiscount && originalPrice > price && (
                  <Text 
                    className="text-sm text-neutral-400 line-through ml-2"
                    accessibilityLabel={`Original price: ${formatCurrency(originalPrice, selectedCountry)}`}
                  >
                    {formatCurrency(originalPrice, selectedCountry)}
                  </Text>
                )}
              </View>
              {/* Rating Display */}
              <View className="mb-2" style={{ minHeight: 20 }}>
                <RatingDisplay
                  rating={product.rating || 4.5}
                  size={14}
                  showNumber={false}
                  showCount={true}
                  reviewCount={product.review_count || Math.floor(Math.random() * 50) + 10}
                />
              </View>
              <View className="flex-row justify-between items-center" style={{ minHeight: 20 }}>
                {stock > 0 && (
                  <Text className="text-xs text-neutral-500">
                    {stock} in stock
                  </Text>
                )}
                {hasDiscount && (
                  <View className="bg-error-50 px-2 py-1 rounded">
                    <Text className="text-xs font-semibold text-error-600">
                      Save {selectedCountry === COUNTRIES.GERMANY ? '€' : 'NOK'} {(originalPrice - price).toFixed(2)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <Button
            title={isInStock ? 'Add to Cart' : 'Out of Stock'}
            onPress={handleAddToCart}
            disabled={!isInStock}
            variant={isInStock ? 'primary' : 'outline'}
            size="sm"
            fullWidth
            accessibilityLabel={isInStock ? `Add ${product.name} to cart` : `${product.name} is out of stock`}
            accessibilityHint={isInStock ? 'Double tap to add this product to your shopping cart' : undefined}
          />
        </View>
      </AnimatedView>
    </AnimatedPressable>
  );
};

export default React.memo(ProductCard);
