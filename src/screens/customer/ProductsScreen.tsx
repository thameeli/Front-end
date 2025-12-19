/**
 * Modern Products Screen with Grid/List Toggle, Filter Drawer, and Infinite Scroll
 * Uses NativeWind for styling and Phase 2 components
 */

import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { RootStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useProducts } from '../../hooks/useProducts';
import { ProductCard, SearchBar, FilterBar, EmptyState, LoadingScreen, ErrorMessage, AnimatedView, Badge, SkeletonCard, ContentFadeIn, SkeletonLoader } from '../../components';
import { getFilteredProducts } from '../../utils/productUtils';
import { debounce } from '../../utils/debounce';
import { COUNTRIES, PRODUCT_CATEGORIES } from '../../constants';
import type { ProductCategory } from '../../types';
import type { Country } from '../../constants';
import { colors } from '../../theme';
import {
  isSmallDevice,
  isTablet,
  getColumnCount,
  getResponsivePadding,
} from '../../utils/responsive';

type ProductsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Products'>;

const ProductsScreen = () => {
  const navigation = useNavigation<ProductsScreenNavigationProp>();
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuthStore();
  const { selectedCountry } = useCartStore();
  
  // Use user's country preference if authenticated, otherwise use selected country from cart store
  const country = (isAuthenticated && user?.country_preference) 
    ? user.country_preference 
    : (selectedCountry || COUNTRIES.GERMANY) as Country;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price_asc' | 'price_desc'>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Responsive dimensions
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const isSmall = isSmallDevice();
  const isTabletDevice = isTablet();
  const numColumns = useMemo(() => {
    if (viewMode === 'list') return 1;
    if (isSmall) return 1;
    if (isTabletDevice) return 3;
    return 2;
  }, [viewMode, isSmall, isTabletDevice]);
  const padding = getResponsivePadding();
  
  // Update dimensions on orientation change
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });
    return () => subscription?.remove();
  }, []);

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
    return (
      <View className="flex-1 bg-neutral-50">
        <View className="px-4 pt-4 pb-2 bg-white">
          <SkeletonLoader width="100%" height={48} borderRadius={12} className="mb-4" />
          <SkeletonLoader width="60%" height={32} borderRadius={8} />
        </View>
        <View className="px-4 pt-4">
          <SkeletonCard type="product" count={3} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-neutral-50">
        <ErrorMessage
          message="Failed to load products. Please try again."
          error={error}
          onRetry={async () => { await refetch(); }}
          retryWithBackoff={true}
        />
      </View>
    );
  }

  const renderHeader = () => (
    <AnimatedView animation="fade" delay={0} className="px-4 pt-4 pb-2 bg-white">
      <SearchBar
        value={searchQuery}
        onChangeText={handleSearchChange}
        onClear={handleClearSearch}
        placeholder="Search products..."
        style={{ marginBottom: 12 }}
      />
      
      <View className="flex-row items-center justify-between mb-2">
        <FilterBar
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
        
        {/* View Mode Toggle */}
        <View className="flex-row bg-neutral-100 rounded-lg p-1">
          <TouchableOpacity
            onPress={() => setViewMode('list')}
            className={`px-3 py-1 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
          >
            <Icon
              name="format-list-bulleted"
              size={20}
              color={viewMode === 'list' ? colors.primary[500] : colors.neutral[500]}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode('grid')}
            className={`px-3 py-1 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
          >
            <Icon
              name="view-grid"
              size={20}
              color={viewMode === 'grid' ? colors.primary[500] : colors.neutral[500]}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Results Count */}
      <View className="flex-row items-center justify-between mt-2">
        <Text className="text-sm text-neutral-500">
          {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
        </Text>
        {selectedCategory !== 'all' && (
          <Badge variant="primary" size="sm">
            {selectedCategory}
          </Badge>
        )}
      </View>
    </AnimatedView>
  );

  if (filteredProducts.length === 0) {
    return (
      <View className="flex-1 bg-neutral-50">
        {renderHeader()}
        <EmptyState
          icon="magnify"
          title={searchQuery ? "No products found" : "No products available"}
          message={searchQuery ? "Try adjusting your search or filters" : "Check back later for new products"}
        />
      </View>
    );
  }

  // Memoized render item for grid
  const renderGridItem = React.useCallback(({ item, index }: { item: typeof filteredProducts[0]; index: number }) => (
    <ContentFadeIn delay={index * 50} style={{ flex: 1, margin: 8 }}>
      <ProductCard
        product={item}
        country={country}
        onPress={() => handleProductPress(item.id)}
        index={index}
      />
    </ContentFadeIn>
  ), [country, handleProductPress]);

  // Memoized key extractor
  const keyExtractor = React.useCallback((item: typeof filteredProducts[0]) => item.id, []);

  // Grid View
  if (viewMode === 'grid') {
    return (
      <View className="flex-1 bg-neutral-50">
        <FlatList
          data={filteredProducts}
          keyExtractor={keyExtractor}
          numColumns={numColumns}
          ListHeaderComponent={renderHeader}
          renderItem={renderGridItem}
          contentContainerStyle={{ paddingBottom: 16 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={10}
          getItemLayout={numColumns > 1 ? (data, index) => ({
            length: 250, // Approximate item height
            offset: 250 * Math.floor(index / numColumns),
            index,
          }) : undefined}
        />
      </View>
    );
  }

  // List View - single column
  return (
    <View className="flex-1 bg-neutral-50">
      <FlatList
        data={filteredProducts}
        keyExtractor={keyExtractor}
        numColumns={1}
        ListHeaderComponent={renderHeader}
        renderItem={renderGridItem}
        contentContainerStyle={{ paddingBottom: 16 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
      />
    </View>
  );
};

export default ProductsScreen;
