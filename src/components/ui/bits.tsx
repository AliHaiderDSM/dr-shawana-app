import { Info, TriangleAlert, type LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { colors, icon, radius, space, touch } from '@/theme/tokens';
import { AppText } from './app-text';

export function InfoRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: ReactNode }) {
  return (
    <View
      style={styles.infoRow}
      accessible
      accessibilityLabel={`${label}: ${typeof value === 'string' ? value : ''}`}
    >
      <Icon size={icon.md} color={colors.textMuted} style={styles.infoIcon} />
      <View style={styles.flex}>
        <AppText variant="caption" tone="muted">
          {label}
        </AppText>
        {typeof value === 'string' || typeof value === 'number' ? <AppText>{value}</AppText> : value}
      </View>
    </View>
  );
}

export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <AppText variant="subheading" accessibilityRole="header" style={styles.flex}>
        {title}
      </AppText>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          hitSlop={8}
          style={styles.sectionAction}
        >
          <AppText variant="label" tone="primary" weight="semibold">
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Avatar({ text, size = 48 }: { text: string; size?: number }) {
  return (
    <View
      style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <AppText variant="subheading" style={{ color: colors.primarySoftText }}>
        {text}
      </AppText>
    </View>
  );
}

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'warning'; children: ReactNode }) {
  const Icon = tone === 'warning' ? TriangleAlert : Info;
  const fg = tone === 'warning' ? colors.warning : colors.info;
  return (
    <View
      style={[styles.notice, { backgroundColor: tone === 'warning' ? colors.warningSoft : colors.infoSoft }]}
      accessibilityRole="text"
    >
      <Icon size={icon.md} color={fg} style={styles.infoIcon} />
      <View style={styles.flex}>
        {typeof children === 'string' ? <AppText variant="label">{children}</AppText> : children}
      </View>
    </View>
  );
}

export function ChoiceChips<T extends string>({
  label,
  options,
  value,
  onChange,
  error,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T | undefined;
  onChange: (value: T) => void;
  error?: string;
}) {
  return (
    <View style={styles.chipsField} accessibilityRole="radiogroup" accessibilityLabel={label}>
      <AppText variant="label">{label}</AppText>
      <View style={styles.chips}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={option.label}
              onPress={() => onChange(option.value)}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <AppText variant="label" style={{ color: selected ? colors.textInverse : colors.text }}>
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      {error ? (
        <AppText variant="caption" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

export function confirm(options: {
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
}) {
  Alert.alert(options.title, options.message, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: options.confirmLabel,
      style: options.destructive ? 'destructive' : 'default',
      onPress: options.onConfirm,
    },
  ]);
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  infoRow: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  infoIcon: { marginTop: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: touch.iconButton },
  sectionAction: { minHeight: touch.iconButton, justifyContent: 'center' },
  avatar: { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  notice: { flexDirection: 'row', gap: space.md, padding: space.md, borderRadius: radius.md },
  chipsField: { gap: space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    minHeight: touch.iconButton,
    justifyContent: 'center',
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
});
