/**
 * Modern Home Screen with Hero Section, Featured Products, and Smooth Scrolling
 * Uses NativeWind for styling and Phase 2 components
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CommonActions } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useProducts } from '../../hooks/useProducts';
import { useCartStore } from '../../store/cartStore';
import { ProductCard, SearchBar, FilterBar, EmptyState, LoadingScreen, ErrorMessage, Button, CountrySelectionModal, AnimatedView, SkeletonCard, ContentFadeIn, SkeletonLoader, PromotionalBanner, CategoryIconRow } from '../../components';
import { getFilteredProducts } from '../../utils/productUtils';
import { debounce } from '../../utils/debounce';
import { COUNTRIES, PRODUCT_CATEGORIES } from '../../constants';
import type { ProductCategory } from '../../types';
import type { Country } from '../../constants';
import { colors } from '../../theme';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'> | BottomTabNavigationProp<any>;

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

  // Featured products (first 3)
  const featuredProducts = useMemo(() => {
    return filteredProducts.slice(0, 3);
  }, [filteredProducts]);

  const handleProductPress = React.useCallback((productId: string) => {
    (navigation as any).navigate('ProductDetails', { productId });
  }, [navigation]);

  const handleAddToCart = React.useCallback((product: any) => {
    if (!countrySelected && !selectedCountry) {
      Alert.alert(
        t('country.selectCountry') || 'Select Country',
        t('country.selectCountryFirst') || 'Please select your country first to see products and prices',
      );
      return;
    }

    if (!isAuthenticated) {
      Alert.alert(
        t('auth.loginRequired') || 'Login Required',
        t('auth.loginToAddCart') || 'Please login or sign up to add items to cart',
        [
          { text: t('common.cancel') || 'Cancel', style: 'cancel' },
          {
            text: t('auth.login') || 'Login',
            onPress: () => (navigation as any).navigate('Login'),
          },
          {
            text: t('auth.register') || 'Sign Up',
            onPress: () => (navigation as any).navigate('Register'),
            style: 'default',
          },
        ]
      );
      return;
    }

    addItem(product, 1, country);
  }, [countrySelected, selectedCountry, isAuthenticated, country, addItem, navigation, t]);

  const handleCountrySelect = async (selectedCountry: Country) => {
    await setSelectedCountry(selectedCountry);
  };

  // Memoized render item
  const renderProductItem = React.useCallback(({ item, index }: { item: any; index: number }) => (
    <AnimatedView animation="fade" delay={index * 50} className="flex-1 m-2">
      <ProductCard
        product={item}
        country={country}
        onPress={() => handleProductPress(item.id)}
        onAddToCart={() => handleAddToCart(item)}
        index={index}
      />
    </AnimatedView>
  ), [country, handleProductPress, handleAddToCart]);

  // Memoized key extractor
  const keyExtractor = React.useCallback((item: any) => item.id, []);

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
      <View className="flex-1 bg-white">
        <ErrorMessage
          message={t('errors.failedToLoadProducts') || 'Failed to load products'}
          error={error}
          onRetry={async () => { await refetch(); }}
          retryWithBackoff={true}
        />
      </View>
    );
  }

  const renderHeader = () => (
    <>
      {/* Country Selection Modal */}
      <CountrySelectionModal
        visible={!countrySelected && !isAuthenticated}
        selectedCountry={selectedCountry}
        onSelectCountry={handleCountrySelect}
      />

      {/* Hero Section */}
      <AnimatedView animation="fade" delay={0}>
        <LinearGradient
          colors={[colors.primary[500], colors.primary[600]]}
          className="px-6 pt-16 pb-8"
        >
          {!isAuthenticated ? (
            <View className="items-center">
              <Text className="text-3xl font-bold text-white mb-2 text-center">
                {t('home.welcome') || 'Welcome to Thamili'}
              </Text>
              <Text className="text-base text-white/90 text-center mb-6">
                Fresh fish and vegetables delivered to your door
              </Text>
              {selectedCountry && (
                <View className="bg-white/20 rounded-full px-4 py-2 mb-4">
                  <Text className="text-sm text-white font-medium">
                    {t('country.viewing') || 'Viewing products for'} {selectedCountry === COUNTRIES.GERMANY ? 'Germany' : 'Norway'}
                  </Text>
                </View>
              )}
              <View className="flex-row gap-3 w-full">
                <Button
                  title={t('auth.login') || 'Login'}
                  onPress={() => (navigation as any).navigate('Login')}
                  variant="outline"
                  style={{ flex: 1, backgroundColor: 'white' }}
                  textStyle={{ color: colors.primary[500] }}
                />
                <Button
                  title={t('auth.register') || 'Sign Up'}
                  onPress={() => (navigation as any).navigate('Register')}
                  style={{ flex: 1, backgroundColor: 'white' }}
                  textStyle={{ color: colors.primary[500] }}
                />
              </View>
            </View>
          ) : (
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="w-12 h-12 rounded-full bg-white/20 justify-center items-center mr-3">
                  <Icon name="account-circle" size={28} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-white" numberOfLines={1}>
                    {user?.name || user?.email || 'User'}
                  </Text>
                  <Text className="text-sm text-white/80">
                    {user?.role === 'admin' ? 'Admin' : 'Customer'} • {country === COUNTRIES.GERMANY ? 'Germany' : 'Norway'}
                  </Text>
                </View>
              </View>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => {
                    const tabNavigator = navigation.getParent();
                    if (tabNavigator) {
                      tabNavigator.navigate('Profile');
                    } else {
                      navigation.dispatch(CommonActions.navigate({ name: 'Profile' }));
                    }
                  }}
                  className="w-10 h-10 rounded-full bg-white/20 justify-center items-center"
                >
                  <Icon name="account" size={20} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
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
                  className="w-10 h-10 rounded-full bg-white/20 justify-center items-center"
                >
                  <Icon name="logout" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </LinearGradient>
      </AnimatedView>

      {/* Promotional Banner */}
      {!searchQuery && selectedCategory === 'all' && (
        <AnimatedView animation="fade" delay={50}>
          <PromotionalBanner
            title="UP TO 100% FREE DELIVERY"
            subtitle="Minimum Order Value €50"
            offerText="Free Shipping on orders above €50"
            validUntil="31 DEC 2024"
            onCollect={() => {
              Alert.alert('Voucher Collected', 'Free delivery voucher has been added to your account!');
            }}
            variant="success"
          />
        </AnimatedView>
      )}

      {/* Category Icons Row */}
      {!searchQuery && selectedCategory === 'all' && (
        <AnimatedView animation="slide" delay={100} enterFrom="bottom">
          <CategoryIconRow
            categories={[
              {
                id: 'all',
                name: 'All',
                icon: 'view-grid',
                category: 'all',
              },
              {
                id: 'fresh',
                name: 'Fresh',
                icon: 'fish',
                category: 'fresh',
                badge: '20% OFF',
              },
              {
                id: 'frozen',
                name: 'Frozen',
                icon: 'snowflake',
                category: 'frozen',
              },
              {
                id: 'delivery',
                name: 'Free Delivery',
                icon: 'truck-delivery',
              },
              {
                id: 'special',
                name: 'Special Offers',
                icon: 'tag',
                badge: 'NEW',
              },
            ]}
            onCategoryPress={(category) => {
              if (category.category) {
                setSelectedCategory(category.category as ProductCategory | 'all');
              }
            }}
            selectedCategory={selectedCategory}
          />
        </AnimatedView>
      )}

      {/* Search and Filters */}
      <AnimatedView animation="slide" delay={150} enterFrom="bottom" className="px-4 pt-4 pb-2 bg-white">
        <SearchBar
          value={searchQuery}
          onChangeText={handleSearchChange}
          onClear={handleClearSearch}
          placeholder={t('products.searchPlaceholder') || 'Search products...'}
          style={{ marginBottom: 12 }}
          onSearchPress={() => {
            // Handle search action
            if (searchQuery.trim()) {
              setDebouncedSearchQuery(searchQuery);
            }
          }}
        />
        <FilterBar
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
      </AnimatedView>

      {/* Featured Products Section */}
      {featuredProducts.length > 0 && !searchQuery && selectedCategory === 'all' && (
        <AnimatedView animation="fade" delay={200} className="px-4 pt-6 pb-2">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-neutral-900">Featured Products</Text>
            <Icon name="star" size={20} color={colors.warning[500]} />
          </View>
          <FlatList
            horizontal
            data={featuredProducts}
            keyExtractor={(item) => `featured-${item.id}`}
            renderItem={({ item, index }) => (
              <AnimatedView animation="slide" delay={300 + index * 50} enterFrom="right" style={{ marginRight: 12 }}>
                <ProductCard
                  product={item}
                  country={country}
                  onPress={() => handleProductPress(item.id)}
                  onAddToCart={() => handleAddToCart(item)}
                  index={index}
                />
              </AnimatedView>
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 16 }}
          />
        </AnimatedView>
      )}

      {/* All Products Header */}
      <View className="px-4 pt-4 pb-2">
        <Text className="text-xl font-bold text-neutral-900">
          {searchQuery ? 'Search Results' : selectedCategory !== 'all' ? `${selectedCategory} Products` : 'All Products'}
        </Text>
        <Text className="text-sm text-neutral-500 mt-1">
          {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
        </Text>
      </View>
    </>
  );

  return (
    <View className="flex-1 bg-neutral-50">
      {(!countrySelected && !isAuthenticated) ? (
        <View className="flex-1 justify-center items-center px-8">
          <EmptyState
            icon="map-marker-off"
            title={t('country.selectCountry') || 'Select Country'}
            message={t('country.selectCountryToView') || 'Please select your country to view products'}
          />
        </View>
      ) : filteredProducts.length === 0 ? (
        <View className="flex-1">
          {renderHeader()}
          <EmptyState
            icon="store-off"
            title={t('products.noProductsFound') || 'No products found'}
            message="Try adjusting your search or filters"
          />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={keyExtractor}
          numColumns={2}
          renderItem={renderProductItem}
          ListHeaderComponent={renderHeader}
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
          getItemLayout={(data, index) => ({
            length: 250, // Approximate item height
            offset: 250 * Math.floor(index / 2),
            index,
          })}
        />
      )}
    </View>
  );
};

export default HomeScreen;
