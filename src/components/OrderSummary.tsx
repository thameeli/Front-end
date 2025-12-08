import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { CartItem } from '../types';
import { formatPrice } from '../utils/productUtils';
import { COUNTRIES } from '../constants';
import type { Country } from '../constants';

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  country: Country;
  style?: any;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  items,
  subtotal,
  deliveryFee,
  total,
  country,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>Order Summary</Text>
      
      <ScrollView style={styles.itemsList} nestedScrollEnabled>
        {items.map((item) => {
          const price = country === COUNTRIES.GERMANY
            ? item.product.price_germany
            : item.product.price_norway;
          const itemSubtotal = price * item.quantity;

          return (
            <View key={item.product.id} style={styles.item}>
              <View style={styles.itemImage}>
                {item.product.image_url ? (
                  <Image
                    source={{ uri: item.product.image_url }}
                    style={styles.image}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.placeholderImage}>
                    <Icon name="image-off" size={24} color="#ccc" />
                  </View>
                )}
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.product.name}
                </Text>
                <Text style={styles.itemQuantity}>
                  {item.quantity} × {formatPrice(price, country)}
                </Text>
              </View>
              <Text style={styles.itemSubtotal}>
                {formatPrice(itemSubtotal, country)}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.totals}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>{formatPrice(subtotal, country)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Delivery Fee</Text>
          <Text style={styles.totalValue}>{formatPrice(deliveryFee, country)}</Text>
        </View>
        <View style={[styles.totalRow, styles.finalTotal]}>
          <Text style={styles.finalTotalLabel}>Total</Text>
          <Text style={styles.finalTotalValue}>{formatPrice(total, country)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  itemsList: {
    maxHeight: 200,
    marginBottom: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemImage: {
    width: 50,
    height: 50,
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
  itemContent: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 12,
    color: '#666',
  },
  itemSubtotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  totals: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  finalTotal: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  finalTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  finalTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
});

export default OrderSummary;

