/**
 * Modern Register Screen with Step-by-Step Progress Indicator
 * Uses NativeWind for styling and Phase 2 components
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Dimensions, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { RootStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { Button, Input, ErrorMessage, AnimatedView, Badge } from '../../components';
import { registerSchema, validateForm } from '../../utils/validation';
import { validateEmail, validatePassword, validateName, validatePhone, validateConfirmPassword } from '../../utils/fieldValidation';
import { colors } from '../../theme';
import { ASSETS } from '../../constants/assets';
import {
  isSmallDevice,
  isTablet,
  getResponsivePadding,
  getResponsiveFontSize,
} from '../../utils/responsive';

type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;

const RegisterScreen = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { t } = useTranslation();
  const { register, isLoading } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string>('');
  
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

  const handleRegister = async () => {
    setErrors({});
    setApiError('');

    // Validate form
    const validation = await validateForm(registerSchema, {
      name,
      email,
      phone: phone || undefined,
      password,
      confirmPassword,
    });
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // Always register as customer - admin must be created via seed data
    const result = await register(email, password, name, phone || undefined, 'customer');
    if (!result.success) {
      setApiError(result.error || t('errors.somethingWentWrong'));
    }
  };

  // Calculate progress (simplified - all fields are on one screen)
  const progress = React.useMemo(() => {
    let filled = 0;
    if (name) filled++;
    if (email) filled++;
    if (phone) filled++;
    if (password) filled++;
    if (confirmPassword) filled++;
    return filled / 5;
  }, [name, email, phone, password, confirmPassword]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: 'rgba(245, 245, 250, 0.95)' }}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{
          flex: 1,
          paddingHorizontal: padding.horizontal * 1.5,
          paddingTop: isSmall ? padding.vertical * 2 : padding.vertical * 4,
          paddingBottom: padding.vertical * 2,
          maxWidth: isTabletDevice ? 600 : '100%',
          alignSelf: isTabletDevice ? 'center' : 'stretch',
        }}>
          {/* Header with Progress Indicator */}
          <AnimatedView animation="fade" delay={0} className="mb-8">
            <View className="items-center mb-6">
              <View style={{
                width: isSmall ? 100 : isTabletDevice ? 150 : 120,
                height: isSmall ? 100 : isTabletDevice ? 150 : 120,
                borderRadius: isSmall ? 50 : isTabletDevice ? 75 : 60,
                backgroundColor: colors.primary[500] + '10',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: padding.vertical * 1.5,
              }}>
                <Image 
                  source={ASSETS.logo} 
                  style={{
                    width: isSmall ? 70 : isTabletDevice ? 110 : 90,
                    height: isSmall ? 70 : isTabletDevice ? 110 : 90,
                  }}
                  resizeMode="contain"
                />
              </View>
              <Text style={{
                fontSize: getResponsiveFontSize(isSmall ? 28 : isTabletDevice ? 48 : 36, 24, 48),
                fontWeight: 'bold',
                color: colors.neutral[900],
                marginBottom: 8,
                textAlign: 'center',
              }}>
                {t('auth.register')}
              </Text>
              <Text style={{
                fontSize: getResponsiveFontSize(16, 14, 18),
                color: colors.neutral[500],
                textAlign: 'center',
                marginBottom: padding.vertical * 1.5,
              }}>
                Create your account to get started
              </Text>

              {/* Progress Bar */}
              <View className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden mb-2">
                <View
                  className="h-full bg-primary-500 rounded-full"
                  style={{ width: `${progress * 100}%` }}
                />
              </View>
              <Text className="text-xs text-neutral-500">
                {Math.round(progress * 100)}% Complete
              </Text>
            </View>
          </AnimatedView>

          {/* Form */}
          <AnimatedView animation="slide" delay={100} enterFrom="bottom" className="flex-1">
            <View className="mb-6">
              {apiError && (
                <ErrorMessage
                  message={apiError}
                  onDismiss={() => setApiError('')}
                />
              )}

              <Input
                placeholder={t('auth.name')}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                autoCapitalize="words"
                error={errors.name}
                leftIcon="account-outline"
                containerStyle={{ marginBottom: 20 }}
              />

              <Input
                placeholder={t('auth.email')}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={errors.email}
                leftIcon="email-outline"
                validateOnChange={true}
                showSuccess={true}
                onValidate={validateEmail}
                containerStyle={{ marginBottom: 20 }}
              />

              <Input
                placeholder={t('auth.phone')}
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  if (errors.phone) setErrors({ ...errors, phone: '' });
                }}
                keyboardType="phone-pad"
                autoComplete="tel"
                error={errors.phone}
                leftIcon="phone-outline"
                validateOnChange={true}
                showSuccess={true}
                onValidate={validatePhone}
                helperText="Optional"
                containerStyle={{ marginBottom: 20 }}
              />


              <Input
                placeholder={t('auth.password')}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors({ ...errors, password: '' });
                }}
                secureTextEntry
                autoComplete="password-new"
                error={errors.password}
                leftIcon="lock-outline"
                validateOnChange={true}
                showSuccess={true}
                onValidate={validatePassword}
                helperText="At least 6 characters"
                containerStyle={{ marginBottom: 20 }}
              />

              <Input
                placeholder={t('auth.confirmPassword')}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                }}
                secureTextEntry
                autoComplete="password-new"
                error={errors.confirmPassword}
                leftIcon="lock-check-outline"
                validateOnChange={true}
                showSuccess={true}
                onValidate={(val) => validateConfirmPassword(val, password)}
                containerStyle={{ marginBottom: 20 }}
              />

              <Button
                title={t('auth.register')}
                onPress={handleRegister}
                loading={isLoading}
                disabled={isLoading}
                fullWidth
                size="lg"
                style={{ marginBottom: 16 }}
              />

              <View className="flex-row items-center justify-center mt-4">
                <Text className="text-sm text-neutral-500 mr-1">
                  Already have an account?
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text className="text-sm font-semibold text-primary-500">
                    {t('auth.login')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </AnimatedView>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;
