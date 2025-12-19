/**
 * Modern Admin Dashboard with Modern Cards and Animated Charts
 * Uses NativeWind for styling and Phase 2 components
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { orderService } from '../../services/orderService';
import { productService } from '../../services/productService';
import { AppHeader, StatisticsCard, OrderCard, LoadingScreen, ErrorMessage, AnimatedView, Card, SkeletonCard, ContentFadeIn } from '../../components';
import { useOrderRealtime } from '../../hooks/useOrderRealtime';
import { formatPrice } from '../../utils/productUtils';
import { formatDate } from '../../utils/regionalFormatting';
import { COUNTRIES } from '../../constants';
import type { Country } from '../../constants';
import type { Order } from '../../types';
import { RootStackParamList } from '../../types';
import { colors } from '../../theme';
import {
  isSmallDevice,
  isTablet,
  getResponsivePadding,
  getColumnCount,
} from '../../utils/responsive';

type AdminDashboardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AdminDashboard'>;

const AdminDashboardScreen = () => {
  const navigation = useNavigation<AdminDashboardScreenNavigationProp>();
  const { user } = useAuthStore();
  const country = (user?.country_preference || COUNTRIES.GERMANY) as Country;
  
  // Responsive dimensions
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const isSmall = isSmallDevice();
  const isTabletDevice = isTablet();
  const numColumns = getColumnCount();
  const padding = getResponsivePadding();
  
  // Update dimensions on orientation change
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });
    return () => subscription?.remove();
  }, []);

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
    return (
      <View className="flex-1 bg-neutral-50">
        <AppHeader title="Admin Dashboard" />
        <View className="px-4 pt-4">
          <SkeletonCard type="custom" count={6} />
        </View>
      </View>
    );
  }

  const handleOrderPress = (orderId: string) => {
    navigation.navigate('OrderDetails', { orderId });
  };

  return (
    <View className="flex-1 bg-neutral-50">
      <AppHeader title="Admin Dashboard" />
      
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={{
          paddingHorizontal: padding.horizontal,
          paddingTop: padding.vertical,
          maxWidth: isTabletDevice ? 1200 : '100%',
          alignSelf: isTabletDevice ? 'center' : 'stretch',
        }}>
          {/* Statistics Grid */}
          <AnimatedView animation="fade" delay={0}>
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 16,
            }}>
              {[
                { label: "Total Orders", value: statistics.totalOrders.toString(), icon: "package-variant", iconColor: colors.primary[500] },
                { label: "Today's Orders", value: statistics.todayOrders.toString(), icon: "calendar-today", iconColor: colors.success[500] },
                { label: "Total Revenue", value: formatPrice(statistics.totalRevenue, country), icon: "currency-usd", iconColor: colors.warning[500] },
                { label: "Today's Revenue", value: formatPrice(statistics.todayRevenue, country), icon: "trending-up", iconColor: colors.secondary[500] },
                { label: "Pending Orders", value: statistics.pendingOrders.toString(), icon: "clock-outline", iconColor: colors.error[500] },
                { label: "Total Products", value: statistics.totalProducts.toString(), icon: "store", iconColor: colors.primary[500] },
              ].map((stat, index) => (
                <View
                  key={index}
                  style={{
                    width: isSmall ? '100%' : isTabletDevice ? '31%' : '48%',
                  }}
                >
                  <StatisticsCard
                    label={stat.label}
                    value={stat.value}
                    icon={stat.icon as any}
                    iconColor={stat.iconColor}
                  />
                </View>
              ))}
            </View>
          </AnimatedView>

          {/* Quick Actions */}
          <AnimatedView animation="slide" delay={100} enterFrom="bottom" className="mb-4">
            <Card elevation="raised" className="p-4">
              <Text className="text-lg font-bold text-neutral-900 mb-4">
                Quick Actions
              </Text>
              <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 12,
              }}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('AdminProducts' as never)}
                  style={{
                    flex: isSmall ? 0 : 1,
                    minWidth: isSmall ? '100%' : '48%',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 16,
                    backgroundColor: colors.primary[50],
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: colors.primary[200],
                  }}
                >
                  <Icon name="store" size={24} color={colors.primary[500]} />
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: colors.primary[500],
                    marginLeft: 8,
                  }}>
                    Products
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => navigation.navigate('AdminOrders' as never)}
                  style={{
                    flex: isSmall ? 0 : 1,
                    minWidth: isSmall ? '100%' : '48%',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 16,
                    backgroundColor: colors.success[50],
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: colors.success[200],
                  }}
                >
                  <Icon name="package-variant" size={24} color={colors.success[500]} />
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: colors.success[500],
                    marginLeft: 8,
                  }}>
                    Orders
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          </AnimatedView>

          {/* Recent Orders */}
          <AnimatedView animation="fade" delay={200} className="mb-4">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-neutral-900">
                Recent Orders
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('AdminOrders' as never)}
                className="flex-row items-center"
              >
                <Text className="text-sm text-primary-500 font-semibold mr-1">
                  View All
                </Text>
                <Icon name="arrow-right" size={16} color={colors.primary[500]} />
              </TouchableOpacity>
            </View>

            {recentOrders.length === 0 ? (
              <Card elevation="flat" className="p-8 items-center">
                <Icon name={"package-variant-off" as any} size={48} color={colors.neutral[400]} />
                <Text className="text-base text-neutral-500 mt-4 text-center">
                  No recent orders
                </Text>
              </Card>
            ) : (
              <View className="gap-3">
                {recentOrders.map((order, index) => (
                  <ContentFadeIn key={order.id} delay={300 + index * 50}>
                    <Card
                      elevation="card"
                      onPress={() => handleOrderPress(order.id)}
                      className="p-4"
                    >
                      <View className="flex-row items-center justify-between mb-2">
                        <View className="flex-row items-center">
                          <Icon
                            name="receipt"
                            size={20}
                            color={colors.primary[500]}
                            style={{ marginRight: 8 }}
                          />
                          <Text className="text-base font-bold text-neutral-900">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </Text>
                        </View>
                        <Text className="text-lg font-bold text-primary-500">
                          {formatPrice(order.total_amount, country)}
                        </Text>
                      </View>
                      <View className="flex-row items-center justify-between">
                        <Text 
                          className="text-sm text-neutral-500"
                          accessibilityLabel={`Order date: ${formatDate(order.created_at, country)}`}
                        >
                          {formatDate(order.created_at, country)}
                        </Text>
                        <View
                          className={`px-2 py-1 rounded-full ${
                            order.status === 'pending'
                              ? 'bg-warning-100'
                              : order.status === 'confirmed'
                              ? 'bg-primary-100'
                              : order.status === 'delivered'
                              ? 'bg-success-100'
                              : 'bg-neutral-100'
                          }`}
                        >
                          <Text
                            className={`text-xs font-semibold capitalize ${
                              order.status === 'pending'
                                ? 'text-warning-700'
                                : order.status === 'confirmed'
                                ? 'text-primary-700'
                                : order.status === 'delivered'
                                ? 'text-success-700'
                                : 'text-neutral-700'
                            }`}
                          >
                            {order.status}
                          </Text>
                        </View>
                      </View>
                    </Card>
                  </ContentFadeIn>
                ))}
              </View>
            )}
          </AnimatedView>
        </View>
      </ScrollView>
    </View>
  );
};

export default AdminDashboardScreen;
