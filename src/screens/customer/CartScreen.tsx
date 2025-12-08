import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../../types';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { useProducts } from '../../hooks/useProducts';
import { CartItem, AppHeader, Button, EmptyState, LoadingScreen, ErrorMessage } from '../../components';
import { formatCartSummary } from '../../utils/cartUtils';
import { validateCart, updateCartWithProductData } from '../../utils/cartValidation';
import { COUNTRIES } from '../../constants';
import type { Country } from '../../constants';

type CartScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Cart'>;

const CartScreen = () => {
  const navigation = useNavigation<CartScreenNavigationProp>();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const country = (user?.country_preference || COUNTRIES.GERMANY) as Country;
  
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    loadCart,
  } = useCartStore();

  // Fetch all products to validate cart
  const { data: products = [] } = useProducts({ active: true });

  useEffect(() => {
    loadCart();
  }, []);

  // Update cart with latest product data
  useEffect(() => {
    if (products.length > 0 && items.length > 0) {
      const updatedItems = updateCartWithProductData(items, products);
      if (updatedItems.length !== items.length) {
        // Some items were removed, update cart
        useCartStore.setState({ items: updatedItems });
        useCartStore.getState().saveCart();
      }
    }
  }, [products]);

  // Validate cart
  const cartValidation = useMemo(() => {
    return validateCart(items);
  }, [items]);

  // Calculate totals (using placeholder for pickup point - will be set in checkout)
  const cartSummary = useMemo(() => {
    return formatCartSummary(items, country, null, false);
  }, [items, country]);

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId);
    } else {
      const item = items.find((i) => i.product.id === productId);
      if (item) {
        const maxQuantity = item.product.stock;
        if (newQuantity > maxQuantity) {
          Alert.alert(
            'Stock Limit',
            `Only ${maxQuantity} available for ${item.product.name}`
          );
          updateQuantity(productId, maxQuantity);
        } else {
          updateQuantity(productId, newQuantity);
        }
      }
    }
  };

  const handleRemoveItem = (productId: string) => {
    const item = items.find((i) => i.product.id === productId);
    Alert.alert(
      'Remove Item',
      `Remove ${item?.product.name} from cart?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeItem(productId),
        },
      ]
    );
  };

  const handleCheckout = () => {
    const { isAuthenticated } = useAuthStore.getState();
    
    // Check if user is authenticated
    if (!isAuthenticated) {
      Alert.alert(
        t('auth.loginRequired') || 'Login Required',
        t('auth.loginToCheckout') || 'Please login or sign up to proceed with checkout',
        [
          { text: t('common.cancel') || 'Cancel', style: 'cancel' },
          {
            text: t('auth.login') || 'Login',
            onPress: () => navigation.navigate('Login'),
          },
          {
            text: t('auth.register') || 'Sign Up',
            onPress: () => navigation.navigate('Register'),
            style: 'default',
          },
        ]
      );
      return;
    }

    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart');
      return;
    }

    if (!cartValidation.isValid) {
      Alert.alert(
        'Cart Issues',
        cartValidation.errors.join('\n') +
          '\n\nPlease update your cart before checkout.'
      );
      return;
    }

    navigation.navigate('Checkout');
  };

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <AppHeader title="Shopping Cart" />
        <EmptyState
          icon="cart-off"
          title="Your cart is empty"
          message="Add some products to get started!"
        />
        <View style={styles.emptyCartActions}>
          <Button
            title="Continue Shopping"
            onPress={() => navigation.navigate('Products')}
            fullWidth
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Shopping Cart" />
      <ScrollView style={styles.content}>
        {!cartValidation.isValid && (
          <ErrorMessage
            message={cartValidation.errors.join(', ')}
            type="warning"
            style={styles.errorMessage}
          />
        )}

        <View style={styles.itemsList}>
          {items.map((item) => (
            <CartItem
              key={item.product.id}
              item={item}
              onQuantityChange={(quantity) =>
                handleQuantityChange(item.product.id, quantity)
              }
              onRemove={() => handleRemoveItem(item.product.id)}
              country={country}
            />
          ))}
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{cartSummary.subtotal}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>
              {cartSummary.deliveryFee} (at checkout)
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{cartSummary.total}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={`Proceed to Checkout (${cartSummary.total})`}
          onPress={handleCheckout}
          disabled={!cartValidation.isValid}
          fullWidth
          style={styles.checkoutButton}
        />
      </View>
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
  errorMessage: {
    marginBottom: 16,
  },
  itemsList: {
    marginBottom: 16,
  },
  summary: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  checkoutButton: {
    marginTop: 0,
  },
  emptyCartActions: {
    padding: 16,
  },
});

export default CartScreen;
