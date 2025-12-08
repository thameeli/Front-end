import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { OrderStatus } from '../types';
import { OrderStatusBadge } from './OrderStatusBadge';

interface OrderStatusUpdateProps {
  currentStatus: OrderStatus;
  onStatusChange: (newStatus: OrderStatus) => void;
  disabled?: boolean;
  style?: any;
}

const OrderStatusUpdate: React.FC<OrderStatusUpdateProps> = ({
  currentStatus,
  onStatusChange,
  disabled = false,
  style,
}) => {
  const getNextStatuses = (): OrderStatus[] => {
    switch (currentStatus) {
      case 'pending':
        return ['confirmed', 'cancelled'];
      case 'confirmed':
        return ['out_for_delivery', 'cancelled'];
      case 'out_for_delivery':
        return ['delivered'];
      case 'delivered':
        return [];
      case 'cancelled':
        return [];
      default:
        return [];
    }
  };

  const getStatusLabel = (status: OrderStatus): string => {
    switch (status) {
      case 'pending':
        return 'Confirm Order';
      case 'confirmed':
        return 'Mark as Out for Delivery';
      case 'out_for_delivery':
        return 'Mark as Delivered';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: OrderStatus): string => {
    switch (status) {
      case 'confirmed':
        return 'check-circle';
      case 'out_for_delivery':
        return 'truck-delivery';
      case 'delivered':
        return 'check-circle';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'arrow-right';
    }
  };

  const handleStatusChange = (newStatus: OrderStatus) => {
    Alert.alert(
      'Update Order Status',
      `Are you sure you want to change the order status to "${getStatusLabel(newStatus)}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: () => onStatusChange(newStatus),
        },
      ]
    );
  };

  const nextStatuses = getNextStatuses();

  if (nextStatuses.length === 0) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.currentStatusLabel}>Current Status</Text>
        <OrderStatusBadge status={currentStatus} />
        <Text style={styles.finalStatusText}>
          This order has reached its final status
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.currentStatusLabel}>Current Status</Text>
      <OrderStatusBadge status={currentStatus} style={styles.statusBadge} />

      <Text style={styles.updateLabel}>Update Status</Text>
      <View style={styles.buttonsContainer}>
        {nextStatuses.map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.statusButton,
              status === 'cancelled' && styles.cancelButton,
            ]}
            onPress={() => handleStatusChange(status)}
            disabled={disabled}
          >
            <Icon
              name={getStatusIcon(status)}
              size={20}
              color={status === 'cancelled' ? '#FF3B30' : '#007AFF'}
            />
            <Text
              style={[
                styles.statusButtonText,
                status === 'cancelled' && styles.cancelButtonText,
              ]}
            >
              {getStatusLabel(status)}
            </Text>
          </TouchableOpacity>
        ))}
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
  currentStatusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  statusBadge: {
    marginBottom: 16,
  },
  finalStatusText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 8,
  },
  updateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  buttonsContainer: {
    gap: 8,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    backgroundColor: '#f0f7ff',
    gap: 8,
  },
  cancelButton: {
    borderColor: '#FF3B30',
    backgroundColor: '#ffe6e6',
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  cancelButtonText: {
    color: '#FF3B30',
  },
});

export default OrderStatusUpdate;

