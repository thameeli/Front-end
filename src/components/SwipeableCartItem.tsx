/**
 * Swipeable Cart Item Component
 * Enhanced cart item with swipe-to-delete functionality
 */

import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { CartItem as CartItemType } from '../types';
import QuantitySelector from './QuantitySelector';
import { formatPrice } from '../utils/productUtils';
import { COUNTRIES } from '../constants';
import type { Country } from '../constants';
import { useTheme } from '../hooks/useTheme';
import { useSavedForLaterStore } from '../store/savedForLaterStore';
import ProgressiveImage from './ProgressiveImage';

interface SwipeableCartItemProps {
  item: CartItemType;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
  onSaveForLater?: () => void;
  country: Country;
}

const SwipeableCartItem: React.FC<SwipeableCartItemProps> = ({
  item,
  onQuantityChange,
  onRemove,
  onSaveForLater,
  country,
}) => {
  const { colors: themeColors } = useTheme();
  const { addItem: saveForLater, isSaved } = useSavedForLaterStore();
  const swipeableRef = useRef<Swipeable>(null);
  
  const handleSaveForLater = () => {
    if (onSaveForLater) {
      onSaveForLater();
    } else {
      saveForLater(item.product, country);
      onRemove(); // Remove from cart after saving
    }
    swipeableRef.current?.close();
  };
  
  const price = country === COUNTRIES.GERMANY
    ? item.product.price_germany
    : item.product.price_denmark;
  const subtotal = price * item.quantity;
  const stock = country === COUNTRIES.GERMANY
    ? item.product.stock_germany
    : item.product.stock_denmark;
  const maxQuantity = stock;

  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.rightActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: themeColors.info[500] }]}
          onPress={handleSaveForLater}
          accessibilityLabel="Save for later"
          accessibilityRole="button"
        >
          <Animated.View style={{ transform: [{ scale }] }}>
            <Icon 
              name={isSaved(item.product.id) ? "bookmark" : "bookmark-outline"} 
              size={24} 
              color="#FFFFFF" 
            />
          </Animated.View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: themeColors.error[500] }]}
          onPress={() => {
            swipeableRef.current?.close();
            onRemove();
          }}
          accessibilityLabel="Remove item"
          accessibilityRole="button"
        >
          <Animated.View style={{ transform: [{ scale }] }}>
            <Icon name="delete-outline" size={24} color="#FFFFFF" />
          </Animated.View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      rightThreshold={40}
      overshootRight={false}
    >
      <View style={[styles.container, { backgroundColor: themeColors.background.card }]}>
        <View style={styles.imageContainer}>
          {item.product.image_url ? (
            <ProgressiveImage
              source={{ uri: item.product.image_url }}
              style={styles.image}
              placeholder="skeleton"
              lazy={true}
            />
          ) : (
            <View style={[styles.placeholderImage, { backgroundColor: themeColors.neutral[100] }]}>
              <Icon name="image-off" size={32} color={themeColors.neutral[400]} />
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.name, { color: themeColors.text.primary }]} numberOfLines={2}>
              {item.product.name}
            </Text>
            <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
              <Icon name="close" size={20} color={themeColors.error[500]} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.category, { color: themeColors.text.secondary }]}>
            {item.product.category === 'fresh' ? 'Fresh' : 'Frozen'}
          </Text>

          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: themeColors.primary[500] }]}>
              {formatPrice(price, country)}
            </Text>
            {stock > 0 && (
              <Text style={[styles.stock, { color: themeColors.text.secondary }]}>
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
            <Text style={[styles.subtotal, { color: themeColors.text.primary }]}>
              {formatPrice(subtotal, country)}
            </Text>
          </View>
        </View>
      </View>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
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
    marginRight: 8,
  },
  removeButton: {
    padding: 4,
  },
  category: {
    fontSize: 12,
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
  },
  stock: {
    fontSize: 12,
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtotal: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  actionButton: {
    width: 80,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderRadius: 12,
  },
});

export default SwipeableCartItem;

