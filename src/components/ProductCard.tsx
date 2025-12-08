import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { Product } from '../types';
import Button from './Button';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { productService } from '../services';
import { COUNTRIES } from '../constants';
import type { Country } from '../constants';

interface ProductCardProps {
  product: Product;
  country?: Country;
  onPress?: () => void;
  onAddToCart?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, country, onPress, onAddToCart }) => {
  const { addItem } = useCartStore();
  const { user } = useAuthStore();
  const selectedCountry = country || (user?.country_preference || COUNTRIES.GERMANY) as Country;
  const price = productService.getProductPrice(product, selectedCountry);
  const isInStock = product.stock > 0;

  const handleAddToCart = () => {
    if (isInStock) {
      // Use provided onAddToCart callback if available (for cart protection)
      if (onAddToCart) {
        onAddToCart();
      } else {
        // Fallback to direct add (for authenticated users)
        addItem(product, 1, selectedCountry);
      }
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        {product.image_url ? (
          <Image
            source={{ uri: product.image_url }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Icon name="image-off" size={40} color="#ccc" />
          </View>
        )}
        {!isInStock && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.category}>
          {product.category === 'fresh' ? 'Fresh' : 'Frozen'}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>
            {selectedCountry === COUNTRIES.GERMANY ? '€' : 'NOK'} {price.toFixed(2)}
          </Text>
          {product.stock > 0 && (
            <Text style={styles.stock}>
              {product.stock} in stock
            </Text>
          )}
        </View>
        <Button
          title={isInStock ? 'Add to Cart' : 'Out of Stock'}
          onPress={handleAddToCart}
          disabled={!isInStock}
          variant={isInStock ? 'primary' : 'outline'}
          style={styles.addButton}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    padding: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  stock: {
    fontSize: 12,
    color: '#666',
  },
  addButton: {
    marginTop: 0,
  },
});

export default ProductCard;

