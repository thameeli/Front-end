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
import { RootStackParamList } from '../types';
import { LoadingScreen, CartBadge, CustomTabBar } from '../components';
import { colors } from '../theme';

// Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
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

// Guest Tab Navigator (for unauthenticated users)
const GuestTabs = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#fff',
          elevation: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        headerTintColor: '#000',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
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
        headerShown: true,
        headerStyle: {
          backgroundColor: '#fff',
          elevation: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        headerTintColor: '#000',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
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
        headerShown: true,
        headerStyle: {
          backgroundColor: '#fff',
          elevation: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        headerTintColor: '#000',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
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
  const { isAuthenticated, user, isLoading, loadSession } = useAuthStore();
  const navigationRef = useRef<any>(null);

  useEffect(() => {
    loadSession();
  }, []);

  // Navigate when authentication state changes
  useEffect(() => {
    if (!isLoading && navigationRef.current) {
      const timer = setTimeout(() => {
        if (navigationRef.current) {
          try {
            navigationRef.current.reset({
              index: 0,
              routes: [{ name: 'Main' }],
            });
            console.log('🔄 Navigation reset:', {
              isAuthenticated,
              role: user?.role,
              navigatorKey: isAuthenticated
                ? user?.role === 'admin'
                  ? 'admin'
                  : 'customer'
                : 'guest',
            });
          } catch (error) {
            console.error('❌ Navigation reset error:', error);
          }
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, isLoading]);

  if (isLoading) {
    return <LoadingScreen message="Loading..." />;
  }

  // Use a key to force re-render when auth state changes
  const navigatorKey = isAuthenticated
    ? user?.role === 'admin'
      ? 'admin'
      : 'customer'
    : 'guest';

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
        ) : user?.role === 'admin' ? (
          <>
            <Stack.Screen name="Main" component={AdminTabs} />
            <Stack.Screen name="Settings" component={AdminSettingsScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
            <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
            <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
            <Stack.Screen name="AddProduct" component={AddProductScreen} />
            <Stack.Screen name="EditProduct" component={EditProductScreen} />
            <Stack.Screen name="AddPickupPoint" component={AddPickupPointScreen} />
            <Stack.Screen name="EditPickupPoint" component={EditPickupPointScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={CustomerTabs} />
            <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} />
            <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} />
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
