import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { RootStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { orderService } from '../../services/orderService';
import { useOrderPolling } from '../../hooks/useOrderPolling';
import { productService } from '../../services/productService';
import { pickupPointService } from '../../services';
import {
  AppHeader,
  OrderStatusBadge,
  OrderStatusTimeline,
  OrderReceipt,
  LoadingScreen,
  ErrorMessage,
  Card,
  OrderStatusUpdate,
} from '../../components';
import { formatPrice } from '../../utils/productUtils';
import { formatDateTime } from '../../utils/regionalFormatting';
import { COUNTRIES } from '../../constants';
import type { Country } from '../../constants';
import {
  isSmallDevice,
  isTablet,
  isLandscape,
  getResponsivePadding,
  getResponsiveFontSize,
} from '../../utils/responsive';

type OrderDetailsScreenRouteProp = RouteProp<RootStackParamList, 'OrderDetails'>;
type OrderDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'OrderDetails'>;

const OrderDetailsScreen = () => {
  const route = useRoute<OrderDetailsScreenRouteProp>();
  const navigation = useNavigation<OrderDetailsScreenNavigationProp>();
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuthStore();
  const { selectedCountry } = useCartStore();
  const queryClient = useQueryClient();
  const { orderId } = route.params;
  
  // Responsive dimensions
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const isSmall = isSmallDevice();
  const isTabletDevice = isTablet();
  const isLandscapeMode = isLandscape();
  const padding = getResponsivePadding();
  
  // Update dimensions on orientation change
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });
    return () => subscription?.remove();
  }, []);
  
  // Use user's country preference if authenticated, otherwise use selected country from cart store
  const country = (isAuthenticated && user?.country_preference) 
    ? user.country_preference 
    : (selectedCountry || COUNTRIES.GERMANY) as Country;

  // Fetch order with real-time polling (only for pending/confirmed/out_for_delivery orders)
  const shouldPoll = order?.status && ['pending', 'confirmed', 'out_for_delivery'].includes(order.status);
  
  const { order: polledOrder, isLoading: loadingOrder, error: orderError } = useOrderPolling({
    orderId,
    enabled: shouldPoll && !!orderId,
    pollInterval: 10000, // Poll every 10 seconds
    onStatusChange: (newStatus) => {
      // Show notification when status changes
      if (newStatus === 'out_for_delivery') {
        Alert.alert('Order Update', 'Your order is now out for delivery!');
      } else if (newStatus === 'delivered') {
        Alert.alert('Order Delivered', 'Your order has been delivered!');
      }
    },
  });

  // Use polled order if available, otherwise fallback to regular query
  const { data: fallbackOrder } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderService.getOrderById(orderId),
    enabled: !!orderId && !shouldPoll,
  });

  const order = polledOrder || fallbackOrder;

  // Fetch order items
  const { data: orderItems = [], isLoading: loadingItems } = useQuery({
    queryKey: ['orderItems', orderId],
    queryFn: () => orderService.getOrderItems(orderId),
    enabled: !!orderId,
  });

  // Fetch product details
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => productService.getProducts({ active: true }),
  });

  // Fetch pickup point if applicable
  const { data: pickupPoint } = useQuery({
    queryKey: ['pickupPoint', order?.pickup_point_id],
    queryFn: () => order?.pickup_point_id
      ? pickupPointService.getPickupPointById(order.pickup_point_id)
      : null,
    enabled: !!order?.pickup_point_id,
  });

  // Enrich order items with product data
  const enrichedOrderItems = React.useMemo(() => {
    return orderItems.map((item) => ({
      ...item,
      product: products.find((p) => p.id === item.product_id),
    }));
  }, [orderItems, products]);

  if (loadingOrder || loadingItems) {
    return <LoadingScreen message="Loading order details..." />;
  }

  if (orderError || !order) {
    return (
      <View style={styles.container}>
        <AppHeader title="Order Details" showBack />
        <ErrorMessage message="Failed to load order details. Please try again." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Order Details" showBack />
      <ScrollView style={[
        styles.content,
        {
          padding: padding.horizontal,
          paddingBottom: padding.vertical * 2,
        }
      ]}>
        <Card style={styles.headerCard}>
          <View style={[
            styles.headerRow,
            {
              flexDirection: isSmall || isLandscapeMode ? 'column' : 'row',
              gap: isSmall || isLandscapeMode ? 12 : 0,
            }
          ]}>
            <View style={styles.orderInfo}>
              <Text 
                style={[
                  styles.orderNumber,
                  { fontSize: getResponsiveFontSize(20, 18, 22) }
                ]}
                accessibilityRole="header"
                accessibilityLabel={`Order number: ${order.id.slice(0, 8).toUpperCase()}`}
              >
                Order #{order.id.slice(0, 8).toUpperCase()}
              </Text>
              <Text 
                style={[
                  styles.orderDate,
                  { fontSize: getResponsiveFontSize(14, 12, 16) }
                ]}
                accessibilityLabel={`Order date: ${formatDateTime(order.created_at, country)}`}
              >
                {formatDateTime(order.created_at, country)}
              </Text>
            </View>
            <OrderStatusBadge status={order.status} />
          </View>
        </Card>

        <OrderStatusTimeline currentStatus={order.status} style={styles.section} />

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Information</Text>
          {order.pickup_point_id && pickupPoint ? (
            <View style={[
              styles.infoRow,
              {
                flexDirection: isSmall || isLandscapeMode ? 'column' : 'row',
              }
            ]}>
              <Icon name="map-marker" size={20} color="#007AFF" accessibilityElementsHidden />
              <View style={styles.infoContent} accessibilityRole="text">
                <Text style={styles.infoLabel}>Pickup Point</Text>
                <Text 
                  style={styles.infoValue}
                  accessibilityLabel={`Pickup point: ${pickupPoint.name}`}
                >
                  {pickupPoint.name}
                </Text>
                <Text 
                  style={styles.infoSubtext}
                  accessibilityLabel={`Address: ${pickupPoint.address}`}
                >
                  {pickupPoint.address}
                </Text>
                <Text 
                  style={styles.infoFee}
                  accessibilityLabel={`Delivery fee: ${formatPrice(pickupPoint.delivery_fee, country)}`}
                >
                  Delivery fee: {formatPrice(pickupPoint.delivery_fee, country)}
                </Text>
              </View>
            </View>
          ) : order.delivery_address ? (
            <View style={[
              styles.infoRow,
              {
                flexDirection: isSmall || isLandscapeMode ? 'column' : 'row',
              }
            ]}>
              <Icon name="home" size={20} color="#007AFF" accessibilityElementsHidden />
              <View style={styles.infoContent} accessibilityRole="text">
                <Text style={styles.infoLabel}>Delivery Address</Text>
                <Text 
                  style={styles.infoValue}
                  accessibilityLabel={`Delivery address: ${order.delivery_address}`}
                >
                  {order.delivery_address}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.noInfo}>No delivery information available</Text>
          )}
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Information</Text>
          <View style={[
            styles.infoRow,
            {
              flexDirection: isSmall || isLandscapeMode ? 'column' : 'row',
            }
          ]}>
            <Icon name="credit-card" size={20} color="#007AFF" accessibilityElementsHidden />
            <View style={styles.infoContent} accessibilityRole="text">
              <Text style={styles.infoLabel}>Payment Method</Text>
              <Text 
                style={styles.infoValue}
                accessibilityLabel={`Payment method: ${order.payment_method === 'online' ? 'Online Payment' : 'Cash on Delivery'}`}
              >
                {order.payment_method === 'online' ? 'Online Payment' : 'Cash on Delivery'}
              </Text>
            </View>
          </View>
          <View style={[
            styles.infoRow,
            {
              flexDirection: isSmall || isLandscapeMode ? 'column' : 'row',
            }
          ]}>
            <Icon name="check-circle" size={20} color="#34C759" accessibilityElementsHidden />
            <View style={styles.infoContent} accessibilityRole="text">
              <Text style={styles.infoLabel}>Payment Status</Text>
              <Text 
                style={[styles.infoValue, styles.paymentStatus]}
                accessibilityLabel={`Payment status: ${order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}`}
              >
                {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
              </Text>
            </View>
          </View>
        </Card>

        <OrderReceipt
          order={order}
          orderItems={enrichedOrderItems}
          country={country}
          style={styles.section}
        />

        {user?.role === 'admin' && (
          <Card style={styles.section}>
            <OrderStatusUpdate
              currentStatus={order.status}
              onStatusChange={async (newStatus) => {
                try {
                  await orderService.updateOrderStatus(order.id, newStatus);
                  // Invalidate queries to refresh data
                  queryClient.invalidateQueries({ queryKey: ['order', orderId] });
                  queryClient.invalidateQueries({ queryKey: ['orders'] });
                  queryClient.invalidateQueries({ queryKey: ['allOrders'] });
                } catch (error: any) {
                  Alert.alert('Error', error.message || 'Failed to update order status');
                }
              }}
            />
          </Card>
        )}
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
    // padding is set dynamically
  },
  section: {
    marginBottom: 16,
  },
  headerCard: {
    marginBottom: 16,
  },
  headerRow: {
    // flexDirection is set dynamically
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  infoRow: {
    // flexDirection will be set dynamically for small screens
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  infoSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoFee: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  noInfo: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  paymentStatus: {
    textTransform: 'capitalize',
  },
});

export default OrderDetailsScreen;
