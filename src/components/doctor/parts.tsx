import { ChevronRight, MapPin } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { StatusBadge, type BadgeTone } from '@/components/ui/status-badge';
import { formatDate, formatDateTime, formatTime } from '@/lib/format';
import { colors, icon, radius, shadow, space, touch } from '@/theme/tokens';

const isoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const today = () => isoDay(new Date());

export const STATUS_TONE: Record<string, { label: string; tone: BadgeTone }> = {
  booked: { label: 'Booked', tone: 'info' },
  completed: { label: 'Completed', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
};

export function dayLabel(date: string) {
  const now = today();
  if (date === now) return 'Today';
  const next = new Date(`${now}T00:00:00`);
  next.setDate(next.getDate() + 1);
  const tomorrow = isoDay(next);
  return date === tomorrow ? 'Tomorrow' : formatDate(date);
}

export function Initials({
  text,
  size = 44,
  tone = 'primary',
}: {
  text: string;
  size?: number;
  tone?: 'primary' | 'soft';
}) {
  return (
    <View
      style={[
        styles.initials,
        { width: size, height: size },
        tone === 'primary' ? styles.initialsPrimary : styles.initialsSoft,
      ]}
    >
      <AppText
        weight="bold"
        style={tone === 'primary' ? styles.initialsTextPrimary : styles.initialsTextSoft}
      >
        {text}
      </AppText>
    </View>
  );
}

export function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <View style={styles.unread}>
      <AppText variant="caption" weight="bold" style={styles.unreadText}>
        {count > 99 ? '99+' : count}
      </AppText>
    </View>
  );
}

export function RowCard({
  onPress,
  label,
  children,
  right,
}: {
  onPress?: () => void;
  label: string;
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      {children}
      {right ?? <ChevronRight size={icon.md} color={colors.textMuted} />}
    </Pressable>
  );
}

export function ScheduleRow({
  date,
  timeFrom,
  name,
  detail,
  branch,
  status,
  onPress,
}: {
  date: string;
  timeFrom: string;
  name: string;
  detail: string;
  branch: string;
  status: string;
  onPress: () => void;
}) {
  const s = STATUS_TONE[status] ?? { label: status, tone: 'neutral' as const };
  return (
    <RowCard label={`${name}, ${dayLabel(date)} ${formatTime(timeFrom)}`} onPress={onPress}>
      <View style={styles.time}>
        <AppText variant="label" weight="bold" tone="primary">
          {formatTime(timeFrom)}
        </AppText>
        <AppText variant="caption" tone="muted">
          {dayLabel(date)}
        </AppText>
      </View>
      <View style={styles.flex}>
        <AppText weight="semibold" numberOfLines={1}>
          {name}
        </AppText>
        <AppText variant="caption" tone="muted" numberOfLines={1}>
          {detail}
        </AppText>
        <View style={styles.meta}>
          <MapPin size={12} color={colors.textMuted} />
          <AppText variant="caption" tone="muted" numberOfLines={1} style={styles.flex}>
            {branch}
          </AppText>
          <StatusBadge label={s.label} tone={s.tone} />
        </View>
      </View>
    </RowCard>
  );
}

export function ChatRow({
  name,
  lastMessage,
  lastMessageAt,
  unread,
  onPress,
}: {
  name: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unread: number;
  onPress: () => void;
}) {
  return (
    <RowCard
      label={`${name}${unread ? `, ${unread} new` : ''}`}
      onPress={onPress}
      right={<UnreadBadge count={unread} />}
    >
      <Initials text={name.trim().slice(0, 1).toUpperCase() || 'P'} tone="soft" />
      <View style={styles.flex}>
        <View style={styles.between}>
          <AppText weight={unread ? 'bold' : 'semibold'} numberOfLines={1} style={styles.flex}>
            {name}
          </AppText>
          {lastMessageAt ? (
            <AppText variant="caption" tone="muted">
              {formatDateTime(lastMessageAt)}
            </AppText>
          ) : null}
        </View>
        <AppText variant="caption" tone={unread ? 'default' : 'muted'} numberOfLines={1}>
          {lastMessage ?? 'Start the conversation'}
        </AppText>
      </View>
    </RowCard>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  between: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  meta: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: space.xxs },
  initials: { borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  initialsPrimary: { backgroundColor: colors.primary },
  initialsSoft: { backgroundColor: colors.primarySoft },
  initialsTextPrimary: { color: colors.textInverse },
  initialsTextSoft: { color: colors.primarySoftText },
  unread: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.whatsapp,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: { color: colors.textInverse, fontSize: 11, lineHeight: 13 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    minHeight: touch.minHeight,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow,
  },
  rowPressed: { backgroundColor: colors.surfaceMuted },
  time: {
    width: 76,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    gap: space.xxs,
  },
});
