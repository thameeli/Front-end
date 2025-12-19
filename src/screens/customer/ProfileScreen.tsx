/**
 * Modern Profile Screen with Gradient Header and Smooth Sections
 * Uses NativeWind for styling and Phase 2 components
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { AppHeader, CountrySelector, Card, AnimatedView, Badge } from '../../components';
import { formatPhoneNumber } from '../../utils/regionalFormatting';
import { COUNTRIES } from '../../constants';
import type { Country } from '../../constants';
import { colors } from '../../theme';
import { isTablet, getResponsivePadding, getResponsiveFontSize } from '../../utils/responsive';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

const ProfileScreen = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { t } = useTranslation();
  const { user, logout, updateCountryPreference } = useAuthStore();
  const padding = getResponsivePadding();

  const handleLogout = async () => {
    Alert.alert(
      t('auth.logout') || 'Logout',
      t('auth.logoutConfirm') || 'Are you sure you want to logout?',
      [
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('auth.logout') || 'Logout',
          style: 'destructive',
          onPress: async () => await logout(),
        },
      ]
    );
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile' as never);
  };

  const handleCountryChange = async (country: Country) => {
    if (user) {
      await updateCountryPreference(country);
    }
  };

  if (!user) {
    return (
      <View className="flex-1 bg-white">
        <AppHeader title={t('profile.title')} />
        <View className="flex-1 justify-center items-center">
          <Text className="text-base text-neutral-500">{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neutral-50">
      <AppHeader title={t('profile.title')} />
      
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Profile Header with Gradient */}
        <AnimatedView animation="fade" delay={0}>
          <LinearGradient
            colors={[colors.primary[500], colors.primary[600]]}
            style={{ paddingHorizontal: padding.horizontal, paddingTop: padding.vertical * 1.5, paddingBottom: padding.vertical * 2 }}
          >
            <View className="items-center">
              <View className="w-24 h-24 rounded-full bg-white/20 justify-center items-center mb-4 border-4 border-white/30">
                <Icon name="account-circle" size={64} color="white" />
              </View>
              <Text style={{ fontSize: getResponsiveFontSize(24), fontWeight: 'bold', color: 'white', marginBottom: 8 }}>
                {user.name || user.email}
              </Text>
              <View className="flex-row items-center gap-2">
                <Badge variant="secondary" size="sm">
                  {user.role === 'admin' ? t('profile.admin') : t('profile.customer')}
                </Badge>
                <Badge variant="primary" size="sm">
                  {user.country_preference === COUNTRIES.GERMANY ? 'Germany' : 'Norway'}
                </Badge>
              </View>
            </View>
          </LinearGradient>
        </AnimatedView>

        {/* Profile Information */}
        <AnimatedView animation="slide" delay={100} enterFrom="bottom" style={{ paddingHorizontal: padding.horizontal, marginTop: -24 }}>
          <Card elevation="raised" style={{ padding: padding.vertical * 1.5, marginBottom: padding.vertical }}>
            <Text className="text-lg font-bold text-neutral-900 mb-4">
              {t('profile.information') || 'Information'}
            </Text>

            <View className="gap-4">
              <View className="flex-row items-center pb-4 border-b border-neutral-200">
                <View className="w-10 h-10 rounded-full bg-primary-100 justify-center items-center mr-3">
                  <Icon name="email" size={20} color={colors.primary[500]} />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-neutral-500 mb-1">
                    {t('profile.email')}
                  </Text>
                  <Text className="text-base font-semibold text-neutral-900">
                    {user.email}
                  </Text>
                </View>
              </View>

              {user.name && (
                <View className="flex-row items-center pb-4 border-b border-neutral-200">
                  <View className="w-10 h-10 rounded-full bg-primary-100 justify-center items-center mr-3">
                    <Icon name="account" size={20} color={colors.primary[500]} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-neutral-500 mb-1">
                      {t('profile.name')}
                    </Text>
                    <Text className="text-base font-semibold text-neutral-900">
                      {user.name}
                    </Text>
                  </View>
                </View>
              )}

              {user.phone && (
                <View className="flex-row items-center pb-4 border-b border-neutral-200">
                  <View className="w-10 h-10 rounded-full bg-primary-100 justify-center items-center mr-3">
                    <Icon name="phone" size={20} color={colors.primary[500]} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-neutral-500 mb-1">
                      {t('profile.phone')}
                    </Text>
                    <Text 
                      className="text-base font-semibold text-neutral-900"
                      accessibilityLabel={`Phone number: ${formatPhoneNumber(user.phone, user.country_preference || COUNTRIES.GERMANY)}`}
                    >
                      {formatPhoneNumber(user.phone, user.country_preference || COUNTRIES.GERMANY)}
                    </Text>
                  </View>
                </View>
              )}

              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-primary-100 justify-center items-center mr-3">
                  <Icon name="shield-account" size={20} color={colors.primary[500]} />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-neutral-500 mb-1">
                    {t('profile.role')}
                  </Text>
                  <Text className="text-base font-semibold text-neutral-900 capitalize">
                    {user.role === 'admin' ? t('profile.admin') : t('profile.customer')}
                  </Text>
                </View>
              </View>
            </View>
          </Card>

          {/* Country Preference */}
          <Card elevation="raised" style={{ padding: padding.vertical * 1.5, marginBottom: padding.vertical }}>
            <Text className="text-lg font-bold text-neutral-900 mb-4">
              {t('profile.countryPreference') || 'Country Preference'}
            </Text>
            <CountrySelector
              selectedCountry={user.country_preference || COUNTRIES.GERMANY}
              onSelectCountry={handleCountryChange}
            />
          </Card>

          {/* Actions */}
          <View className="gap-3">
            <TouchableOpacity
              onPress={handleEditProfile}
              className="flex-row items-center justify-center p-4 bg-white rounded-xl border-2 border-primary-500"
            >
              <Icon name="pencil" size={20} color={colors.primary[500]} />
              <Text className="text-base font-semibold text-primary-500 ml-2">
                {t('common.edit') || 'Edit Profile'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogout}
              className="flex-row items-center justify-center p-4 bg-error-500 rounded-xl"
            >
              <Icon name="logout" size={20} color="white" />
              <Text className="text-base font-semibold text-white ml-2">
                {t('auth.logout') || 'Logout'}
              </Text>
            </TouchableOpacity>
          </View>
        </AnimatedView>
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;
