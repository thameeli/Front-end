import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { RootStackParamList, UserRole } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { Button, Input, ErrorMessage } from '../../components';
import { registerSchema, validateForm } from '../../utils/validation';

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
  const [role, setRole] = useState<UserRole>('customer'); // For testing only
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('auth.register')}</Text>
        <Text style={styles.subtitle}>{t('auth.register')}</Text>
      </View>
      
      <View style={styles.form}>
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

        {/* Role Selection (for testing only) */}
        <View style={styles.roleSection}>
          <Text style={styles.roleLabel}>{t('profile.role')} (Testing)</Text>
          <View style={styles.roleOptions}>
            <TouchableOpacity
              style={[styles.roleOption, role === 'customer' && styles.roleOptionActive]}
              onPress={() => setRole('customer')}
            >
              <Text style={[styles.roleText, role === 'customer' && styles.roleTextActive]}>
                {t('profile.customer')}
              </Text>
              {role === 'customer' && <Icon name="check" size={20} color="#007AFF" />}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleOption, role === 'admin' && styles.roleOptionActive]}
              onPress={() => setRole('admin')}
            >
              <Text style={[styles.roleText, role === 'admin' && styles.roleTextActive]}>
                {t('profile.admin')}
              </Text>
              {role === 'admin' && <Icon name="check" size={20} color="#007AFF" />}
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
        />
        
        <Button
          title={t('auth.register')}
          onPress={handleRegister}
          loading={isLoading}
          disabled={isLoading}
          fullWidth
          style={styles.registerButton}
        />
        
        <Button
          title={t('auth.alreadyHaveAccount')}
          onPress={() => navigation.navigate('Login')}
          variant="outline"
          fullWidth
          style={styles.loginButton}
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
    marginTop: 40,
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
  registerButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  loginButton: {
    marginTop: 8,
  },
  roleSection: {
    marginBottom: 16,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  roleOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  roleOptionActive: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f7ff',
  },
  roleText: {
    fontSize: 14,
    color: '#666',
  },
  roleTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default RegisterScreen;
