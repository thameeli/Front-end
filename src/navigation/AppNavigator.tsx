/**
 * Enhanced App Navigator with Smooth Transitions and Custom Tab Bar
 * Modern navigation with blur effects and animated indicators
 */

import React, { useEffect, useRef } from 'react';
import { View, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { RootStackParamList } from '../types';
import { LoadingScreen, CartBadge, CustomTabBar } from '../components';
import { colors } from '../theme';
import { PAGE_TRANSITIONS } from '../utils/animations';

// Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import CountrySelectionScreen from '../screens/onboarding/CountrySelectionScreen';
import HomeScreen from '../screens/customer/HomeScreen';
import ProductsScreen from '../screens/customer/ProductsScreen';
import ProductDetailsScreen from '../screens/customer/ProductDetailsScreen';
import CartScreen from '../screens/customer/CartScreen';
import CheckoutScreen from '../screens/customer/CheckoutScreen';
import OrderConfirmationScreen from '../screens/customer/OrderConfirmationScreen';
import OrdersScreen from '../screens/customer/OrdersScreen';
import OrderDetailsScreen from '../screens/customer/OrderDetailsScreen';
import ProfileScreen from '../screens/customer/ProfileScreen';
import EditProfileScreen from '../screens/customer/EditProfileScreen';
import ChangePasswordScreen from '../screens/customer/ChangePasswordScreen';
import SettingsScreen from '../screens/customer/SettingsScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminProductsScreen from '../screens/admin/AdminProductsScreen';
import AdminOrdersScreen from '../screens/admin/AdminOrdersScreen';
import AdminPickupPointsScreen from '../screens/admin/AdminPickupPointsScreen';
import AdminSettingsScreen from '../screens/admin/AdminSettingsScreen';
import AddProductScreen from '../screens/admin/AddProductScreen';
import EditProductScreen from '../screens/admin/EditProductScreen';
import AddPickupPointScreen from '../screens/admin/AddPickupPointScreen';
import EditPickupPointScreen from '../screens/admin/EditPickupPointScreen';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// Smooth transition configuration
const screenOptions = {
  headerShown: false,
  ...TransitionPresets.SlideFromRightIOS,
  transitionSpec: {
    open: {
      animation: 'timing' as const,
      config: {
        duration: 300,
      },
    },
    close: {
      animation: 'timing' as const,
      config: {
        duration: 250,
      },
    },
  },
};

// Custom screen options for specific screens
const modalScreenOptions = {
  ...screenOptions,
  headerShown: false, // Explicitly disable header
  ...PAGE_TRANSITIONS.slideFromBottom,
  gestureEnabled: true,
  gestureDirection: 'vertical' as const,
};

const detailScreenOptions = {
  ...screenOptions,
  headerShown: false, // Explicitly disable header
  ...PAGE_TRANSITIONS.fade,
};

// Guest Tab Navigator (for unauthenticated users)
const GuestTabs = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        // Use in-screen headers/hero sections instead of default tab headers
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused, color, size }) => (
            <Icon name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Products"
        component={ProductsScreen}
        options={{
          title: 'Products',
          tabBarLabel: 'Products',
          tabBarIcon: ({ focused, color, size }) => (
            <Icon name={focused ? 'store' : 'store-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: 'Cart',
          tabBarLabel: 'Cart',
          tabBarIcon: ({ focused, color, size }) => {
            const iconName = focused ? 'cart' : 'cart-outline';
            return (
              <View>
                <Icon name={iconName} size={24} color={color} />
                <CartBadge />
              </View>
            );
          },
        }}
      />
    </Tab.Navigator>
  );
};

// Customer Tab Navigator
const CustomerTabs = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused, color, size }) => (
            <Icon name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Products"
        component={ProductsScreen}
        options={{
          title: 'Products',
          tabBarLabel: 'Products',
          tabBarIcon: ({ focused, color, size }) => (
            <Icon name={focused ? 'store' : 'store-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: 'Cart',
          tabBarLabel: 'Cart',
          tabBarIcon: ({ focused, color, size }) => {
            const iconName = focused ? 'cart' : 'cart-outline';
            return (
              <View>
                <Icon name={iconName} size={24} color={color} />
                <CartBadge />
              </View>
            );
          },
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          title: 'Orders',
          tabBarLabel: 'Orders',
          tabBarIcon: ({ focused, color, size }) => (
            <Icon
              name={focused ? 'package-variant' : 'package-variant-closed'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused, color, size }) => (
            <Icon name={focused ? 'account' : 'account-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Admin Tab Navigator
const AdminTabs = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={AdminDashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ focused, color, size }) => (
            <Icon
              name={focused ? 'view-dashboard' : 'view-dashboard-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Products"
        component={AdminProductsScreen}
        options={{
          title: 'Products',
          tabBarLabel: 'Products',
          tabBarIcon: ({ focused, color, size }) => (
            <Icon name={focused ? 'store' : 'store-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Orders"
        component={AdminOrdersScreen}
        options={{
          title: 'Orders',
          tabBarLabel: 'Orders',
          tabBarIcon: ({ focused, color, size }) => (
            <Icon
              name={focused ? 'package-variant' : 'package-variant-closed'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="PickupPoints"
        component={AdminPickupPointsScreen}
        options={{
          title: 'Pickup Points',
          tabBarLabel: 'Pickup Points',
          tabBarIcon: ({ focused, color, size }) => (
            <Icon
              name={focused ? 'map-marker' : 'map-marker-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused, color, size }) => (
            <Icon name={focused ? 'account' : 'account-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Main App Navigator
const AppNavigator = () => {
  const { isAuthenticated, user, isLoading, loadSession, hasCompletedOnboarding, checkOnboardingStatus } = useAuthStore();
  const { countrySelected, selectedCountry, loadCountry } = useCartStore();
  const navigationRef = useRef<any>(null);

  useEffect(() => {
    loadSession();
    checkOnboardingStatus();
    loadCountry(); // Load country preference on app start
  }, []);

  // Note: We don't need to manually reset navigation here
  // React Navigation automatically handles navigation state changes
  // when the navigator structure changes (via the key prop on Stack.Navigator)

  if (isLoading) {
    return <LoadingScreen message="Loading..." />;
  }

  // Check if country is selected (required for all users)
  // Use user's country preference if authenticated, otherwise use cart store
  const hasCountrySelected = isAuthenticated && user?.country_preference
    ? true
    : countrySelected;

  // Show country selection screen first if no country is selected
  // This is required before accessing any tabs
  if (!hasCountrySelected) {
    return (
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator screenOptions={screenOptions}>
          <Stack.Screen 
            name="CountrySelection" 
            component={CountrySelectionScreen}
            options={{ gestureEnabled: false }} // Prevent going back
          />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // Show onboarding for first-time users (only if country is already selected)
  if (!hasCompletedOnboarding && !isAuthenticated) {
    return (
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator screenOptions={screenOptions}>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="CountrySelection" component={CountrySelectionScreen} />
          <Stack.Screen name="Main" component={GuestTabs} />
          <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // Use a key to force re-render when auth state changes
  // Normalize role to lowercase for comparison
  const userRole = user?.role ? user.role.toLowerCase().trim() : 'customer';
  const isAdmin = userRole === 'admin';
  
  const navigatorKey = isAuthenticated
    ? isAdmin
      ? 'admin'
      : 'customer'
    : 'guest';
  
  // Debug logging
  if (isAuthenticated && user) {
    console.log('🔍 [AppNavigator] User role check:', {
      userRole,
      isAdmin,
      navigatorKey,
      rawRole: user.role,
    });
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator key={navigatorKey} screenOptions={screenOptions}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={GuestTabs} />
            <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : isAdmin ? (
          <>
            <Stack.Screen name="Main" component={AdminTabs} />
            <Stack.Screen name="Settings" component={AdminSettingsScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
            <Stack.Screen 
              name="ProductDetails" 
              component={ProductDetailsScreen}
              options={detailScreenOptions}
            />
            <Stack.Screen 
              name="OrderDetails" 
              component={OrderDetailsScreen}
              options={detailScreenOptions}
            />
            <Stack.Screen name="AddProduct" component={AddProductScreen} />
            <Stack.Screen name="EditProduct" component={EditProductScreen} />
            <Stack.Screen name="AddPickupPoint" component={AddPickupPointScreen} />
            <Stack.Screen name="EditPickupPoint" component={EditPickupPointScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={CustomerTabs} />
            <Stack.Screen 
              name="ProductDetails" 
              component={ProductDetailsScreen}
              options={detailScreenOptions}
            />
            <Stack.Screen 
              name="Checkout" 
              component={CheckoutScreen}
              options={modalScreenOptions}
            />
            <Stack.Screen 
              name="OrderConfirmation" 
              component={OrderConfirmationScreen}
              options={detailScreenOptions}
            />
            <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
