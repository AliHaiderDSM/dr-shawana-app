import { router } from 'expo-router';
import { CalendarCheck, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScheduleRow, today } from '@/components/doctor/parts';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/feedback/states';
import { AppText } from '@/components/ui/app-text';
import { colors, contentMaxWidth, icon, radius, shadow, space, touch } from '@/theme/tokens';
import { type DoctorAppointment, useGetDoctorMonthQuery } from '@/redux/features/doctor';

const VISIT_LABEL: Record<string, string> = { new: 'New visit', followup: 'Follow up' };
const MODE_LABEL: Record<string, string> = { physical: 'In clinic', online: 'Online' };
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const pad = (n: number) => String(n).padStart(2, '0');
const monthOf = (date: string) => date.slice(0, 7);
const shiftMonth = (month: string, by: number) => {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y ?? 2000, (m ?? 1) - 1 + by, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};

function daysOf(month: string) {
  const [y, m] = month.split('-').map(Number);
  const year = y ?? 2000;
  const index = (m ?? 1) - 1;
  const first = new Date(year, index, 1);
  const lead = (first.getDay() + 6) % 7;
  const count = new Date(year, index + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: count }, (_, i) => `${month}-${pad(i + 1)}`),
  ];
  while (cells.length % 7) cells.push(null);
  return cells;
}

const longDate = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  const day = new Date(y ?? 2000, (m ?? 1) - 1, d ?? 1);
  return `${DAY_NAMES[day.getDay()]}, ${d} ${MONTHS[(m ?? 1) - 1]}`;
};

function Day({
  date,
  count,
  selected,
  isToday,
  onPress,
}: {
  date: string;
  count: number;
  selected: boolean;
  isToday: boolean;
  onPress: () => void;
}) {
  const day = Number(date.slice(8));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${longDate(date)}, ${count} appointment${count === 1 ? '' : 's'}`}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={styles.cell}
    >
      <View style={[styles.day, isToday && styles.dayToday, selected && styles.daySelected]}>
        <AppText
          variant="label"
          weight={selected || isToday ? 'bold' : 'semibold'}
          style={selected ? styles.dayTextSelected : isToday ? styles.dayTextToday : undefined}
        >
          {day}
        </AppText>
      </View>
      {count ? (
        <View style={[styles.count, selected && styles.countSelected]}>
          <AppText
            variant="caption"
            weight="bold"
            style={selected ? styles.countTextSelected : styles.countText}
          >
            {count}
          </AppText>
        </View>
      ) : (
        <View style={styles.countSpace} />
      )}
    </Pressable>
  );
}

export default function DoctorAppointmentsScreen() {
  const now = today();
  const [month, setMonth] = useState(monthOf(now));
  const [selected, setSelected] = useState(now);
  const list = useGetDoctorMonthQuery(month);
  const [refreshing, setRefreshing] = useState(false);
  const items = list.data?.items ?? [];
  const byDay = new Map<string, DoctorAppointment[]>();
  for (const a of items) byDay.set(a.date, [...(byDay.get(a.date) ?? []), a]);
  const live = (date: string) => (byDay.get(date) ?? []).filter((a) => a.status !== 'cancelled').length;
  const monthTotal = items.filter((a) => a.status !== 'cancelled').length;
  const dayList = monthOf(selected) === month ? (byDay.get(selected) ?? []) : [];
  const [y, m] = month.split('-').map(Number);

  const go = (by: number) => {
    const next = shiftMonth(month, by);
    setMonth(next);
    setSelected(next === monthOf(now) ? now : `${next}-01`);
  };

  const refresh = async () => {
    setRefreshing(true);
    await list.refetch();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.root} edges={['left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh()}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.card}>
          <View style={styles.monthBar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous month"
              onPress={() => go(-1)}
              style={styles.arrow}
            >
              <ChevronLeft size={icon.md} color={colors.primary} />
            </Pressable>
            <View style={styles.monthTitle}>
              <AppText weight="bold" accessibilityRole="header">
                {MONTHS[(m ?? 1) - 1]} {y}
              </AppText>
              <AppText variant="caption" tone="muted">
                {list.isFetching && !list.data
                  ? 'Loading…'
                  : `${monthTotal} appointment${monthTotal === 1 ? '' : 's'} this month`}
              </AppText>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next month"
              onPress={() => go(1)}
              style={styles.arrow}
            >
              <ChevronRight size={icon.md} color={colors.primary} />
            </Pressable>
          </View>
          {month !== monthOf(now) || selected !== now ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setMonth(monthOf(now));
                setSelected(now);
              }}
              style={styles.todayButton}
            >
              <AppText variant="caption" weight="semibold" tone="primary">
                Back to today
              </AppText>
            </Pressable>
          ) : null}
          <View style={styles.week}>
            {WEEKDAYS.map((d) => (
              <AppText key={d} variant="caption" weight="semibold" tone="muted" style={styles.weekday}>
                {d}
              </AppText>
            ))}
          </View>
          <View style={styles.grid}>
            {daysOf(month).map((date, i) =>
              date ? (
                <Day
                  key={date}
                  date={date}
                  count={live(date)}
                  selected={date === selected}
                  isToday={date === now}
                  onPress={() => setSelected(date)}
                />
              ) : (
                <View key={`empty-${i}`} style={styles.cell} />
              ),
            )}
          </View>
        </View>

        <View style={styles.dayHead}>
          <AppText weight="semibold">{selected === now ? 'Today' : longDate(selected)}</AppText>
          <AppText variant="caption" tone="muted">
            {dayList.length} appointment{dayList.length === 1 ? '' : 's'}
          </AppText>
        </View>

        {list.isLoading ? (
          <CardSkeleton count={3} />
        ) : list.isError && !list.data ? (
          <ErrorState error={list.error} onRetry={list.refetch} retrying={list.isFetching} />
        ) : dayList.length ? (
          <View style={styles.list}>
            {dayList.map((a) => (
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
            title="No appointments on this day"
            message="Pick a date with a number under it to see its appointments."
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: {
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.xxxl,
    width: '100%',
    maxWidth: contentMaxWidth,
    alignSelf: 'center',
  },
  card: {
    padding: space.md,
    gap: space.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow,
  },
  monthBar: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  monthTitle: { flex: 1, alignItems: 'center', gap: space.xxs },
  arrow: {
    width: touch.iconButton,
    height: touch.iconButton,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  todayButton: { alignSelf: 'center', paddingVertical: space.xxs, paddingHorizontal: space.sm },
  week: { flexDirection: 'row', paddingTop: space.xs },
  weekday: { flex: 1, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: space.xs, gap: space.xxs },
  day: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayToday: { borderWidth: 1.5, borderColor: colors.primary },
  daySelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayTextToday: { color: colors.primary },
  dayTextSelected: { color: colors.textInverse },
  count: {
    minWidth: 20,
    height: 16,
    paddingHorizontal: space.xs,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  countSelected: { backgroundColor: colors.primary },
  countText: { color: colors.primarySoftText, fontSize: 10, lineHeight: 14 },
  countTextSelected: { color: colors.textInverse, fontSize: 10, lineHeight: 14 },
  countSpace: { height: 16 },
  dayHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: space.xs,
  },
  list: { gap: space.sm },
});
