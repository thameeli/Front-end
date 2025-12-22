/**
 * Enhanced FilterBar with Icons
 * Modern filter design with visual icons for categories and sort options
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { ProductCategory } from '../types';
import { PRODUCT_CATEGORIES } from '../constants';
import { colors } from '../theme';

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
      {/* Category Section */}
      <View style={styles.section}>
        <View style={styles.labelContainer}>
          <Icon name="tag" size={16} color={colors.neutral[600]} style={styles.labelIcon} />
          <Text style={styles.label}>Category:</Text>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedCategory === 'all' && styles.filterButtonActive,
            ]}
            onPress={() => onCategoryChange('all')}
            activeOpacity={0.7}
          >
            <Icon
              name="view-grid"
              size={16}
              color={selectedCategory === 'all' ? '#fff' : colors.neutral[600]}
              style={styles.buttonIcon}
            />
            <Text
              style={[
                styles.filterButtonText,
                selectedCategory === 'all' && styles.filterButtonTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedCategory === PRODUCT_CATEGORIES.FRESH &&
                styles.filterButtonActive,
            ]}
            onPress={() => onCategoryChange(PRODUCT_CATEGORIES.FRESH)}
            activeOpacity={0.7}
          >
            <Icon
              name="fish"
              size={16}
              color={
                selectedCategory === PRODUCT_CATEGORIES.FRESH
                  ? '#fff'
                  : colors.success[600]
              }
              style={styles.buttonIcon}
            />
            <Text
              style={[
                styles.filterButtonText,
                selectedCategory === PRODUCT_CATEGORIES.FRESH &&
                  styles.filterButtonTextActive,
              ]}
            >
              Fresh
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedCategory === PRODUCT_CATEGORIES.FROZEN &&
                styles.filterButtonActive,
            ]}
            onPress={() => onCategoryChange(PRODUCT_CATEGORIES.FROZEN)}
            activeOpacity={0.7}
          >
            <Icon
              name="snowflake"
              size={16}
              color={
                selectedCategory === PRODUCT_CATEGORIES.FROZEN
                  ? '#fff'
                  : colors.primary[600]
              }
              style={styles.buttonIcon}
            />
            <Text
              style={[
                styles.filterButtonText,
                selectedCategory === PRODUCT_CATEGORIES.FROZEN &&
                  styles.filterButtonTextActive,
              ]}
            >
              Frozen
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sort Section */}
      <View style={styles.section}>
        <View style={styles.labelContainer}>
          <Icon name="sort" size={16} color={colors.neutral[600]} style={styles.labelIcon} />
          <Text style={styles.label}>Sort:</Text>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              sortBy === 'name' && styles.filterButtonActive,
            ]}
            onPress={() => onSortChange('name')}
            activeOpacity={0.7}
          >
            <Icon
              name="alphabetical"
              size={16}
              color={sortBy === 'name' ? '#fff' : colors.neutral[600]}
              style={styles.buttonIcon}
            />
            <Text
              style={[
                styles.filterButtonText,
                sortBy === 'name' && styles.filterButtonTextActive,
              ]}
            >
              Name
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              sortBy === 'price_asc' && styles.filterButtonActive,
            ]}
            onPress={() => onSortChange('price_asc')}
            activeOpacity={0.7}
          >
            <Icon
              name="sort-ascending"
              size={16}
              color={sortBy === 'price_asc' ? '#fff' : colors.neutral[600]}
              style={styles.buttonIcon}
            />
            <Text
              style={[
                styles.filterButtonText,
                sortBy === 'price_asc' && styles.filterButtonTextActive,
              ]}
            >
              Price ↑
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              sortBy === 'price_desc' && styles.filterButtonActive,
            ]}
            onPress={() => onSortChange('price_desc')}
            activeOpacity={0.7}
          >
            <Icon
              name="sort-descending"
              size={16}
              color={sortBy === 'price_desc' ? '#fff' : colors.neutral[600]}
              style={styles.buttonIcon}
            />
            <Text
              style={[
                styles.filterButtonText,
                sortBy === 'price_desc' && styles.filterButtonTextActive,
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
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(58, 181, 209, 0.1)',
  },
  section: {
    marginBottom: 12,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(58, 181, 209, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginRight: 8,
    marginBottom: 8,
  },
  labelIcon: {
    marginRight: 6,
  },
  filterButtonActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  filterButtonText: {
    fontSize: 13,
    color: colors.neutral[700],
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 6,
  },
});

// Set displayName for better debugging
FilterBar.displayName = 'FilterBar';

export default FilterBar;
