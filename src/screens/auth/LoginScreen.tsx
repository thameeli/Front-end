/**
 * Modern Login Screen with Clean Layout and Smooth Form Animations
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
import { Button, Input, ErrorMessage, AnimatedView, AlertModal } from '../../components';
import { loginSchema, validateForm } from '../../utils/validation';
import { validateEmail, validatePassword } from '../../utils/fieldValidation';
import { colors } from '../../theme';
import { ASSETS } from '../../constants/assets';
import {
  isSmallDevice,
  isTablet,
  getResponsivePadding,
  getResponsiveFontSize,
} from '../../utils/responsive';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { t } = useTranslation();
  const { login, isLoading, isAuthenticated, user } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string>('');
  const [shakeKey, setShakeKey] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  
  // Responsive dimensions
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const isSmall = isSmallDevice();
  const isTabletDevice = isTablet();
  const padding = getResponsivePadding();
  
  // Function to trigger shake animation by re-rendering with key
  const triggerShake = () => {
    setShakeKey(prev => prev + 1);
  };
  
  // Update dimensions on orientation change
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });
    return () => subscription?.remove();
  }, []);

  // Debug: Log when showAlert changes
  useEffect(() => {
    console.log('🔵 [LoginScreen] showAlert state changed:', showAlert, 'message:', alertMessage);
  }, [showAlert, alertMessage]);

  // Navigate when authentication state changes
  // Note: Don't clear errors here - only clear on successful login attempt
  // IMPORTANT: Only clear error on successful authentication, never navigate on error
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('✅ Login successful, user authenticated:', {
        role: user.role,
        email: user.email,
        name: user.name,
      });
      // Clear error only on successful authentication
      setApiError('');
      // Navigation will happen automatically via AppNavigator based on isAuthenticated
    } else if (!isAuthenticated) {
      // If user becomes unauthenticated (logout), clear any stale errors
      // But keep errors if login just failed (apiError will be set by handleLogin)
      // Only clear if there's no active login attempt
      if (!isLoading) {
        // Don't clear apiError here - let it persist until user tries again
      }
    }
  }, [isAuthenticated, user, isLoading]);

  const handleLogin = async () => {
    // Clear previous errors
    setErrors({});
    setApiError('');

    // Validate form
    const validation = await validateForm(loginSchema, { email, password });
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // Attempt login
    const result = await login(email, password);
    
    // Always check result and display error if login failed
    // IMPORTANT: Do NOT navigate on error - stay on login screen
    if (!result.success) {
      const errorMessage = result.error || t('errors.somethingWentWrong') || 'Invalid email or password. Please try again.';
      setApiError(errorMessage);
      setAlertMessage(errorMessage);
      console.log('🔵 [LoginScreen] Setting showAlert to true, message:', errorMessage);
      setShowAlert(true);
      triggerShake(); // Visual feedback for error
      console.log('❌ [LoginScreen] Login failed - staying on login screen:', errorMessage);
      
      // CRITICAL: Ensure we stay on login screen - do NOT navigate
      // isAuthenticated will remain false, so AppNavigator will keep showing Login screen
      // User must correct credentials and try again
      return; // Exit early to prevent any further processing
    } else {
      // Clear any previous errors on success
      setApiError('');
      setShowAlert(false); // Hide any previous error modal
      setShakeKey(0); // Reset shake
      console.log('✅ [LoginScreen] Login successful - navigation will happen automatically');
      // Navigation will happen automatically via AppNavigator when isAuthenticated becomes true
    }
  };

  const handleForgotPassword = () => {
    // TODO: Implement forgot password flow
    // Alert.alert(t('auth.forgotPassword'), 'Forgot password feature coming soon!');
  };

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
          {/* Header with Animation */}
          <AnimatedView animation="fade" delay={0} className="mb-12">
            <View className="items-center mb-8">
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
                {t('auth.login')}
              </Text>
              <Text className="text-base text-neutral-500 text-center">
                Welcome back! Please login to continue
              </Text>
            </View>
          </AnimatedView>

          {/* Form with Animation */}
          <AnimatedView 
            key={shakeKey}
            animation="slide" 
            delay={100} 
            enterFrom="bottom" 
            className="flex-1"
          >
            <View className="mb-6">
                {apiError && (
                  <ErrorMessage
                    message={apiError}
                    type="error"
                    onDismiss={() => setApiError('')}
                    style={{ 
                      marginBottom: 16,
                      backgroundColor: colors.error[50] || '#FEF2F2',
                      borderLeftWidth: 4,
                      borderLeftColor: colors.error[500] || '#EF4444',
                      padding: 12,
                      borderRadius: 8,
                    }}
                  />
                )}

              <Input
                placeholder={t('auth.email')}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  // Clear field-specific error when user types
                  if (errors.email) {
                    setErrors({ ...errors, email: '' });
                  }
                  // Keep API error visible until user tries to login again
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
                placeholder={t('auth.password')}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  // Clear field-specific error when user types
                  if (errors.password) {
                    setErrors({ ...errors, password: '' });
                  }
                  // Keep API error visible until user tries to login again
                }}
                secureTextEntry
                autoComplete="password"
                error={errors.password}
                leftIcon="lock-outline"
                validateOnChange={true}
                showSuccess={true}
                onValidate={validatePassword}
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

      {/* Custom Alert Modal */}
      <AlertModal
        visible={showAlert}
        onClose={() => {
          console.log('🔵 [LoginScreen] AlertModal onClose called');
          setShowAlert(false);
        }}
        title="Login Failed"
        message={alertMessage || 'Invalid email or password. Please check your credentials and try again.'}
        type="error"
        confirmText="OK"
        onConfirm={() => {
          console.log('🔵 [LoginScreen] AlertModal onConfirm called');
          setShowAlert(false);
        }}
      />
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
