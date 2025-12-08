import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { RootStackParamList, Notification } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { notificationService } from '../../services/notificationService';
import {
  AppHeader,
  NotificationCard,
  EmptyState,
  LoadingScreen,
  ErrorMessage,
  Button,
} from '../../components';

type NotificationsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Notifications'>;

const NotificationsScreen = () => {
  const navigation = useNavigation<NotificationsScreenNavigationProp>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Fetch notifications
  const {
    data: notifications = [],
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => notificationService.getNotifications(user?.id || ''),
    enabled: !!user?.id,
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      notificationService.markAsRead(user?.id || '', notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(user?.id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleClearAll = () => {
    // TODO: Implement clear all functionality
  };

  if (isLoading) {
    return <LoadingScreen message="Loading notifications..." />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <AppHeader title="Notifications" />
        <ErrorMessage
          message="Failed to load notifications. Please try again."
          onRetry={() => refetch()}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader
        title="Notifications"
        rightAction={
          unreadCount > 0
            ? {
                icon: 'check-all',
                onPress: handleMarkAllAsRead,
              }
            : undefined
        }
      />

      {notifications.length === 0 ? (
        <EmptyState
          icon="bell-off"
          title="No notifications"
          message="You're all caught up!"
        />
      ) : (
        <>
          {unreadCount > 0 && (
            <View style={styles.headerActions}>
              <Button
                title={`Mark all as read (${unreadCount})`}
                onPress={handleMarkAllAsRead}
                variant="outline"
                style={styles.markAllButton}
              />
            </View>
          )}

          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <NotificationCard
                notification={item}
                onPress={() => {
                  if (!item.read) {
                    handleMarkAsRead(item.id);
                  }
                }}
                onMarkAsRead={() => handleMarkAsRead(item.id)}
              />
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
            }
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerActions: {
    padding: 16,
    paddingBottom: 8,
  },
  markAllButton: {
    marginBottom: 0,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
});

export default NotificationsScreen;

