/**
 * Modern Checkout Screen with Step Indicator and Smooth Form Progression
 * Uses NativeWind for styling and Phase 2 components
 */

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, StyleSheet, Platform } from 'react-native';
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
} from '../../components';
import StripePaymentButton from '../../components/StripePaymentButton';
import { formatCartSummary, calculateDeliveryFee } from '../../utils/cartUtils';
import { validateCheckout, CheckoutFormData } from '../../utils/checkoutValidation';
import { validateCart } from '../../utils/cartValidation';
import { COUNTRIES } from '../../constants';
import type { Country } from '../../constants';
import { colors } from '../../theme';

type CheckoutScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Checkout'>;

type CheckoutStep = 'summary' | 'delivery' | 'payment' | 'review';

const CheckoutScreen = () => {
  const navigation = useNavigation<CheckoutScreenNavigationProp>();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { items, clearCart } = useCartStore();
  const country = (user?.country_preference || COUNTRIES.GERMANY) as Country;

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

    const validation = validateCheckout(formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      throw new Error('Please fill in all required fields correctly.');
    }

    setValidationErrors({});

    const orderItems = items.map((item) => {
      const price = country === COUNTRIES.GERMANY
        ? item.product.price_germany
        : item.product.price_norway;
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
      <View className="flex-1 bg-neutral-50">
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

  const renderStepIndicator = () => (
    <View className="px-4 pt-4 pb-2 bg-white">
      <View className="flex-row items-center justify-between mb-4">
        {steps.map((step, index) => {
          const isActive = step.key === currentStep;
          const isCompleted = getCurrentStepIndex() > index;
          const isAccessible = getCurrentStepIndex() >= index;

          return (
            <TouchableOpacity
              key={step.key}
              onPress={() => isAccessible && setCurrentStep(step.key)}
              disabled={!isAccessible}
              className="flex-1 items-center"
            >
              <View
                className={`
                  w-10 h-10 rounded-full items-center justify-center mb-2
                  ${isCompleted ? 'bg-success-500' : isActive ? 'bg-primary-500' : 'bg-neutral-200'}
                `}
              >
                <Icon
                  name={isCompleted ? 'check' : (step.icon as any)}
                  size={20}
                  color={isCompleted || isActive ? 'white' : colors.neutral[500]}
                />
              </View>
              <Text
                className={`
                  text-xs font-medium text-center
                  ${isActive ? 'text-primary-500' : isCompleted ? 'text-success-500' : 'text-neutral-400'}
                `}
              >
                {step.label}
              </Text>
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 'summary':
        return (
          <AnimatedView animation="fade" delay={0} className="px-4 pt-4">
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
          <AnimatedView animation="slide" delay={0} enterFrom="right" className="px-4 pt-4">
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
              />
            )}
          </AnimatedView>
        );

      case 'payment':
        return (
          <AnimatedView animation="slide" delay={0} enterFrom="right" className="px-4 pt-4">
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
          <AnimatedView animation="fade" delay={0} className="px-4 pt-4">
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

            <View className="bg-white rounded-xl p-4">
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
        contentContainerStyle={{ paddingBottom: 180 }}
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
          { bottom: totalTabBarHeight }
        ]}
      >
        <View style={styles.buttonRow}>
          <Button
            title="← Back"
            onPress={handleBack}
            variant="outline"
            style={styles.backButton}
          />
          {currentStep === 'review' ? (
            <Button
              title={
                paymentMethod === 'online' && !paymentIntentClientSecret
                  ? `Initialize Payment • ${cartSummary.total}`
                  : paymentMethod === 'cod'
                  ? `Place Order (COD) • ${cartSummary.total}`
                  : `Place Order • ${cartSummary.total}`
              }
              onPress={handlePlaceOrder}
              loading={isProcessing || isCreatingPaymentIntent}
              disabled={isProcessing || isCreatingPaymentIntent}
              style={styles.nextButton}
            />
          ) : (
            <Button
              title="→ Next"
              onPress={handleNext}
              disabled={!canProceedToNextStep()}
              style={styles.nextButton}
            />
          )}
        </View>
      </AnimatedView>

      {isProcessing && <LoadingOverlay message="Processing your order..." />}
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonRow: {
    flexDirection: 'row',
  },
  backButton: {
    flex: 1,
    marginRight: 12,
  },
  nextButton: {
    flex: 2,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
});

export default CheckoutScreen;
