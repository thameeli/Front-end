/**
 * Color Palette for Thamili App
 * Modern minimal design with semantic colors
 */

export const colors = {
  // Primary Blue - Main brand color
  primary: {
    50: '#E6F2FF',
    100: '#CCE5FF',
    200: '#99CBFF',
    300: '#66B1FF',
    400: '#3397FF',
    500: '#007AFF', // Main primary color
    600: '#0062CC',
    700: '#004999',
    800: '#003166',
    900: '#001833',
  },

  // Secondary Gray - Neutral colors
  secondary: {
    50: '#F5F5F5',
    100: '#E0E0E0',
    200: '#BDBDBD',
    300: '#9E9E9E',
    400: '#757575',
    500: '#616161',
    600: '#424242',
    700: '#212121',
  },

  // Success Green
  success: {
    50: '#E8F5E9',
    100: '#C8E6C9',
    500: '#4CAF50',
    600: '#43A047',
    700: '#388E3C',
  },

  // Error Red
  error: {
    50: '#FFEBEE',
    100: '#FFCDD2',
    500: '#F44336',
    600: '#E53935',
    700: '#D32F2F',
  },

  // Warning Orange
  warning: {
    50: '#FFF3E0',
    100: '#FFE0B2',
    500: '#FF9800',
    600: '#FB8C00',
    700: '#F57C00',
  },

  // Neutral Grays
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },

  // Semantic colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export type ColorKey = keyof typeof colors;
export type ColorShade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

