/**
 * Welcome Screen - First screen of onboarding
 * Introduces the app with smooth animations
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../../types';
import { colors } from '../../theme';
import { EASING, ANIMATION_DURATION } from '../../utils/animations';
import Button from '../../components/Button';
import { isTablet, getResponsivePadding, getResponsiveFontSize } from '../../utils/responsive';

// Safe import of reanimated with fallback
let Animated: any;
let useAnimatedStyle: any;
let useSharedValue: any;
let withSpring: any;
let withTiming: any;

try {
  const Reanimated = require('react-native-reanimated');
  Animated = Reanimated.default || Reanimated;
  useAnimatedStyle = Reanimated.useAnimatedStyle;
  useSharedValue = Reanimated.useSharedValue;
  withSpring = Reanimated.withSpring;
  withTiming = Reanimated.withTiming;
} catch (e) {
  console.log('⚠️ [WelcomeScreen] Reanimated not available, using fallback');
}

// Create safe Animated.View component
const AnimatedView = Animated && Animated.View 
  ? Animated.View 
  : Animated && Animated.createAnimatedComponent 
    ? Animated.createAnimatedComponent(View)
    : View;

const { width, height } = Dimensions.get('window');

type WelcomeScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Welcome'
>;

const WelcomeScreen = () => {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();
  const padding = getResponsivePadding();

  // Initialize shared values only if reanimated is available
  const logoScale = useSharedValue ? useSharedValue(0) : { value: 1 };
  const logoOpacity = useSharedValue ? useSharedValue(0) : { value: 1 };
  const titleOpacity = useSharedValue ? useSharedValue(0) : { value: 1 };
  const titleTranslateY = useSharedValue ? useSharedValue(30) : { value: 0 };
  const featuresOpacity = useSharedValue ? useSharedValue(0) : { value: 1 };
  const buttonOpacity = useSharedValue ? useSharedValue(0) : { value: 1 };
  const buttonScale = useSharedValue ? useSharedValue(0.8) : { value: 1 };

  useEffect(() => {
    // Only run animations if reanimated is available
    if (!withSpring || !withTiming || !logoScale || !logoOpacity) {
      return;
    }

    // Logo animation
    logoScale.value = withSpring(1, EASING.spring);
    logoOpacity.value = withTiming(1, { duration: ANIMATION_DURATION.normal });

    // Title animation
    setTimeout(() => {
      titleOpacity.value = withTiming(1, { duration: ANIMATION_DURATION.normal });
      titleTranslateY.value = withSpring(0, EASING.spring);
    }, 200);

    // Features animation
    setTimeout(() => {
      featuresOpacity.value = withTiming(1, { duration: ANIMATION_DURATION.slow });
    }, 400);

    // Button animation
    setTimeout(() => {
      buttonOpacity.value = withTiming(1, { duration: ANIMATION_DURATION.normal });
      buttonScale.value = withSpring(1, EASING.spring);
    }, 600);
  }, []);

  // Safe animated styles with fallback
  const logoStyle = useAnimatedStyle && logoScale && logoOpacity
    ? useAnimatedStyle(() => ({
        transform: [{ scale: logoScale.value }],
        opacity: logoOpacity.value,
      }))
    : {};

  const titleStyle = useAnimatedStyle && titleOpacity && titleTranslateY
    ? useAnimatedStyle(() => ({
        opacity: titleOpacity.value,
        transform: [{ translateY: titleTranslateY.value }],
      }))
    : {};

  const featuresStyle = useAnimatedStyle && featuresOpacity
    ? useAnimatedStyle(() => ({
        opacity: featuresOpacity.value,
      }))
    : {};

  const buttonStyle = useAnimatedStyle && buttonOpacity && buttonScale
    ? useAnimatedStyle(() => ({
        opacity: buttonOpacity.value,
        transform: [{ scale: buttonScale.value }],
      }))
    : {};

  const features = [
    { icon: 'shopping', text: 'Shop Quality Products' },
    { icon: 'truck-fast', text: 'Fast Delivery' },
    { icon: 'shield-check', text: 'Secure Payments' },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary[500], colors.primary[600]]}
        style={[styles.gradient, { paddingHorizontal: padding.horizontal * 1.5, paddingVertical: padding.vertical * 3 }]}
      >
        <AnimatedView style={[styles.logoContainer, logoStyle]}>
          <View style={styles.logoCircle}>
            <Icon name="store" size={64} color="white" />
          </View>
        </AnimatedView>

        <AnimatedView style={[styles.titleContainer, titleStyle]}>
          <Text style={styles.title}>Welcome to Thamili</Text>
          <Text style={styles.subtitle}>
            Your trusted marketplace for quality products
          </Text>
        </AnimatedView>

        <AnimatedView style={[styles.featuresContainer, featuresStyle]}>
          {features.map((feature, index) => (
            <View key={index} style={styles.feature}>
              <Icon
                name={feature.icon as any}
                size={24}
                color="white"
                style={styles.featureIcon}
              />
              <Text style={styles.featureText}>{feature.text}</Text>
            </View>
          ))}
        </AnimatedView>

        <AnimatedView style={[styles.buttonContainer, buttonStyle, { bottom: padding.vertical * 3, paddingHorizontal: padding.horizontal * 1.5 }]}>
          <Button
            title="Get Started"
            onPress={() => navigation.navigate('CountrySelection' as never)}
            variant="primary"
            size="lg"
            fullWidth
            style={styles.button}
            textStyle={styles.buttonText}
          />
          <Button
            title="Skip"
            onPress={() => navigation.navigate('Main' as never)}
            variant="ghost"
            size="md"
            fullWidth
            style={styles.skipButton}
            textStyle={styles.skipButtonText}
          />
        </AnimatedView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 40,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: getResponsiveFontSize(32),
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: getResponsiveFontSize(16),
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 60,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  featureIcon: {
    marginRight: 16,
  },
  featureText: {
    fontSize: getResponsiveFontSize(16),
    color: 'white',
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
    position: 'absolute',
  },
  button: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  buttonText: {
    color: colors.primary[600],
    fontWeight: '600',
  },
  skipButton: {
    backgroundColor: 'transparent',
  },
  skipButtonText: {
    color: 'white',
  },
});

export default WelcomeScreen;

