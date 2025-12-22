import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme';

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  showMenu?: boolean;
  rightAction?: React.ReactNode;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  showBack = false,
  showMenu = false,
  rightAction,
}) => {
  const navigation = useNavigation();
  const { user, logout } = useAuthStore();

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleMenu = () => {
    // Navigate to settings or show menu
    navigation.navigate('Settings' as never);
  };

  return (
    <View style={styles.headerContainer}>
      <LinearGradient
        colors={[colors.navy[500], colors.navy[600]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <View style={styles.glassOverlay}>
          <View style={styles.header}>
            <View style={styles.leftSection}>
              {showBack && (
                <TouchableOpacity onPress={handleBack} style={styles.iconButton}>
                  <Icon name="arrow-left" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              )}
              {showMenu && (
                <TouchableOpacity onPress={handleMenu} style={styles.iconButton}>
                  <Icon name="menu" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              )}
              <Text style={styles.title}>{title}</Text>
            </View>
            <View style={styles.rightSection}>
              {rightAction || (
                user && (
                  <TouchableOpacity onPress={logout} style={styles.iconButton}>
                    <Icon name="logout" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  gradient: {
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.borderDark,
  },
  glassOverlay: {
    backgroundColor: colors.glass.backgroundDark,
    backdropFilter: 'blur(10px)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 56,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 12,
    letterSpacing: 0.5,
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});

export default AppHeader;

