import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { RootStackParamList } from '../types';
import { LoadingScreen, CartBadge } from '../components';

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

// Common tab bar styling
const commonTabBarOptions = {
  tabBarActiveTintColor: '#007AFF',
  tabBarInactiveTintColor: '#999',
  tabBarStyle: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
    paddingBottom: 8,
    height: 65,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabBarLabelStyle: {
    fontSize: 12,
    fontWeight: '500' as const,
    marginTop: 4,
  },
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
    fontWeight: 'bold' as const,
    fontSize: 18,
  },
};

// Guest Tab Navigator (for unauthenticated users)
const GuestTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...commonTabBarOptions,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Products') {
            iconName = focused ? 'store' : 'store-outline';
          } else if (route.name === 'Cart') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else {
            iconName = 'help-circle';
          }

          return <Icon name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ 
          title: 'Home',
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen 
        name="Products" 
        component={ProductsScreen}
        options={{ 
          title: 'Products',
          tabBarLabel: 'Products',
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
      screenOptions={({ route }) => ({
        ...commonTabBarOptions,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Products') {
            iconName = focused ? 'store' : 'store-outline';
          } else if (route.name === 'Cart') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'Orders') {
            iconName = focused ? 'package-variant' : 'package-variant-closed';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'account' : 'account-outline';
          } else {
            iconName = 'help-circle';
          }

          return <Icon name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ 
          title: 'Home',
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen 
        name="Products" 
        component={ProductsScreen}
        options={{ 
          title: 'Products',
          tabBarLabel: 'Products',
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
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ 
          title: 'Profile',
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

// Admin Tab Navigator
const AdminTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...commonTabBarOptions,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
          } else if (route.name === 'Products') {
            iconName = focused ? 'store' : 'store-outline';
          } else if (route.name === 'Orders') {
            iconName = focused ? 'package-variant' : 'package-variant-closed';
          } else if (route.name === 'PickupPoints') {
            iconName = focused ? 'map-marker' : 'map-marker-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'account' : 'account-outline';
          } else {
            iconName = 'help-circle';
          }

          return <Icon name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={AdminDashboardScreen}
        options={{ 
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
        }}
      />
      <Tab.Screen 
        name="Products" 
        component={AdminProductsScreen}
        options={{ 
          title: 'Products',
          tabBarLabel: 'Products',
        }}
      />
      <Tab.Screen 
        name="Orders" 
        component={AdminOrdersScreen}
        options={{ 
          title: 'Orders',
          tabBarLabel: 'Orders',
        }}
      />
      <Tab.Screen 
        name="PickupPoints" 
        component={AdminPickupPointsScreen}
        options={{ 
          title: 'Pickup Points',
          tabBarLabel: 'Pickup Points',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ 
          title: 'Profile',
          tabBarLabel: 'Profile',
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
      // Use a longer delay to ensure Stack.Navigator has re-rendered with new isAuthenticated value
      const timer = setTimeout(() => {
        if (navigationRef.current) {
          try {
            if (isAuthenticated && user) {
              // Reset navigation stack to Main screen (CustomerTabs or AdminTabs)
              // The Stack.Navigator should have already re-rendered to show CustomerTabs/AdminTabs
              navigationRef.current.reset({
                index: 0,
                routes: [{ name: 'Main' }],
              });
            } else if (!isAuthenticated) {
              // Reset to Main screen (GuestTabs)
              navigationRef.current.reset({
                index: 0,
                routes: [{ name: 'Main' }],
              });
            }
          } catch (error) {
            console.error('Navigation reset error:', error);
          }
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, isLoading]);

  if (isLoading) {
    return <LoadingScreen message="Loading..." />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
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
