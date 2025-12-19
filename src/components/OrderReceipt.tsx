import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { Order, OrderItem, Product } from '../types';
import { formatPrice } from '../utils/productUtils';
import { formatDateTime } from '../utils/regionalFormatting';
import { COUNTRIES } from '../constants';
import type { Country } from '../constants';

interface OrderReceiptProps {
  order: Order;
  orderItems: (OrderItem & { product?: Product })[];
  country: Country;
  style?: any;
}

const OrderReceipt: React.FC<OrderReceiptProps> = ({
  order,
  orderItems,
  country,
  style,
}) => {

  return (
    <ScrollView style={[styles.container, style]}>
      <View style={styles.header}>
        <Icon name="check-circle" size={64} color="#34C759" />
        <Text style={styles.successTitle}>Order Confirmed!</Text>
        <Text style={styles.orderNumber}>Order #{order.id.slice(0, 8).toUpperCase()}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Order Date</Text>
          <Text 
            style={styles.detailValue}
            accessibilityLabel={`Order date: ${formatDateTime(order.created_at, country)}`}
          >
            {formatDateTime(order.created_at, country)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Status</Text>
          <Text style={[styles.detailValue, styles.status]}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Payment Method</Text>
          <Text style={styles.detailValue}>
            {order.payment_method === 'online' ? 'Online Payment' : 'Cash on Delivery'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Payment Status</Text>
          <Text style={[styles.detailValue, styles.paymentStatus]}>
            {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Items</Text>
        {orderItems.map((item) => (
          <View key={item.id} style={styles.item}>
            <View style={styles.itemImage}>
              {item.product?.image_url ? (
                <Image
                  source={{ uri: item.product.image_url }}
                  style={styles.image}
                  contentFit="cover"
                  accessibilityLabel={item.product.name || 'Product image'}
                />
              ) : (
                <View style={styles.placeholderImage} accessibilityElementsHidden>
                  <Icon name="image-off" size={24} color="#ccc" />
                </View>
              )}
            </View>
            <View style={styles.itemContent}>
              <Text 
                style={styles.itemName}
                accessibilityRole="header"
              >
                {item.product?.name || 'Product'}
              </Text>
              <Text 
                style={styles.itemQuantity}
                accessibilityLabel={`Quantity: ${item.quantity}`}
              >
                Quantity: {item.quantity}
              </Text>
            </View>
            <Text 
              style={styles.itemPrice}
              accessibilityLabel={`Price: ${formatPrice(item.subtotal, country)}`}
            >
              {formatPrice(item.subtotal, country)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>
            {formatPrice(
              orderItems.reduce((sum, item) => sum + item.subtotal, 0),
              country
            )}
          </Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>
            {formatPrice(order.total_amount, country)}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  status: {
    textTransform: 'capitalize',
  },
  paymentStatus: {
    textTransform: 'capitalize',
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
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
});

export default OrderReceipt;

