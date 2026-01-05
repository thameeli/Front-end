/**
 * Trending Products Component
 */

import React, { useMemo } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { Product } from '../types';
import { getTrendingProducts } from '../utils/productRecommendations';
import { ProductCard } from './';
import { useTheme } from '../hooks/useTheme';
import { COUNTRIES } from '../constants';
import type { Country } from '../constants';

interface TrendingProductsProps {
  products: Product[];
  country: Country;
  onProductPress: (productId: string) => void;
  limit?: number;
  style?: any;
}

const TrendingProducts: React.FC<TrendingProductsProps> = ({
  products,
  country,
  onProductPress,
  limit = 10,
  style,
}) => {
  const { colors: themeColors } = useTheme();

  const trendingProducts = useMemo(() => {
    return getTrendingProducts(products, country, limit);
  }, [products, country, limit]);

  if (trendingProducts.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Icon name="trending-up" size={20} color={themeColors.primary[500]} />
        <Text style={[styles.title, { color: themeColors.text.primary }]}>
          Trending Now
        </Text>
      </View>
      <FlatList
        data={trendingProducts}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            country={country}
            onPress={() => onProductPress(item.id)}
            style={styles.productCard}
          />
        )}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  productCard: {
    marginRight: 12,
    width: 160,
  },
});

export default TrendingProducts;

