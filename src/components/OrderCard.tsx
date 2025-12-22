import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { Order } from '../types';
import OrderStatusBadge from './OrderStatusBadge';
import { formatPrice } from '../utils/productUtils';
import { formatDate } from '../utils/regionalFormatting';
import { COUNTRIES } from '../constants';
import type { Country } from '../constants';

interface OrderCardProps {
  order: Order;
  country: Country;
  onPress: () => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, country, onPress }) => {
  const formatOrderNumber = (orderId: string) => {
    return `#${orderId.slice(0, 8).toUpperCase()}`;
  };

  const orderNumber = formatOrderNumber(order.id);
  const formattedDate = formatDate(order.created_at, country);
  const paymentMethod = order.payment_method === 'online' ? 'Online Payment' : 'Cash on Delivery';
  const accessibilityLabel = `Order ${orderNumber}, ${formattedDate}, ${order.status}, Total ${formatPrice(order.total_amount, country)}`;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Double tap to view order details"
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <View style={styles.header}>
        <View style={styles.orderInfo}>
          <Text 
            style={styles.orderNumber}
            accessibilityRole="header"
          >
            {orderNumber}
          </Text>
          <Text 
            style={styles.orderDate}
            accessibilityLabel={`Order date: ${formattedDate}`}
          >
            {formattedDate}
          </Text>
        </View>
        <OrderStatusBadge status={order.status} />
      </View>

      <View style={styles.details} accessibilityRole="text">
        <View style={styles.detailRow}>
          <Icon name="package-variant" size={16} color="#666" accessibilityElementsHidden />
          <Text 
            style={styles.detailText}
            accessibilityLabel={`Payment method: ${paymentMethod}`}
          >
            {paymentMethod}
          </Text>
        </View>
        {order.pickup_point_id && (
          <View style={styles.detailRow}>
            <Icon name="map-marker" size={16} color="#666" accessibilityElementsHidden />
            <Text 
              style={styles.detailText}
              accessibilityLabel="Pickup point delivery"
            >
              Pickup Point
            </Text>
          </View>
        )}
        {order.delivery_address && (
          <View style={styles.detailRow}>
            <Icon name="home" size={16} color="#666" accessibilityElementsHidden />
            <Text 
              style={styles.detailText}
              accessibilityLabel="Home delivery"
            >
              Home Delivery
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text 
          style={styles.totalLabel}
          accessibilityLabel="Total amount"
        >
          Total
        </Text>
        <Text 
          style={styles.totalAmount}
          accessibilityLabel={`Total: ${formatPrice(order.total_amount, country)}`}
        >
          {formatPrice(order.total_amount, country)}
        </Text>
      </View>

      <View style={styles.actionRow}>
        <Text style={styles.viewDetailsText}>View Details</Text>
        <Icon name="chevron-right" size={20} color="#007AFF" accessibilityElementsHidden />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(58, 181, 209, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    minHeight: 44, // WCAG minimum touch target
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
  },
  details: {
    marginBottom: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
});

// Custom comparison for memoization
const areEqual = (prevProps: OrderCardProps, nextProps: OrderCardProps) => {
  return (
    prevProps.order.id === nextProps.order.id &&
    prevProps.order.status === nextProps.order.status &&
    prevProps.order.total_amount === nextProps.order.total_amount &&
    prevProps.country === nextProps.country
  );
};

const MemoizedOrderCard = React.memo(OrderCard, areEqual);
MemoizedOrderCard.displayName = 'OrderCard';

export default MemoizedOrderCard;

