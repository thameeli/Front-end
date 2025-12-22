import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { RootStackParamList } from '../../types';
import { AppHeader, Card } from '../../components';
import { useAuthStore } from '../../store/authStore';
import { isTablet, getResponsivePadding, getResponsiveFontSize } from '../../utils/responsive';
import { glassmorphism, colors } from '../../theme';

type AdminSettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

const AdminSettingsScreen = () => {
  const navigation = useNavigation<AdminSettingsScreenNavigationProp>();
  const { user, logout } = useAuthStore();
  const padding = getResponsivePadding();

  const handleLogout = () => {
    logout();
  };

  return (
    <View style={glassmorphism.screenBackground}>
      <AppHeader title="Settings" showBack />
      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ 
          padding: padding.vertical,
          maxWidth: isTablet ? 600 : '100%',
          alignSelf: isTablet ? 'center' : 'stretch',
        }}
      >
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Icon name="account-edit" size={24} color={colors.primary[500]} />
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Edit Profile</Text>
              <Text style={styles.settingDescription}>Update your personal information</Text>
            </View>
            <Icon name="chevron-right" size={24} color={colors.neutral[400]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => navigation.navigate('ChangePassword')}
          >
            <Icon name="lock-reset" size={24} color={colors.primary[500]} />
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Change Password</Text>
              <Text style={styles.settingDescription}>Update your password</Text>
            </View>
            <Icon name="chevron-right" size={24} color={colors.neutral[400]} />
          </TouchableOpacity>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Admin Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role</Text>
            <Text style={styles.infoValue}>Administrator</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>
          {user?.name && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{user.name}</Text>
            </View>
          )}
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          <View style={styles.settingItem}>
            <Icon name="bell-outline" size={24} color={colors.primary[500]} />
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Notifications</Text>
              <Text style={styles.settingDescription}>Manage notification preferences</Text>
            </View>
            <Icon name="chevron-right" size={24} color={colors.neutral[400]} />
          </View>
          <View style={styles.settingItem}>
            <Icon name="truck-delivery-outline" size={24} color={colors.primary[500]} />
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Delivery Settings</Text>
              <Text style={styles.settingDescription}>Configure delivery options</Text>
            </View>
            <Icon name="chevron-right" size={24} color={colors.neutral[400]} />
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>App Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
        </Card>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" size={24} color="#FF3B30" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: 'bold',
    color: colors.neutral[900],
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(58, 181, 209, 0.1)',
    gap: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[900],
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: colors.neutral[600],
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(58, 181, 209, 0.1)',
  },
  infoLabel: {
    fontSize: 14,
    color: colors.neutral[600],
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[900],
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.error[500],
    ...glassmorphism.panel,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error[500],
  },
});

export default AdminSettingsScreen;

