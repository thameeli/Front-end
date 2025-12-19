/**
 * Enhanced Admin Products Screen with Modern Product Management UI
 * Uses NativeWind for styling and Phase 2 components
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, Platform, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RootStackParamList, Product } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { productService } from '../../services/productService';
import {
  AppHeader,
  ProductCard,
  Button,
  EmptyState,
  LoadingScreen,
  ErrorMessage,
  SearchBar,
  FilterBar,
  AnimatedView,
  Badge,
  Card,
  SkeletonCard,
  ContentFadeIn,
} from '../../components';
import { getFilteredProducts } from '../../utils/productUtils';
import { debounce } from '../../utils/debounce';
import { COUNTRIES, PRODUCT_CATEGORIES } from '../../constants';
import type { Country } from '../../constants';
import type { ProductCategory } from '../../types';
import { colors } from '../../theme';
import {
  isSmallDevice,
  isTablet,
  isLandscape,
  getResponsivePadding,
} from '../../utils/responsive';

type AdminProductsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AdminProducts'>;

const AdminProductsScreen = () => {
  const navigation = useNavigation<AdminProductsScreenNavigationProp>();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const country = (user?.country_preference || COUNTRIES.GERMANY) as Country;
  
  // Responsive dimensions
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const isSmall = isSmallDevice();
  const isTabletDevice = isTablet();
  const isLandscapeMode = isLandscape();
  const padding = getResponsivePadding();
  
  // Update dimensions on orientation change
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });
    return () => subscription?.remove();
  }, []);
  
  // Calculate tab bar height to position button above it
  const tabBarHeight = Platform.OS === 'ios' ? 60 : 56;
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 8 : 4);
  const totalTabBarHeight = tabBarHeight + bottomPadding;

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');

  // Debounce search
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

  // Fetch all products (including inactive)
  const { data: products = [], isLoading, error, refetch } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: () => productService.getProducts(),
  });
  
  if (error) {
    return (
      <View className="flex-1 bg-neutral-50">
        <AppHeader title="Manage Products" />
        <ErrorMessage
          message="Failed to load products. Please try again."
          error={error}
          onRetry={async () => { await refetch(); }}
          retryWithBackoff={true}
        />
      </View>
    );
  }

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: (productId: string) => productService.deleteProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      Alert.alert('Success', 'Product deleted successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to delete product');
    },
  });

  // Toggle product active status
  const toggleActiveMutation = useMutation({
    mutationFn: ({ productId, active }: { productId: string; active: boolean }) =>
      productService.updateProduct(productId, { active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to update product');
    },
  });

  // Filter products
  const filteredProducts = useMemo(() => {
    return getFilteredProducts(products, {
      category: selectedCategory,
      searchQuery: debouncedSearchQuery,
      sortBy: 'name',
      country,
    });
  }, [products, selectedCategory, debouncedSearchQuery, country]);

  const handleAddProduct = () => {
    (navigation as any).navigate('AddProduct');
  };

  const handleEditProduct = useCallback((productId: string) => {
    (navigation as any).navigate('EditProduct', { productId });
  }, [navigation]);

  const handleDeleteProduct = useCallback((product: Product) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(product.id),
        },
      ]
    );
  }, [deleteMutation]);

  const handleToggleActive = useCallback((product: Product) => {
    toggleActiveMutation.mutate({
      productId: product.id,
      active: !product.active,
    });
  }, [toggleActiveMutation]);

  // Memoized render item
  const renderProductItem = useCallback(({ item, index }: { item: Product; index: number }) => (
    <AnimatedView animation="fade" delay={index * 50} className="px-4 mb-4">
      <Card elevation="flat" className="p-4">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-neutral-900 mb-1">{item.name}</Text>
            <Text className="text-sm text-neutral-500">{item.category}</Text>
          </View>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => handleEditProduct(item.id)}
              className="p-2 bg-primary-50 rounded-lg"
              accessibilityRole="button"
              accessibilityLabel="Edit product"
            >
              <Icon name="pencil" size={18} color={colors.primary[500]} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDeleteProduct(item)}
              className="p-2 bg-error-50 rounded-lg"
              accessibilityRole="button"
              accessibilityLabel="Delete product"
            >
              <Icon name="delete" size={18} color={colors.error[500]} />
            </TouchableOpacity>
          </View>
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-bold text-primary-500">
            {country === COUNTRIES.GERMANY 
              ? `€${item.price_germany.toFixed(2)}` 
              : `kr${item.price_norway.toFixed(2)}`}
          </Text>
          <TouchableOpacity
            onPress={() => handleToggleActive(item)}
            className={`px-3 py-1 rounded ${item.active ? 'bg-success-100' : 'bg-neutral-100'}`}
            accessibilityRole="button"
            accessibilityLabel={item.active ? 'Deactivate product' : 'Activate product'}
          >
            <Text className={`text-xs font-semibold ${item.active ? 'text-success-600' : 'text-neutral-600'}`}>
              {item.active ? 'Active' : 'Inactive'}
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
    </AnimatedView>
  ), [handleEditProduct, handleDeleteProduct, handleToggleActive, country]);

  // Memoized key extractor
  const keyExtractor = useCallback((item: Product) => item.id, []);

  if (isLoading) {
    return (
      <View className="flex-1 bg-neutral-50">
        <AppHeader title="Manage Products" />
        <View className="px-4 pt-4">
          <SkeletonCard type="product" count={3} />
        </View>
      </View>
    );
  }

  const renderHeader = () => (
    <AnimatedView animation="fade" delay={0} className="px-4 pt-4 pb-2 bg-white">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-2xl font-bold text-neutral-900">Manage Products</Text>
        <TouchableOpacity
          onPress={handleAddProduct}
          className="w-10 h-10 rounded-full bg-primary-500 justify-center items-center"
        >
          <Icon name="plus" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <SearchBar
        value={searchQuery}
        onChangeText={handleSearchChange}
        onClear={() => {
          setSearchQuery('');
          setDebouncedSearchQuery('');
        }}
        placeholder="Search products..."
        style={{ marginBottom: 12 }}
      />

      <FilterBar
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        sortBy="name"
        onSortChange={() => {}}
      />

      {/* Results Count */}
      <View className="flex-row items-center justify-between mt-3">
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
          icon="store-off"
          title={searchQuery ? "No products found" : "No products"}
          message={searchQuery ? "Try adjusting your search" : "Add your first product"}
          actionLabel="Add Product"
          onAction={handleAddProduct}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neutral-50">
      <AppHeader title="Manage Products" />
      
      <FlatList
        data={filteredProducts}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderHeader}
        renderItem={renderProductItem}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
        getItemLayout={(data, index) => ({
          length: 350, // Approximate item height with admin actions
          offset: 350 * index,
          index,
        })}
      />

      {/* Sticky Add Button - Positioned above tab bar */}
      <AnimatedView
        animation="slide"
        delay={0}
        enterFrom="bottom"
        style={[
          styles.stickyContainer,
          {
            bottom: totalTabBarHeight,
            paddingHorizontal: padding.horizontal,
            maxWidth: isTabletDevice && !isLandscapeMode ? 600 : '100%',
            alignSelf: isTabletDevice && !isLandscapeMode ? 'center' : 'stretch',
          }
        ] as any}
      >
        <Button
          title={isSmall ? "Add Product" : "Add New Product"}
          onPress={handleAddProduct}
          fullWidth
          size="lg"
          icon={<Icon name="plus" size={20} color="white" />}
        />
      </AnimatedView>
    </View>
  );
};

const styles = StyleSheet.create({
  stickyContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingTop: 12,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    // paddingHorizontal is set dynamically
  },
});

export default AdminProductsScreen;
