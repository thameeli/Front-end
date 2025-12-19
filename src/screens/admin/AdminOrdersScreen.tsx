/**
 * Modern Admin Orders Screen with Modern Order List and Filters
 * Uses NativeWind for styling and Phase 2 components
 */

import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { RootStackParamList, OrderStatus } from '../../types';
import { orderService } from '../../services/orderService';
import { useOrderRealtime } from '../../hooks/useOrderRealtime';
import { useAuthStore } from '../../store/authStore';
import {
  AppHeader,
  OrderCard,
  OrderFilter,
  SearchBar,
  EmptyState,
  LoadingScreen,
  ErrorMessage,
  AnimatedView,
  Badge,
  SkeletonCard,
  ContentFadeIn,
} from '../../components';
import { getFilteredOrders } from '../../utils/orderUtils';
import { debounce } from '../../utils/debounce';
import { COUNTRIES } from '../../constants';
import type { Country } from '../../constants';
import { colors } from '../../theme';

type AdminOrdersScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AdminOrders'>;

const AdminOrdersScreen = () => {
  const navigation = useNavigation<AdminOrdersScreenNavigationProp>();
  const { user } = useAuthStore();
  const country = (user?.country_preference || COUNTRIES.GERMANY) as Country;

  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');
  const [selectedCountry, setSelectedCountry] = useState<'all' | 'germany' | 'norway'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Set up real-time updates
  useOrderRealtime(user?.id || '');

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

  // Fetch all orders
  const {
    data: orders = [],
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['allOrders', selectedStatus !== 'all' ? selectedStatus : undefined],
    queryFn: () =>
      orderService.getAllOrders(
        selectedStatus !== 'all' ? { status: selectedStatus } : undefined
      ),
  });

  // Filter orders
  const filteredOrders = useMemo(() => {
    let filtered = orders;

    // Filter by country
    if (selectedCountry !== 'all') {
      filtered = filtered.filter((order) => order.country === selectedCountry);
    }

    // Apply search and sort
    return getFilteredOrders(filtered, {
      status: selectedStatus,
      searchQuery: debouncedSearchQuery,
      sortBy: 'date_desc',
    });
  }, [orders, selectedStatus, selectedCountry, debouncedSearchQuery]);

  const handleOrderPress = useCallback((orderId: string) => {
    navigation.navigate('OrderDetails', { orderId });
  }, [navigation]);
  
  // Memoized render item
  const renderOrderItem = useCallback(({ item }: { item: typeof filteredOrders[0] }) => (
    <ContentFadeIn delay={0} style={{ paddingHorizontal: 16, marginBottom: 12 }}>
      <OrderCard
        order={item}
        country={country}
        onPress={() => handleOrderPress(item.id)}
      />
    </ContentFadeIn>
  ), [country, handleOrderPress]);

  // Memoized key extractor
  const keyExtractor = useCallback((item: typeof filteredOrders[0]) => item.id, []);

  if (isLoading) {
    return (
      <View className="flex-1 bg-neutral-50">
        <AppHeader title="Manage Orders" />
        <View className="px-4 pt-4">
          <SkeletonCard type="order" count={3} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-neutral-50">
        <AppHeader title="Manage Orders" />
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
    <AnimatedView animation="fade" delay={0} className="px-4 pt-4 pb-2 bg-white">
      <Text className="text-2xl font-bold text-neutral-900 mb-4">Manage Orders</Text>

      <SearchBar
        value={searchQuery}
        onChangeText={handleSearchChange}
        onClear={() => {
          setSearchQuery('');
          setDebouncedSearchQuery('');
        }}
        placeholder="Search by order number..."
        style={{ marginBottom: 12 }}
      />

      <OrderFilter
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
      />

      {/* Country Filter */}
      <View className="mt-4 mb-2">
        <Text className="text-sm font-semibold text-neutral-700 mb-3">Country Filter</Text>
        <View className="flex-row gap-2">
          {(['all', 'germany', 'norway'] as const).map((countryOption) => (
            <TouchableOpacity
              key={countryOption}
              onPress={() => setSelectedCountry(countryOption)}
              className={`
                flex-1 flex-row items-center justify-center p-3 rounded-lg border-2
                ${selectedCountry === countryOption
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-neutral-200 bg-white'}
              `}
            >
              <Icon
                name={countryOption === 'germany' ? 'flag' : countryOption === 'norway' ? 'flag' : 'earth'}
                size={16}
                color={selectedCountry === countryOption ? colors.primary[500] : colors.neutral[500]}
                style={{ marginRight: 4 }}
              />
              <Text
                className={`
                  text-sm font-semibold capitalize
                  ${selectedCountry === countryOption ? 'text-primary-500' : 'text-neutral-600'}
                `}
              >
                {countryOption === 'all' ? 'All' : countryOption.charAt(0).toUpperCase() + countryOption.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Results Count */}
      <View className="flex-row items-center justify-between mt-3">
        <Text className="text-sm text-neutral-500">
          {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'} found
        </Text>
        {selectedStatus !== 'all' && (
          <Badge variant="primary" size="sm">
            {selectedStatus}
          </Badge>
        )}
        {selectedCountry !== 'all' && (
          <Badge variant="secondary" size="sm">
            {selectedCountry}
          </Badge>
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
              : "Orders will appear here"
          }
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neutral-50">
      <AppHeader title="Manage Orders" />

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

export default AdminOrdersScreen;
