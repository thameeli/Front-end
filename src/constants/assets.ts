/**
 * Centralized asset paths
 * This file provides a single source of truth for all asset imports
 */

export const ASSETS = {
  logo: require('../../assets/logo.png'),
  icon: require('../../assets/icon.png'),
  adaptiveIcon: require('../../assets/adaptive-icon.png'),
  splashIcon: require('../../assets/splash-icon.png'),
  favicon: require('../../assets/favicon.png'),
} as const;

