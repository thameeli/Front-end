import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { AppHeader, EmptyState, LoadingScreen, ErrorMessage, NotificationStatusDisplay, Card } from '../../components';
import { notificationService } from '../../services/notificationService';
import { WhatsAppNotification } from '../../types/notifications';

const NotificationHistoryScreen = () => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'delivered' | 'failed'>('all');

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return <LoadingScreen message="Loading notification history..." />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <AppHeader title="Notification History" />
        <ErrorMessage
          message="Failed to load notification history. Please try again."
          onRetry={() => refetch()}
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
                <View style={styles.notificationInfo}>
                  <Text style={styles.orderId}>
                    Order #{item.order_id.slice(0, 8).toUpperCase()}
                  </Text>
                  <Text style={styles.phoneNumber}>{item.phone_number}</Text>
                </View>
                <NotificationStatusDisplay status={item.status} />
              </View>
              <Text style={styles.message}>{item.message}</Text>
              <View style={styles.notificationFooter}>
                <Text style={styles.date}>
                  {item.sent_at ? formatDate(item.sent_at) : formatDate(item.created_at)}
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

