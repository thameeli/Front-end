/**
 * Enhanced Typography System for Thamili App
 * WCAG AA compliant with minimum 14px body text
 * Optimized for readability in German and Danish markets
 */

export const typography = {
  // Font Sizes (minimum 14px for body text - accessibility requirement)
  fontSize: {
    xs: 12, // For labels only, not body text
    sm: 14, // Minimum body text size (WCAG AA)
    base: 16, // Standard body text
    lg: 18, // Large body text
    xl: 20, // Subheadings
    '2xl': 24, // Headings
    '3xl': 30, // Large headings
    '4xl': 36, // Hero headings
    '5xl': 48, // Display text
  },

  // Line Heights (optimized for readability)
  lineHeight: {
    none: 1,
    tight: 1.25, // For headings
    snug: 1.375, // For subheadings
    normal: 1.5, // Standard for body text
    relaxed: 1.625, // For longer paragraphs
    loose: 2, // For very long text blocks
  },

  // Font Weights
  fontWeight: {
    light: '300' as const,
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },

  // Letter Spacing (optimized for European languages)
  letterSpacing: {
    tighter: -0.5,
    tight: -0.25,
    normal: 0,
    wide: 0.25,
    wider: 0.5,
    widest: 1,
  },
} as const;

// Typography presets for common use cases (WCAG AA compliant)
export const textStyles = {
  // Headings (optimized for hierarchy)
  h1: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.tight,
  },
  h2: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.tight,
  },
  h3: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.snug,
    letterSpacing: typography.letterSpacing.normal,
  },
  h4: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.normal,
  },
  h5: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.normal,
  },
  h6: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.normal,
  },

  // Body text (minimum 14px for accessibility)
  body: {
    fontSize: typography.fontSize.base, // 16px - optimal for readability
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.relaxed, // 1.625 for better readability
    letterSpacing: typography.letterSpacing.normal,
  },
  bodySmall: {
    fontSize: typography.fontSize.sm, // 14px - minimum WCAG requirement
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.normal,
  },
  bodyLarge: {
    fontSize: typography.fontSize.lg, // 18px - for emphasis
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.relaxed,
    letterSpacing: typography.letterSpacing.normal,
  },

  // Labels and captions
  label: {
    fontSize: typography.fontSize.sm, // 14px minimum
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.wide,
  },
  caption: {
    fontSize: typography.fontSize.xs, // 12px - only for non-essential text
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.normal,
  },
  
  // Button text
  button: {
    fontSize: typography.fontSize.base, // 16px
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.wide,
  },
  buttonSmall: {
    fontSize: typography.fontSize.sm, // 14px
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.wide,
  },
  buttonLarge: {
    fontSize: typography.fontSize.lg, // 18px
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.wide,
  },
} as const;

