import React, { useRef } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import Input from './Input';
import AddressAutocomplete from './AddressAutocomplete';
import { formatPhoneNumber, validatePostalCode } from '../utils/regionalFormatting';
import { COUNTRIES } from '../constants';
import type { Country } from '../constants';

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
  country?: Country;
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
  country = COUNTRIES.GERMANY,
}) => {
  // Refs for keyboard navigation
  const cityRef = useRef<TextInput>(null);
  const postalCodeRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const instructionsRef = useRef<TextInput>(null);
  // Format phone number as user types
  const handlePhoneChange = (text: string) => {
    // Remove formatting to get raw digits
    const digits = text.replace(/\D/g, '');
    // Format based on country
    const formatted = formatPhoneNumber(digits, country);
    onPhoneChange(formatted);
  };

  // Validate postal code as user types
  const handlePostalCodeChange = (text: string) => {
    // Only allow digits
    const digits = text.replace(/\D/g, '');
    onPostalCodeChange(digits);
    // Validation will be handled by parent component via errors prop
  };

  const postalCodePlaceholder = country === COUNTRIES.GERMANY 
    ? '12345' 
    : '1234';
  const postalCodeMaxLength = country === COUNTRIES.GERMANY ? 5 : 4;

  return (
    <View 
      style={[styles.container, style]}
      accessibilityLabel="Delivery address form"
    >
      <Text 
        style={styles.title}
        accessibilityRole="header"
      >
        Delivery Address
      </Text>

      <View style={{ marginBottom: 8 }}>
        <Text style={[styles.label, { color: '#666', fontSize: 14, marginBottom: 8 }]}>
          Street Address
        </Text>
        <AddressAutocomplete
          value={street}
          onChangeText={onStreetChange}
          onSelectSuggestion={(suggestion) => {
            onStreetChange(suggestion.address);
            onCityChange(suggestion.city);
            onPostalCodeChange(suggestion.postalCode);
          }}
          placeholder="Enter street address"
        />
      </View>
      {errors.street && (
        <Text style={{ color: '#F44336', fontSize: 12, marginTop: -8, marginBottom: 8 }}>
          {errors.street}
        </Text>
      )}

      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <Input
            ref={cityRef}
            label="City"
            placeholder="Enter city"
            value={city}
            onChangeText={onCityChange}
            error={errors.city}
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => postalCodeRef.current?.focus()}
            accessibilityLabel="City input"
            accessibilityHint="Enter your city name"
          />
        </View>
        <View style={styles.halfWidth}>
          <Input
            ref={postalCodeRef}
            label="Postal Code"
            placeholder={postalCodePlaceholder}
            value={postalCode}
            onChangeText={handlePostalCodeChange}
            error={errors.postalCode}
            keyboardType="number-pad"
            maxLength={postalCodeMaxLength}
            returnKeyType="next"
            onSubmitEditing={() => phoneRef.current?.focus()}
            accessibilityLabel={`Postal code input for ${country === COUNTRIES.GERMANY ? 'Germany' : 'Denmark'}`}
            accessibilityHint={`Enter ${postalCodeMaxLength} digit postal code`}
          />
        </View>
      </View>

      <Input
        ref={phoneRef}
        label="Phone Number"
        placeholder={country === COUNTRIES.GERMANY ? "+49 123 4567890" : "+45 12 34 56 78"}
        value={phone}
        onChangeText={handlePhoneChange}
        error={errors.phone}
        keyboardType="phone-pad"
        autoComplete="tel"
        returnKeyType="next"
        onSubmitEditing={() => instructionsRef.current?.focus()}
        accessibilityLabel={`Phone number input for ${country === COUNTRIES.GERMANY ? 'Germany' : 'Denmark'}`}
        accessibilityHint={`Enter phone number in ${country === COUNTRIES.GERMANY ? 'German' : 'Danish'} format`}
      />

      <Input
        ref={instructionsRef}
        label="Delivery Instructions (Optional)"
        placeholder="Any special delivery instructions?"
        value={instructions}
        onChangeText={onInstructionsChange}
        error={errors.instructions}
        multiline
        numberOfLines={3}
        returnKeyType="done"
        blurOnSubmit={true}
        style={styles.textArea}
        accessibilityLabel="Delivery instructions input"
        accessibilityHint="Enter any special delivery instructions (optional)"
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

