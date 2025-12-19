import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RootStackParamList, PickupPoint } from '../../types';
import { pickupPointService } from '../../services';
import { AppHeader, Button, EmptyState, LoadingScreen, ErrorMessage } from '../../components';
import { useAuthStore } from '../../store/authStore';
import { formatPrice } from '../../utils/productUtils';
import { COUNTRIES } from '../../constants';
import type { Country } from '../../constants';
import { isTablet, isSmallDevice, getResponsivePadding } from '../../utils/responsive';

type AdminPickupPointsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AdminPickupPoints'>;

const AdminPickupPointsScreen = () => {
  const navigation = useNavigation<AdminPickupPointsScreenNavigationProp>();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const country = (user?.country_preference || COUNTRIES.GERMANY) as Country;
  const padding = getResponsivePadding();

  // Fetch all pickup points
  const { data: pickupPoints = [], isLoading, error, refetch } = useQuery({
    queryKey: ['pickupPoints', 'all'],
    queryFn: () => pickupPointService.getPickupPoints(),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (pickupPointId: string) => pickupPointService.deletePickupPoint(pickupPointId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pickupPoints'] });
      Alert.alert('Success', 'Pickup point deleted successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to delete pickup point');
    },
  });

  // Toggle active status
  const toggleActiveMutation = useMutation({
    mutationFn: ({ pickupPointId, active }: { pickupPointId: string; active: boolean }) =>
      pickupPointService.updatePickupPoint(pickupPointId, { active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pickupPoints'] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to update pickup point');
    },
  });

  const handleAddPickupPoint = useCallback(() => {
    (navigation as any).navigate('AddPickupPoint');
  }, [navigation]);

  const handleEditPickupPoint = useCallback((pickupPointId: string) => {
    (navigation as any).navigate('EditPickupPoint', { pickupPointId });
  }, [navigation]);

  const handleDeletePickupPoint = useCallback((point: PickupPoint) => {
    Alert.alert(
      'Delete Pickup Point',
      `Are you sure you want to delete "${point.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(point.id),
        },
      ]
    );
  }, [deleteMutation]);

  const handleToggleActive = useCallback((point: PickupPoint) => {
    toggleActiveMutation.mutate({
      pickupPointId: point.id,
      active: !point.active,
    });
  }, [toggleActiveMutation]);
  
  // Memoized render item
  const renderPickupPointItem = useCallback(({ item }: { item: PickupPoint }) => (
    <View style={styles.pickupPointCard}>
      <View style={styles.pickupPointHeader}>
        <View style={styles.pickupPointInfo}>
          <Text style={styles.pickupPointName}>{item.name}</Text>
          <Text style={styles.pickupPointAddress}>{item.address}</Text>
          <View style={styles.pickupPointMeta}>
            <Text style={styles.pickupPointCountry}>
              {item.country.charAt(0).toUpperCase() + item.country.slice(1)}
            </Text>
            <Text style={styles.pickupPointFee}>
              Fee: {formatPrice(item.delivery_fee, item.country as Country)}
            </Text>
          </View>
          {!item.active && (
            <Text style={styles.inactiveLabel}>Inactive</Text>
          )}
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, !item.active && styles.activeButton]}
          onPress={() => handleToggleActive(item)}
          accessibilityRole="button"
          accessibilityLabel={item.active ? 'Deactivate pickup point' : 'Activate pickup point'}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon
            name={item.active ? 'eye-off' : 'eye'}
            size={18}
            color={item.active ? '#666' : '#34C759'}
          />
          <Text style={[styles.actionText, !item.active && styles.activeText]}>
            {item.active ? 'Deactivate' : 'Activate'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditPickupPoint(item.id)}
          accessibilityRole="button"
          accessibilityLabel="Edit pickup point"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="pencil" size={18} color="#007AFF" />
          <Text style={[styles.actionText, styles.editText]}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeletePickupPoint(item)}
          accessibilityRole="button"
          accessibilityLabel="Delete pickup point"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="delete" size={18} color="#FF3B30" />
          <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [handleToggleActive, handleEditPickupPoint, handleDeletePickupPoint]);
  
  // Memoized key extractor
  const keyExtractor = useCallback((item: PickupPoint) => item.id, []);

  if (isLoading) {
    return <LoadingScreen message="Loading pickup points..." />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <AppHeader title="Manage Pickup Points" />
        <ErrorMessage
          message="Failed to load pickup points. Please try again."
          error={error}
          onRetry={async () => { await refetch(); }}
          retryWithBackoff={true}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader
        title="Manage Pickup Points"
        rightAction={
          <TouchableOpacity onPress={handleAddPickupPoint} style={{ padding: 8 }}>
            <Icon name="plus" size={24} color="#000" />
          </TouchableOpacity>
        }
      />

      {pickupPoints.length === 0 ? (
        <EmptyState
          icon="map-marker-off"
          title="No pickup points"
          message="Add your first pickup point"
        />
      ) : (
        <FlatList
          data={pickupPoints}
          keyExtractor={keyExtractor}
          renderItem={renderPickupPointItem}
          contentContainerStyle={[
            styles.listContent,
            { 
              padding: padding.vertical,
              maxWidth: isTablet ? 600 : '100%',
              alignSelf: isTablet ? 'center' : 'stretch',
            }
          ]}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={10}
          getItemLayout={(data, index) => ({
            length: 200, // Approximate pickup point card height
            offset: 200 * index,
            index,
          })}
        />
      )}

      <View style={styles.footer}>
        <Button
          title="Add New Pickup Point"
          onPress={handleAddPickupPoint}
          fullWidth
          style={styles.addButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    // padding will be set dynamically
  },
  pickupPointCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pickupPointHeader: {
    marginBottom: 12,
  },
  pickupPointInfo: {
    flex: 1,
  },
  pickupPointName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  pickupPointAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  pickupPointMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 4,
  },
  pickupPointCountry: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  pickupPointFee: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  inactiveLabel: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '600',
    marginTop: 4,
  },
  actions: {
    flexDirection: isSmallDevice ? 'column' : 'row',
    justifyContent: 'flex-end',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    gap: 4,
  },
  activeButton: {
    borderColor: '#34C759',
    backgroundColor: '#e6f9ed',
  },
  editButton: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f7ff',
  },
  deleteButton: {
    borderColor: '#FF3B30',
    backgroundColor: '#ffe6e6',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  activeText: {
    color: '#34C759',
  },
  editText: {
    color: '#007AFF',
  },
  deleteText: {
    color: '#FF3B30',
  },
  footer: {
    padding: padding.vertical,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  addButton: {
    marginTop: 0,
  },
});

export default AdminPickupPointsScreen;
