import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { CartItem as CartItemType } from '../types';
import QuantitySelector from './QuantitySelector';
import { formatPrice } from '../utils/productUtils';
import { COUNTRIES } from '../constants';
import type { Country } from '../constants';

interface CartItemProps {
  item: CartItemType;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
  country: Country;
}

const CartItem: React.FC<CartItemProps> = ({
  item,
  onQuantityChange,
  onRemove,
  country,
}) => {
  const price = country === COUNTRIES.GERMANY
    ? item.product.price_germany
    : item.product.price_denmark;
  const subtotal = price * item.quantity;
  const stock = country === COUNTRIES.GERMANY
    ? item.product.stock_germany
    : item.product.stock_denmark;
  const maxQuantity = stock;

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        {item.product.image_url ? (
          <Image
            source={{ uri: item.product.image_url }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Icon name="image-off" size={32} color="#ccc" />
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={2}>
            {item.product.name}
          </Text>
          <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
            <Icon name="close" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>

        <Text style={styles.category}>
          {item.product.category === 'fresh' ? 'Fresh' : 'Frozen'}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(price, country)}</Text>
          {stock > 0 && (
            <Text style={styles.stock}>
              {stock} in stock
            </Text>
          )}
        </View>

        <View style={styles.quantityRow}>
          <QuantitySelector
            value={item.quantity}
            onChange={onQuantityChange}
            min={1}
            max={maxQuantity}
            disabled={stock === 0}
          />
          <Text style={styles.subtotal}>
            {formatPrice(subtotal, country)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(58, 181, 209, 0.15)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
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
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginRight: 8,
  },
  removeButton: {
    padding: 4,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  stock: {
    fontSize: 12,
    color: '#666',
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
});

// Custom comparison for memoization
const areEqual = (prevProps: CartItemProps, nextProps: CartItemProps) => {
  return (
    prevProps.item.product.id === nextProps.item.product.id &&
    prevProps.item.quantity === nextProps.item.quantity &&
    prevProps.country === nextProps.country
  );
};

// Set displayName for better debugging and NativeWind compatibility
const MemoizedCartItem = React.memo(CartItem, areEqual);
MemoizedCartItem.displayName = 'CartItem';

export default MemoizedCartItem;

