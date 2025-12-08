import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  type?: 'error' | 'warning' | 'info';
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  onDismiss,
  type = 'error',
}) => {
  const { t } = useTranslation();

  const getIconName = () => {
    switch (type) {
      case 'warning':
        return 'alert';
      case 'info':
        return 'information';
      default:
        return 'alert-circle';
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'warning':
        return '#FFF3CD';
      case 'info':
        return '#D1ECF1';
      default:
        return '#F8D7DA';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'warning':
        return '#856404';
      case 'info':
        return '#0C5460';
      default:
        return '#721C24';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
      <Icon name={getIconName()} size={20} color={getTextColor()} />
      <Text style={[styles.message, { color: getTextColor() }]}>{message}</Text>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
          <Icon name="close" size={18} color={getTextColor()} />
        </TouchableOpacity>
      )}
      {onRetry && (
        <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
          <Text style={[styles.retryText, { color: getTextColor() }]}>
            {t('errors.tryAgain')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    gap: 8,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  dismissButton: {
    padding: 4,
  },
  retryButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ErrorMessage;

