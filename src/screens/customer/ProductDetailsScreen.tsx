/**
 * Modern Product Details Screen with Image Gallery, Sticky Add-to-Cart, and Smooth Transitions
 * Uses NativeWind for styling and Phase 2 components
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { RootStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useProduct } from '../../hooks/useProducts';
import { ImageGallery, Button, LoadingScreen, ErrorMessage, AppHeader, QuantitySelector, Badge, AnimatedView } from '../../components';
import { productService } from '../../services/productService';
import { formatPrice, isInStock } from '../../utils/productUtils';
import { COUNTRIES } from '../../constants';
import type { Country } from '../../constants';
import { colors } from '../../theme';

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
  
  // Calculate tab bar height to position sticky button above it
  const tabBarHeight = Platform.OS === 'ios' ? 60 : 56;
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 8 : 4);
  const totalTabBarHeight = tabBarHeight + bottomPadding;

  const country = (user?.country_preference || selectedCountry || COUNTRIES.GERMANY) as Country;
  const { data: product, isLoading, error } = useProduct(productId);

  if (isLoading) {
    return <LoadingScreen message="Loading product details..." />;
  }

  if (error || !product) {
    return (
      <View className="flex-1 bg-white">
        <AppHeader title="Product Details" showBack />
        <ErrorMessage message="Failed to load product details. Please try again." />
      </View>
    );
  }

  const price = productService.getProductPrice(product, country);
  const inStock = isInStock(product);
  const images = product.image_url ? [product.image_url] : [];

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      Alert.alert(
        t('auth.loginRequired') || 'Login Required',
        t('auth.loginToAddCart') || 'Please login or sign up to add items to cart',
        [
          { text: t('common.cancel') || 'Cancel', style: 'cancel' },
          {
            text: t('auth.login') || 'Login',
            onPress: () => navigation.navigate('Login'),
          },
          {
            text: t('auth.register') || 'Sign Up',
            onPress: () => navigation.navigate('Register'),
            style: 'default',
          },
        ]
      );
      return;
    }

    if (!inStock) {
      Alert.alert('Out of Stock', 'This product is currently out of stock.');
      return;
    }

    addItem(product, quantity, country);
    Alert.alert('Success', 'Product added to cart!');
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <AppHeader title={product.name} showBack />
      
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Image Gallery */}
        <AnimatedView animation="fade" delay={0}>
          <ImageGallery images={images} />
        </AnimatedView>

        {/* Product Details */}
        <AnimatedView animation="slide" delay={100} enterFrom="bottom" className="px-4 pt-6">
          <View className="flex-row items-start justify-between mb-4">
            <View className="flex-1">
              <Text className="text-3xl font-bold text-neutral-900 mb-2">
                {product.name}
              </Text>
              <View className="flex-row items-center gap-2 mb-3">
                <Badge variant={product.category === 'fresh' ? 'success' : 'secondary'} size="sm">
                  {product.category === 'fresh' ? 'Fresh' : 'Frozen'}
                </Badge>
                {inStock ? (
                  <View className="flex-row items-center">
                    <Icon name="check-circle" size={16} color={colors.success[500]} />
                    <Text className="text-sm text-success-500 ml-1 font-medium">
                      In Stock ({product.stock} available)
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

          {/* Price */}
          <View className="mb-6">
            <Text className="text-4xl font-bold text-primary-500 mb-1">
              {formatPrice(price, country)}
            </Text>
            <Text className="text-sm text-neutral-500">
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
                  if (newQuantity >= 1 && newQuantity <= product.stock) {
                    setQuantity(newQuantity);
                  }
                }}
                min={1}
                max={product.stock}
              />
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
          { bottom: totalTabBarHeight }
        ]}
      >
        <View style={styles.stickyContent}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              {formatPrice(price * quantity, country)}
            </Text>
          </View>
          <View style={styles.buttonContainer}>
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  stickyContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalContainer: {
    flex: 1,
    marginRight: 16,
  },
  totalLabel: {
    fontSize: 12,
    color: '#9E9E9E',
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  buttonContainer: {
    flex: 1,
  },
});

export default ProductDetailsScreen;
