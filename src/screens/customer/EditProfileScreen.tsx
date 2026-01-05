import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { userService } from '../../services';
import { Button, Input, ErrorMessage, AppHeader, CountrySelector, useToast } from '../../components';
import { profileUpdateSchema, validateForm } from '../../utils/validation';
import { validateName, validatePhone } from '../../utils/fieldValidation';
import { formatPhoneNumber } from '../../utils/regionalFormatting';
import { COUNTRIES } from '../../constants';
import type { Country } from '../../constants';
import { isTablet, getResponsivePadding } from '../../utils/responsive';

type EditProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

const EditProfileScreen = () => {
  const navigation = useNavigation<EditProfileScreenNavigationProp>();
  const { t } = useTranslation();
  const { user, setUser } = useAuthStore();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState<Country>(COUNTRIES.GERMANY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const padding = getResponsivePadding();

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
      showToast({
        message: 'Profile updated successfully',
        type: 'success',
        duration: 2000,
      });
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
      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ 
          padding: padding.vertical,
          maxWidth: isTablet ? 600 : '100%',
          alignSelf: isTablet ? 'center' : 'stretch',
        }}
      >
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
          validateOnChange={true}
          showSuccess={true}
          onValidate={validateName}
        />

        <Input
          label={t('auth.phone')}
          placeholder={country === COUNTRIES.GERMANY ? "+49 123 4567890" : "+45 12 34 56 78"}
          value={phone}
          onChangeText={(text) => {
            // Format phone number as user types
            const digits = text.replace(/\D/g, '');
            const formatted = formatPhoneNumber(digits, country);
            setPhone(formatted);
            if (errors.phone) setErrors({ ...errors, phone: '' });
          }}
          keyboardType="phone-pad"
          autoComplete="tel"
          error={errors.phone}
          validateOnChange={true}
          showSuccess={true}
          onValidate={validatePhone}
          helperText="Optional"
          accessibilityLabel={`Phone number input for ${country === COUNTRIES.GERMANY ? 'Germany' : 'Denmark'}`}
          accessibilityHint={`Enter phone number in ${country === COUNTRIES.GERMANY ? 'German' : 'Danish'} format`}
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

