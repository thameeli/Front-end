/**
 * Modern Checkout Screen with Step Indicator and Smooth Form Progression
 * Uses NativeWind for styling and Phase 2 components
 */

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, StyleSheet, Platform, Linking, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { RootStackParamList, PaymentMethod } from '../../types';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { pickupPointService } from '../../services';
import { orderService } from '../../services/orderService';
import { stripeService } from '../../services/stripeService';
import {
  AppHeader,
  OrderSummary,
  PickupPointSelector,
  DeliveryAddressForm,
  PaymentMethodSelector,
  Button,
  LoadingOverlay,
  ErrorMessage,
  AnimatedView,
  Badge,
  EmptyState,
  TrustBadge,
} from '../../components';
import StripePaymentButton from '../../components/StripePaymentButton';
import { formatCartSummary, calculateDeliveryFee } from '../../utils/cartUtils';
import { validateCheckout, CheckoutFormData } from '../../utils/checkoutValidation';
import { validateCart } from '../../utils/cartValidation';
import { COUNTRIES } from '../../constants';
import type { Country } from '../../constants';
import { colors } from '../../theme';
import {
  isSmallDevice,
  isTablet,
  isLandscape,
  getScreenWidth,
  getResponsivePadding,
  getResponsiveFontSize,
  MIN_TOUCH_TARGET,
} from '../../utils/responsive';

type CheckoutScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Checkout'>;

type CheckoutStep = 'summary' | 'delivery' | 'payment' | 'review';

const CheckoutScreen = () => {
  const navigation = useNavigation<CheckoutScreenNavigationProp>();
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuthStore();
  const { items, clearCart, selectedCountry } = useCartStore();
  
  // Use user's country preference if authenticated, otherwise use selected country from cart store
  const country = (isAuthenticated && user?.country_preference) 
    ? user.country_preference 
    : (selectedCountry || COUNTRIES.GERMANY) as Country;
  const insets = useSafeAreaInsets();
  
  // Responsive dimensions
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const screenWidth = screenData.width;
  const screenHeight = screenData.height;
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
  
  // Calculate tab bar height to position sticky button above it
  const tabBarHeight = Platform.OS === 'ios' ? 60 : 56;
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 8 : 4);
  const totalTabBarHeight = tabBarHeight + bottomPadding;

  const [currentStep, setCurrentStep] = useState<CheckoutStep>('summary');
  const [isHomeDelivery, setIsHomeDelivery] = useState(false);
  const [selectedPickupPointId, setSelectedPickupPointId] = useState<string | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: '',
    postalCode: '',
    phone: user?.phone || '',
    instructions: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentIntentClientSecret, setPaymentIntentClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [isCreatingPaymentIntent, setIsCreatingPaymentIntent] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  // Fetch pickup points
  const { data: pickupPoints = [], isLoading: loadingPickupPoints } = useQuery({
    queryKey: ['pickupPoints', country],
    queryFn: () => pickupPointService.getPickupPoints(country),
  });

  // Calculate totals
  const selectedPickupPoint = useMemo(() => {
    return pickupPoints.find((p) => p.id === selectedPickupPointId) || null;
  }, [pickupPoints, selectedPickupPointId]);

  const cartSummary = useMemo(() => {
    return formatCartSummary(
      items,
      country,
      selectedPickupPoint,
      isHomeDelivery
    );
  }, [items, country, selectedPickupPoint, isHomeDelivery]);

  // Validate cart
  const cartValidation = useMemo(() => {
    return validateCart(items);
  }, [items]);

  const steps: { key: CheckoutStep; label: string; icon: string }[] = [
    { key: 'summary', label: 'Summary', icon: 'receipt' },
    { key: 'delivery', label: 'Delivery', icon: 'truck-delivery' },
    { key: 'payment', label: 'Payment', icon: 'credit-card' },
    { key: 'review', label: 'Review', icon: 'check-circle' },
  ];

  const getCurrentStepIndex = () => {
    return steps.findIndex((s) => s.key === currentStep);
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 'summary':
        return cartValidation.isValid;
      case 'delivery':
        return isHomeDelivery
          ? deliveryAddress.street && deliveryAddress.city && deliveryAddress.postalCode
          : selectedPickupPointId !== null;
      case 'payment':
        return paymentMethod !== null;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!canProceedToNextStep()) {
      Alert.alert('Incomplete', 'Please complete all required fields to continue');
      return;
    }

    const currentIndex = getCurrentStepIndex();
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].key);
    }
  };

  const handleBack = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].key);
    } else {
      navigation.goBack();
    }
  };

  // Create order first (for both COD and online payment)
  const createOrder = async () => {
    if (!user) {
      throw new Error('Please login to place an order');
    }

    if (!cartValidation.isValid) {
      throw new Error(cartValidation.errors.join('\n'));
    }

    const formData: CheckoutFormData = {
      isHomeDelivery,
      pickupPointId: selectedPickupPointId,
      deliveryAddress,
      paymentMethod,
      paymentDetails,
    };

    const validation = validateCheckout(formData, country);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      // Create a more helpful error message listing missing fields
      const errorMessages = Object.values(validation.errors);
      const errorMessage = errorMessages.length > 0
        ? `Please fix the following:\n${errorMessages.join('\n')}`
        : 'Please fill in all required fields correctly.';
      throw new Error(errorMessage);
    }

    setValidationErrors({});

    const orderItems = items.map((item) => {
      const price = country === COUNTRIES.GERMANY
        ? item.product.price_germany
        : item.product.price_denmark;
      return {
        product_id: item.product.id,
        quantity: item.quantity,
        price,
      };
    });

    const deliveryAddressString = isHomeDelivery
      ? `${deliveryAddress.street}, ${deliveryAddress.city}, ${deliveryAddress.postalCode}${deliveryAddress.instructions ? ` - ${deliveryAddress.instructions}` : ''}`
      : undefined;

    const order = await orderService.createOrder({
      user_id: user.id,
      country,
      payment_method: paymentMethod!,
      pickup_point_id: isHomeDelivery ? undefined : selectedPickupPointId!,
      delivery_address: deliveryAddressString,
      delivery_fee: cartSummary.deliveryFeeValue,
      items: orderItems,
    });

    return order;
  };

  // Create payment intent for online payment
  const handleCreatePaymentIntent = async () => {
    if (paymentMethod !== 'online') {
      return;
    }

    try {
      setIsCreatingPaymentIntent(true);
      
      // First create the order
      const order = await createOrder();
      setCreatedOrderId(order.id);

      // Create payment intent
      const currency = country === COUNTRIES.GERMANY ? 'eur' : 'nok';
      const paymentIntent = await stripeService.createPaymentIntent({
        orderId: order.id,
        amount: cartSummary.totalValue,
        currency,
        metadata: {
          userId: user!.id,
          country,
        },
      });

      setPaymentIntentClientSecret(paymentIntent.clientSecret);
      setPaymentIntentId(paymentIntent.paymentIntentId);
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      Alert.alert(
        'Payment Error',
        error.message || 'Failed to initialize payment. Please try again.'
      );
      setIsCreatingPaymentIntent(false);
    }
  };

  // Handle payment success
  const handlePaymentSuccess = async () => {
    try {
      if (createdOrderId) {
        // Update order payment status
        await orderService.updatePaymentStatus(createdOrderId, 'paid');
        
        clearCart();
        navigation.replace('OrderConfirmation', { orderId: createdOrderId });
      }
    } catch (error: any) {
      console.error('Error updating order after payment:', error);
      Alert.alert(
        'Order Update Error',
        'Payment was successful but there was an error updating your order. Please contact support.'
      );
    } finally {
      setIsProcessing(false);
      setIsCreatingPaymentIntent(false);
    }
  };

  // Handle payment failure
  const handlePaymentFailure = (error: string) => {
    Alert.alert('Payment Failed', error || 'Payment could not be processed. Please try again.');
    setIsProcessing(false);
    setIsCreatingPaymentIntent(false);
    // Reset payment intent to allow retry
    setPaymentIntentClientSecret(null);
    setPaymentIntentId(null);
  };

  // Handle COD order placement
  const handlePlaceCODOrder = async () => {
    setIsProcessing(true);
    try {
      const order = await createOrder();
      // COD orders are already created with pending payment status
      clearCart();
      navigation.replace('OrderConfirmation', { orderId: order.id });
    } catch (error: any) {
      console.error('Error placing COD order:', error);
      Alert.alert(
        'Order Failed',
        error.message || 'Failed to place order. Please try again.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle place order button click
  const handlePlaceOrder = async () => {
    if (paymentMethod === 'cod') {
      await handlePlaceCODOrder();
    } else if (paymentMethod === 'online') {
      if (!paymentIntentClientSecret) {
        // Create payment intent first
        await handleCreatePaymentIntent();
      } else {
        // Payment intent already created, payment should be handled by StripePaymentButton
        // This shouldn't happen, but just in case
        Alert.alert('Payment Ready', 'Please use the payment button to complete your order.');
      }
    }
  };

  // Reset payment intent when payment method changes
  useEffect(() => {
    if (paymentMethod !== 'online') {
      setPaymentIntentClientSecret(null);
      setPaymentIntentId(null);
      setCreatedOrderId(null);
    }
  }, [paymentMethod]);

  // Move to payment step when payment intent is created
  useEffect(() => {
    if (paymentIntentClientSecret && paymentMethod === 'online' && currentStep === 'review') {
      // Small delay to ensure state is updated
      setTimeout(() => {
        setCurrentStep('payment');
      }, 500);
    }
  }, [paymentIntentClientSecret, paymentMethod]);

  if (items.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: 'rgba(245, 245, 250, 0.95)' }}>
        <AppHeader title="Checkout" showBack />
        <View className="flex-1 justify-center items-center px-8">
          <EmptyState
            icon="cart-off"
            title="Your cart is empty"
            message="Add some products to checkout"
            actionLabel="Continue Shopping"
            onAction={() => navigation.goBack()}
          />
        </View>
      </View>
    );
  }

  const renderStepIndicator = () => {
    // On small screens, show only icons for non-active steps
    // On tablets, show full labels with more spacing
    const showLabels = !isSmall || isTabletDevice;
    const iconSize = isSmall ? 18 : isTabletDevice ? 24 : 20;
    const stepIconSize = isSmall ? 8 : isTabletDevice ? 12 : 10;
    const stepLabelFontSize = getResponsiveFontSize(isSmall ? 9 : isTabletDevice ? 14 : 12, 9, 14);

    return (
      <View style={{ paddingHorizontal: padding.horizontal, paddingTop: padding.vertical, paddingBottom: 8, backgroundColor: '#fff' }}>
        <View 
          className={`flex-row items-center ${isTabletDevice ? 'justify-around' : 'justify-between'} mb-4`}
          style={{ gap: isSmall ? 4 : isTabletDevice ? 16 : 8 }}
        >
          {steps.map((step, index) => {
            const isActive = step.key === currentStep;
            const isCompleted = getCurrentStepIndex() > index;
            const isAccessible = getCurrentStepIndex() >= index;
            const shouldShowLabel = showLabels || isActive || isCompleted;

            return (
              <TouchableOpacity
                key={step.key}
                onPress={() => isAccessible && setCurrentStep(step.key)}
                disabled={!isAccessible}
                className="flex-1 items-center"
                style={{ minWidth: MIN_TOUCH_TARGET }}
                accessibilityLabel={`Step ${index + 1}: ${step.label}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive, disabled: !isAccessible }}
              >
                <View
                  style={{
                    width: isTabletDevice ? 48 : isSmall ? 32 : 40,
                    height: isTabletDevice ? 48 : isSmall ? 32 : 40,
                    borderRadius: isTabletDevice ? 24 : isSmall ? 16 : 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: shouldShowLabel ? 8 : 0,
                    backgroundColor: isCompleted 
                      ? colors.success?.[500] || '#10b981' 
                      : isActive 
                      ? colors.primary?.[500] || '#007AFF' 
                      : colors.neutral?.[200] || '#e5e5e5',
                  }}
                >
                  <Icon
                    name={isCompleted ? 'check' : (step.icon as any)}
                    size={iconSize}
                    color={isCompleted || isActive ? 'white' : colors.neutral[500]}
                  />
                </View>
                {shouldShowLabel && (
                  <Text
                    style={{
                      fontSize: stepLabelFontSize,
                      fontWeight: isActive ? '600' : '500',
                      textAlign: 'center',
                      color: isActive 
                        ? colors.primary?.[500] || '#007AFF' 
                        : isCompleted 
                        ? colors.success?.[500] || '#10b981' 
                        : colors.neutral?.[400] || '#a3a3a3',
                      maxWidth: '100%',
                    }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {step.label}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        
        {/* Progress Bar */}
        <View className="h-1 bg-neutral-200 rounded-full overflow-hidden">
          <View
            className="h-full bg-primary-500 rounded-full"
            style={{ width: `${((getCurrentStepIndex() + 1) / steps.length) * 100}%` }}
          />
        </View>
      </View>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'summary':
        return (
          <AnimatedView 
            animation="fade" 
            delay={0} 
            style={{ 
              paddingHorizontal: padding.horizontal, 
              paddingTop: padding.vertical,
              maxWidth: isTabletDevice && !isLandscapeMode ? 600 : '100%',
              alignSelf: isTabletDevice && !isLandscapeMode ? 'center' : 'stretch',
            }}
          >
            <OrderSummary
              items={items}
              subtotal={cartSummary.subtotalValue}
              deliveryFee={cartSummary.deliveryFeeValue}
              total={cartSummary.totalValue}
              country={country}
            />
          </AnimatedView>
        );

      case 'delivery':
        return (
          <AnimatedView 
            animation="slide" 
            delay={0} 
            enterFrom="right" 
            style={{ 
              paddingHorizontal: padding.horizontal, 
              paddingTop: padding.vertical,
              maxWidth: isTabletDevice && !isLandscapeMode ? 600 : '100%',
              alignSelf: isTabletDevice && !isLandscapeMode ? 'center' : 'stretch',
            }}
          >
            <PickupPointSelector
              pickupPoints={pickupPoints}
              selectedPickupPointId={selectedPickupPointId}
              onSelectPickupPoint={setSelectedPickupPointId}
              isHomeDelivery={isHomeDelivery}
              onToggleHomeDelivery={setIsHomeDelivery}
              country={country}
            />

            {isHomeDelivery && (
              <DeliveryAddressForm
                street={deliveryAddress.street}
                city={deliveryAddress.city}
                postalCode={deliveryAddress.postalCode}
                phone={deliveryAddress.phone}
                instructions={deliveryAddress.instructions}
                onStreetChange={(text) =>
                  setDeliveryAddress({ ...deliveryAddress, street: text })
                }
                onCityChange={(text) =>
                  setDeliveryAddress({ ...deliveryAddress, city: text })
                }
                onPostalCodeChange={(text) =>
                  setDeliveryAddress({ ...deliveryAddress, postalCode: text })
                }
                onPhoneChange={(text) =>
                  setDeliveryAddress({ ...deliveryAddress, phone: text })
                }
                onInstructionsChange={(text) =>
                  setDeliveryAddress({ ...deliveryAddress, instructions: text })
                }
                errors={validationErrors}
                country={country}
              />
            )}
          </AnimatedView>
        );

      case 'payment':
        return (
          <AnimatedView 
            animation="slide" 
            delay={0} 
            enterFrom="right" 
            style={{ 
              paddingHorizontal: padding.horizontal, 
              paddingTop: padding.vertical,
              maxWidth: isTabletDevice && !isLandscapeMode ? 600 : '100%',
              alignSelf: isTabletDevice && !isLandscapeMode ? 'center' : 'stretch',
            }}
          >
            <PaymentMethodSelector
              selectedMethod={paymentMethod}
              onSelectMethod={setPaymentMethod}
            />

            {paymentMethod === 'online' && (
              <View style={{ marginTop: 16 }}>
                {!paymentIntentClientSecret ? (
                  <View style={{ padding: 16, backgroundColor: '#fff', borderRadius: 12, marginBottom: 16 }}>
                    <Text style={{ fontSize: 14, color: '#666', marginBottom: 8, textAlign: 'center', fontWeight: '600' }}>
                      {isCreatingPaymentIntent
                        ? 'Initializing secure payment...'
                        : 'Secure Payment with Stripe'}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#999', textAlign: 'center' }}>
                      {isCreatingPaymentIntent
                        ? 'Please wait while we set up your payment...'
                        : 'Go to Review step and click "Initialize Payment" to proceed'}
                    </Text>
                    {isCreatingPaymentIntent && (
                      <View style={{ marginTop: 16 }}>
                        <LoadingOverlay visible={true} />
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={{ marginTop: 8 }}>
                    <Text style={{ fontSize: 14, color: '#666', marginBottom: 12, textAlign: 'center', fontWeight: '500' }}>
                      Ready to pay securely with Stripe
                    </Text>
                    <StripePaymentButton
                      clientSecret={paymentIntentClientSecret}
                      amount={cartSummary.totalValue}
                      currency={country === COUNTRIES.GERMANY ? 'EUR' : 'NOK'}
                      onSuccess={handlePaymentSuccess}
                      onFailure={handlePaymentFailure}
                      disabled={isProcessing}
                    />
                  </View>
                )}
              </View>
            )}
          </AnimatedView>
        );

      case 'review':
        return (
          <AnimatedView 
            animation="fade" 
            delay={0} 
            style={{ 
              paddingHorizontal: padding.horizontal, 
              paddingTop: padding.vertical,
              maxWidth: isTabletDevice && !isLandscapeMode ? 600 : '100%',
              alignSelf: isTabletDevice && !isLandscapeMode ? 'center' : 'stretch',
            }}
          >
            <View className="bg-white rounded-xl p-4 mb-4">
              <Text className="text-lg font-bold text-neutral-900 mb-4">
                Order Summary
              </Text>
              <OrderSummary
                items={items}
                subtotal={cartSummary.subtotalValue}
                deliveryFee={cartSummary.deliveryFeeValue}
                total={cartSummary.totalValue}
                country={country}
              />
            </View>

            <View className="bg-white rounded-xl p-4 mb-4">
              <Text className="text-lg font-bold text-neutral-900 mb-4">
                Delivery Information
              </Text>
              {isHomeDelivery ? (
                <View>
                  <Text className="text-sm text-neutral-600 mb-1">Address</Text>
                  <Text className="text-base text-neutral-900 mb-3">
                    {deliveryAddress.street}, {deliveryAddress.city}, {deliveryAddress.postalCode}
                  </Text>
                  {deliveryAddress.instructions && (
                    <>
                      <Text className="text-sm text-neutral-600 mb-1">Instructions</Text>
                      <Text className="text-base text-neutral-900">{deliveryAddress.instructions}</Text>
                    </>
                  )}
                </View>
              ) : (
                <View>
                  <Text className="text-sm text-neutral-600 mb-1">Pickup Point</Text>
                  <Text className="text-base text-neutral-900">
                    {selectedPickupPoint?.name || 'Not selected'}
                  </Text>
                </View>
              )}
            </View>

            <View className="bg-white rounded-xl p-4 mb-4">
              <Text className="text-lg font-bold text-neutral-900 mb-4">
                Payment Method
              </Text>
              <Text className="text-base text-neutral-900 capitalize mb-2">
                {paymentMethod === 'online' ? 'Online Payment (Stripe)' : paymentMethod === 'cod' ? 'Cash on Delivery' : 'Not selected'}
              </Text>
              {paymentMethod === 'online' && paymentIntentClientSecret && (
                <Text className="text-sm text-success-600 mt-2">
                  ✓ Payment ready - Click "Pay" button to complete
                </Text>
              )}
            </View>

            {/* Trust & Security Badges */}
            <View className="bg-white rounded-xl p-4">
              <Text className="text-lg font-bold text-neutral-900 mb-4">
                Security & Trust
              </Text>
              <View className="flex-row flex-wrap gap-3">
                <TrustBadge type="ssl" size="md" />
                <TrustBadge type="secure-payment" size="md" />
                <TrustBadge type="money-back" size="md" />
                <TrustBadge type="verified" size="md" />
              </View>
              <View className="flex-row gap-4 mt-4">
                <TouchableOpacity 
                  onPress={() => {
                    Linking.openURL('https://thamili.com/privacy-policy').catch(() => {
                      Alert.alert('Error', 'Could not open privacy policy link');
                    });
                  }}
                  accessibilityRole="link"
                  accessibilityLabel="View privacy policy"
                >
                  <Text className="text-sm text-primary-500 underline">
                    Privacy Policy
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => {
                    Linking.openURL('https://thamili.com/terms').catch(() => {
                      Alert.alert('Error', 'Could not open terms link');
                    });
                  }}
                  accessibilityRole="link"
                  accessibilityLabel="View terms and conditions"
                >
                  <Text className="text-sm text-primary-500 underline">
                    Terms & Conditions
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </AnimatedView>
        );

      default:
        return null;
    }
  };

  return (
    <View className="flex-1 bg-neutral-50">
      <AppHeader title="Checkout" showBack />
      
      {renderStepIndicator()}

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ 
          paddingBottom: totalTabBarHeight + (isTabletDevice ? 120 : 100),
          paddingHorizontal: isTabletDevice && !isLandscapeMode ? padding.horizontal * 2 : 0,
        }}
        showsVerticalScrollIndicator={false}
      >
        {!cartValidation.isValid && currentStep === 'summary' && (
          <AnimatedView animation="fade" delay={0} className="px-4 pt-4">
            <ErrorMessage
              message={cartValidation.errors.join(', ')}
              type="warning"
            />
          </AnimatedView>
        )}

        {renderStepContent()}
      </ScrollView>

      {/* Sticky Navigation Buttons - Positioned above tab bar */}
      <AnimatedView
        animation="slide"
        delay={0}
        enterFrom="bottom"
        style={[
          styles.navigationContainer, 
          { 
            bottom: totalTabBarHeight,
            paddingHorizontal: padding.horizontal,
            maxWidth: isTabletDevice && !isLandscapeMode ? 600 : '100%',
            alignSelf: isTabletDevice && !isLandscapeMode ? 'center' : 'stretch',
          }
        ] as any}
      >
        <View style={[
          styles.buttonRow,
          {
            flexDirection: isSmall || isLandscapeMode ? 'column' : 'row',
            gap: isSmall || isLandscapeMode ? 8 : 12,
          }
        ]}>
          <Button
            title={isSmall ? "← Back" : "← Back"}
            onPress={handleBack}
            variant="outline"
            style={{
              ...styles.backButton,
              flex: isSmall || isLandscapeMode ? 0 : 1,
              width: isSmall || isLandscapeMode ? '100%' : undefined,
              minHeight: MIN_TOUCH_TARGET,
              marginRight: isSmall || isLandscapeMode ? 0 : 12,
            } as any}
          />
          {currentStep === 'review' ? (
            <Button
              title={
                isSmall
                  ? paymentMethod === 'online' && !paymentIntentClientSecret
                    ? `Pay • ${cartSummary.total}`
                    : paymentMethod === 'cod'
                    ? `Order (COD) • ${cartSummary.total}`
                    : `Order • ${cartSummary.total}`
                  : paymentMethod === 'online' && !paymentIntentClientSecret
                  ? `Initialize Payment • ${cartSummary.total}`
                  : paymentMethod === 'cod'
                  ? `Place Order (COD) • ${cartSummary.total}`
                  : `Place Order • ${cartSummary.total}`
              }
              onPress={handlePlaceOrder}
              loading={isProcessing || isCreatingPaymentIntent}
              disabled={isProcessing || isCreatingPaymentIntent}
              style={{
                ...styles.nextButton,
                flex: isSmall || isLandscapeMode ? 0 : 2,
                width: isSmall || isLandscapeMode ? '100%' : undefined,
                minHeight: MIN_TOUCH_TARGET,
              } as any}
            />
          ) : (
            <Button
              title="→ Next"
              onPress={handleNext}
              disabled={!canProceedToNextStep()}
              style={{
                ...styles.nextButton,
                flex: isSmall || isLandscapeMode ? 0 : 2,
                width: isSmall || isLandscapeMode ? '100%' : undefined,
                minHeight: MIN_TOUCH_TARGET,
              } as any}
            />
          )}
        </View>
      </AnimatedView>

      {isProcessing && <LoadingOverlay visible={isProcessing} message="Processing your order..." />}
    </View>
  );
};

const styles = StyleSheet.create({
  navigationContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    paddingTop: 12,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonRow: {
    // flexDirection is set dynamically based on screen size
  },
  backButton: {
    // flex and width are set dynamically
  },
  nextButton: {
    // flex and width are set dynamically
  },
});

export default CheckoutScreen;
