/**
 * Enhanced Admin Products Screen with Modern Product Management UI
 * Uses NativeWind for styling and Phase 2 components
 */

import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, Platform } from 'react-native';
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

type AdminProductsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AdminProducts'>;

const AdminProductsScreen = () => {
  const navigation = useNavigation<AdminProductsScreenNavigationProp>();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const country = (user?.country_preference || COUNTRIES.GERMANY) as Country;
  
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
    navigation.navigate('AddProduct' as never);
  };

  const handleEditProduct = (productId: string) => {
    navigation.navigate('EditProduct' as never, { productId } as never);
  };

  const handleDeleteProduct = (product: Product) => {
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
  };

  const handleToggleActive = (product: Product) => {
    toggleActiveMutation.mutate({
      productId: product.id,
      active: !product.active,
    });
  };

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

  if (error) {
    return (
      <View className="flex-1 bg-neutral-50">
        <AppHeader title="Manage Products" />
        <ErrorMessage
          message="Failed to load products. Please try again."
          onRetry={() => refetch()}
        />
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
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item, index }) => (
          <ContentFadeIn delay={index * 50} style={{ paddingHorizontal: 16, marginBottom: 12 }}>
            <Card elevation="card" className="overflow-hidden">
              <ProductCard
                product={item}
                country={country}
                onPress={() => handleEditProduct(item.id)}
                index={index}
              />
              
              {/* Admin Actions */}
              <View className="flex-row gap-2 p-4 bg-neutral-50 border-t border-neutral-200">
                <TouchableOpacity
                  onPress={() => handleToggleActive(item)}
                  className={`
                    flex-1 flex-row items-center justify-center p-3 rounded-lg border-2
                    ${item.active ? 'border-neutral-300 bg-white' : 'border-success-500 bg-success-50'}
                  `}
                >
                  <Icon
                    name={item.active ? 'eye-off' : 'eye'}
                    size={18}
                    color={item.active ? colors.neutral[500] : colors.success[500]}
                  />
                  <Text
                    className={`
                      text-sm font-semibold ml-2
                      ${item.active ? 'text-neutral-600' : 'text-success-500'}
                    `}
                  >
                    {item.active ? 'Deactivate' : 'Activate'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleEditProduct(item.id)}
                  className="flex-1 flex-row items-center justify-center p-3 rounded-lg border-2 border-primary-500 bg-primary-50"
                >
                  <Icon name="pencil" size={18} color={colors.primary[500]} />
                  <Text className="text-sm font-semibold text-primary-500 ml-2">
                    Edit
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleDeleteProduct(item)}
                  className="flex-1 flex-row items-center justify-center p-3 rounded-lg border-2 border-error-500 bg-error-50"
                >
                  <Icon name="delete" size={18} color={colors.error[500]} />
                  <Text className="text-sm font-semibold text-error-500 ml-2">
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          </ContentFadeIn>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Sticky Add Button - Positioned above tab bar */}
      <AnimatedView
        animation="slide"
        delay={0}
        enterFrom="bottom"
        style={[
          styles.stickyContainer,
          { bottom: totalTabBarHeight }
        ]}
      >
        <Button
          title="Add New Product"
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default AdminProductsScreen;
