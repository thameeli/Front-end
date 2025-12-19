import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RootStackParamList } from '../../types';
import { pickupPointService } from '../../services';
import { AppHeader, Input, Button, ErrorMessage, CountrySelector } from '../../components';
import { COUNTRIES } from '../../constants';
import type { Country } from '../../constants';
import { isTablet, isSmallDevice, getResponsivePadding } from '../../utils/responsive';

type AddPickupPointScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddPickupPoint'>;

const AddPickupPointScreen = () => {
  const navigation = useNavigation<AddPickupPointScreenNavigationProp>();
  const queryClient = useQueryClient();
  const padding = getResponsivePadding();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [country, setCountry] = useState<Country>(COUNTRIES.GERMANY);
  const [deliveryFee, setDeliveryFee] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useMutation({
    mutationFn: (pickupPointData: any) => pickupPointService.createPickupPoint(pickupPointData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pickupPoints'] });
      Alert.alert('Success', 'Pickup point created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to create pickup point');
    },
  });

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Name is required';
    if (!address.trim()) newErrors.address = 'Address is required';
    if (!deliveryFee || isNaN(parseFloat(deliveryFee)) || parseFloat(deliveryFee) < 0) {
      newErrors.deliveryFee = 'Valid delivery fee is required';
    }

    // Validate coordinates if provided
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

    createMutation.mutate({
      name: name.trim(),
      address: address.trim(),
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      country,
      delivery_fee: parseFloat(deliveryFee),
      active: true,
    });
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Add Pickup Point" showBack />
      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ 
          padding: padding.vertical,
          maxWidth: isTablet ? 600 : '100%',
          alignSelf: isTablet ? 'center' : 'stretch',
        }}
      >
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

        <Button
          title="Create Pickup Point"
          onPress={handleSubmit}
          loading={createMutation.isPending}
          disabled={createMutation.isPending}
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
    flexDirection: isSmallDevice ? 'column' : 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 16,
  },
});

export default AddPickupPointScreen;

