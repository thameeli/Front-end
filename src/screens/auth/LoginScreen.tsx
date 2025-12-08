import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { Button, Input, ErrorMessage } from '../../components';
import { loginSchema, validateForm } from '../../utils/validation';

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
      // Navigation will be handled by AppNavigator based on auth state
      // But we can force a navigation reset to ensure it happens
      // The AppNavigator should automatically redirect, but this ensures it
      console.log('✅ Login successful, user authenticated:', user.role);
    }
  }, [isAuthenticated, user, navigation]);

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
    // If successful, navigation will happen automatically via AppNavigator
    // The useEffect above will also trigger when isAuthenticated changes
  };

  const handleForgotPassword = () => {
    // TODO: Implement forgot password flow
    Alert.alert(t('auth.forgotPassword'), 'Forgot password feature coming soon!');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('auth.login')}</Text>
        <Text style={styles.subtitle}>{t('auth.login')}</Text>
      </View>
      
      <View style={styles.form}>
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
        />

        <TouchableOpacity
          style={styles.forgotPasswordButton}
          onPress={handleForgotPassword}
        >
          <Text style={styles.forgotPasswordText}>{t('auth.forgotPassword')}</Text>
        </TouchableOpacity>
        
        <Button
          title={t('auth.login')}
          onPress={handleLogin}
          loading={isLoading}
          disabled={isLoading}
          fullWidth
          style={styles.loginButton}
        />
        
        <Button
          title={t('auth.dontHaveAccount')}
          onPress={() => navigation.navigate('Register')}
          variant="outline"
          fullWidth
          style={styles.registerButton}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  header: {
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    flex: 1,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    marginTop: -8,
  },
  forgotPasswordText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  registerButton: {
    marginTop: 8,
  },
});

export default LoginScreen;
