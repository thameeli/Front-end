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
import { isTablet, isSmallDevice, getResponsivePadding } from '../../utils/responsive';
import { glassmorphism, colors } from '../../theme';

const NotificationHistoryScreen = () => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'delivered' | 'failed'>('all');
  const { user } = useAuthStore();
  const country = (user?.country_preference || COUNTRIES.GERMANY) as Country;
  const padding = getResponsivePadding();

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
      <View style={glassmorphism.screenBackground}>
        <AppHeader title="Notification History" />
        <ErrorMessage
          message="Failed to load notification history. Please try again."
          onRetry={async () => { await refetch(); }}
        />
      </View>
    );
  }

  return (
    <View style={glassmorphism.screenBackground}>
      <AppHeader title="Notification History" />

      <View style={[styles.filters, { padding: padding.vertical, paddingBottom: padding.vertical * 0.5, gap: 8 }]}>
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
          contentContainerStyle={[
            styles.listContent,
            { 
              padding: padding.vertical,
              paddingTop: padding.vertical * 0.5,
              maxWidth: isTablet ? 600 : '100%',
              alignSelf: isTablet ? 'center' : 'stretch',
            }
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: isSmallDevice ? 'wrap' : 'nowrap',
    // padding will be set dynamically
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(58, 181, 209, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    minHeight: 44, // WCAG minimum touch target
    ...glassmorphism.panel,
  },
  filterButtonActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  filterText: {
    fontSize: 14,
    color: colors.neutral[600],
    fontWeight: '500',
  },
  filterTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  listContent: {
    // padding will be set dynamically
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
    color: colors.neutral[900],
    marginBottom: 4,
  },
  phoneNumber: {
    fontSize: 14,
    color: colors.neutral[600],
  },
  message: {
    fontSize: 14,
    color: colors.neutral[900],
    marginBottom: 8,
    lineHeight: 20,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(58, 181, 209, 0.1)',
  },
  date: {
    fontSize: 12,
    color: colors.neutral[500],
  },
  errorText: {
    fontSize: 12,
    color: colors.error[500],
    flex: 1,
    textAlign: 'right',
  },
});

export default NotificationHistoryScreen;

