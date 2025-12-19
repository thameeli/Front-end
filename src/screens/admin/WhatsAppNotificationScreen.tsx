import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RootStackParamList } from '../../types';
import { orderService } from '../../services/orderService';
import { notificationService } from '../../services/notificationService';
import { AppHeader, Input, Button, LoadingScreen, ErrorMessage, Card } from '../../components';
import { useAuthStore } from '../../store/authStore';

type WhatsAppNotificationScreenRouteProp = RouteProp<RootStackParamList, 'OrderDetails'>;
type WhatsAppNotificationScreenNavigationProp = StackNavigationProp<RootStackParamList, 'OrderDetails'>;

const WhatsAppNotificationScreen = () => {
  const route = useRoute<WhatsAppNotificationScreenRouteProp>();
  const navigation = useNavigation<WhatsAppNotificationScreenNavigationProp>();
  const { orderId } = route.params;
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [message, setMessage] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Fetch order
  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderService.getOrderById(orderId),
    enabled: !!orderId,
  });

  // Fetch user phone
  React.useEffect(() => {
    if (order) {
      // Get phone from order user or use default
      setPhoneNumber(order.user_id || '');
    }
  }, [order]);

  // Send WhatsApp mutation
  const sendMutation = useMutation({
    mutationFn: () =>
      notificationService.sendWhatsAppNotification(orderId, phoneNumber, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsappHistory'] });
      Alert.alert('Success', 'WhatsApp notification sent successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to send WhatsApp notification');
    },
  });

  const handleSend = () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Phone number is required');
      return;
    }
    if (!message.trim()) {
      Alert.alert('Error', 'Message is required');
      return;
    }

    Alert.alert(
      'Send WhatsApp Notification',
      'Are you sure you want to send this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: () => sendMutation.mutate(),
        },
      ]
    );
  };

  if (isLoading) {
    return <LoadingScreen message="Loading order..." />;
  }

  if (!order) {
    return (
      <View style={styles.container}>
        <AppHeader title="Send WhatsApp Notification" showBack />
        <ErrorMessage message="Order not found" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Send WhatsApp Notification" showBack />
      <ScrollView style={styles.content}>
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Order Information</Text>
          <Text style={styles.orderInfo}>
            Order #{order.id.slice(0, 8).toUpperCase()}
          </Text>
          <Text style={styles.orderInfo}>
            Status: {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Text>
        </Card>

        <Input
          label="Phone Number *"
          placeholder="+491234567890"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          style={styles.input}
        />

        <Input
          label="Message *"
          placeholder="Enter notification message..."
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={6}
          style={styles.textArea}
        />

        <Card style={styles.previewSection}>
          <Text style={styles.sectionTitle}>Preview</Text>
          <Text style={styles.previewText}>
            {message || 'Your message will appear here...'}
          </Text>
        </Card>

        <Button
          title="Send WhatsApp Notification"
          onPress={handleSend}
          loading={sendMutation.isPending}
          disabled={sendMutation.isPending || !phoneNumber.trim() || !message.trim()}
          fullWidth
          style={styles.sendButton}
        />
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
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  orderInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  input: {
    marginBottom: 16,
  },
  textArea: {
    minHeight: 120,
    marginBottom: 16,
  },
  previewSection: {
    marginBottom: 16,
  },
  previewText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  sendButton: {
    marginTop: 8,
    marginBottom: 16,
  },
});

export default WhatsAppNotificationScreen;

