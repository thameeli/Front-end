/**
 * Thamili Mobile App
 * React Native Application for Fish & Vegetables Store
 */

// CRITICAL: Import URL polyfill BEFORE any Supabase imports
// This is required for Supabase to work in React Native/Expo Go
console.log('🔵 [App.tsx] Step 1: Loading URL polyfill...');
import 'react-native-url-polyfill/auto';
console.log('✅ [App.tsx] Step 2: URL polyfill loaded successfully');

// Import NativeWind global styles
import './global.css';

console.log('🔵 [App.tsx] Step 3: Loading React and core dependencies...');
import React, { useEffect } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { QueryClientProvider } from '@tanstack/react-query';
console.log('✅ [App.tsx] Step 4: Core dependencies loaded');
import { ErrorBoundary } from './src/components';
import { validateEnv } from './src/config/env';
import { queryClient } from './src/config/queryClient';
// Note: Notification handler initialization is disabled to prevent Expo Go conflicts
// It will be initialized when notifications are actually used
// import { initializeNotificationHandler } from './src/services/pushNotificationService';
console.log('🔵 [App.tsx] Step 5: Loading i18n...');
import './src/i18n'; // Initialize i18n
console.log('✅ [App.tsx] Step 6: i18n loaded');
import StripeProviderWrapper from './src/components/StripeProviderWrapper';
console.log('🔵 [App.tsx] Step 7: Loading navigation and stores...');
import AppNavigator from './src/navigation/AppNavigator';
import { useCartStore } from './src/store/cartStore';
import { useThemeStore } from './src/store/themeStore';
import { initializeOfflineQueue } from './src/utils/offlineQueue';
import { OfflineStatusIndicator, ToastProvider } from './src/components';
console.log('✅ [App.tsx] Step 8: Navigation and stores loaded');

// React Native Paper Theme
import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { colors } from './src/theme/colors';
import { darkColors } from './src/theme/darkColors';

const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary[500],
    secondary: colors.secondary[500],
    error: colors.error[500],
    background: colors.background.default,
    surface: colors.background.secondary,
    text: colors.text.primary,
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: darkColors.primary[500],
    secondary: darkColors.neutral[500],
    error: darkColors.error[500],
    background: darkColors.background.primary,
    surface: darkColors.background.secondary,
    text: darkColors.text.primary,
  },
};

function App(): React.JSX.Element {
  console.log('🚀 [App.tsx] App component rendering...');
  const loadCart = useCartStore((state) => state.loadCart);
  const loadCountry = useCartStore((state) => state.loadCountry);
  const { isDark, loadThemePreference } = useThemeStore();

  useEffect(() => {
    console.log('🔵 [App.tsx] useEffect running - validating env and loading cart...');
    // Validate environment variables on app startup
    validateEnv();
    console.log('✅ [App.tsx] Environment validated');
    // Load theme preference
    loadThemePreference();
    console.log('✅ [App.tsx] Theme preference loaded');
    // Load cart and country from storage
    loadCart();
    loadCountry(); // Load country preference on app start
    console.log('✅ [App.tsx] Cart and country loaded');
    // Initialize offline queue
    initializeOfflineQueue().catch((error) => {
      console.error('Error initializing offline queue:', error);
    });
    console.log('✅ [App.tsx] Offline queue initialized');
    // Note: Notification handler initialization is disabled to prevent Expo Go conflicts
    // It will be initialized automatically when pushNotificationService is first used
    console.log('✅ [App.tsx] App initialization complete');
  }, [loadCart, loadCountry, loadThemePreference]);

  return (
    <ErrorBoundary>
      <StripeProviderWrapper>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <PaperProvider theme={isDark ? darkTheme : lightTheme}>
              <SafeAreaProvider>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
                <ToastProvider>
                  <AppNavigator />
                  <OfflineStatusIndicator />
                </ToastProvider>
              </SafeAreaProvider>
            </PaperProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </StripeProviderWrapper>
    </ErrorBoundary>
  );
}

export default App;
