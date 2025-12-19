import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RootStackParamList } from '../../types';
import { pickupPointService } from '../../services';
import { AppHeader, Input, Button, ErrorMessage, LoadingScreen, CountrySelector } from '../../components';
import { COUNTRIES } from '../../constants';
import type { Country } from '../../constants';

type EditPickupPointScreenRouteProp = RouteProp<RootStackParamList, 'EditPickupPoint'>;
type EditPickupPointScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EditPickupPoint'>;

const EditPickupPointScreen = () => {
  const route = useRoute<EditPickupPointScreenRouteProp>();
  const navigation = useNavigation<EditPickupPointScreenNavigationProp>();
  const queryClient = useQueryClient();
  const { pickupPointId } = route.params;

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [country, setCountry] = useState<Country>(COUNTRIES.GERMANY);
  const [deliveryFee, setDeliveryFee] = useState('');
  const [active, setActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch pickup point
  const { data: pickupPoint, isLoading } = useQuery({
    queryKey: ['pickupPoint', pickupPointId],
    queryFn: () => pickupPointService.getPickupPointById(pickupPointId),
    enabled: !!pickupPointId,
  });

  useEffect(() => {
    if (pickupPoint) {
      setName(pickupPoint.name);
      setAddress(pickupPoint.address);
      setLatitude(pickupPoint.latitude?.toString() || '');
      setLongitude(pickupPoint.longitude?.toString() || '');
      setCountry(pickupPoint.country);
      setDeliveryFee(pickupPoint.delivery_fee.toString());
      setActive(pickupPoint.active);
    }
  }, [pickupPoint]);

  const updateMutation = useMutation({
    mutationFn: (updates: any) => pickupPointService.updatePickupPoint(pickupPointId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pickupPoints'] });
      queryClient.invalidateQueries({ queryKey: ['pickupPoint', pickupPointId] });
      Alert.alert('Success', 'Pickup point updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to update pickup point');
    },
  });

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Name is required';
    if (!address.trim()) newErrors.address = 'Address is required';
    if (!deliveryFee || isNaN(parseFloat(deliveryFee)) || parseFloat(deliveryFee) < 0) {
      newErrors.deliveryFee = 'Valid delivery fee is required';
    }

    if (latitude && (isNaN(parseFloat(latitude)) || parseFloat(latitude) < -90 || parseFloat(latitude) > 90)) {
      newErrors.latitude = 'Valid latitude (-90 to 90) is required';
    }
    if (longitude && (isNaN(parseFloat(longitude)) || parseFloat(longitude) < -180 || parseFloat(longitude) > 180)) {
      newErrors.longitude = 'Valid longitude (-180 to 180) is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    updateMutation.mutate({
      name: name.trim(),
      address: address.trim(),
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      country,
      delivery_fee: parseFloat(deliveryFee),
      active,
    });
  };

  if (isLoading) {
    return <LoadingScreen message="Loading pickup point..." />;
  }

  if (!pickupPoint) {
    return (
      <View style={styles.container}>
        <AppHeader title="Edit Pickup Point" showBack />
        <ErrorMessage message="Pickup point not found" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Edit Pickup Point" showBack />
      <ScrollView style={styles.content}>
        {Object.keys(errors).length > 0 && (
          <ErrorMessage
            message="Please fix the errors below"
            type="error"
            style={styles.errorMessage}
          />
        )}

        <Input
          label="Name *"
          placeholder="Enter pickup point name"
          value={name}
          onChangeText={(text) => {
            setName(text);
            if (errors.name) setErrors({ ...errors, name: '' });
          }}
          error={errors.name}
        />

        <Input
          label="Address *"
          placeholder="Enter full address"
          value={address}
          onChangeText={(text) => {
            setAddress(text);
            if (errors.address) setErrors({ ...errors, address: '' });
          }}
          error={errors.address}
          multiline
          numberOfLines={2}
        />

        <CountrySelector
          selectedCountry={country}
          onSelectCountry={setCountry}
          style={styles.section}
        />

        <Input
          label="Delivery Fee *"
          placeholder="0.00"
          value={deliveryFee}
          onChangeText={(text) => {
            setDeliveryFee(text);
            if (errors.deliveryFee) setErrors({ ...errors, deliveryFee: '' });
          }}
          keyboardType="decimal-pad"
          error={errors.deliveryFee}
        />

        <View style={styles.coordinatesSection}>
          <Text style={styles.sectionTitle}>Coordinates (Optional)</Text>
          <View style={styles.coordinatesRow}>
            <View style={styles.halfWidth}>
              <Input
                label="Latitude"
                placeholder="-90 to 90"
                value={latitude}
                onChangeText={(text) => {
                  setLatitude(text);
                  if (errors.latitude) setErrors({ ...errors, latitude: '' });
                }}
                keyboardType="decimal-pad"
                error={errors.latitude}
              />
            </View>
            <View style={styles.halfWidth}>
              <Input
                label="Longitude"
                placeholder="-180 to 180"
                value={longitude}
                onChangeText={(text) => {
                  setLongitude(text);
                  if (errors.longitude) setErrors({ ...errors, longitude: '' });
                }}
                keyboardType="decimal-pad"
                error={errors.longitude}
              />
            </View>
          </View>
        </View>

        <View style={styles.activeSection}>
          <Text style={styles.label}>Status</Text>
          <TouchableOpacity
            style={[styles.activeButton, active && styles.activeButtonActive]}
            onPress={() => setActive(!active)}
          >
            <Icon
              name={active ? 'check-circle' : 'close-circle'}
              size={20}
              color={active ? '#34C759' : '#FF3B30'}
            />
            <Text style={[styles.activeText, active && styles.activeTextActive]}>
              {active ? 'Active' : 'Inactive'}
            </Text>
          </TouchableOpacity>
        </View>

        <Button
          title="Update Pickup Point"
          onPress={handleSubmit}
          loading={updateMutation.isPending}
          disabled={updateMutation.isPending}
          fullWidth
          style={styles.submitButton}
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
  errorMessage: {
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  coordinatesSection: {
    marginBottom: 16,
  },
  coordinatesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  activeSection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  activeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    gap: 8,
  },
  activeButtonActive: {
    borderColor: '#34C759',
    backgroundColor: '#e6f9ed',
  },
  activeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTextActive: {
    color: '#34C759',
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 16,
  },
});

export default EditPickupPointScreen;

