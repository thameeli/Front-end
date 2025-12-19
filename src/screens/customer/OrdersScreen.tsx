/**
 * Modern Orders Screen with Timeline View and Status Animations
 * Uses NativeWind for styling and Phase 2 components
 */

import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, FlatList, RefreshControl, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList, OrderStatus } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useOrders } from '../../hooks/useOrders';
import { useOrderRealtime } from '../../hooks/useOrderRealtime';
import {
  AppHeader,
  OrderCard,
  OrderFilter,
  SearchBar,
  EmptyState,
  LoadingScreen,
  ErrorMessage,
  SkeletonLoader,
  AnimatedView,
  SkeletonCard,
  ContentFadeIn,
} from '../../components';
import { getFilteredOrders } from '../../utils/orderUtils';
import { debounce } from '../../utils/debounce';
import { COUNTRIES } from '../../constants';
import type { Country } from '../../constants';
import {
  isSmallDevice,
  isTablet,
  getResponsivePadding,
} from '../../utils/responsive';

type OrdersScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Orders'>;

const OrdersScreen = () => {
  const navigation = useNavigation<OrdersScreenNavigationProp>();
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuthStore();
  const { selectedCountry } = useCartStore();
  
  // Use user's country preference if authenticated, otherwise use selected country from cart store
  const country = (isAuthenticated && user?.country_preference) 
    ? user.country_preference 
    : (selectedCountry || COUNTRIES.GERMANY) as Country;

  // Responsive dimensions
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const isSmall = isSmallDevice();
  const isTabletDevice = isTablet();
  const padding = getResponsivePadding();
  
  // Update dimensions on orientation change
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });
    return () => subscription?.remove();
  }, []);

  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

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

  // Set up real-time updates
  useOrderRealtime(user?.id || '');

  // Fetch orders
  const {
    data: orders = [],
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useOrders(user?.id || '', {
    status: selectedStatus !== 'all' ? selectedStatus : undefined,
  });

  // Filter and search orders
  const filteredOrders = useMemo(() => {
    return getFilteredOrders(orders, {
      status: selectedStatus,
      searchQuery: debouncedSearchQuery,
      sortBy: 'date_desc',
    });
  }, [orders, selectedStatus, debouncedSearchQuery]);

  const handleOrderPress = React.useCallback((orderId: string) => {
    navigation.navigate('OrderDetails', { orderId });
  }, [navigation]);

  // Memoized render item
  const renderOrderItem = React.useCallback(({ item }: { item: typeof filteredOrders[0] }) => (
    <ContentFadeIn delay={0} style={{ marginBottom: 12 }}>
      <OrderCard
        order={item}
        country={country}
        onPress={() => handleOrderPress(item.id)}
      />
    </ContentFadeIn>
  ), [country, handleOrderPress]);

  // Memoized key extractor
  const keyExtractor = React.useCallback((item: typeof filteredOrders[0]) => item.id, []);

  if (isLoading) {
    return (
      <View className="flex-1 bg-neutral-50">
        <AppHeader title="My Orders" />
        <View style={{ paddingHorizontal: padding.horizontal, paddingTop: padding.vertical }}>
          <SkeletonCard type="order" count={3} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-neutral-50">
        <AppHeader title="My Orders" />
        <ErrorMessage
          message="Failed to load orders. Please try again."
          error={error}
          onRetry={async () => { await refetch(); }}
          retryWithBackoff={true}
        />
      </View>
    );
  }

  const renderHeader = () => (
    <AnimatedView 
      animation="fade" 
      delay={0} 
      style={{
        paddingHorizontal: padding.horizontal,
        paddingTop: padding.vertical,
        paddingBottom: 8,
        backgroundColor: '#fff',
      }}
    >
      <SearchBar
        value={searchQuery}
        onChangeText={handleSearchChange}
        onClear={handleClearSearch}
        placeholder="Search by order number..."
        style={{ marginBottom: 12 }}
      />

      <OrderFilter
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
      />

      {/* Results Count */}
      <View className="flex-row items-center justify-between mt-3">
        <Text className="text-sm text-neutral-500">
          {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'} found
        </Text>
        {selectedStatus !== 'all' && (
          <Text className="text-xs text-neutral-400 capitalize">
            Filter: {selectedStatus}
          </Text>
        )}
      </View>
    </AnimatedView>
  );

  if (filteredOrders.length === 0) {
    return (
      <View className="flex-1 bg-neutral-50">
        {renderHeader()}
        <EmptyState
          icon={searchQuery ? "magnify" : "package-variant"}
          title={searchQuery ? "No orders found" : "No orders yet"}
          message={
            searchQuery
              ? "Try adjusting your search or filters"
              : "Your order history will appear here"
          }
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neutral-50">
      <AppHeader title="My Orders" />
      
      <FlatList
        data={filteredOrders}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderHeader}
        renderItem={renderOrderItem}
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
          length: 180, // Approximate order card height
          offset: 180 * index,
          index,
        })}
      />
    </View>
  );
};

export default OrdersScreen;
