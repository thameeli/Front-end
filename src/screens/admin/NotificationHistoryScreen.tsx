import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { AppHeader, EmptyState, LoadingScreen, ErrorMessage, NotificationStatusDisplay, Card } from '../../components';
import { notificationService } from '../../services/notificationService';
import { WhatsAppNotification } from '../../types/notifications';
import { formatDateTime } from '../../utils/regionalFormatting';
import { formatPhoneNumber } from '../../utils/regionalFormatting';
import { useAuthStore } from '../../store/authStore';
import { COUNTRIES } from '../../constants';
import type { Country } from '../../constants';

const NotificationHistoryScreen = () => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'delivered' | 'failed'>('all');
  const { user } = useAuthStore();
  const country = (user?.country_preference || COUNTRIES.GERMANY) as Country;

  // Fetch WhatsApp notification history
  const {
    data: notifications = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['whatsappHistory', statusFilter],
    queryFn: () =>
      notificationService.getWhatsAppHistory(
        statusFilter !== 'all' ? { status: statusFilter } : undefined
      ),
  });

  if (isLoading) {
    return <LoadingScreen message="Loading notification history..." />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <AppHeader title="Notification History" />
        <ErrorMessage
          message="Failed to load notification history. Please try again."
          onRetry={async () => { await refetch(); }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Notification History" />

      <View style={styles.filters}>
        {(['all', 'sent', 'delivered', 'failed'] as const).map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterButton,
              statusFilter === status && styles.filterButtonActive,
            ]}
            onPress={() => setStatusFilter(status)}
            accessibilityRole="button"
            accessibilityLabel={`Filter by ${status}`}
            accessibilityState={{ selected: statusFilter === status }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text
              style={[
                styles.filterText,
                statusFilter === status && styles.filterTextActive,
              ]}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {notifications.length === 0 ? (
        <EmptyState
          icon="message-text-outline"
          title="No notifications"
          message="WhatsApp notification history will appear here"
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card style={styles.notificationCard}>
              <View style={styles.notificationHeader}>
                <View style={styles.notificationInfo} accessibilityRole="text">
                  <Text 
                    style={styles.orderId}
                    accessibilityLabel={`Order number: ${item.order_id.slice(0, 8).toUpperCase()}`}
                  >
                    Order #{item.order_id.slice(0, 8).toUpperCase()}
                  </Text>
                  <Text 
                    style={styles.phoneNumber}
                    accessibilityLabel={`Phone number: ${formatPhoneNumber(item.phone_number, country)}`}
                  >
                    {formatPhoneNumber(item.phone_number, country)}
                  </Text>
                </View>
                <NotificationStatusDisplay status={item.status} />
              </View>
              <Text 
                style={styles.message}
                accessibilityLabel={`Message: ${item.message}`}
              >
                {item.message}
              </Text>
              <View style={styles.notificationFooter}>
                <Text 
                  style={styles.date}
                  accessibilityLabel={`Date: ${item.sent_at ? formatDateTime(item.sent_at, country) : formatDateTime(item.created_at, country)}`}
                >
                  {item.sent_at ? formatDateTime(item.sent_at, country) : formatDateTime(item.created_at, country)}
                </Text>
                {item.error_message && (
                  <Text style={styles.errorText}>{item.error_message}</Text>
                )}
              </View>
            </Card>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  filters: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 8,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    minHeight: 44, // WCAG minimum touch target
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  notificationCard: {
    marginBottom: 12,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  phoneNumber: {
    fontSize: 14,
    color: '#666',
  },
  message: {
    fontSize: 14,
    color: '#000',
    marginBottom: 8,
    lineHeight: 20,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    flex: 1,
    textAlign: 'right',
  },
});

export default NotificationHistoryScreen;

