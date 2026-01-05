import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { AppHeader, ThemeToggle, PerformanceIndicator } from '../../components';
import { RootStackParamList } from '../../types';
import { isSmallDevice, isTablet, getResponsivePadding, getResponsiveFontSize } from '../../utils/responsive';

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

const SettingsScreen = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const padding = getResponsivePadding();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <View style={styles.container}>
      <AppHeader title={t('settings.title')} showBack />
      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ 
          padding: padding.vertical,
          maxWidth: isTablet ? 600 : '100%',
          alignSelf: isTablet ? 'center' : 'stretch',
        }}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
          <View style={styles.languageOptions}>
            <TouchableOpacity
              style={[
                styles.languageOption,
                i18n.language === 'en' && styles.languageOptionActive,
              ]}
              onPress={() => changeLanguage('en')}
            >
              <Text
                style={[
                  styles.languageOptionText,
                  i18n.language === 'en' && styles.languageOptionTextActive,
                ]}
              >
                {t('settings.english')}
              </Text>
              {i18n.language === 'en' && (
                <Icon name="check" size={20} color="#007AFF" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.languageOption,
                i18n.language === 'ta' && styles.languageOptionActive,
              ]}
              onPress={() => changeLanguage('ta')}
            >
              <Text
                style={[
                  styles.languageOptionText,
                  i18n.language === 'ta' && styles.languageOptionTextActive,
                ]}
              >
                {t('settings.tamil')}
              </Text>
              {i18n.language === 'ta' && (
                <Icon name="check" size={20} color="#007AFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {user && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('profile.title')}</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('profile.email')}:</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>
            {user.name && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('profile.name')}:</Text>
                <Text style={styles.infoValue}>{user.name}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('profile.role')}:</Text>
              <Text style={styles.infoValue}>
                {user.role === 'admin' ? t('profile.admin') : t('profile.customer')}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => navigation.navigate('EditProfile' as never)}
          >
            <Icon name="account-edit" size={24} color="#007AFF" />
            <Text style={styles.settingText}>Edit Profile</Text>
            <Icon name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => navigation.navigate('ChangePassword' as never)}
          >
            <Icon name="lock-reset" size={24} color="#007AFF" />
            <Text style={styles.settingText}>Change Password</Text>
            <Icon name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.theme') || 'Theme'}</Text>
          <ThemeToggle />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance</Text>
          <PerformanceIndicator 
            showNetworkSpeed={true}
            showCacheStatus={true}
            style={styles.performanceIndicator}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.about')}</Text>
          <Text style={styles.versionText}>
            {t('settings.version')}: 1.0.0
          </Text>
        </View>
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
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
  },
  languageOptions: {
    gap: 12,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  languageOptionActive: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f7ff',
  },
  languageOptionText: {
    fontSize: 16,
    color: '#666',
  },
  languageOptionTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: isSmallDevice ? 'column' : 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: isSmallDevice ? 4 : 0,
  },
  infoLabel: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: '600',
    color: '#666',
    width: isSmallDevice ? '100%' : 100,
  },
  infoValue: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  versionText: {
    fontSize: 14,
    color: '#666',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  performanceIndicator: {
    marginTop: 8,
  },
});

export default SettingsScreen;
