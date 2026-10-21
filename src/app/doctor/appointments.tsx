import { router } from 'expo-router';
import { CalendarCheck, CalendarClock, History } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScheduleRow } from '@/components/doctor/parts';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/feedback/states';
import { AppText } from '@/components/ui/app-text';
import { colors, contentMaxWidth, icon, radius, shadow, space } from '@/theme/tokens';
import { type AppointmentsWhen, useGetDoctorAppointmentsQuery } from '@/redux/features/doctor';

const VISIT_LABEL: Record<string, string> = { new: 'New visit', followup: 'Follow up' };
const MODE_LABEL: Record<string, string> = { physical: 'In clinic', online: 'Online' };

const TABS: { key: AppointmentsWhen; label: string; icon: typeof History }[] = [
  { key: 'upcoming', label: 'Upcoming', icon: CalendarClock },
  { key: 'past', label: 'Past', icon: History },
];

export default function DoctorAppointmentsScreen() {
  const [when, setWhen] = useState<AppointmentsWhen>('upcoming');
  const [pages, setPages] = useState<Record<AppointmentsWhen, number>>({ upcoming: 1, past: 1 });
  const page = pages[when];
  const list = useGetDoctorAppointmentsQuery({ when, page });
  const [refreshing, setRefreshing] = useState(false);
  const items = list.data?.items;

  const refresh = async () => {
    setRefreshing(true);
    if (page === 1) await list.refetch();
    else setPages((p) => ({ ...p, [when]: 1 }));
    setRefreshing(false);
  };

  const more = () => {
    if (list.data?.hasMore && !list.isFetching) setPages((p) => ({ ...p, [when]: p[when] + 1 }));
  };

  return (
    <SafeAreaView style={styles.root} edges={['left', 'right']}>
      <View style={styles.tabsWrap}>
        <View style={styles.tabs} accessibilityRole="tablist">
          {TABS.map((t) => {
            const on = when === t.key;
            const Icon = t.icon;
            return (
              <Pressable
                key={t.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                onPress={() => setWhen(t.key)}
                style={[styles.tab, on && styles.tabOn]}
              >
                <Icon size={icon.sm} color={on ? colors.primary : colors.textMuted} />
                <AppText variant="label" weight="semibold" tone={on ? 'primary' : 'muted'}>
                  {t.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>
      <FlatList
        data={list.isLoading ? [] : (items ?? [])}
        keyExtractor={(a) => a.id}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={styles.gap} />}
        renderItem={({ item: a }) => (
          <ScheduleRow
            date={a.date}
            timeFrom={a.timeFrom}
            name={a.patient.name}
            detail={`#${a.appointmentNo} · ${VISIT_LABEL[a.visitType] ?? a.visitType} · ${MODE_LABEL[a.mode] ?? a.mode}`}
            branch={a.branch}
            status={a.status}
            onPress={() =>
              router.push({ pathname: '/doctor/patient/[patientId]', params: { patientId: a.patient.id } })
            }
          />
        )}
        onEndReached={more}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          list.isFetching && page > 1 ? (
            <ActivityIndicator color={colors.primary} style={styles.footer} />
          ) : null
        }
        ListEmptyComponent={
          list.isLoading ? (
            <CardSkeleton count={4} />
          ) : list.isError && !items ? (
            <ErrorState error={list.error} onRetry={list.refetch} retrying={list.isFetching} />
          ) : (
            <EmptyState
              icon={CalendarCheck}
              title={when === 'upcoming' ? 'No appointments ahead' : 'No past appointments'}
              message={
                when === 'upcoming'
                  ? 'Your booked appointments from today onwards show here.'
                  : 'Appointments you have already seen show here, newest first.'
              }
            />
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh()}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  tabsWrap: { paddingHorizontal: space.lg, paddingTop: space.md },
  tabs: {
    flexDirection: 'row',
    gap: space.xs,
    padding: space.xs,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    width: '100%',
    maxWidth: contentMaxWidth,
    alignSelf: 'center',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    minHeight: 40,
    borderRadius: radius.sm,
  },
  tabOn: { backgroundColor: colors.surface, ...shadow },
  content: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.xxxl,
    width: '100%',
    maxWidth: contentMaxWidth,
    alignSelf: 'center',
  },
  gap: { height: space.sm },
  footer: { marginTop: space.lg },
});
