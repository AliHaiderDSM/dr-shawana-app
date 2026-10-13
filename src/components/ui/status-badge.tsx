import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { colors, radius, space } from '@/theme/tokens';
import { AppText } from './app-text';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

const tones: Record<BadgeTone, { bg: string; fg: string }> = {
  neutral: { bg: colors.neutralSoft, fg: colors.textMuted },
  primary: { bg: colors.primarySoft, fg: colors.primarySoftText },
  success: { bg: colors.successSoft, fg: colors.success },
  warning: { bg: colors.warningSoft, fg: colors.warning },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
  info: { bg: colors.infoSoft, fg: colors.info },
};

export function StatusBadge({
  label,
  tone,
  icon: Icon,
}: {
  label: string;
  tone: BadgeTone;
  icon?: LucideIcon;
}) {
  const t = tones[tone];
  return (
    <View
      style={[styles.badge, { backgroundColor: t.bg }]}
      accessible
      accessibilityLabel={`Status: ${label}`}
    >
      {Icon ? <Icon size={14} color={t.fg} strokeWidth={2.25} /> : null}
      <AppText variant="caption" weight="semibold" style={{ color: t.fg }}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: space.xs,
    paddingHorizontal: space.sm,
    paddingVertical: space.xxs + 1,
    borderRadius: radius.pill,
  },
});
