// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Custom resolver to replace ALL problematic expo modules with mocks
// This prevents "property is not configurable" errors in Expo Go
const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Mock Stripe on web platform (Stripe React Native doesn't work on web)
  // This must be checked first to prevent web bundling errors
  if (platform === 'web' && moduleName === '@stripe/stripe-react-native') {
    const stripeMock = path.resolve(__dirname, 'src/services/mocks/stripe-mock.js');
    console.log(`🔄 [metro.config] Redirecting @stripe/stripe-react-native to mock (web platform)`);
    return {
      filePath: stripeMock,
      type: 'sourceFile',
    };
  }
  
  // Map of problematic expo modules to their mock replacements
  const problematicModules = {
    'expo-notifications': path.resolve(__dirname, 'src/services/expo-notifications-wrapper.ts'),
    'expo-image': path.resolve(__dirname, 'src/services/mocks/expo-image-mock.tsx'),
    'expo-image-picker': path.resolve(__dirname, 'src/services/mocks/expo-image-picker-mock.js'),
  };
  
  // Mock for react-native-reanimated in Expo Go to prevent NullPointerException and _toString errors
  const reanimatedMock = path.resolve(__dirname, 'src/services/mocks/reanimated-mock.js');
  
  // Handle react-native-reanimated CSS proxy import error
  // This is a known issue with reanimated v4 CSS features conflicting with NativeWind
  const reanimatedCssMock = path.resolve(__dirname, 'src/services/mocks/reanimated-css-mock.js');
  
  // Check if this is a relative import (./proxy) from reanimated CSS module
  const isRelativeImport = moduleName.startsWith('./') || moduleName.startsWith('../');
  const isReanimatedContext = context.originModulePath && 
    context.originModulePath.includes('react-native-reanimated');
  
  if (isRelativeImport && isReanimatedContext) {
    // Handle relative imports from reanimated (like ./proxy)
    if (moduleName.includes('proxy') || moduleName.includes('css')) {
      return {
        filePath: reanimatedCssMock,
        type: 'sourceFile',
      };
    }
  }
  
  // Also check for CSS-related imports from reanimated (absolute paths)
  // Only redirect if it's specifically CSS/proxy related, not the main module
  if (
    moduleName === 'react-native-reanimated/css' ||
    moduleName === 'react-native-reanimated/proxy' ||
    (moduleName.includes('react-native-reanimated') && 
     (moduleName.includes('/css') || moduleName.includes('/proxy')))
  ) {
    return {
      filePath: reanimatedCssMock,
      type: 'sourceFile',
    };
  }
  
  // Mock react-native-reanimated in Expo Go to prevent _toString errors
  // This prevents native module initialization issues
  if (moduleName === 'react-native-reanimated') {
    console.log(`🔄 [metro.config] Redirecting react-native-reanimated to mock`);
    return {
      filePath: reanimatedMock,
      type: 'sourceFile',
    };
  }
  
  // Check exact match first
  if (problematicModules[moduleName]) {
    console.log(`🔄 [metro.config] Redirecting ${moduleName} to mock`);
    return {
      filePath: problematicModules[moduleName],
      type: 'sourceFile',
    };
  }
  
  // Also check for variations (e.g., expo-notifications/something)
  for (const [module, mockPath] of Object.entries(problematicModules)) {
    if (moduleName.includes(module) || moduleName.startsWith(module + '/')) {
      console.log(`🔄 [metro.config] Redirecting ${moduleName} (contains ${module}) to mock`);
      return {
        filePath: mockPath,
        type: 'sourceFile',
      };
    }
  }
  
  // Use default resolver for all other modules
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  
  // Fallback to default resolution
  return context.resolveRequest(context, moduleName, platform);
};

// Ensure buffer is available for Supabase crypto polyfills
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  buffer: require.resolve('buffer'),
};

module.exports = withNativeWind(config, { 
  input: './global.css',
  // Disable automatic color scheme detection to prevent conflicts
  configPath: './tailwind.config.js',
});
