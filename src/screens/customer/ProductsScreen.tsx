import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useProducts } from '../../hooks/useProducts';
import { ProductCard, SearchBar, FilterBar, EmptyState, LoadingScreen, ErrorMessage } from '../../components';
import { getFilteredProducts } from '../../utils/productUtils';
import { debounce } from '../../utils/debounce';
import { COUNTRIES, PRODUCT_CATEGORIES } from '../../constants';
import type { ProductCategory } from '../../types';
import type { Country } from '../../constants';

type ProductsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Products'>;

const ProductsScreen = () => {
  const navigation = useNavigation<ProductsScreenNavigationProp>();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const country = (user?.country_preference || COUNTRIES.GERMANY) as Country;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price_asc' | 'price_desc'>('name');

  // Debounce search query
  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        setDebouncedSearchQuery(query);
      }, 300),
    []
  );

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    debouncedSearch(text);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
  };

  // Fetch products
  const { data: products = [], isLoading, error, refetch, isRefetching } = useProducts({
    active: true,
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    search: debouncedSearchQuery || undefined,
  });

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return getFilteredProducts(products, {
      category: selectedCategory,
      searchQuery: debouncedSearchQuery,
      sortBy,
      country,
    });
  }, [products, selectedCategory, debouncedSearchQuery, sortBy, country]);

  const handleProductPress = (productId: string) => {
    navigation.navigate('ProductDetails', { productId });
  };

  if (isLoading) {
    return <LoadingScreen message="Loading products..." />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ErrorMessage
          message="Failed to load products. Please try again."
          onRetry={() => refetch()}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SearchBar
        value={searchQuery}
        onChangeText={handleSearchChange}
        onClear={handleClearSearch}
        placeholder="Search products..."
        style={styles.searchBar}
      />
      
      <FilterBar
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {filteredProducts.length === 0 ? (
        <EmptyState
          icon="magnify"
          title={searchQuery ? "No products found" : "No products available"}
          message={searchQuery ? "Try adjusting your search or filters" : "Check back later for new products"}
        />
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => handleProductPress(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchBar: {
    margin: 16,
    marginBottom: 0,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
});

export default ProductsScreen;
