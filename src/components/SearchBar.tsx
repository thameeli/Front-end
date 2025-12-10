/**
 * Enhanced SearchBar with Camera Icon and Modern Design
 * Inspired by modern e-commerce apps
 * Safe for Expo Go - uses StyleSheet instead of className
 */

import React, { useState } from 'react';
import { TextInput, TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors } from '../theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  style?: any;
  onFocus?: () => void;
  onBlur?: () => void;
  onCameraPress?: () => void;
  onSearchPress?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search products...',
  onClear,
  style,
  onFocus,
  onBlur,
  onCameraPress,
  onSearchPress,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value.length > 0;

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.searchContainer, isFocused && styles.searchContainerFocused]}>
        <Icon
          name="magnify"
          size={20}
          color={isFocused ? colors.primary[500] : colors.neutral[500]}
          style={styles.searchIcon}
        />

        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.neutral[400]}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {hasValue && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Icon name="close-circle" size={20} color={colors.neutral[500]} />
          </TouchableOpacity>
        )}
      </View>

      {onCameraPress && (
        <TouchableOpacity
          onPress={onCameraPress}
          style={[styles.cameraButton, styles.buttonSpacing]}
          activeOpacity={0.7}
        >
          <Icon name="camera" size={22} color={colors.primary[500]} />
        </TouchableOpacity>
      )}

      {onSearchPress && (
        <TouchableOpacity
          onPress={onSearchPress}
          style={[styles.searchButton, styles.buttonSpacing]}
          activeOpacity={0.8}
        >
          <Text style={styles.searchButtonText} allowFontScaling={false}>
            Search
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  searchContainerFocused: {
    borderColor: colors.primary[500],
    borderWidth: 2,
    backgroundColor: '#fff',
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.neutral[900],
    padding: 0,
    margin: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 4,
  },
  cameraButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  searchButton: {
    paddingHorizontal: 20,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.warning[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonSpacing: {
    marginLeft: 8,
  },
});

// Set displayName for better debugging
SearchBar.displayName = 'SearchBar';

export default SearchBar;
