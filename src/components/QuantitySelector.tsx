import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

interface QuantitySelectorProps {
  value: number;
  onChange: (quantity: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  style?: any;
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  value,
  onChange,
  min = 1,
  max,
  disabled = false,
  style,
}) => {
  const handleDecrement = () => {
    if (!disabled && value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (!disabled && (!max || value < max)) {
      onChange(value + 1);
    }
  };

  const handleTextChange = (text: string) => {
    const numValue = parseInt(text, 10);
    if (!isNaN(numValue)) {
      let newValue = numValue;
      if (newValue < min) newValue = min;
      if (max && newValue > max) newValue = max;
      onChange(newValue);
    } else if (text === '') {
      onChange(min);
    }
  };

  const canDecrement = !disabled && value > min;
  const canIncrement = !disabled && (!max || value < max);

  return (
    <View 
      style={[styles.container, style]}
      accessibilityRole="adjustable"
      accessibilityLabel={`Quantity selector, current value: ${value}`}
      accessibilityValue={{ text: value.toString() }}
    >
      <TouchableOpacity
        style={[styles.button, !canDecrement && styles.buttonDisabled, { minWidth: 44, minHeight: 44 }]} // WCAG minimum touch target
        onPress={handleDecrement}
        disabled={!canDecrement}
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
        accessibilityHint="Double tap to decrease quantity by one"
        accessibilityState={{ disabled: !canDecrement }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Icon
          name="minus"
          size={20}
          color={canDecrement ? '#007AFF' : '#ccc'}
          accessibilityElementsHidden
        />
      </TouchableOpacity>

      <TextInput
        style={[styles.input, disabled && styles.inputDisabled, { minHeight: 44 }]}
        value={value.toString()}
        onChangeText={handleTextChange}
        keyboardType="number-pad"
        editable={!disabled}
        selectTextOnFocus
        accessibilityRole="adjustable"
        accessibilityLabel="Quantity input"
        accessibilityHint="Enter quantity or use buttons to adjust"
        accessibilityValue={{ text: value.toString() }}
      />

      <TouchableOpacity
        style={[styles.button, !canIncrement && styles.buttonDisabled, { minWidth: 44, minHeight: 44 }]} // WCAG minimum touch target
        onPress={handleIncrement}
        disabled={!canIncrement}
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
        accessibilityHint="Double tap to increase quantity by one"
        accessibilityState={{ disabled: !canIncrement }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Icon
          name="plus"
          size={20}
          color={canIncrement ? '#007AFF' : '#ccc'}
          accessibilityElementsHidden
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  button: {
    minWidth: 44, // WCAG minimum touch target
    minHeight: 44,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  buttonDisabled: {
    backgroundColor: '#f9f9f9',
  },
  input: {
    width: 60,
    minHeight: 44, // WCAG minimum touch target
    height: 44,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#ddd',
  },
  inputDisabled: {
    backgroundColor: '#f9f9f9',
    color: '#999',
  },
});

// Set displayName for better debugging and NativeWind compatibility
QuantitySelector.displayName = 'QuantitySelector';

export default QuantitySelector;

