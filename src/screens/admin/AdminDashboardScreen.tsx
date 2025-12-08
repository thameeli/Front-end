import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { orderService } from '../../services/orderService';
import { productService } from '../../services/productService';
import { AppHeader, StatisticsCard, OrderCard, LoadingScreen, ErrorMessage } from '../../components';
import { useOrderRealtime } from '../../hooks/useOrderRealtime';
import { formatPrice } from '../../utils/productUtils';
import { COUNTRIES } from '../../constants';
import type { Country } from '../../constants';
import type { Order } from '../../types';

const AdminDashboardScreen = () => {
  const { user } = useAuthStore();
  const country = (user?.country_preference || COUNTRIES.GERMANY) as Country;

  // Set up real-time updates
  useOrderRealtime(user?.id || '');

  // Fetch all orders
  const { data: allOrders = [], isLoading: loadingOrders, refetch, isRefetching } = useQuery({
    queryKey: ['allOrders'],
    queryFn: () => orderService.getAllOrders(),
  });

  // Fetch all products
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => productService.getProducts({ active: true }),
  });

  // Calculate statistics
  const statistics = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = allOrders.filter((order) => {
      const orderDate = new Date(order.created_at);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    });

    const totalRevenue = allOrders
      .filter((order) => order.status !== 'cancelled')
      .reduce((sum, order) => sum + order.total_amount, 0);

    const todayRevenue = todayOrders
      .filter((order) => order.status !== 'cancelled')
      .reduce((sum, order) => sum + order.total_amount, 0);

    const pendingOrders = allOrders.filter((order) => order.status === 'pending').length;

    return {
      totalOrders: allOrders.length,
      todayOrders: todayOrders.length,
      totalRevenue,
      todayRevenue,
      pendingOrders,
      totalProducts: products.length,
    };
  }, [allOrders, products]);

  // Get recent orders
  const recentOrders = React.useMemo(() => {
    return allOrders
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [allOrders]);

  if (loadingOrders) {
    return <LoadingScreen message="Loading dashboard..." />;
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Admin Dashboard" />
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <View style={styles.statsGrid}>
          <StatisticsCard
            label="Total Orders"
            value={statistics.totalOrders}
            icon="package-variant"
            iconColor="#007AFF"
            style={styles.statCard}
          />
          <StatisticsCard
            label="Today's Orders"
            value={statistics.todayOrders}
            icon="calendar-today"
            iconColor="#34C759"
            style={styles.statCard}
          />
        </View>

        <View style={styles.statsGrid}>
          <StatisticsCard
            label="Total Revenue"
            value={formatPrice(statistics.totalRevenue, country)}
            icon="currency-usd"
            iconColor="#FF9500"
            style={styles.statCard}
          />
          <StatisticsCard
            label="Today's Revenue"
            value={formatPrice(statistics.todayRevenue, country)}
            icon="trending-up"
            iconColor="#5856D6"
            style={styles.statCard}
          />
        </View>

        <View style={styles.statsGrid}>
          <StatisticsCard
            label="Pending Orders"
            value={statistics.pendingOrders}
            icon="clock-outline"
            iconColor="#FF3B30"
            style={styles.statCard}
          />
          <StatisticsCard
            label="Total Products"
            value={statistics.totalProducts}
            icon="store"
            iconColor="#007AFF"
            style={styles.statCard}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          {recentOrders.length === 0 ? (
            <Text style={styles.emptyText}>No recent orders</Text>
          ) : (
            recentOrders.map((order) => (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderNumber}>
                    #{order.id.slice(0, 8).toUpperCase()}
                  </Text>
                  <Text style={styles.orderAmount}>
                    {formatPrice(order.total_amount, country)}
                  </Text>
                </View>
                <Text style={styles.orderDate}>
                  {new Date(order.created_at).toLocaleDateString()}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  orderDate: {
    fontSize: 12,
    color: '#666',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
});

export default AdminDashboardScreen;
