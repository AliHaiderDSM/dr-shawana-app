import { router } from 'expo-router';
import { CalendarCheck, CalendarClock, CalendarDays, ChevronRight, Stethoscope } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { ChatRow, ScheduleRow } from '@/components/doctor/parts';
import { CardSkeleton, EmptyState, ErrorState, SkeletonBlock } from '@/components/feedback/states';
import { AppText } from '@/components/ui/app-text';
import { SectionHeader } from '@/components/ui/bits';
import { Screen } from '@/components/ui/screen';
import { useRefresh } from '@/hooks/use-refresh';
import { greeting, initials } from '@/lib/format';
import { colors, icon, radius, space, touch } from '@/theme/tokens';
import { useGetDoctorHomeQuery } from '@/redux/features/doctor';

const VISIT_LABEL: Record<string, string> = { new: 'New visit', followup: 'Follow up' };
const MODE_LABEL: Record<string, string> = { physical: 'In clinic', online: 'Online' };

function Stat({ label, value }: { label: string; value: number | undefined }) {
  return (
    <View style={styles.stat}>
      <AppText variant="heading" style={styles.heroText}>
        {value ?? '–'}
      </AppText>
      <AppText variant="caption" numberOfLines={1} style={styles.heroMuted}>
        {label}
      </AppText>
    </View>
  );
}

function Action({
  label,
  hint,
  icon: Icon,
  badge,
  onPress,
}: {
  label: string;
  hint: string;
  icon: typeof CalendarDays;
  badge?: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={badge ? `${label}, ${badge} new` : label}
      onPress={onPress}
      style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
    >
      <View style={styles.actionIcon}>
        <Icon size={icon.lg} color={colors.primary} />
        {badge ? <View style={styles.dot} /> : null}
      </View>
      <View style={styles.flex}>
        <AppText weight="semibold">{label}</AppText>
        <AppText variant="caption" tone="muted" numberOfLines={1}>
          {hint}
        </AppText>
      </View>
      <ChevronRight size={icon.md} color={colors.textMuted} />
    </Pressable>
  );
}

export default function DoctorHomeScreen() {
  const home = useGetDoctorHomeQuery();
  const { refreshing, onRefresh } = useRefresh(home.refetch);
  const h = home.data;

  return (
    <Screen edges={['top', 'left', 'right']} refreshing={refreshing} onRefresh={onRefresh}>
      <View style={styles.hero}>
        <View style={[styles.ring, styles.ringLarge]} />
        <View style={[styles.ring, styles.ringSmall]} />
        <View style={styles.heroTop}>
          <View style={styles.flex}>
            <AppText variant="label" style={styles.heroMuted}>
              {greeting()},
            </AppText>
            {h ? (
              <AppText variant="title" numberOfLines={2} accessibilityRole="header" style={styles.heroText}>
                {h.doctor.name}
              </AppText>
            ) : (
              <SkeletonBlock width="60%" height={28} />
            )}
            <View style={styles.chip}>
              <Stethoscope size={icon.sm} color={colors.textInverse} />
              <AppText variant="caption" weight="semibold" style={styles.heroText} numberOfLines={1}>
                {h ? `${h.doctor.details ?? 'Doctor'} · ${h.doctor.branch}` : 'DSM Clinic'}
              </AppText>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open your profile"
            onPress={() => router.push('/doctor/profile')}
            hitSlop={4}
            style={styles.heroAvatar}
          >
            <AppText weight="bold" style={styles.heroText}>
              {h ? initials(h.doctor.name.replace(/^dr\.?\s*/i, '')) : ''}
            </AppText>
          </Pressable>
        </View>
        <View style={styles.stats}>
          <Stat label="Today" value={h?.counts.today} />
          <Stat label="Done today" value={h?.counts.completedToday} />
          <Stat label="Upcoming" value={h?.counts.upcoming} />
          <Stat label="Unread" value={h?.counts.unread} />
        </View>
      </View>

      <View style={styles.actions}>
        <Action
          label="Appointments"
          hint={
            h?.counts.appointments !== undefined
              ? `${h.counts.appointments} in every branch · upcoming and past`
              : 'Upcoming and past, in every branch'
          }
          icon={CalendarDays}
          onPress={() => router.push('/doctor/appointments')}
        />
      </View>

      {home.isLoading ? (
        <CardSkeleton count={3} />
      ) : home.isError || !h ? (
        <ErrorState error={home.error} onRetry={home.refetch} retrying={home.isFetching} />
      ) : (
        <>
          <SectionHeader
            title="Schedule"
            actionLabel="All"
            onAction={() => router.push('/doctor/appointments')}
          />
          {h.schedule.length ? (
            <View style={styles.list}>
              {h.schedule.map((a) => (
                <ScheduleRow
                  key={a.id}
                  date={a.date}
                  timeFrom={a.timeFrom}
                  name={a.patient.name}
                  detail={`#${a.appointmentNo} · ${VISIT_LABEL[a.visitType] ?? a.visitType} · ${MODE_LABEL[a.mode] ?? a.mode}`}
                  branch={a.branch}
                  status={a.status}
                  onPress={() =>
                    router.push({
                      pathname: '/doctor/patient/[patientId]',
                      params: { patientId: a.patient.id },
                    })
                  }
                />
              ))}
            </View>
          ) : (
            <EmptyState
              icon={CalendarCheck}
              title="No appointments ahead"
              message="Your next booked appointments will show here."
            />
          )}

          <SectionHeader
            title="Recent messages"
            actionLabel={h.chats.length ? 'All' : undefined}
            onAction={() => router.push('/doctor/messages')}
          />
          {h.chats.length ? (
            <View style={styles.list}>
              {h.chats.map((c) => (
                <ChatRow
                  key={c.conversationId}
                  name={c.patient.name}
                  lastMessage={c.lastMessage}
                  lastMessageAt={c.lastMessageAt}
                  unread={c.unread}
                  onPress={() =>
                    router.push({
                      pathname: '/doctor/chat/[conversationId]',
                      params: {
                        conversationId: c.conversationId,
                        patientId: c.patient.id,
                        name: c.patient.name,
                      },
                    })
                  }
                />
              ))}
            </View>
          ) : (
            <EmptyState
              icon={CalendarClock}
              title="No messages yet"
              message="Open a patient and tap Message to start a chat."
            />
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0, gap: space.xs },
  hero: {
    marginTop: space.sm,
    padding: space.lg,
    gap: space.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    overflow: 'hidden',
  },
  ring: { position: 'absolute', borderRadius: radius.pill, backgroundColor: colors.heroAccent },
  ringLarge: { width: 220, height: 220, top: -90, right: -70 },
  ringSmall: { width: 120, height: 120, bottom: -50, left: -40 },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  heroText: { color: colors.textInverse },
  heroMuted: { color: colors.textInverseMuted },
  chip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    marginTop: space.xs,
    paddingHorizontal: space.sm,
    paddingVertical: space.xxs,
    borderRadius: radius.pill,
    backgroundColor: colors.onPrimarySoft,
  },
  heroAvatar: {
    width: touch.iconButton + 4,
    height: touch.iconButton + 4,
    borderRadius: radius.pill,
    backgroundColor: colors.onPrimarySoft,
    borderWidth: 2,
    borderColor: colors.textInverseMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: { flexDirection: 'row', gap: space.sm },
  stat: {
    flex: 1,
    minWidth: 0,
    paddingVertical: space.sm,
    paddingHorizontal: space.sm,
    borderRadius: radius.md,
    backgroundColor: colors.onPrimarySoft,
    gap: space.xxs,
  },
  actions: { gap: space.md },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  actionPressed: { backgroundColor: colors.surfaceMuted },
  actionIcon: {
    width: touch.iconButton,
    height: touch.iconButton,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.whatsapp,
    borderWidth: 2,
    borderColor: colors.primarySoft,
  },
  list: { gap: space.md },
});
