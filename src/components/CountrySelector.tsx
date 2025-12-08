import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COUNTRIES } from '../constants';
import type { Country } from '../constants';

interface CountrySelectorProps {
  selectedCountry: Country;
  onSelectCountry: (country: Country) => void;
  style?: any;
}

const CountrySelector: React.FC<CountrySelectorProps> = ({
  selectedCountry,
  onSelectCountry,
  style,
}) => {
  const { t } = useTranslation();

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{t('profile.countryPreference')}</Text>
      <View style={styles.options}>
        <TouchableOpacity
          style={[
            styles.option,
            selectedCountry === COUNTRIES.GERMANY && styles.optionActive,
          ]}
          onPress={() => onSelectCountry(COUNTRIES.GERMANY)}
        >
          <Icon
            name="flag"
            size={24}
            color={selectedCountry === COUNTRIES.GERMANY ? '#007AFF' : '#666'}
          />
          <Text
            style={[
              styles.optionText,
              selectedCountry === COUNTRIES.GERMANY && styles.optionTextActive,
            ]}
          >
            {t('profile.germany')}
          </Text>
          {selectedCountry === COUNTRIES.GERMANY && (
            <Icon name="check-circle" size={20} color="#007AFF" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.option,
            selectedCountry === COUNTRIES.NORWAY && styles.optionActive,
          ]}
          onPress={() => onSelectCountry(COUNTRIES.NORWAY)}
        >
          <Icon
            name="flag"
            size={24}
            color={selectedCountry === COUNTRIES.NORWAY ? '#007AFF' : '#666'}
          />
          <Text
            style={[
              styles.optionText,
              selectedCountry === COUNTRIES.NORWAY && styles.optionTextActive,
            ]}
          >
            {t('profile.norway')}
          </Text>
          {selectedCountry === COUNTRIES.NORWAY && (
            <Icon name="check-circle" size={20} color="#007AFF" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  options: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    gap: 12,
  },
  optionActive: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f7ff',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#666',
  },
  optionTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default CountrySelector;

