import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { Order } from '../types';
import { OrderStatusBadge } from './OrderStatusBadge';
import { formatPrice } from '../utils/productUtils';
import { COUNTRIES } from '../constants';
import type { Country } from '../constants';

interface OrderCardProps {
  order: Order;
  country: Country;
  onPress: () => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, country, onPress }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatOrderNumber = (orderId: string) => {
    return `#${orderId.slice(0, 8).toUpperCase()}`;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>{formatOrderNumber(order.id)}</Text>
          <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
        </View>
        <OrderStatusBadge status={order.status} />
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Icon name="package-variant" size={16} color="#666" />
          <Text style={styles.detailText}>
            {order.payment_method === 'online' ? 'Online Payment' : 'Cash on Delivery'}
          </Text>
        </View>
        {order.pickup_point_id && (
          <View style={styles.detailRow}>
            <Icon name="map-marker" size={16} color="#666" />
            <Text style={styles.detailText}>Pickup Point</Text>
          </View>
        )}
        {order.delivery_address && (
          <View style={styles.detailRow}>
            <Icon name="home" size={16} color="#666" />
            <Text style={styles.detailText}>Home Delivery</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalAmount}>
          {formatPrice(order.total_amount, country)}
        </Text>
      </View>

      <View style={styles.actionRow}>
        <Text style={styles.viewDetailsText}>View Details</Text>
        <Icon name="chevron-right" size={20} color="#007AFF" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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

export default OrderCard;

