import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
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
} from '../../components';
import { getFilteredOrders } from '../../utils/orderUtils';
import { debounce } from '../../utils/debounce';
import { COUNTRIES } from '../../constants';
import type { Country } from '../../constants';

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
    queryFn: () => orderService.getAllOrders(
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

  const handleOrderPress = (orderId: string) => {
    navigation.navigate('OrderDetails', { orderId });
  };

  if (isLoading) {
    return <LoadingScreen message="Loading orders..." />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <AppHeader title="Manage Orders" />
        <ErrorMessage
          message="Failed to load orders. Please try again."
          onRetry={() => refetch()}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Manage Orders" />

      <SearchBar
        value={searchQuery}
        onChangeText={handleSearchChange}
        onClear={() => {
          setSearchQuery('');
          setDebouncedSearchQuery('');
        }}
        placeholder="Search by order number..."
        style={styles.searchBar}
      />

      <OrderFilter
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
      />

      <View style={styles.countryFilter}>
        <Text style={styles.countryFilterLabel}>Country:</Text>
        <View style={styles.countryButtons}>
          {(['all', 'germany', 'norway'] as const).map((countryOption) => (
            <TouchableOpacity
              key={countryOption}
              style={[
                styles.countryButton,
                selectedCountry === countryOption && styles.countryButtonActive,
              ]}
              onPress={() => setSelectedCountry(countryOption)}
            >
              <Text
                style={[
                  styles.countryButtonText,
                  selectedCountry === countryOption && styles.countryButtonTextActive,
                ]}
              >
                {countryOption === 'all' ? 'All' : countryOption.charAt(0).toUpperCase() + countryOption.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {filteredOrders.length === 0 ? (
        <EmptyState
          icon={searchQuery ? "magnify" : "package-variant"}
          title={searchQuery ? "No orders found" : "No orders yet"}
          message={
            searchQuery
              ? "Try adjusting your search or filters"
              : "Orders will appear here"
          }
        />
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              country={item.country}
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
  countryFilter: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  countryFilterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  countryButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  countryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  countryButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  countryButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  countryButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
});

export default AdminOrdersScreen;
