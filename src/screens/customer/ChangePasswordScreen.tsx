import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { Button, Input, ErrorMessage, AppHeader } from '../../components';
import { passwordChangeSchema, validateForm } from '../../utils/validation';

type ChangePasswordScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

const ChangePasswordScreen = () => {
  const navigation = useNavigation<ChangePasswordScreenNavigationProp>();
  const { t } = useTranslation();
  const { changePassword } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = async () => {
    setErrors({});
    setApiError('');

    // Validate form
    const validation = await validateForm(passwordChangeSchema, {
      currentPassword,
      newPassword,
      confirmPassword,
    });
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsLoading(true);
    const result = await changePassword(currentPassword, newPassword);
    setIsLoading(false);

    if (result.success) {
      Alert.alert(t('common.success'), 'Password changed successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } else {
      setApiError(result.error || t('errors.somethingWentWrong'));
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Change Password" showBack />
      <ScrollView style={styles.content}>
        {apiError && (
          <ErrorMessage
            message={apiError}
            onDismiss={() => setApiError('')}
          />
        )}

        <Input
          label="Current Password"
          placeholder="Enter current password"
          value={currentPassword}
          onChangeText={(text) => {
            setCurrentPassword(text);
            if (errors.currentPassword) setErrors({ ...errors, currentPassword: '' });
          }}
          secureTextEntry
          error={errors.currentPassword}
        />

        <Input
          label="New Password"
          placeholder="Enter new password"
          value={newPassword}
          onChangeText={(text) => {
            setNewPassword(text);
            if (errors.newPassword) setErrors({ ...errors, newPassword: '' });
          }}
          secureTextEntry
          error={errors.newPassword}
        />

        <Input
          label="Confirm New Password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
          }}
          secureTextEntry
          error={errors.confirmPassword}
        />

        <Button
          title="Change Password"
          onPress={handleChangePassword}
          loading={isLoading}
          disabled={isLoading}
          fullWidth
          style={styles.changeButton}
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
  changeButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  cancelButton: {
    marginTop: 8,
  },
});

export default ChangePasswordScreen;

