/**
 * Modern Cart Screen with Swipe-to-Delete, Quantity Animations, and Sticky Total
 * Uses StyleSheet instead of className for better NativeWind compatibility
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, StyleSheet, Platform, Dimensions, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../types';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { useProducts } from '../../hooks/useProducts';
import { SwipeableCartItem, AppHeader, Button, EmptyState, LoadingScreen, ErrorMessage, AnimatedView, Card, useToast } from '../../components';
import { successHaptic, errorHaptic, warningHaptic } from '../../utils/hapticFeedback';
import { useSavedForLaterStore } from '../../store/savedForLaterStore';
import { formatCartSummary } from '../../utils/cartUtils';
import { validateCart, updateCartWithProductData } from '../../utils/cartValidation';
import { getProductStock } from '../../utils/productUtils';
import { COUNTRIES } from '../../constants';
import type { Country } from '../../constants';
import { colors } from '../../theme';
import {
  isSmallDevice,
  isTablet,
  isLandscape,
  getResponsivePadding,
  getResponsiveFontSize,
} from '../../utils/responsive';

type CartScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Cart'>;

const CartScreen = () => {
  const navigation = useNavigation<CartScreenNavigationProp>();
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuthStore();
  const { selectedCountry } = useCartStore();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  
  // Use user's country preference if authenticated, otherwise use selected country from cart store
  const country = (isAuthenticated && user?.country_preference) 
    ? user.country_preference 
    : (selectedCountry || COUNTRIES.GERMANY) as Country;
  
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
  
  // Calculate tab bar height to position button above it
  const tabBarHeight = Platform.OS === 'ios' ? 60 : 56;
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 8 : 4);
  const totalTabBarHeight = tabBarHeight + bottomPadding;
  
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
        useCartStore.setState({ items: updatedItems });
        useCartStore.getState().saveCart();
      }
    }
  }, [products]);

  // Validate cart
  const cartValidation = useMemo(() => {
    return validateCart(items);
  }, [items]);

  // Calculate totals
  const cartSummary = useMemo(() => {
    return formatCartSummary(items, country, null, false);
  }, [items, country]);

  const handleQuantityChange = async (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      await removeItem(productId);
    } else {
      const item = items.find((i) => i.product.id === productId);
      if (item) {
        const maxQuantity = getProductStock(item.product, item.selectedCountry);
        if (newQuantity > maxQuantity) {
          warningHaptic();
          showToast({
            message: `Only ${maxQuantity} available for ${item.product.name}`,
            type: 'warning',
            duration: 3000,
          });
          await updateQuantity(productId, maxQuantity);
        } else {
          await updateQuantity(productId, newQuantity);
          successHaptic();
          showToast({
            message: 'Quantity updated',
            type: 'success',
            duration: 2000,
          });
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
          onPress: async () => {
            try {
              await removeItem(productId);
              successHaptic();
              showToast({
                message: `${item?.product.name} removed from cart`,
                type: 'success',
                duration: 2000,
              });
            } catch (error) {
              console.error('Error removing item:', error);
              errorHaptic();
              showToast({
                message: 'Failed to remove item from cart',
                type: 'error',
                duration: 3000,
              });
            }
          },
        },
      ]
    );
  };

  const handleCheckout = () => {
    const { isAuthenticated } = useAuthStore.getState();
    
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
          actionLabel="Continue Shopping"
          onAction={() => navigation.navigate('Products')}
          suggestions={[
            'Browse our fresh and frozen products',
            'Check out trending items',
            'Use search to find specific products',
          ]}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: 'rgba(245, 245, 250, 0.95)' }]}>
      <AppHeader title="Shopping Cart" />
      
      {/* Sticky Order Summary Header */}
      <View style={[
        styles.stickySummaryHeader,
        {
          paddingHorizontal: padding.horizontal,
          maxWidth: isTabletDevice && !isLandscapeMode ? 600 : '100%',
          alignSelf: isTabletDevice && !isLandscapeMode ? 'center' : 'stretch',
        }
      ]}>
        <Card elevation="raised" style={styles.summaryCardSticky}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>
              {cartSummary.subtotal}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.totalValue}>
              {cartSummary.total}
            </Text>
          </View>
        </Card>
      </View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: 80, paddingBottom: totalTabBarHeight + (isTabletDevice ? 180 : 160) }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={async () => {
              await loadCart();
              // Refetch products to validate cart
              if (products.length > 0) {
                // Trigger validation
              }
            }}
            tintColor={colors.primary[500]}
            colors={[colors.primary[500]]}
          />
        }
      >
        <View style={[
          styles.content,
          {
            paddingHorizontal: padding.horizontal,
            paddingTop: padding.vertical,
            maxWidth: isTabletDevice && !isLandscapeMode ? 600 : '100%',
            alignSelf: isTabletDevice && !isLandscapeMode ? 'center' : 'stretch',
          }
        ]}>
          {!cartValidation.isValid && (
            <AnimatedView animation="fade" delay={0}>
              <Card elevation="raised" style={styles.warningCard}>
                <View style={styles.warningHeader}>
                  <Icon name="alert" size={20} color={colors.warning[500]} />
                  <Text style={styles.warningTitle}>
                    Cart Issues
                  </Text>
                </View>
                <Text style={styles.warningText}>
                  {cartValidation.errors.join(', ')}
                </Text>
              </Card>
            </AnimatedView>
          )}

          {/* Cart Items */}
          <View style={styles.cartItemsContainer}>
            {items.map((item, index) => (
              <AnimatedView
                key={item.product.id}
                animation="fade"
                delay={index * 50}
              >
                <SwipeableCartItem
                  item={item}
                  onQuantityChange={(quantity) =>
                    handleQuantityChange(item.product.id, quantity)
                  }
                  onRemove={() => handleRemoveItem(item.product.id)}
                  country={country}
                />
              </AnimatedView>
            ))}
          </View>

          {/* Order Summary (Detailed) - Only shown in scroll view for detailed breakdown */}
          <AnimatedView animation="slide" delay={items.length * 50} enterFrom="bottom">
            <Card elevation="raised" style={styles.summaryCard}>
              <Text style={[
                styles.summaryTitle,
                { fontSize: getResponsiveFontSize(18, 16, 20) }
              ]}>
                Order Summary
              </Text>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>
                  {cartSummary.subtotal}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery Fee</Text>
                <Text style={styles.summaryValueSecondary}>
                  {cartSummary.deliveryFee} (at checkout)
                </Text>
              </View>
              
              <View style={styles.totalContainer}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>
                    {cartSummary.total}
                  </Text>
                </View>
              </View>
            </Card>
          </AnimatedView>
        </View>
      </ScrollView>

      {/* Sticky Checkout Button - Positioned above tab bar */}
      <AnimatedView
        animation="slide"
        delay={100}
        enterFrom="bottom"
        style={[
          styles.checkoutContainer,
          {
            bottom: totalTabBarHeight,
            paddingHorizontal: padding.horizontal,
            maxWidth: isTabletDevice && !isLandscapeMode ? 600 : '100%',
            alignSelf: isTabletDevice && !isLandscapeMode ? 'center' : 'stretch',
          }
        ] as any}
      >
        <Button
          title={
            isSmall
              ? `Checkout • ${cartSummary.total}`
              : `→ Proceed to checkout • ${cartSummary.total}`
          }
          onPress={handleCheckout}
          disabled={!cartValidation.isValid}
          fullWidth
          size="lg"
        />
      </AnimatedView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(245, 245, 250, 0.95)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 180, // Increased to account for button + tab bar
  },
  content: {
    // paddingHorizontal and paddingTop will be set dynamically
  },
  warningCard: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'rgba(255, 243, 224, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.2)',
    borderRadius: 12,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.warning[700],
    marginLeft: 8,
  },
  warningText: {
    fontSize: 14,
    color: colors.warning[600],
  },
  cartItemsContainer: {
    marginBottom: 16,
  },
  stickySummaryHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'rgba(245, 245, 250, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
    paddingTop: 8,
    paddingBottom: 8,
  },
  summaryCardSticky: {
    padding: 12,
    marginBottom: 0,
  },
  summaryCard: {
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    // fontSize will be set dynamically
    fontWeight: 'bold',
    color: colors.neutral[900],
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: colors.neutral[600],
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[900],
  },
  summaryValueSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[500],
  },
  totalContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    paddingTop: 12,
    marginTop: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.neutral[900],
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary[500],
  },
  checkoutContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(58, 181, 209, 0.15)',
    paddingTop: 12,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    // paddingHorizontal is set dynamically
  },
});

// Set displayName for better debugging
CartScreen.displayName = 'CartScreen';

export default CartScreen;
