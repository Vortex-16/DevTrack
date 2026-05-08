import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, spacing, radius, fontSize, fontWeight } from '../../theme';

// =================== BUTTON ===================

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
}: ButtonProps) {
  const bgColors = {
    primary: colors.accent.primary,
    ghost: colors.bg.elevated,
    danger: colors.red.default,
    outline: 'transparent',
  };
  const textColors = {
    primary: colors.white,
    ghost: colors.text.primary,
    danger: colors.white,
    outline: colors.accent.primary,
  };
  const borderColors = {
    primary: 'transparent',
    ghost: colors.bg.border,
    danger: 'transparent',
    outline: colors.accent.primary,
  };
  const paddings = {
    sm: { paddingVertical: spacing.xs + 2, paddingHorizontal: spacing.md },
    md: { paddingVertical: spacing.sm + 4, paddingHorizontal: spacing.lg },
    lg: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
  };
  const fontSizes = { sm: fontSize.sm, md: fontSize.base, lg: fontSize.lg };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        s.btn,
        { backgroundColor: bgColors[variant], borderColor: borderColors[variant], ...paddings[size] },
        (disabled || loading) && s.disabled,
        style,
      ]}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColors[variant]} />
      ) : (
        <View style={s.btnInner}>
          {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
          <Text style={[s.btnText, { color: textColors[variant], fontSize: fontSizes[size] }]}>
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// =================== STAT CARD ===================

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  subtitle?: string;
}

export function StatCard({ icon, label, value, color, subtitle }: StatCardProps) {
  return (
    <View style={[s.statCard, { borderLeftColor: color, borderLeftWidth: 2 }]}>
      <View style={[s.iconBox, { backgroundColor: `${color}20` }]}>{icon}</View>
      <Text style={s.statValue}>{value ?? '—'}</Text>
      <Text style={s.statLabel}>{label}</Text>
      {subtitle && <Text style={s.statSub}>{subtitle}</Text>}
    </View>
  );
}

// =================== SECTION HEADER ===================

interface SectionHeaderProps {
  title: string;
  action?: { label: string; onPress: () => void };
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={action.onPress}>
          <Text style={s.sectionAction}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// =================== BADGE ===================

interface BadgeProps {
  label: string;
  color?: string;
  style?: ViewStyle;
}

export function Badge({ label, color = colors.accent.primary, style }: BadgeProps) {
  return (
    <View style={[s.badge, { backgroundColor: `${color}20`, borderColor: `${color}40` }, style]}>
      <Text style={[s.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

// =================== EMPTY STATE ===================

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
}

export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <View style={s.emptyState}>
      <View style={s.emptyIcon}>{icon}</View>
      <Text style={s.emptyTitle}>{title}</Text>
      {subtitle && <Text style={s.emptySubtitle}>{subtitle}</Text>}
      {action && (
        <Button label={action.label} onPress={action.onPress} style={{ marginTop: spacing.lg }} />
      )}
    </View>
  );
}

// =================== LOADER ===================

interface LoaderProps {
  message?: string;
}

export function FullScreenLoader({ message = 'Loading...' }: LoaderProps) {
  return (
    <View style={s.loaderFull}>
      <View style={s.loaderCircle}>
        <ActivityIndicator size="large" color={colors.accent.primary} />
      </View>
      <Text style={s.loaderText}>{message}</Text>
    </View>
  );
}

// =================== SCREEN HEADER ===================

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, right }: ScreenHeaderProps) {
  return (
    <View style={s.screenHeader}>
      <View style={{ flex: 1 }}>
        <Text style={s.screenTitle}>{title}</Text>
        {subtitle && <Text style={s.screenSubtitle}>{subtitle}</Text>}
      </View>
      {right && <View style={s.screenHeaderRight}>{right}</View>}
    </View>
  );
}

// =================== TOAST ===================

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
}

export function Toast({ message, type = 'info' }: ToastProps) {
  const bgColors = {
    success: colors.green.bg,
    error: colors.red.bg,
    info: colors.accent.glow,
  };
  const borderColors = {
    success: colors.green.default,
    error: colors.red.default,
    info: colors.accent.primary,
  };
  return (
    <View style={[s.toast, { backgroundColor: bgColors[type], borderColor: borderColors[type] }]}>
      <Text style={[s.toastText, { color: borderColors[type] }]}>{message}</Text>
    </View>
  );
}

export { GlassCard } from './GlassCard';

// =================== STYLES ===================

const s = StyleSheet.create({
  // Button
  btn: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  disabled: { opacity: 0.45 },
  btnInner: { flexDirection: 'row', alignItems: 'center' },
  btnText: { fontWeight: fontWeight.semibold },

  // StatCard
  statCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.bg.border,
    width: '47%',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  statSub: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginTop: 2,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  sectionAction: {
    fontSize: fontSize.sm,
    color: colors.accent.primary,
    fontWeight: fontWeight.medium,
  },

  // Badge
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.bg.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Loader
  loaderFull: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg.primary,
    gap: spacing.md,
  },
  loaderCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.bg.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.bg.border,
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  loaderText: {
    color: colors.text.secondary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    marginTop: spacing.sm,
  },

  // Screen Header
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  screenTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  screenSubtitle: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  screenHeaderRight: {
    marginLeft: spacing.md,
  },

  // Toast
  toast: {
    position: 'absolute',
    bottom: 90,
    left: spacing.lg,
    right: spacing.lg,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    zIndex: 9999,
  },
  toastText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
  },
});
