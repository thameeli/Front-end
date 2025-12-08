import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ProductCategory } from '../types';
import { PRODUCT_CATEGORIES } from '../constants';

interface FilterBarProps {
  selectedCategory: ProductCategory | 'all';
  onCategoryChange: (category: ProductCategory | 'all') => void;
  sortBy: 'name' | 'price_asc' | 'price_desc';
  onSortChange: (sort: 'name' | 'price_asc' | 'price_desc') => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.categorySection}>
        <Text style={styles.label}>Category:</Text>
        <View style={styles.categoryButtons}>
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === 'all' && styles.categoryButtonActive,
            ]}
            onPress={() => onCategoryChange('all')}
          >
            <Text
              style={[
                styles.categoryButtonText,
                selectedCategory === 'all' && styles.categoryButtonTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === PRODUCT_CATEGORIES.FRESH &&
                styles.categoryButtonActive,
            ]}
            onPress={() => onCategoryChange(PRODUCT_CATEGORIES.FRESH)}
          >
            <Text
              style={[
                styles.categoryButtonText,
                selectedCategory === PRODUCT_CATEGORIES.FRESH &&
                  styles.categoryButtonTextActive,
              ]}
            >
              Fresh
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === PRODUCT_CATEGORIES.FROZEN &&
                styles.categoryButtonActive,
            ]}
            onPress={() => onCategoryChange(PRODUCT_CATEGORIES.FROZEN)}
          >
            <Text
              style={[
                styles.categoryButtonText,
                selectedCategory === PRODUCT_CATEGORIES.FROZEN &&
                  styles.categoryButtonTextActive,
              ]}
            >
              Frozen
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sortSection}>
        <Text style={styles.label}>Sort:</Text>
        <View style={styles.sortButtons}>
          <TouchableOpacity
            style={[
              styles.sortButton,
              sortBy === 'name' && styles.sortButtonActive,
            ]}
            onPress={() => onSortChange('name')}
          >
            <Text
              style={[
                styles.sortButtonText,
                sortBy === 'name' && styles.sortButtonTextActive,
              ]}
            >
              Name
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sortButton,
              sortBy === 'price_asc' && styles.sortButtonActive,
            ]}
            onPress={() => onSortChange('price_asc')}
          >
            <Text
              style={[
                styles.sortButtonText,
                sortBy === 'price_asc' && styles.sortButtonTextActive,
              ]}
            >
              Price ↑
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sortButton,
              sortBy === 'price_desc' && styles.sortButtonActive,
            ]}
            onPress={() => onSortChange('price_desc')}
          >
            <Text
              style={[
                styles.sortButtonText,
                sortBy === 'price_desc' && styles.sortButtonTextActive,
              ]}
            >
              Price ↓
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categorySection: {
    marginBottom: 12,
  },
  sortSection: {
    marginTop: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  categoryButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  sortButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: '#fff',
  },
});

export default FilterBar;

