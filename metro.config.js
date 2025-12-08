// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Custom resolver to replace ALL problematic expo modules with mocks
// This prevents "property is not configurable" errors in Expo Go
const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Map of problematic expo modules to their mock replacements
  const problematicModules = {
    'expo-notifications': path.resolve(__dirname, 'src/services/expo-notifications-wrapper.ts'),
    'expo-image': path.resolve(__dirname, 'src/services/mocks/expo-image-mock.tsx'),
    'expo-image-picker': path.resolve(__dirname, 'src/services/mocks/expo-image-picker-mock.js'),
  };
  
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

module.exports = config;
