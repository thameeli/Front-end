import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Input } from './Input';

interface DeliveryAddressFormProps {
  street: string;
  city: string;
  postalCode: string;
  phone: string;
  instructions: string;
  onStreetChange: (text: string) => void;
  onCityChange: (text: string) => void;
  onPostalCodeChange: (text: string) => void;
  onPhoneChange: (text: string) => void;
  onInstructionsChange: (text: string) => void;
  errors?: Record<string, string>;
  style?: any;
}

const DeliveryAddressForm: React.FC<DeliveryAddressFormProps> = ({
  street,
  city,
  postalCode,
  phone,
  instructions,
  onStreetChange,
  onCityChange,
  onPostalCodeChange,
  onPhoneChange,
  onInstructionsChange,
  errors = {},
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>Delivery Address</Text>

      <Input
        label="Street Address"
        placeholder="Enter street address"
        value={street}
        onChangeText={onStreetChange}
        error={errors.street}
        autoCapitalize="words"
      />

      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <Input
            label="City"
            placeholder="Enter city"
            value={city}
            onChangeText={onCityChange}
            error={errors.city}
            autoCapitalize="words"
          />
        </View>
        <View style={styles.halfWidth}>
          <Input
            label="Postal Code"
            placeholder="Enter postal code"
            value={postalCode}
            onChangeText={onPostalCodeChange}
            error={errors.postalCode}
            keyboardType="number-pad"
          />
        </View>
      </View>

      <Input
        label="Phone Number"
        placeholder="Enter phone number"
        value={phone}
        onChangeText={onPhoneChange}
        error={errors.phone}
        keyboardType="phone-pad"
        autoComplete="tel"
      />

      <Input
        label="Delivery Instructions (Optional)"
        placeholder="Any special delivery instructions?"
        value={instructions}
        onChangeText={onInstructionsChange}
        error={errors.instructions}
        multiline
        numberOfLines={3}
        style={styles.textArea}
      />
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  textArea: {
    minHeight: 80,
  },
});

export default DeliveryAddressForm;

