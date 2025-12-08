import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '../../services/orderService';
import { productService } from '../../services/productService';
import { AppHeader, OrderReceipt, Button, LoadingScreen, ErrorMessage } from '../../components';
import { COUNTRIES } from '../../constants';
import type { Country } from '../../constants';
import type { OrderItem } from '../../types';

type OrderConfirmationScreenRouteProp = RouteProp<RootStackParamList, 'OrderConfirmation'>;
type OrderConfirmationScreenNavigationProp = StackNavigationProp<RootStackParamList, 'OrderConfirmation'>;

const OrderConfirmationScreen = () => {
  const route = useRoute<OrderConfirmationScreenRouteProp>();
  const navigation = useNavigation<OrderConfirmationScreenNavigationProp>();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { orderId } = route.params;
  const country = (user?.country_preference || COUNTRIES.GERMANY) as Country;

  // Fetch order
  const { data: order, isLoading: loadingOrder, error: orderError } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderService.getOrderById(orderId),
    enabled: !!orderId,
  });

  // Fetch order items
  const { data: orderItems = [], isLoading: loadingItems } = useQuery({
    queryKey: ['orderItems', orderId],
    queryFn: () => orderService.getOrderItems(orderId),
    enabled: !!orderId,
  });

  // Fetch product details for order items
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => productService.getProducts({ active: true }),
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
        <AppHeader title="Order Confirmation" showBack />
        <ErrorMessage message="Failed to load order details. Please try again." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Order Confirmation" showBack={false} />
      <ScrollView style={styles.content}>
        <OrderReceipt
          order={order}
          orderItems={enrichedOrderItems}
          country={country}
        />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="View Orders"
          onPress={() => navigation.navigate('Orders')}
          fullWidth
          style={styles.button}
        />
        <Button
          title="Continue Shopping"
          onPress={() => navigation.navigate('Products')}
          variant="outline"
          fullWidth
          style={styles.button}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  button: {
    marginTop: 0,
  },
});

export default OrderConfirmationScreen;
