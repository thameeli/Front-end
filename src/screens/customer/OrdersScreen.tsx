import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
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
      <View style={styles.container}>
        <AppHeader title="My Orders" />
        <View style={styles.loadingContainer}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <SkeletonLoader width="100%" height={120} borderRadius={12} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <AppHeader title="My Orders" />
        <ErrorMessage
          message="Failed to load orders. Please try again."
          onRetry={() => refetch()}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="My Orders" />
      
      <SearchBar
        value={searchQuery}
        onChangeText={handleSearchChange}
        onClear={handleClearSearch}
        placeholder="Search by order number..."
        style={styles.searchBar}
      />

      <OrderFilter
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
      />

      {filteredOrders.length === 0 ? (
        <EmptyState
          icon={searchQuery ? "magnify" : "package-variant"}
          title={searchQuery ? "No orders found" : "No orders yet"}
          message={
            searchQuery
              ? "Try adjusting your search or filters"
              : "Your order history will appear here"
          }
        />
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              country={country}
              onPress={() => handleOrderPress(item.id)}
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
  loadingContainer: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  skeletonCard: {
    marginBottom: 12,
  },
});

export default OrdersScreen;
