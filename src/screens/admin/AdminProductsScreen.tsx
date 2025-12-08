import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
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
} from '../../components';
import { getFilteredProducts } from '../../utils/productUtils';
import { debounce } from '../../utils/debounce';
import { COUNTRIES, PRODUCT_CATEGORIES } from '../../constants';
import type { Country } from '../../constants';
import type { ProductCategory } from '../../types';

type AdminProductsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AdminProducts'>;

const AdminProductsScreen = () => {
  const navigation = useNavigation<AdminProductsScreenNavigationProp>();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const country = (user?.country_preference || COUNTRIES.GERMANY) as Country;

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
    return <LoadingScreen message="Loading products..." />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <AppHeader title="Manage Products" />
        <ErrorMessage
          message="Failed to load products. Please try again."
          onRetry={() => refetch()}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader
        title="Manage Products"
        rightAction={{
          icon: 'plus',
          onPress: handleAddProduct,
        }}
      />

      <SearchBar
        value={searchQuery}
        onChangeText={handleSearchChange}
        onClear={() => {
          setSearchQuery('');
          setDebouncedSearchQuery('');
        }}
        placeholder="Search products..."
        style={styles.searchBar}
      />

      <FilterBar
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        sortBy="name"
        onSortChange={() => {}}
      />

      {filteredProducts.length === 0 ? (
        <EmptyState
          icon="store-off"
          title={searchQuery ? "No products found" : "No products"}
          message={searchQuery ? "Try adjusting your search" : "Add your first product"}
        />
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.productCard}>
              <ProductCard
                product={item}
                onPress={() => handleEditProduct(item.id)}
              />
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.actionButton, !item.active && styles.activeButton]}
                  onPress={() => handleToggleActive(item)}
                >
                  <Icon
                    name={item.active ? 'eye-off' : 'eye'}
                    size={20}
                    color={item.active ? '#666' : '#34C759'}
                  />
                  <Text
                    style={[
                      styles.actionText,
                      !item.active && styles.activeText,
                    ]}
                  >
                    {item.active ? 'Deactivate' : 'Activate'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => handleEditProduct(item.id)}
                >
                  <Icon name="pencil" size={20} color="#007AFF" />
                  <Text style={[styles.actionText, styles.editText]}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteProduct(item)}
                >
                  <Icon name="delete" size={20} color="#FF3B30" />
                  <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      <View style={styles.footer}>
        <Button
          title="Add New Product"
          onPress={handleAddProduct}
          fullWidth
          style={styles.addButton}
        />
      </View>
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
  productCard: {
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    gap: 4,
  },
  activeButton: {
    borderColor: '#34C759',
    backgroundColor: '#e6f9ed',
  },
  editButton: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f7ff',
  },
  deleteButton: {
    borderColor: '#FF3B30',
    backgroundColor: '#ffe6e6',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  activeText: {
    color: '#34C759',
  },
  editText: {
    color: '#007AFF',
  },
  deleteText: {
    color: '#FF3B30',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  addButton: {
    marginTop: 0,
  },
});

export default AdminProductsScreen;
