import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList, PaymentMethod } from '../../types';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { pickupPointService } from '../../services';
import { orderService } from '../../services/orderService';
import {
  AppHeader,
  OrderSummary,
  PickupPointSelector,
  DeliveryAddressForm,
  PaymentMethodSelector,
  PaymentForm,
  Button,
  LoadingOverlay,
  ErrorMessage,
} from '../../components';
import { formatCartSummary, calculateDeliveryFee } from '../../utils/cartUtils';
import { validateCheckout, CheckoutFormData } from '../../utils/checkoutValidation';
import { validateCart } from '../../utils/cartValidation';
import { COUNTRIES } from '../../constants';
import type { Country } from '../../constants';

type CheckoutScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Checkout'>;

const CheckoutScreen = () => {
  const navigation = useNavigation<CheckoutScreenNavigationProp>();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { items, clearCart } = useCartStore();
  const country = (user?.country_preference || COUNTRIES.GERMANY) as Country;

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

  const handlePlaceOrder = async () => {
    if (!user) {
      Alert.alert('Error', 'Please login to place an order');
      return;
    }

    // Validate cart
    if (!cartValidation.isValid) {
      Alert.alert(
        'Cart Issues',
        cartValidation.errors.join('\n') + '\n\nPlease update your cart.'
      );
      return;
    }

    // Prepare form data
    const formData: CheckoutFormData = {
      isHomeDelivery,
      pickupPointId: selectedPickupPointId,
      deliveryAddress,
      paymentMethod,
      paymentDetails,
    };

    // Validate checkout form
    const validation = validateCheckout(formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      Alert.alert('Validation Error', 'Please fill in all required fields correctly.');
      return;
    }

    setValidationErrors({});
    setIsProcessing(true);

    try {
      // Prepare order data
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

      // Create order
      const order = await orderService.createOrder({
        user_id: user.id,
        country,
        payment_method: paymentMethod!,
        pickup_point_id: isHomeDelivery ? undefined : selectedPickupPointId!,
        delivery_address: deliveryAddressString,
        delivery_fee: cartSummary.deliveryFeeValue,
        items: orderItems,
      });

      // For online payment, payment processing would happen here
      // For now, we'll just mark it as pending
      if (paymentMethod === 'online') {
        // TODO: Integrate Stripe payment processing
        // For now, we'll simulate successful payment
        await orderService.updatePaymentStatus(order.id, 'paid');
      }

      // Clear cart
      clearCart();

      // Navigate to confirmation
      navigation.replace('OrderConfirmation', { orderId: order.id });
    } catch (error: any) {
      console.error('Error placing order:', error);
      Alert.alert(
        'Order Failed',
        error.message || 'Failed to place order. Please try again.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <AppHeader title="Checkout" showBack />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <Button
            title="Continue Shopping"
            onPress={() => navigation.goBack()}
            style={styles.emptyButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Checkout" showBack />
      <ScrollView style={styles.content}>
        {!cartValidation.isValid && (
          <ErrorMessage
            message={cartValidation.errors.join(', ')}
            type="warning"
            style={styles.errorMessage}
          />
        )}

        <OrderSummary
          items={items}
          subtotal={cartSummary.subtotalValue}
          deliveryFee={cartSummary.deliveryFeeValue}
          total={cartSummary.totalValue}
          country={country}
          style={styles.section}
        />

        <PickupPointSelector
          pickupPoints={pickupPoints}
          selectedPickupPointId={selectedPickupPointId}
          onSelectPickupPoint={setSelectedPickupPointId}
          isHomeDelivery={isHomeDelivery}
          onToggleHomeDelivery={setIsHomeDelivery}
          country={country}
          style={styles.section}
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
            style={styles.section}
          />
        )}

        <PaymentMethodSelector
          selectedMethod={paymentMethod}
          onSelectMethod={setPaymentMethod}
          style={styles.section}
        />

        {paymentMethod === 'online' && (
          <PaymentForm
            cardNumber={paymentDetails.cardNumber}
            expiryDate={paymentDetails.expiryDate}
            cvv={paymentDetails.cvv}
            cardholderName={paymentDetails.cardholderName}
            onCardNumberChange={(text) =>
              setPaymentDetails({ ...paymentDetails, cardNumber: text })
            }
            onExpiryDateChange={(text) =>
              setPaymentDetails({ ...paymentDetails, expiryDate: text })
            }
            onCvvChange={(text) =>
              setPaymentDetails({ ...paymentDetails, cvv: text })
            }
            onCardholderNameChange={(text) =>
              setPaymentDetails({ ...paymentDetails, cardholderName: text })
            }
            errors={validationErrors}
            style={styles.section}
          />
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={`Place Order (${cartSummary.total})`}
          onPress={handlePlaceOrder}
          disabled={isProcessing || !cartValidation.isValid}
          loading={isProcessing}
          fullWidth
          style={styles.placeOrderButton}
        />
      </View>

      <LoadingOverlay visible={isProcessing} message="Processing your order..." />
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
  section: {
    marginBottom: 16,
  },
  errorMessage: {
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 24,
  },
  emptyButton: {
    minWidth: 200,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  placeOrderButton: {
    marginTop: 0,
  },
});

export default CheckoutScreen;
