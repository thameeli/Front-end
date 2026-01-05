/**
 * Modern Product Details Screen with Image Gallery, Sticky Add-to-Cart, and Smooth Transitions
 * Uses NativeWind for styling and Phase 2 components
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import * as Sharing from 'expo-sharing';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { RootStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useProduct, useProducts } from '../../hooks/useProducts';
import { requireAuth } from '../../utils/requireAuth';
import { ImageGallery, Button, LoadingScreen, ErrorMessage, AppHeader, QuantitySelector, Badge, AnimatedView, RatingDisplay, ReviewCard, FavoriteButton, ProductCard } from '../../components';
import { productService } from '../../services/productService';
import { formatPrice, isInStock, getProductStock } from '../../utils/productUtils';
import { mediumHaptic, successHaptic } from '../../utils/hapticFeedback';
import { COUNTRIES } from '../../constants';
import type { Country } from '../../constants';
import { colors } from '../../theme';
import {
  isSmallDevice,
  isTablet,
  isLandscape,
  getResponsivePadding,
  getResponsiveFontSize,
  responsiveWidth,
} from '../../utils/responsive';

type ProductDetailsScreenRouteProp = RouteProp<RootStackParamList, 'ProductDetails'>;
type ProductDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ProductDetails'>;

const ProductDetailsScreen = () => {
  const route = useRoute<ProductDetailsScreenRouteProp>();
  const navigation = useNavigation<ProductDetailsScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { productId } = route.params;
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuthStore();
  const { addItem, selectedCountry } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Responsive dimensions
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const isSmall = isSmallDevice();
  const isTabletDevice = isTablet();
  const isLandscapeMode = isLandscape();
  const padding = getResponsivePadding();
  
  // Update dimensions on orientation change
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });
    return () => subscription?.remove();
  }, []);
  
  // Calculate tab bar height to position sticky button above it
  const tabBarHeight = Platform.OS === 'ios' ? 60 : 56;
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 8 : 4);
  const totalTabBarHeight = tabBarHeight + bottomPadding;

  const country = (user?.country_preference || selectedCountry || COUNTRIES.GERMANY) as Country;
  const { data: product, isLoading, error, refetch } = useProduct(productId);
  
  // Add to recently viewed when product loads
  useEffect(() => {
    if (product) {
      addToRecentlyViewed(product.id, product.category);
    }
  }, [product]);
  
  // Get country-specific stock
  const stock = product ? getProductStock(product, country) : 0;
  
  // Fetch all products for related products
  const { data: allProducts = [] } = useProducts({ active: true });
  
  // Get related products (same category, excluding current product)
  const relatedProducts = React.useMemo(() => {
    if (!product || !allProducts.length) return [];
    return allProducts
      .filter(p => p.id !== product.id && p.category === product.category && p.active)
      .slice(0, 4);
  }, [product, allProducts]);
  
  // Share functionality
  const handleShare = async () => {
    if (!product) return;
    
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        showToast({
          message: 'Sharing is not available on this device',
          type: 'warning',
          duration: 2000,
        });
        return;
      }
      
      const shareMessage = `Check out ${product.name} on Thamili!\n${product.description || ''}\nPrice: ${formatPrice(productService.getProductPrice(product, country), country)}`;
      
      await Sharing.shareAsync(shareMessage, {
        mimeType: 'text/plain',
        dialogTitle: `Share ${product.name}`,
      });
    } catch (error: any) {
      showToast({
        message: error.message || 'Failed to share product',
        type: 'error',
        duration: 3000,
      });
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Loading product details..." />;
  }

  if (error || !product) {
    return (
      <View style={{ flex: 1, backgroundColor: 'rgba(245, 245, 250, 0.95)' }}>
        <AppHeader title="Product Details" showBack />
        <ErrorMessage 
          message="Failed to load product details. Please try again."
          error={error}
          onRetry={() => refetch?.()}
          retryWithBackoff={true}
        />
      </View>
    );
  }

  const price = productService.getProductPrice(product, country);
  const inStock = isInStock(product);
  const images = product.image_url ? [product.image_url] : [];

  const handleAddToCart = async () => {
    // Check authentication - if not authenticated, prompt to login/register
    if (!requireAuth({
      navigation,
      isAuthenticated,
      t,
    })) {
      return;
    }

    if (!inStock) {
      showToast({
        message: 'This product is currently out of stock',
        type: 'warning',
        duration: 3000,
      });
      return;
    }

    try {
      await addItem(product, quantity, country);
      successHaptic();
      showToast({
        message: 'Product added to cart!',
        type: 'success',
        duration: 2000,
      });
    } catch (error: any) {
      showToast({
        message: error.message || 'Failed to add product to cart',
        type: 'error',
        duration: 3000,
      });
    }
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    const stock = getProductStock(product, country);
    if (newQuantity >= 1 && newQuantity <= stock) {
      setQuantity(newQuantity);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <AppHeader title={product.name} showBack />
      
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: totalTabBarHeight + (isTabletDevice ? 120 : 100),
          paddingHorizontal: isTabletDevice && !isLandscapeMode ? padding.horizontal * 2 : 0,
        }}
      >
        {/* Image Gallery */}
        <AnimatedView animation="fade" delay={0}>
          <ImageGallery images={images} />
        </AnimatedView>

        {/* Product Details */}
        <AnimatedView
          animation="slide"
          delay={100}
          enterFrom="bottom"
          style={{
            paddingHorizontal: padding.horizontal,
            paddingTop: padding.vertical * 1.5,
            maxWidth: isTabletDevice && !isLandscapeMode ? 600 : '100%',
            alignSelf: isTabletDevice && !isLandscapeMode ? 'center' : 'stretch',
          }}
        >
          <View className="flex-row items-start justify-between mb-4">
            <View className="flex-1">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-3xl font-bold text-neutral-900 flex-1">
                  {product.name}
                </Text>
                <View className="flex-row items-center gap-3">
                  <TouchableOpacity
                    onPress={handleShare}
                    className="p-2"
                    accessibilityRole="button"
                    accessibilityLabel="Share product"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Icon name="share-variant" size={24} color={colors.neutral[700]} />
                  </TouchableOpacity>
                  <FavoriteButton
                    isFavorite={isFavorite}
                    onToggle={() => setIsFavorite(!isFavorite)}
                    size={28}
                  />
                </View>
              </View>
              <View className="flex-row items-center gap-2 mb-3">
                <Badge variant={product.category === 'fresh' ? 'success' : 'secondary'} size="sm">
                  {product.category === 'fresh' ? 'Fresh' : 'Frozen'}
                </Badge>
                {inStock ? (
                  <View className="flex-row items-center">
                    <Icon name="check-circle" size={16} color={colors.success[500]} />
                    <Text className="text-sm text-success-500 ml-1 font-medium">
                      In Stock ({stock} available)
                    </Text>
                  </View>
                ) : (
                  <View className="flex-row items-center">
                    <Icon name="close-circle" size={16} color={colors.error[500]} />
                    <Text className="text-sm text-error-500 ml-1 font-medium">
                      Out of Stock
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Price and Rating */}
          <View className="mb-6">
            <Text className="text-4xl font-bold text-primary-500 mb-2">
              {formatPrice(price, country)}
            </Text>
            <RatingDisplay
              rating={product.rating || 4.5}
              size={18}
              showNumber={true}
              showCount={true}
              reviewCount={product.review_count || Math.floor(Math.random() * 50) + 10}
            />
            <Text className="text-sm text-neutral-500 mt-1">
              {country === COUNTRIES.GERMANY ? 'Price in EUR' : 'Price in NOK'}
            </Text>
          </View>

          {/* Description */}
          {product.description && (
            <View className="mb-6">
              <Text className="text-lg font-semibold text-neutral-900 mb-3">
                Description
              </Text>
              <Text className="text-base text-neutral-600 leading-6">
                {product.description}
              </Text>
            </View>
          )}

          {/* Quantity Selector */}
          {inStock && (
            <View className="mb-6">
              <Text className="text-lg font-semibold text-neutral-900 mb-4">
                Quantity
              </Text>
              <QuantitySelector
                value={quantity}
                onChange={(newQuantity) => {
                  if (newQuantity >= 1 && newQuantity <= stock) {
                    setQuantity(newQuantity);
                  }
                }}
                min={1}
                max={stock}
              />
            </View>
          )}

          {/* Reviews Section */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-neutral-900">
                Customer Reviews
              </Text>
              <Text className="text-sm text-neutral-500">
                {product.review_count || 25} reviews
              </Text>
            </View>
            
            {/* Sample Reviews */}
            {[
              {
                id: '1',
                userName: 'Sarah M.',
                rating: 5,
                comment: 'Excellent quality! Fresh and delivered on time. Highly recommend!',
                date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                verified: true,
              },
              {
                id: '2',
                userName: 'Michael K.',
                rating: 4,
                comment: 'Good product, fast delivery. Would order again.',
                date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                verified: true,
              },
              {
                id: '3',
                userName: 'Emma L.',
                rating: 5,
                comment: 'Perfect! Exactly as described. Great service!',
                date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                verified: false,
              },
            ].map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                country={country}
                style={{ marginBottom: 12 }}
              />
            ))}
          </View>

          {/* Related Products Section */}
          {relatedProducts.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-semibold text-neutral-900">
                  Related Products
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Products')}
                  accessibilityRole="button"
                  accessibilityLabel="View all products"
                >
                  <Text className="text-sm text-primary-500">View All</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 16 }}
              >
                {relatedProducts.map((relatedProduct, index) => (
                  <View
                    key={relatedProduct.id}
                    style={{
                      marginRight: 12,
                      width: isSmall ? responsiveWidth(45) : isTabletDevice ? 220 : 180,
                    }}
                  >
                    <ProductCard
                      product={relatedProduct}
                      country={country}
                      onPress={() => {
                        navigation.replace('ProductDetails', { productId: relatedProduct.id });
                      }}
                      index={index}
                    />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </AnimatedView>
      </ScrollView>

      {/* Sticky Add to Cart Button - Positioned above tab bar */}
      <AnimatedView
        animation="slide"
        delay={200}
        enterFrom="bottom"
        style={[
          styles.stickyContainer,
          {
            bottom: totalTabBarHeight,
            paddingHorizontal: padding.horizontal,
            maxWidth: isTabletDevice && !isLandscapeMode ? 600 : '100%',
            alignSelf: isTabletDevice && !isLandscapeMode ? 'center' : 'stretch',
          }
        ]}
      >
        <View style={[
          styles.stickyContent,
          {
            flexDirection: isSmall || isLandscapeMode ? 'column' : 'row',
            gap: isSmall || isLandscapeMode ? 12 : 16,
          }
        ]}>
          <View style={[
            styles.totalContainer,
            {
              flex: isSmall || isLandscapeMode ? 0 : 1,
              marginRight: isSmall || isLandscapeMode ? 0 : 16,
              width: isSmall || isLandscapeMode ? '100%' : undefined,
            }
          ]}>
            <Text style={[
              styles.totalLabel,
              { fontSize: getResponsiveFontSize(12, 11, 14) }
            ]}>
              Total
            </Text>
            <Text style={[
              styles.totalValue,
              { fontSize: getResponsiveFontSize(24, 20, 28) }
            ]}>
              {formatPrice(price * quantity, country)}
            </Text>
          </View>
          <View style={[
            styles.buttonContainer,
            {
              flex: isSmall || isLandscapeMode ? 0 : 1,
              width: isSmall || isLandscapeMode ? '100%' : undefined,
            }
          ]}>
            <Button
              title={inStock ? 'Add to Cart' : 'Out of Stock'}
              onPress={handleAddToCart}
              disabled={!inStock}
              fullWidth
              size="lg"
              icon={<Icon name="cart-plus" size={20} color="white" />}
            />
          </View>
        </View>
      </AnimatedView>
    </View>
  );
};

const styles = StyleSheet.create({
  stickyContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingTop: 12,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    // paddingHorizontal is set dynamically
  },
  stickyContent: {
    // flexDirection is set dynamically
    alignItems: 'center',
  },
  totalContainer: {
    // flex and width are set dynamically
  },
  totalLabel: {
    // fontSize is set dynamically
    color: '#9E9E9E',
    marginBottom: 4,
  },
  totalValue: {
    // fontSize is set dynamically
    fontWeight: 'bold',
    color: '#007AFF',
  },
  buttonContainer: {
    // flex and width are set dynamically
  },
});

export default ProductDetailsScreen;
