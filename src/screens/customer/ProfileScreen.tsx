import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { RootStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { AppHeader, CountrySelector, Card } from '../../components';
import { COUNTRIES } from '../../constants';
import type { Country } from '../../constants';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

const ProfileScreen = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { t } = useTranslation();
  const { user, logout, updateCountryPreference } = useAuthStore();

  const handleLogout = async () => {
    await logout();
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
      <View style={styles.container}>
        <AppHeader title={t('profile.title')} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title={t('profile.title')} />
      <ScrollView style={styles.content}>
        <Card style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Icon name="account-circle" size={80} color="#007AFF" />
          </View>
          <Text style={styles.name}>{user.name || user.email}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </Card>

        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Icon name="email" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('profile.email')}</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>
          </View>

          {user.name && (
            <View style={styles.infoRow}>
              <Icon name="account" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t('profile.name')}</Text>
                <Text style={styles.infoValue}>{user.name}</Text>
              </View>
            </View>
          )}

          {user.phone && (
            <View style={styles.infoRow}>
              <Icon name="phone" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t('profile.phone')}</Text>
                <Text style={styles.infoValue}>{user.phone}</Text>
              </View>
            </View>
          )}

          <View style={styles.infoRow}>
            <Icon name="shield-account" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('profile.role')}</Text>
              <Text style={styles.infoValue}>
                {user.role === 'admin' ? t('profile.admin') : t('profile.customer')}
              </Text>
            </View>
          </View>
        </Card>

        <Card style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>{t('profile.countryPreference')}</Text>
          <CountrySelector
            selectedCountry={user.country_preference || COUNTRIES.GERMANY}
            onSelectCountry={handleCountryChange}
          />
        </Card>

        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Icon name="pencil" size={20} color="#007AFF" />
          <Text style={styles.editButtonText}>{t('common.edit')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" size={20} color="#FF3B30" />
          <Text style={styles.logoutText}>{t('auth.logout')}</Text>
        </TouchableOpacity>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  profileCard: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 20,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
  },
  infoCard: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  settingsCard: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 12,
    gap: 8,
  },
  editButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
