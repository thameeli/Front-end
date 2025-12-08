import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { OrderStatus } from '../types';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  style?: any;
}

const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status, style }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          color: '#FF9500',
          backgroundColor: '#FFF4E6',
          label: 'Pending',
          icon: 'clock-outline',
        };
      case 'confirmed':
        return {
          color: '#007AFF',
          backgroundColor: '#E6F2FF',
          label: 'Confirmed',
          icon: 'check-circle-outline',
        };
      case 'out_for_delivery':
        return {
          color: '#5856D6',
          backgroundColor: '#F0EFFF',
          label: 'Out for Delivery',
          icon: 'truck-delivery-outline',
        };
      case 'delivered':
        return {
          color: '#34C759',
          backgroundColor: '#E6F9ED',
          label: 'Delivered',
          icon: 'check-circle',
        };
      case 'cancelled':
        return {
          color: '#FF3B30',
          backgroundColor: '#FFE6E6',
          label: 'Cancelled',
          icon: 'close-circle',
        };
      default:
        return {
          color: '#666',
          backgroundColor: '#F5F5F5',
          label: status,
          icon: 'help-circle',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <View style={[styles.badge, { backgroundColor: config.backgroundColor }, style]}>
      <Text style={[styles.badgeText, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});

export default OrderStatusBadge;

