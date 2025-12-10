/**
 * Modern Orders Screen with Timeline View and Status Animations
 * Uses NativeWind for styling and Phase 2 components
 */

import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList, OrderStatus } from '../../types';
import { useAuthStore } from '../../store/authStore';
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

type OrdersScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Orders'>;

const OrdersScreen = () => {
  const navigation = useNavigation<OrdersScreenNavigationProp>();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const country = (user?.country_preference || COUNTRIES.GERMANY) as Country;

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

  const handleOrderPress = (orderId: string) => {
    navigation.navigate('OrderDetails', { orderId });
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-neutral-50">
        <AppHeader title="My Orders" />
        <View className="px-4 pt-4">
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
          onRetry={() => refetch()}
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
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item, index }) => (
          <ContentFadeIn delay={index * 50} style={{ paddingHorizontal: 16, marginBottom: 12 }}>
            <OrderCard
              order={item}
              country={country}
              onPress={() => handleOrderPress(item.id)}
            />
          </ContentFadeIn>
        )}
        contentContainerStyle={{ paddingBottom: 16 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default OrdersScreen;
