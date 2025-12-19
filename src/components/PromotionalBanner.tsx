/**
 * Promotional Banner Component
 * Large banner with promotional offers and vouchers
 * Safe for Expo Go - uses StyleSheet instead of className
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors } from '../theme';
import Button from './Button';

interface PromotionalBannerProps {
  title: string;
  subtitle?: string;
  offerText?: string;
  validUntil?: string;
  onCollect?: () => void;
  variant?: 'primary' | 'success' | 'warning';
}

const PromotionalBanner: React.FC<PromotionalBannerProps> = ({
  title,
  subtitle,
  offerText,
  validUntil,
  onCollect,
  variant = 'primary',
}) => {
  const getGradientColors = (): string[] => {
    switch (variant) {
      case 'success':
        return [colors.success[500] as string, colors.success[600] as string];
      case 'warning':
        return [colors.warning[500] as string, colors.warning[600] as string];
      case 'primary':
      default:
        return [colors.primary[500] as string, colors.primary[600] as string];
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={getGradientColors() as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && (
              <Text style={styles.subtitle}>{subtitle}</Text>
            )}
            {offerText && (
              <View style={styles.offerContainer}>
                <Icon name="gift" size={16} color="#fff" />
                <Text style={styles.offerText}>{offerText}</Text>
              </View>
            )}
            {validUntil && (
              <Text style={styles.validUntil}>
                Valid until {validUntil}
              </Text>
            )}
          </View>
          
          {onCollect && (
            <TouchableOpacity
              onPress={onCollect}
              style={styles.button}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Collect Now</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gradient: {
    padding: 16,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 8,
  },
  offerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  offerText: {
    fontSize: 12,
    color: '#fff',
    marginLeft: 6,
    fontWeight: '500',
  },
  validUntil: {
    fontSize: 11,
    color: '#fff',
    opacity: 0.8,
    fontStyle: 'italic',
  },
  button: {
    borderWidth: 1.5,
    borderColor: '#fff',
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

// Set displayName for better debugging
PromotionalBanner.displayName = 'PromotionalBanner';

export default PromotionalBanner;
