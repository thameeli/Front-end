/**
 * Modern Register Screen with Step-by-Step Progress Indicator
 * Uses NativeWind for styling and Phase 2 components
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { RootStackParamList, UserRole } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { Button, Input, ErrorMessage, AnimatedView, Badge } from '../../components';
import { registerSchema, validateForm } from '../../utils/validation';
import { colors } from '../../theme';

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
  const [role, setRole] = useState<UserRole>('customer');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string>('');

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

    const result = await register(email, password, name, phone || undefined, role);
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
      className="flex-1 bg-white"
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6 pt-16 pb-8">
          {/* Header with Progress Indicator */}
          <AnimatedView animation="fade" delay={0} className="mb-8">
            <View className="items-center mb-6">
              <View className="w-20 h-20 rounded-full bg-primary-500/10 justify-center items-center mb-6">
                <Icon name="account-plus" size={40} color={colors.primary[500]} />
              </View>
              <Text className="text-4xl font-bold text-neutral-900 mb-2">
                {t('auth.register')}
              </Text>
              <Text className="text-base text-neutral-500 text-center mb-6">
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
                label={t('auth.name')}
                placeholder={t('auth.name')}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                autoCapitalize="words"
                error={errors.name}
                leftIcon="account-outline"
                floatingLabel
                containerStyle={{ marginBottom: 20 }}
              />

              <Input
                label={t('auth.email')}
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
                floatingLabel
                containerStyle={{ marginBottom: 20 }}
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
                leftIcon="phone-outline"
                floatingLabel
                containerStyle={{ marginBottom: 20 }}
              />

              {/* Role Selection */}
              <View className="mb-6">
                <Text className="text-sm font-semibold text-neutral-700 mb-3">
                  {t('profile.role')} (Testing)
                </Text>
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => setRole('customer')}
                    className={`
                      flex-1 flex-row items-center justify-between p-4 rounded-lg border-2
                      ${role === 'customer' ? 'border-primary-500 bg-primary-50' : 'border-neutral-200 bg-white'}
                    `}
                  >
                    <View className="flex-row items-center">
                      <Icon
                        name="account"
                        size={20}
                        color={role === 'customer' ? colors.primary[500] : colors.neutral[500]}
                        style={{ marginRight: 8 }}
                      />
                      <Text
                        className={`
                          text-sm font-medium
                          ${role === 'customer' ? 'text-primary-500' : 'text-neutral-600'}
                        `}
                      >
                        {t('profile.customer')}
                      </Text>
                    </View>
                    {role === 'customer' && (
                      <Icon name="check-circle" size={20} color={colors.primary[500]} />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setRole('admin')}
                    className={`
                      flex-1 flex-row items-center justify-between p-4 rounded-lg border-2
                      ${role === 'admin' ? 'border-primary-500 bg-primary-50' : 'border-neutral-200 bg-white'}
                    `}
                  >
                    <View className="flex-row items-center">
                      <Icon
                        name="shield-account"
                        size={20}
                        color={role === 'admin' ? colors.primary[500] : colors.neutral[500]}
                        style={{ marginRight: 8 }}
                      />
                      <Text
                        className={`
                          text-sm font-medium
                          ${role === 'admin' ? 'text-primary-500' : 'text-neutral-600'}
                        `}
                      >
                        {t('profile.admin')}
                      </Text>
                    </View>
                    {role === 'admin' && (
                      <Icon name="check-circle" size={20} color={colors.primary[500]} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <Input
                label={t('auth.password')}
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
                floatingLabel
                containerStyle={{ marginBottom: 20 }}
              />

              <Input
                label={t('auth.confirmPassword')}
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
                floatingLabel
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
