import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, icon, radius, space, touch } from '@/theme/tokens';
import { AppText } from './app-text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: LucideIcon;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  compact?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

const palette: Record<Variant, { bg: string; pressed: string; text: string; border: string }> = {
  primary: {
    bg: colors.primary,
    pressed: colors.primaryPressed,
    text: colors.textInverse,
    border: colors.primary,
  },
  secondary: {
    bg: colors.surface,
    pressed: colors.surfaceMuted,
    text: colors.primary,
    border: colors.border,
  },
  ghost: { bg: 'transparent', pressed: colors.surfaceMuted, text: colors.primary, border: 'transparent' },
  danger: { bg: colors.surface, pressed: colors.dangerSoft, text: colors.danger, border: colors.border },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon: Icon,
  loading,
  disabled,
  fullWidth = true,
  compact,
  accessibilityHint,
  style,
}: ButtonProps) {
  const p = palette[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: Boolean(inactive), busy: Boolean(loading) }}
      onPress={inactive ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        compact && styles.compact,
        fullWidth && styles.full,
        { backgroundColor: pressed && !inactive ? p.pressed : p.bg, borderColor: p.border },
        inactive && styles.disabled,
        style,
      ]}
    >
      <View style={styles.row}>
        {loading ? (
          <ActivityIndicator color={p.text} />
        ) : Icon ? (
          <Icon size={icon.md} color={p.text} strokeWidth={2} />
        ) : null}
        <AppText variant="body" weight="semibold" style={{ color: p.text }} numberOfLines={2} center>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touch.minHeight,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    justifyContent: 'center',
  },
  compact: { minHeight: touch.iconButton, paddingHorizontal: space.md },
  full: { alignSelf: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm },
  disabled: { opacity: 0.55 },
});
