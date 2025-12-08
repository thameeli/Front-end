import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppHeader, Card, Button } from '../../components';
import { useAuthStore } from '../../store/authStore';
import { notificationService } from '../../services/notificationService';

const NotificationSettingsScreen = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [orderNotifications, setOrderNotifications] = useState(true);
  const [deliveryNotifications, setDeliveryNotifications] = useState(true);
  const [paymentNotifications, setPaymentNotifications] = useState(true);
  const [generalNotifications, setGeneralNotifications] = useState(true);

  // Fetch preferences
  const { data: preferences } = useQuery({
    queryKey: ['notificationPreferences', user?.id],
    queryFn: () => notificationService.getPreferences(user?.id || ''),
    enabled: !!user?.id,
    onSuccess: (data) => {
      if (data) {
        setPushEnabled(data.push_enabled);
        setOrderNotifications(data.order_notifications);
        setDeliveryNotifications(data.delivery_notifications);
        setPaymentNotifications(data.payment_notifications);
        setGeneralNotifications(data.general_notifications);
      }
    },
  });

  // Update preferences
  const updateMutation = useMutation({
    mutationFn: (prefs: any) => notificationService.updatePreferences(user?.id || '', prefs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationPreferences'] });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      push_enabled: pushEnabled,
      order_notifications: orderNotifications,
      delivery_notifications: deliveryNotifications,
      payment_notifications: paymentNotifications,
      general_notifications: generalNotifications,
    });
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Notification Settings" showBack />
      <ScrollView style={styles.content}>
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Push Notifications</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Enable Push Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive push notifications on your device
              </Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: '#ddd', true: '#007AFF' }}
              thumbColor="#fff"
            />
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Types</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Order Notifications</Text>
              <Text style={styles.settingDescription}>
                Get notified when your order is confirmed
              </Text>
            </View>
            <Switch
              value={orderNotifications}
              onValueChange={setOrderNotifications}
              disabled={!pushEnabled}
              trackColor={{ false: '#ddd', true: '#007AFF' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Delivery Notifications</Text>
              <Text style={styles.settingDescription}>
                Get notified about delivery updates
              </Text>
            </View>
            <Switch
              value={deliveryNotifications}
              onValueChange={setDeliveryNotifications}
              disabled={!pushEnabled}
              trackColor={{ false: '#ddd', true: '#007AFF' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Payment Notifications</Text>
              <Text style={styles.settingDescription}>
                Get notified about payment status
              </Text>
            </View>
            <Switch
              value={paymentNotifications}
              onValueChange={setPaymentNotifications}
              disabled={!pushEnabled}
              trackColor={{ false: '#ddd', true: '#007AFF' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>General Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive general updates and announcements
              </Text>
            </View>
            <Switch
              value={generalNotifications}
              onValueChange={setGeneralNotifications}
              disabled={!pushEnabled}
              trackColor={{ false: '#ddd', true: '#007AFF' }}
              thumbColor="#fff"
            />
          </View>
        </Card>

        <Button
          title="Save Settings"
          onPress={handleSave}
          loading={updateMutation.isPending}
          fullWidth
          style={styles.saveButton}
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
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingContent: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
  },
  saveButton: {
    marginTop: 8,
    marginBottom: 16,
  },
});

export default NotificationSettingsScreen;

