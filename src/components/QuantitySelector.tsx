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
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[styles.button, !canDecrement && styles.buttonDisabled]}
        onPress={handleDecrement}
        disabled={!canDecrement}
      >
        <Icon
          name="minus"
          size={20}
          color={canDecrement ? '#007AFF' : '#ccc'}
        />
      </TouchableOpacity>

      <TextInput
        style={[styles.input, disabled && styles.inputDisabled]}
        value={value.toString()}
        onChangeText={handleTextChange}
        keyboardType="number-pad"
        editable={!disabled}
        selectTextOnFocus
      />

      <TouchableOpacity
        style={[styles.button, !canIncrement && styles.buttonDisabled]}
        onPress={handleIncrement}
        disabled={!canIncrement}
      >
        <Icon
          name="plus"
          size={20}
          color={canIncrement ? '#007AFF' : '#ccc'}
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
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  buttonDisabled: {
    backgroundColor: '#f9f9f9',
  },
  input: {
    width: 60,
    height: 40,
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

