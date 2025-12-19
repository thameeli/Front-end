/**
 * Custom Tab Bar with Blur Effect and Animated Indicators
 * Modern tab bar design with smooth animations
 */

import React from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { colors } from '../theme';
import { EASING } from '../utils/animations';

const AnimatedView = Animated.createAnimatedComponent(View);

interface TabBarItemProps {
  route: any;
  index: number;
  focused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

const TabBarItem: React.FC<TabBarItemProps> = ({
  route,
  focused,
  onPress,
  onLongPress,
  icon,
  label,
  badge,
}) => {
  const scale = useSharedValue(focused ? 1 : 0.9);
  const opacity = useSharedValue(focused ? 1 : 0.6);

  React.useEffect(() => {
    scale.value = withSpring(focused ? 1 : 0.9, EASING.spring);
    opacity.value = withSpring(focused ? 1 : 0.6, { damping: 15, stiffness: 150 });
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: focused ? 1 : 0,
    transform: [{ scaleY: focused ? 1 : 0 }],
  }));

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      className="flex-1 items-center justify-center relative"
      style={{ paddingVertical: 8, minHeight: 44 }} // WCAG minimum touch target
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={`Double tap to navigate to ${label}`}
      accessibilityState={{ selected: focused }}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <AnimatedView style={animatedStyle} className="items-center justify-center">
        <View className="relative">
          {icon}
          {badge && badge > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {badge > 9 ? '9+' : badge}
              </Text>
            </View>
          )}
        </View>
        <Text
          className={`text-xs font-medium mt-1 ${
            focused ? 'text-primary-500' : 'text-neutral-500'
          }`}
        >
          {label}
        </Text>
      </AnimatedView>
      
      {/* Animated Indicator */}
      <AnimatedView
        style={[
          indicatorStyle,
          {
            position: 'absolute',
            bottom: 0,
            left: '20%',
            right: '20%',
            height: 3,
            backgroundColor: colors.primary[500],
            borderRadius: 2,
          },
        ]}
      />
    </TouchableOpacity>
  );
};

const CustomTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  
  // Calculate proper height with safe area insets
  const tabBarHeight = Platform.OS === 'ios' ? 60 : 56;
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 8 : 4);
  const totalHeight = tabBarHeight + bottomPadding;

  return (
    <View
      style={[
        styles.tabBarContainer,
        {
          height: totalHeight,
          paddingBottom: bottomPadding,
        },
      ]}
    >
      {Platform.OS === 'ios' ? (
        <BlurView intensity={80} tint="light" style={styles.blurContainer}>
          <View style={[styles.tabBarContent, { borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)' }]}>
            {state.routes.map((route, index) => {
              const { options } = descriptors[route.key];
              const label =
                options.tabBarLabel !== undefined
                  ? options.tabBarLabel
                  : options.title !== undefined
                  ? options.title
                  : route.name;

              const isFocused = state.index === index;

              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              };

              const onLongPress = () => {
                navigation.emit({
                  type: 'tabLongPress',
                  target: route.key,
                });
              };

              const icon = options.tabBarIcon
                ? options.tabBarIcon({
                    focused: isFocused,
                    color: isFocused ? colors.primary[500] : colors.neutral[500],
                    size: 24,
                  })
                : null;

              // Get badge count if available (e.g., from cart)
              const badge = options.tabBarBadge as number | undefined;

              return (
                <TabBarItem
                  key={route.key}
                  route={route}
                  index={index}
                  focused={isFocused}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  icon={icon}
                  label={label as string}
                  badge={badge}
                />
              );
            })}
          </View>
        </BlurView>
      ) : (
        <View style={[styles.androidContainer, { borderTopWidth: 1, borderTopColor: '#E5E5E5' }]}>
          <View style={styles.tabBarContent}>
            {state.routes.map((route, index) => {
              const { options } = descriptors[route.key];
              const label =
                options.tabBarLabel !== undefined
                  ? options.tabBarLabel
                  : options.title !== undefined
                  ? options.title
                  : route.name;

              const isFocused = state.index === index;

              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              };

              const onLongPress = () => {
                navigation.emit({
                  type: 'tabLongPress',
                  target: route.key,
                });
              };

              const icon = options.tabBarIcon
                ? options.tabBarIcon({
                    focused: isFocused,
                    color: isFocused ? colors.primary[500] : colors.neutral[500],
                    size: 24,
                  })
                : null;

              const badge = options.tabBarBadge as number | undefined;

              return (
                <TabBarItem
                  key={route.key}
                  route={route}
                  index={index}
                  focused={isFocused}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  icon={icon}
                  label={label as string}
                  badge={badge}
                />
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  blurContainer: {
    flex: 1,
  },
  androidContainer: {
    flex: 1,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  tabBarContent: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 60 : 56,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    minWidth: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
});

export default CustomTabBar;

