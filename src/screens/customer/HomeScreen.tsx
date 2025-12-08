import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useProducts } from '../../hooks/useProducts';
import { useCartStore } from '../../store/cartStore';
import { ProductCard, SearchBar, FilterBar, EmptyState, LoadingScreen, ErrorMessage, Button, CountrySelectionModal } from '../../components';
import { getFilteredProducts } from '../../utils/productUtils';
import { debounce } from '../../utils/debounce';
import { COUNTRIES, PRODUCT_CATEGORIES } from '../../constants';
import type { ProductCategory } from '../../types';
import type { Country } from '../../constants';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuthStore();
  const { addItem, selectedCountry, countrySelected, setSelectedCountry, loadCountry } = useCartStore();
  
  // Load country on mount
  useEffect(() => {
    loadCountry();
  }, [loadCountry]);

  // Use user's country preference if authenticated, otherwise use selected country
  const country = (isAuthenticated && user?.country_preference) 
    ? user.country_preference 
    : (selectedCountry || COUNTRIES.GERMANY) as Country;
  
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
  });

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return getFilteredProducts(products, {
      searchQuery: debouncedSearchQuery,
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      sortBy,
      country,
    });
  }, [products, debouncedSearchQuery, selectedCategory, sortBy, country]);

  const handleProductPress = (productId: string) => {
    navigation.navigate('ProductDetails', { productId });
  };

  const handleAddToCart = (product: any) => {
    // Check if country is selected
    if (!countrySelected && !selectedCountry) {
      Alert.alert(
        t('country.selectCountry') || 'Select Country',
        t('country.selectCountryFirst') || 'Please select your country first to see products and prices',
      );
      return;
    }

    // Check if user is authenticated
    if (!isAuthenticated) {
      Alert.alert(
        t('auth.loginRequired') || 'Login Required',
        t('auth.loginToAddCart') || 'Please login or sign up to add items to cart',
        [
          { text: t('common.cancel') || 'Cancel', style: 'cancel' },
          {
            text: t('auth.login') || 'Login',
            onPress: () => navigation.navigate('Login'),
          },
          {
            text: t('auth.register') || 'Sign Up',
            onPress: () => navigation.navigate('Register'),
            style: 'default',
          },
        ]
      );
      return;
    }

    // Add to cart if authenticated
    addItem(product, 1, country);
  };

  const handleCountrySelect = async (selectedCountry: Country) => {
    await setSelectedCountry(selectedCountry);
  };

  if (isLoading) {
    return <LoadingScreen message={t('products.loading') || 'Loading products...'} />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ErrorMessage
          message={t('errors.failedToLoadProducts') || 'Failed to load products'}
          onRetry={refetch}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Country Selection Modal - Show if country not selected */}
      <CountrySelectionModal
        visible={!countrySelected && !isAuthenticated}
        selectedCountry={selectedCountry}
        onSelectCountry={handleCountrySelect}
      />

      {/* Header - Different for guests vs authenticated users */}
      {!isAuthenticated ? (
        <View style={styles.header}>
          <Text style={styles.welcomeText}>{t('home.welcome') || 'Welcome to Thamili'}</Text>
          {selectedCountry && (
            <Text style={styles.countryText}>
              {t('country.viewing') || 'Viewing products for'} {selectedCountry === COUNTRIES.GERMANY ? 'Germany' : 'Norway'}
            </Text>
          )}
          <View style={styles.authButtons}>
            <Button
              title={t('auth.login') || 'Login'}
              onPress={() => navigation.navigate('Login')}
              variant="outline"
              style={styles.authButton}
            />
            <Button
              title={t('auth.register') || 'Sign Up'}
              onPress={() => navigation.navigate('Register')}
              style={styles.authButton}
            />
          </View>
        </View>
      ) : (
        <View style={styles.authenticatedHeader}>
          <View style={styles.userInfo}>
            <Icon name="account-circle" size={32} color="#007AFF" />
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user?.name || user?.email || 'User'}</Text>
              <Text style={styles.userRole}>
                {user?.role === 'admin' ? 'Admin' : 'Customer'} • {country === COUNTRIES.GERMANY ? 'Germany' : 'Norway'}
              </Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => {
                // Navigate to Profile tab
                const tabNavigation = navigation.getParent();
                if (tabNavigation) {
                  tabNavigation.navigate('Profile');
                } else {
                  navigation.navigate('Profile' as never);
                }
              }}
            >
              <Icon name="account" size={24} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={async () => {
                Alert.alert(
                  t('auth.logout') || 'Logout',
                  t('auth.logoutConfirm') || 'Are you sure you want to logout?',
                  [
                    { text: t('common.cancel') || 'Cancel', style: 'cancel' },
                    {
                      text: t('auth.logout') || 'Logout',
                      style: 'destructive',
                      onPress: async () => {
                        const { logout } = useAuthStore.getState();
                        await logout();
                      },
                    },
                  ]
                );
              }}
            >
              <Icon name="logout" size={24} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Search and Filters */}
      <View style={styles.searchSection}>
        <SearchBar
          value={searchQuery}
          onChangeText={handleSearchChange}
          onClear={handleClearSearch}
          placeholder={t('products.searchPlaceholder') || 'Search products...'}
        />
        <FilterBar
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
      </View>

      {/* Products List - Only show if country is selected */}
      {(!countrySelected && !isAuthenticated) ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {t('country.selectCountryToView') || 'Please select your country to view products'}
          </Text>
        </View>
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          message={t('products.noProductsFound') || 'No products found'}
          icon="store-off"
        />
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              country={country}
              onPress={() => handleProductPress(item.id)}
              onAddToCart={() => handleAddToCart(item)}
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
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  authenticatedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  userRole: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  countryText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  authButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  authButton: {
    flex: 1,
  },
  searchSection: {
    padding: 16,
    backgroundColor: '#fff',
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default HomeScreen;
