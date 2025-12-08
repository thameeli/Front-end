import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { PickupPoint } from '../types';
import { formatPrice } from '../utils/productUtils';
import { COUNTRIES } from '../constants';
import type { Country } from '../constants';

interface PickupPointSelectorProps {
  pickupPoints: PickupPoint[];
  selectedPickupPointId: string | null;
  onSelectPickupPoint: (pickupPointId: string | null) => void;
  isHomeDelivery: boolean;
  onToggleHomeDelivery: (isHomeDelivery: boolean) => void;
  country: Country;
  style?: any;
}

const PickupPointSelector: React.FC<PickupPointSelectorProps> = ({
  pickupPoints,
  selectedPickupPointId,
  onSelectPickupPoint,
  isHomeDelivery,
  onToggleHomeDelivery,
  country,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>Delivery Method</Text>

      {/* Home Delivery Option */}
      <TouchableOpacity
        style={[
          styles.option,
          isHomeDelivery && styles.optionSelected,
        ]}
        onPress={() => onToggleHomeDelivery(true)}
      >
        <View style={styles.optionContent}>
          <Icon
            name={isHomeDelivery ? 'radiobox-marked' : 'radiobox-blank'}
            size={24}
            color={isHomeDelivery ? '#007AFF' : '#666'}
          />
          <View style={styles.optionText}>
            <Text style={[styles.optionTitle, isHomeDelivery && styles.optionTitleSelected]}>
              Home Delivery
            </Text>
            <Text style={styles.optionSubtitle}>
              Delivery fee: {formatPrice(5.0, country)} (standard)
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Pickup Points */}
      <Text style={styles.sectionTitle}>Pickup Points</Text>
      {pickupPoints.length === 0 ? (
        <Text style={styles.emptyText}>No pickup points available</Text>
      ) : (
        pickupPoints.map((point) => (
          <TouchableOpacity
            key={point.id}
            style={[
              styles.option,
              !isHomeDelivery && selectedPickupPointId === point.id && styles.optionSelected,
            ]}
            onPress={() => {
              onToggleHomeDelivery(false);
              onSelectPickupPoint(point.id);
            }}
          >
            <View style={styles.optionContent}>
              <Icon
                name={!isHomeDelivery && selectedPickupPointId === point.id ? 'radiobox-marked' : 'radiobox-blank'}
                size={24}
                color={!isHomeDelivery && selectedPickupPointId === point.id ? '#007AFF' : '#666'}
              />
              <View style={styles.optionText}>
                <Text style={[
                  styles.optionTitle,
                  !isHomeDelivery && selectedPickupPointId === point.id && styles.optionTitleSelected,
                ]}>
                  {point.name}
                </Text>
                <Text style={styles.optionSubtitle}>{point.address}</Text>
                <Text style={styles.optionFee}>
                  Delivery fee: {formatPrice(point.delivery_fee, country)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 8,
    marginBottom: 12,
  },
  option: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  optionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f7ff',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  optionText: {
    flex: 1,
    marginLeft: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  optionTitleSelected: {
    color: '#007AFF',
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  optionFee: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
});

export default PickupPointSelector;

