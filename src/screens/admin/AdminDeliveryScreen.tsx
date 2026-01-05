/**
 * Admin Delivery Management Screen
 * Allows admins to view and manage delivery schedules, update delivery status,
 * and access customer contact information - all delivery partner features
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, Alert, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { RootStackParamList } from '../../types';
import { deliveryService, DeliveryStatus } from '../../services/deliveryService';
import { useAuthStore } from '../../store/authStore';
import {
  AppHeader,
  SearchBar,
  EmptyState,
  LoadingScreen,
  ErrorMessage,
  AnimatedView,
  Badge,
  SkeletonCard,
  ContentFadeIn,
  Button,
  Card,
} from '../../components';
import { COUNTRIES } from '../../constants';
import type { Country } from '../../constants';
import { colors, glassmorphism } from '../../theme';
import {
  isSmallDevice,
  isTablet,
  getResponsivePadding,
} from '../../utils/responsive';
import { formatCurrency } from '../../utils/regionalFormatting';

// Simple date formatter (avoiding date-fns dependency)
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate().toString().padStart(2, '0')}, ${date.getFullYear()}`;
  } catch {
    return dateString;
  }
};

type AdminDeliveryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AdminDelivery'>;

const AdminDeliveryScreen = () => {
  const navigation = useNavigation<AdminDeliveryScreenNavigationProp>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const country = (user?.country_preference || COUNTRIES.GERMANY) as Country;

  // Responsive dimensions
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const isSmall = isSmallDevice();
  const isTabletDevice = isTablet();
  const padding = getResponsivePadding();
  
  // Update dimensions on orientation change
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });
    return () => subscription?.remove();
  }, []);

  const [selectedStatus, setSelectedStatus] = useState<DeliveryStatus | 'all'>('all');
  const [selectedCountry, setSelectedCountry] = useState<'all' | 'germany' | 'denmark'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Debounce search
  const debouncedSearch = useMemo(
    () =>
      (query: string) => {
        setTimeout(() => setDebouncedSearchQuery(query), 300);
      },
    []
  );

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    debouncedSearch(text);
  };

  // Fetch delivery schedules
  const {
    data: schedules = [],
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['deliverySchedules', selectedStatus !== 'all' ? selectedStatus : undefined, selectedCountry !== 'all' ? selectedCountry : undefined],
    queryFn: () =>
      deliveryService.getDeliverySchedules({
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        country: selectedCountry !== 'all' ? selectedCountry : undefined,
      }),
  });

  // Filter schedules by search query
  const filteredSchedules = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return schedules;

    const query = debouncedSearchQuery.toLowerCase();
    return schedules.filter((schedule) => {
      const orderId = schedule.order_id.toLowerCase();
      const customerName = schedule.customer?.name?.toLowerCase() || '';
      const customerEmail = schedule.customer?.email?.toLowerCase() || '';
      const pickupPointName = schedule.pickup_point?.name?.toLowerCase() || '';
      
      return (
        orderId.includes(query) ||
        customerName.includes(query) ||
        customerEmail.includes(query) ||
        pickupPointName.includes(query)
      );
    });
  }, [schedules, debouncedSearchQuery]);

  // Update delivery status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ scheduleId, status }: { scheduleId: string; status: DeliveryStatus }) =>
      deliveryService.updateDeliverySchedule(scheduleId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliverySchedules'] });
      queryClient.invalidateQueries({ queryKey: ['allOrders'] });
    },
  });

  const handleStatusUpdate = useCallback((scheduleId: string, newStatus: DeliveryStatus) => {
    Alert.alert(
      'Update Delivery Status',
      `Are you sure you want to mark this delivery as ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: () => {
            updateStatusMutation.mutate({ scheduleId, status: newStatus });
          },
        },
      ]
    );
  }, [updateStatusMutation]);

  const handleSchedulePress = useCallback((scheduleId: string) => {
    // Navigate to order details or delivery details
    const schedule = schedules.find((s) => s.id === scheduleId);
    if (schedule?.order_id) {
      navigation.navigate('OrderDetails', { orderId: schedule.order_id });
    }
  }, [navigation, schedules]);

  const getStatusColor = (status: DeliveryStatus) => {
    switch (status) {
      case 'scheduled':
        return colors.neutral[500];
      case 'in_transit':
        return colors.primary[500];
      case 'delivered':
        return colors.success[500];
      case 'cancelled':
        return colors.error[500];
      case 'failed':
        return colors.error[600];
      default:
        return colors.neutral[500];
    }
  };

  const getStatusIcon = (status: DeliveryStatus) => {
    switch (status) {
      case 'scheduled':
        return 'calendar-clock';
      case 'in_transit':
        return 'truck-delivery';
      case 'delivered':
        return 'check-circle';
      case 'cancelled':
        return 'cancel';
      case 'failed':
        return 'alert-circle';
      default:
        return 'help-circle';
    }
  };

  // Memoized render item
  const renderScheduleItem = useCallback(({ item }: { item: typeof filteredSchedules[0] }) => (
    <ContentFadeIn delay={0} style={{ paddingHorizontal: padding.horizontal, marginBottom: 12 }}>
      <Card
        glassmorphism
        onPress={() => handleSchedulePress(item.id)}
        style={{ padding: 16 }}
      >
        <View style={styles.scheduleHeader}>
          <View style={styles.scheduleInfo}>
            <Text style={styles.orderId}>Order #{item.order_id.slice(0, 8)}</Text>
            <Badge
              variant="primary"
              size="sm"
              style={{ backgroundColor: getStatusColor(item.status) }}
            >
              <Icon name={getStatusIcon(item.status)} size={12} color="#fff" style={{ marginRight: 4 }} />
              {item.status.replace('_', ' ')}
            </Badge>
          </View>
        </View>

        <View style={styles.scheduleDetails}>
          <View style={styles.detailRow}>
            <Icon name="calendar" size={16} color={colors.neutral[600]} />
            <Text style={styles.detailText}>
              {formatDate(item.delivery_date)}
            </Text>
            {item.estimated_time && (
              <>
                <Icon name="clock-outline" size={16} color={colors.neutral[600]} style={{ marginLeft: 12 }} />
                <Text style={styles.detailText}>{item.estimated_time}</Text>
              </>
            )}
          </View>

          {item.customer && (
            <View style={styles.detailRow}>
              <Icon name="account" size={16} color={colors.neutral[600]} />
              <Text style={styles.detailText}>
                {item.customer.name || item.customer.email}
              </Text>
              {item.customer.phone && (
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert('Contact Customer', `Phone: ${item.customer?.phone}`, [
                      { text: 'OK' },
                    ]);
                  }}
                  style={{ marginLeft: 8 }}
                >
                  <Icon name="phone" size={16} color={colors.primary[500]} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {item.pickup_point ? (
            <View style={styles.detailRow}>
              <Icon name="map-marker" size={16} color={colors.neutral[600]} />
              <Text style={styles.detailText} numberOfLines={1}>
                {item.pickup_point.name}
              </Text>
            </View>
          ) : item.order?.delivery_address ? (
            <View style={styles.detailRow}>
              <Icon name="home" size={16} color={colors.neutral[600]} />
              <Text style={styles.detailText} numberOfLines={1}>
                Home Delivery
              </Text>
            </View>
          ) : null}

          {item.order && (
            <View style={styles.detailRow}>
              <Icon name="currency-eur" size={16} color={colors.neutral[600]} />
              <Text style={styles.detailText}>
                {formatCurrency(item.order.total_amount, item.order.country as Country)}
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.actions}>
          {item.status === 'scheduled' && (
            <Button
              title="Start Delivery"
              onPress={() => handleStatusUpdate(item.id, 'in_transit')}
              variant="primary"
              size="sm"
              style={{ flex: 1, marginRight: 8 }}
            />
          )}
          {item.status === 'in_transit' && (
            <>
              <Button
                title="Mark Delivered"
                onPress={() => handleStatusUpdate(item.id, 'delivered')}
                variant="primary"
                size="sm"
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title="Cancel"
                onPress={() => handleStatusUpdate(item.id, 'cancelled')}
                variant="outline"
                size="sm"
                style={{ flex: 1 }}
              />
            </>
          )}
        </View>
      </Card>
    </ContentFadeIn>
  ), [country, handleSchedulePress, handleStatusUpdate, padding.horizontal]);

  // Memoized key extractor
  const keyExtractor = useCallback((item: typeof filteredSchedules[0]) => item.id, []);

  if (isLoading) {
    return (
      <View style={glassmorphism.screenBackground}>
        <AppHeader title="Delivery Management" />
        <View style={{ paddingHorizontal: padding.horizontal, paddingTop: padding.vertical }}>
          <SkeletonCard type="order" count={3} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={glassmorphism.screenBackground}>
        <AppHeader title="Delivery Management" />
        <ErrorMessage
          message="Failed to load delivery schedules. Please try again."
          error={error}
          onRetry={async () => { await refetch(); }}
          retryWithBackoff={true}
        />
      </View>
    );
  }

  const renderHeader = () => (
    <AnimatedView 
      animation="fade" 
      delay={0} 
      style={[
        glassmorphism.panel.container,
        {
          paddingHorizontal: padding.horizontal,
          paddingTop: padding.vertical,
          paddingBottom: 8,
        }
      ]}
    >
      <Text style={styles.title}>Delivery Management</Text>

      <SearchBar
        value={searchQuery}
        onChangeText={handleSearchChange}
        onClear={() => {
          setSearchQuery('');
          setDebouncedSearchQuery('');
        }}
        placeholder="Search by order, customer, or pickup point..."
        style={{ marginBottom: 12 }}
      />

      {/* Status Filter */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Status</Text>
        <View style={styles.filterRow}>
          {(['all', 'scheduled', 'in_transit', 'delivered', 'cancelled'] as const).map((status) => (
            <TouchableOpacity
              key={status}
              onPress={() => setSelectedStatus(status)}
              style={[
                styles.filterButton,
                selectedStatus === status && styles.filterButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedStatus === status && styles.filterButtonTextActive,
                ]}
              >
                {status === 'all' ? 'All' : status.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Country Filter */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Country</Text>
        <View style={styles.filterRow}>
          {(['all', 'germany', 'denmark'] as const).map((countryOption) => (
            <TouchableOpacity
              key={countryOption}
              onPress={() => setSelectedCountry(countryOption)}
              style={[
                styles.filterButton,
                selectedCountry === countryOption && styles.filterButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedCountry === countryOption && styles.filterButtonTextActive,
                ]}
              >
                {countryOption === 'all' ? 'All' : countryOption.charAt(0).toUpperCase() + countryOption.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Results Count */}
      <View style={styles.resultsRow}>
        <Text style={styles.resultsText}>
          {filteredSchedules.length} {filteredSchedules.length === 1 ? 'delivery' : 'deliveries'} found
        </Text>
        {selectedStatus !== 'all' && (
          <Badge variant="primary" size="sm">
            {selectedStatus}
          </Badge>
        )}
        {selectedCountry !== 'all' && (
          <Badge variant="secondary" size="sm">
            {selectedCountry}
          </Badge>
        )}
      </View>
    </AnimatedView>
  );

  return (
    <View style={glassmorphism.screenBackground}>
      <AppHeader title="Delivery Management" />
      <FlatList
        data={filteredSchedules}
        renderItem={renderScheduleItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <EmptyState
            icon="truck-delivery-outline"
            title="No Deliveries Found"
            message={
              filteredSchedules.length === 0 && schedules.length > 0
                ? 'No deliveries match your search criteria'
                : 'No delivery schedules yet. Create one from an order.'
            }
          />
        }
        contentContainerStyle={{
          paddingBottom: padding.vertical * 2,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary[500]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.neutral[900],
    marginBottom: 16,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[700],
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(58, 181, 209, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  filterButtonActive: {
    borderColor: colors.primary[500],
    backgroundColor: 'rgba(58, 181, 209, 0.1)',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[600],
    textTransform: 'capitalize',
  },
  filterButtonTextActive: {
    color: colors.primary[500],
  },
  resultsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  resultsText: {
    fontSize: 14,
    color: colors.neutral[500],
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scheduleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.neutral[900],
  },
  scheduleDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: colors.neutral[700],
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 8,
  },
});

export default AdminDeliveryScreen;

