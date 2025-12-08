console.log('🚀 [index.ts] Starting app registration...');
import { registerRootComponent } from 'expo';
console.log('✅ [index.ts] registerRootComponent imported');
console.log('🔵 [index.ts] Importing App component...');
import App from './App';
console.log('✅ [index.ts] App component imported');

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
console.log('🔵 [index.ts] Registering root component...');
registerRootComponent(App);
console.log('✅ [index.ts] Root component registered');
