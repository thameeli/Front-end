import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useProduct } from '../../hooks/useProducts';
import { ImageGallery, Button, LoadingScreen, ErrorMessage, AppHeader } from '../../components';
import { productService } from '../../services/productService';
import { formatPrice, isInStock } from '../../utils/productUtils';
import { COUNTRIES } from '../../constants';
import type { Country } from '../../constants';

type ProductDetailsScreenRouteProp = RouteProp<RootStackParamList, 'ProductDetails'>;
type ProductDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ProductDetails'>;

const ProductDetailsScreen = () => {
  const route = useRoute<ProductDetailsScreenRouteProp>();
  const navigation = useNavigation<ProductDetailsScreenNavigationProp>();
  const { productId } = route.params;
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuthStore();
  const { addItem, selectedCountry } = useCartStore();
  const [quantity, setQuantity] = useState(1);

  const country = (user?.country_preference || selectedCountry || COUNTRIES.GERMANY) as Country;
  const { data: product, isLoading, error } = useProduct(productId);

  if (isLoading) {
    return <LoadingScreen message="Loading product details..." />;
  }

  if (error || !product) {
    return (
      <View style={styles.container}>
        <AppHeader title="Product Details" showBack />
        <ErrorMessage message="Failed to load product details. Please try again." />
      </View>
    );
  }

  const price = productService.getProductPrice(product, country);
  const inStock = isInStock(product);
  const images = product.image_url ? [product.image_url] : [];

  const handleAddToCart = () => {
    // Check if user is authenticated
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
    <View style={styles.container}>
      <AppHeader title={product.name} showBack />
      <ScrollView style={styles.content}>
        <ImageGallery images={images} />

        <View style={styles.details}>
          <View style={styles.header}>
            <Text style={styles.name}>{product.name}</Text>
            <Text style={styles.price}>{formatPrice(price, country)}</Text>
          </View>

          <View style={styles.categoryRow}>
            <Text style={styles.category}>
              {product.category === 'fresh' ? 'Fresh' : 'Frozen'}
            </Text>
            {inStock ? (
              <Text style={styles.stock}>In Stock ({product.stock} available)</Text>
            ) : (
              <Text style={styles.outOfStock}>Out of Stock</Text>
            )}
          </View>

          {product.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.descriptionLabel}>Description</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>
          )}

          {inStock && (
            <View style={styles.quantitySection}>
              <Text style={styles.quantityLabel}>Quantity</Text>
              <View style={styles.quantityControls}>
                <Button
                  title="-"
                  onPress={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  variant="outline"
                  style={styles.quantityButton}
                />
                <Text style={styles.quantityValue}>{quantity}</Text>
                <Button
                  title="+"
                  onPress={() => handleQuantityChange(1)}
                  disabled={quantity >= product.stock}
                  variant="outline"
                  style={styles.quantityButton}
                />
              </View>
            </View>
          )}

          <Button
            title={inStock ? 'Add to Cart' : 'Out of Stock'}
            onPress={handleAddToCart}
            disabled={!inStock}
            fullWidth
            style={styles.addButton}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  details: {
    padding: 16,
  },
  header: {
    marginBottom: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  category: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
  },
  stock: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '500',
  },
  outOfStock: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500',
  },
  descriptionSection: {
    marginBottom: 24,
  },
  descriptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  quantitySection: {
    marginBottom: 24,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quantityButton: {
    minWidth: 44,
    height: 44,
  },
  quantityValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    minWidth: 40,
    textAlign: 'center',
  },
  addButton: {
    marginTop: 8,
  },
});

export default ProductDetailsScreen;
