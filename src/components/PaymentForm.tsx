import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Input } from './Input';

interface PaymentFormProps {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
  onCardNumberChange: (text: string) => void;
  onExpiryDateChange: (text: string) => void;
  onCvvChange: (text: string) => void;
  onCardholderNameChange: (text: string) => void;
  errors?: Record<string, string>;
  style?: any;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  cardNumber,
  expiryDate,
  cvv,
  cardholderName,
  onCardNumberChange,
  onExpiryDateChange,
  onCvvChange,
  onCardholderNameChange,
  errors = {},
  style,
}) => {
  // Format card number (add spaces every 4 digits)
  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.slice(0, 19); // Max 16 digits + 3 spaces
  };

  // Format expiry date (MM/YY)
  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  const handleCardNumberChange = (text: string) => {
    const formatted = formatCardNumber(text);
    onCardNumberChange(formatted);
  };

  const handleExpiryDateChange = (text: string) => {
    const formatted = formatExpiryDate(text);
    onExpiryDateChange(formatted);
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>Card Details</Text>
      <Text style={styles.note}>
        Note: This is a placeholder form. Actual payment processing will be handled by Stripe integration.
      </Text>

      <Input
        label="Cardholder Name"
        placeholder="Enter cardholder name"
        value={cardholderName}
        onChangeText={onCardholderNameChange}
        error={errors.cardholderName}
        autoCapitalize="words"
      />

      <Input
        label="Card Number"
        placeholder="1234 5678 9012 3456"
        value={cardNumber}
        onChangeText={handleCardNumberChange}
        error={errors.cardNumber}
        keyboardType="number-pad"
        maxLength={19}
      />

      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <Input
            label="Expiry Date"
            placeholder="MM/YY"
            value={expiryDate}
            onChangeText={handleExpiryDateChange}
            error={errors.expiryDate}
            keyboardType="number-pad"
            maxLength={5}
          />
        </View>
        <View style={styles.halfWidth}>
          <Input
            label="CVV"
            placeholder="123"
            value={cvv}
            onChangeText={onCvvChange}
            error={errors.cvv}
            keyboardType="number-pad"
            maxLength={4}
            secureTextEntry
          />
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
    marginBottom: 8,
  },
  note: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
});

export default PaymentForm;

