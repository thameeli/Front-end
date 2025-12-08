import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { PaymentMethod } from '../types';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod | null;
  onSelectMethod: (method: PaymentMethod) => void;
  style?: any;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onSelectMethod,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>Payment Method</Text>

      <TouchableOpacity
        style={[
          styles.option,
          selectedMethod === 'online' && styles.optionSelected,
        ]}
        onPress={() => onSelectMethod('online')}
      >
        <View style={styles.optionContent}>
          <Icon
            name={selectedMethod === 'online' ? 'radiobox-marked' : 'radiobox-blank'}
            size={24}
            color={selectedMethod === 'online' ? '#007AFF' : '#666'}
          />
          <View style={styles.optionText}>
            <Text style={[
              styles.optionTitle,
              selectedMethod === 'online' && styles.optionTitleSelected,
            ]}>
              Online Payment
            </Text>
            <Text style={styles.optionSubtitle}>
              Pay securely with card
            </Text>
          </View>
          <Icon name="credit-card" size={24} color={selectedMethod === 'online' ? '#007AFF' : '#666'} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.option,
          selectedMethod === 'cod' && styles.optionSelected,
        ]}
        onPress={() => onSelectMethod('cod')}
      >
        <View style={styles.optionContent}>
          <Icon
            name={selectedMethod === 'cod' ? 'radiobox-marked' : 'radiobox-blank'}
            size={24}
            color={selectedMethod === 'cod' ? '#007AFF' : '#666'}
          />
          <View style={styles.optionText}>
            <Text style={[
              styles.optionTitle,
              selectedMethod === 'cod' && styles.optionTitleSelected,
            ]}>
              Cash on Delivery
            </Text>
            <Text style={styles.optionSubtitle}>
              Pay when you receive your order
            </Text>
          </View>
          <Icon name="cash" size={24} color={selectedMethod === 'cod' ? '#007AFF' : '#666'} />
        </View>
      </TouchableOpacity>
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
    alignItems: 'center',
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
  },
});

export default PaymentMethodSelector;

