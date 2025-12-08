import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { userService } from '../../services';
import { Button, Input, ErrorMessage, AppHeader, CountrySelector } from '../../components';
import { profileUpdateSchema, validateForm } from '../../utils/validation';
import { COUNTRIES } from '../../constants';
import type { Country } from '../../constants';

type EditProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

const EditProfileScreen = () => {
  const navigation = useNavigation<EditProfileScreenNavigationProp>();
  const { t } = useTranslation();
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState<Country>(COUNTRIES.GERMANY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setCountry(user.country_preference || COUNTRIES.GERMANY);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setErrors({});
    setApiError('');

    // Validate form
    const validation = await validateForm(profileUpdateSchema, { name, phone });
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      setIsLoading(true);
      const updatedUser = await userService.updateUserProfile(user.id, {
        name,
        phone: phone || undefined,
        country_preference: country,
      });

      setUser(updatedUser);
      Alert.alert(t('common.success'), 'Profile updated successfully');
      navigation.goBack();
    } catch (error: any) {
      setApiError(error.message || t('errors.somethingWentWrong'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title={t('profile.title')} showBack />
      <ScrollView style={styles.content}>
        {apiError && (
          <ErrorMessage
            message={apiError}
            onDismiss={() => setApiError('')}
          />
        )}

        <Input
          label={t('auth.name')}
          placeholder={t('auth.name')}
          value={name}
          onChangeText={(text) => {
            setName(text);
            if (errors.name) setErrors({ ...errors, name: '' });
          }}
          autoCapitalize="words"
          error={errors.name}
        />

        <Input
          label={t('auth.phone')}
          placeholder={t('auth.phone')}
          value={phone}
          onChangeText={(text) => {
            setPhone(text);
            if (errors.phone) setErrors({ ...errors, phone: '' });
          }}
          keyboardType="phone-pad"
          autoComplete="tel"
          error={errors.phone}
        />

        <CountrySelector
          selectedCountry={country}
          onSelectCountry={setCountry}
        />

        <Button
          title={t('common.save')}
          onPress={handleSave}
          loading={isLoading}
          disabled={isLoading}
          fullWidth
          style={styles.saveButton}
        />

        <Button
          title={t('common.cancel')}
          onPress={() => navigation.goBack()}
          variant="outline"
          fullWidth
          style={styles.cancelButton}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  saveButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  cancelButton: {
    marginTop: 8,
  },
});

export default EditProfileScreen;

