/**
 * Modern Login Screen with Clean Layout and Smooth Form Animations
 * Uses NativeWind for styling and Phase 2 components
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { RootStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { Button, Input, ErrorMessage, AnimatedView } from '../../components';
import { loginSchema, validateForm } from '../../utils/validation';
import { colors } from '../../theme';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { t } = useTranslation();
  const { login, isLoading, isAuthenticated, user } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string>('');

  // Navigate when authentication state changes
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('✅ Login successful, user authenticated:', {
        role: user.role,
        email: user.email,
        name: user.name,
      });
    }
  }, [isAuthenticated, user]);

  const handleLogin = async () => {
    setErrors({});
    setApiError('');

    // Validate form
    const validation = await validateForm(loginSchema, { email, password });
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    const result = await login(email, password);
    if (!result.success) {
      setApiError(result.error || t('errors.somethingWentWrong'));
    }
  };

  const handleForgotPassword = () => {
    // TODO: Implement forgot password flow
    // Alert.alert(t('auth.forgotPassword'), 'Forgot password feature coming soon!');
  };

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
          {/* Header with Animation */}
          <AnimatedView animation="fade" delay={0} className="mb-12">
            <View className="items-center mb-8">
              <View className="w-20 h-20 rounded-full bg-primary-500/10 justify-center items-center mb-6">
                <Icon name="store" size={40} color={colors.primary[500]} />
              </View>
              <Text className="text-4xl font-bold text-neutral-900 mb-2">
                {t('auth.login')}
              </Text>
              <Text className="text-base text-neutral-500 text-center">
                Welcome back! Please login to continue
              </Text>
            </View>
          </AnimatedView>

          {/* Form with Animation */}
          <AnimatedView animation="slide" delay={100} enterFrom="bottom" className="flex-1">
            <View className="mb-6">
              {apiError && (
                <ErrorMessage
                  message={apiError}
                  onDismiss={() => setApiError('')}
                />
              )}

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
                label={t('auth.password')}
                placeholder={t('auth.password')}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors({ ...errors, password: '' });
                }}
                secureTextEntry
                autoComplete="password"
                error={errors.password}
                leftIcon="lock-outline"
                floatingLabel
                containerStyle={{ marginBottom: 8 }}
              />

              <TouchableOpacity
                onPress={handleForgotPassword}
                className="self-end mb-6"
              >
                <Text className="text-sm font-semibold text-primary-500">
                  {t('auth.forgotPassword')}
                </Text>
              </TouchableOpacity>

              <Button
                title={t('auth.login')}
                onPress={handleLogin}
                loading={isLoading}
                disabled={isLoading}
                fullWidth
                size="lg"
                style={{ marginBottom: 16 }}
              />

              <View className="flex-row items-center justify-center mt-4">
                <Text className="text-sm text-neutral-500 mr-1">
                  Don't have an account?
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text className="text-sm font-semibold text-primary-500">
                    {t('auth.register')}
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

export default LoginScreen;
