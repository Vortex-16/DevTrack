import { colors } from './colors';
import { StyleSheet } from 'react-native';

// Spacing scale
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// Border radius scale
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

// Font sizes
export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const;

// Font weights (as string for RN)
export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

// Shared global styles
export const globalStyles = StyleSheet.create({
  // Containers
  screen: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  container: {
    paddingHorizontal: spacing.lg,
  },
  // Cards
  card: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.bg.border,
  },
  cardElevated: {
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.bg.border,
  },
  // Typography
  heading1: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  heading2: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  heading3: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  body: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  caption: {
    fontSize: fontSize.sm,
    color: colors.text.muted,
  },
  // Dividers
  divider: {
    height: 1,
    backgroundColor: colors.bg.border,
    marginVertical: spacing.md,
  },
  // Row helpers
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // Accent button base
  accentButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accentButtonText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  // Ghost button
  ghostButton: {
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.bg.border,
  },
  ghostButtonText: {
    color: colors.text.primary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  // Center
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Input base
  input: {
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    color: colors.text.primary,
    fontSize: fontSize.base,
    borderWidth: 1,
    borderColor: colors.bg.border,
  },
});

export { colors };
