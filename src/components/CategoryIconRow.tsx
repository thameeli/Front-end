/**
 * Category Icon Row Component
 * Horizontal scrollable row of category icons
 */

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors } from '../theme';
import { ProductCategory } from '../types';

interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  category?: ProductCategory | 'all';
  badge?: string; // e.g., "20% OFF", "FREE"
}

interface CategoryIconRowProps {
  categories: CategoryItem[];
  onCategoryPress?: (category: CategoryItem) => void;
  selectedCategory?: ProductCategory | 'all';
}

const CategoryIconRow: React.FC<CategoryIconRowProps> = ({
  categories,
  onCategoryPress,
  selectedCategory,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((category) => {
          const isSelected = selectedCategory === category.category;
          
          return (
            <TouchableOpacity
              key={category.id}
              onPress={() => onCategoryPress?.(category)}
              style={[
                styles.categoryItem,
                isSelected && styles.categoryItemSelected,
              ]}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconContainer,
                  isSelected && styles.iconContainerSelected,
                ]}
              >
                <Icon
                  name={category.icon as any}
                  size={24}
                  color={isSelected ? colors.primary[500] : colors.neutral[600]}
                />
              </View>
              <Text
                style={[
                  styles.categoryName,
                  isSelected && styles.categoryNameSelected,
                ]}
                numberOfLines={1}
              >
                {category.name}
              </Text>
              {category.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{category.badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 12,
    minWidth: 70,
  },
  categoryItemSelected: {
    opacity: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  iconContainerSelected: {
    backgroundColor: colors.primary[50],
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  categoryName: {
    fontSize: 11,
    color: colors.neutral[600],
    textAlign: 'center',
    fontWeight: '500',
  },
  categoryNameSelected: {
    color: colors.primary[500],
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.error[500],
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
});

// Set displayName for better debugging
CategoryIconRow.displayName = 'CategoryIconRow';

export default CategoryIconRow;

