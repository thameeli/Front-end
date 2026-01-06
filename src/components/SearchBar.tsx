/**
 * Enhanced SearchBar with Camera Icon and Modern Design
 * Inspired by modern e-commerce apps
 * Safe for Expo Go - uses StyleSheet instead of className
 */

import React, { useState, useEffect } from 'react';
import { TextInput, TouchableOpacity, View, Text, StyleSheet, FlatList, Modal, Platform } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors } from '../theme';
import { getSearchHistory, getSearchSuggestions, addToSearchHistory, removeFromSearchHistory, clearSearchHistory } from '../utils/searchHistory';

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
  showSuggestions?: boolean; // Show search suggestions
  onSuggestionPress?: (query: string) => void; // Called when suggestion is selected
  category?: string; // Category for search history
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
  showSuggestions = true,
  onSuggestionPress,
  category,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
  const hasValue = value.length > 0;

  const handleFocus = () => {
    setIsFocused(true);
    setShowSuggestionsModal(true);
    onFocus?.();
  };

  const handleBlur = () => {
    // Delay to allow suggestion press
    setTimeout(() => {
      setIsFocused(false);
      setShowSuggestionsModal(false);
      onBlur?.();
    }, 200);
  };

  // Load recent searches
  useEffect(() => {
    if (showSuggestions && isFocused) {
      loadRecentSearches();
    }
  }, [isFocused, showSuggestions]);

  // Load suggestions as user types
  useEffect(() => {
    if (showSuggestions && value.length > 0 && isFocused) {
      loadSuggestions(value);
    } else {
      setSuggestions([]);
    }
  }, [value, isFocused, showSuggestions]);

  const loadRecentSearches = async () => {
    try {
      const history = await getSearchHistory();
      setRecentSearches(history.slice(0, 5).map(item => item.query));
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  const loadSuggestions = async (query: string) => {
    try {
      const suggs = await getSearchSuggestions(query, 5);
      setSuggestions(suggs);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const handleClear = () => {
    onChangeText('');
    setSuggestions([]);
    onClear?.();
  };

  const handleSuggestionSelect = async (query: string) => {
    onChangeText(query);
    setShowSuggestionsModal(false);
    await addToSearchHistory(query, category);
    onSuggestionPress?.(query);
  };

  const handleSearch = async () => {
    if (value.trim()) {
      await addToSearchHistory(value.trim(), category);
      setShowSuggestionsModal(false);
      onSearchPress?.();
    }
  };

  const handleRemoveSuggestion = async (query: string) => {
    await removeFromSearchHistory(query);
    loadRecentSearches();
  };

  const displaySuggestions = isFocused && (suggestions.length > 0 || recentSearches.length > 0);

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
  onChangeText={(text) => {
    onChangeText(text);
    if (text.length > 0) {
      setShowSuggestionsModal(true);
    }
  }}
  onFocus={handleFocus}
  onBlur={handleBlur}
  onSubmitEditing={handleSearch}
  autoCapitalize="none"
  autoCorrect={false}
  accessibilityLabel="Search input"
  accessibilityHint="Enter search query"
  accessibilityRole={Platform.OS === 'ios' ? 'search' : 'text'}
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
          onPress={handleSearch}
          style={[styles.searchButton, styles.buttonSpacing]}
          activeOpacity={0.8}
          accessibilityLabel="Search button"
          accessibilityRole="button"
        >
          <Text style={styles.searchButtonText} allowFontScaling={false}>
            Search
          </Text>
        </TouchableOpacity>
      )}

      {/* Search Suggestions Modal */}
      {showSuggestions && displaySuggestions && (
        <Modal
          visible={showSuggestionsModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSuggestionsModal(false)}
        >
          <TouchableOpacity
            style={styles.suggestionsOverlay}
            activeOpacity={1}
            onPress={() => setShowSuggestionsModal(false)}
          >
            <View style={styles.suggestionsContainer}>
              {suggestions.length > 0 && (
                <View>
                  <Text style={styles.suggestionsTitle}>Suggestions</Text>
                  {suggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionItem}
                      onPress={() => handleSuggestionSelect(suggestion)}
                      accessibilityLabel={`Search suggestion: ${suggestion}`}
                      accessibilityRole="button"
                    >
                      <Icon name="magnify" size={16} color={colors.neutral[500]} />
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {recentSearches.length > 0 && value.length === 0 && (
                <View style={styles.recentSearches}>
                  <View style={styles.recentSearchesHeader}>
                    <Text style={styles.suggestionsTitle}>Recent Searches</Text>
                    <TouchableOpacity
                      onPress={async () => {
                        await clearSearchHistory();
                        setRecentSearches([]);
                      }}
                      accessibilityLabel="Clear search history"
                      accessibilityRole="button"
                    >
                      <Text style={styles.clearHistoryText}>Clear</Text>
                    </TouchableOpacity>
                  </View>
                  {recentSearches.map((search, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionItem}
                      onPress={() => handleSuggestionSelect(search)}
                      accessibilityLabel={`Recent search: ${search}`}
                      accessibilityRole="button"
                    >
                      <Icon name="clock-outline" size={16} color={colors.neutral[500]} />
                      <Text style={styles.suggestionText}>{search}</Text>
                      <TouchableOpacity
                        onPress={() => handleRemoveSuggestion(search)}
                        style={styles.removeButton}
                        accessibilityLabel={`Remove ${search} from history`}
                        accessibilityRole="button"
                      >
                        <Icon name="close" size={14} color={colors.neutral[400]} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </TouchableOpacity>
        </Modal>
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
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1.5,
    borderColor: 'rgba(58, 181, 209, 0.2)',
  },
  searchContainerFocused: {
    borderColor: colors.primary[500],
    borderWidth: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
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
  suggestionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    paddingTop: 100,
  },
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[600],
    paddingHorizontal: 16,
    paddingVertical: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  suggestionText: {
    flex: 1,
    fontSize: 15,
    color: colors.neutral[900],
    marginLeft: 12,
  },
  recentSearches: {
    marginTop: 8,
  },
  recentSearchesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  clearHistoryText: {
    fontSize: 12,
    color: colors.primary[500],
    fontWeight: '600',
  },
  removeButton: {
    padding: 4,
    marginLeft: 8,
  },
});

// Set displayName for better debugging
SearchBar.displayName = 'SearchBar';

export default SearchBar;
