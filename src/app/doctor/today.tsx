import { router } from 'expo-router';
import { CalendarCheck } from 'lucide-react-native';
import { ScheduleRow, scheduleDetail } from '@/components/doctor/parts';
import { EmptyState } from '@/components/feedback/states';
import { AppText } from '@/components/ui/app-text';
import { ListScreen } from '@/components/ui/list-screen';
import { useRefresh } from '@/hooks/use-refresh';
import { useGetDoctorHomeQuery } from '@/redux/features/doctor';

export default function DoctorTodayScreen() {
  const home = useGetDoctorHomeQuery(undefined, { refetchOnMountOrArgChange: true });
  const { refreshing, onRefresh } = useRefresh(home.refetch);
  const schedule = home.data?.schedule;
  const total = home.data?.counts.today ?? 0;

  return (
    <ListScreen
      data={schedule}
      keyExtractor={(a) => a.id}
      isLoading={home.isLoading}
      error={home.error}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onRetry={home.refetch}
      header={
        schedule?.length ? (
          <AppText tone="muted" variant="label">
            {total} appointment{total === 1 ? '' : 's'} today, by time. Tap one to open the patient file.
          </AppText>
        ) : null
      }
      renderItem={({ item: a }) => (
        <ScheduleRow
          date={a.date}
          timeFrom={a.timeFrom}
          name={a.patient.name}
          detail={scheduleDetail(a)}
          branch={a.branch}
          status={a.status}
          onPress={() =>
            router.push({ pathname: '/doctor/patient/[patientId]', params: { patientId: a.patient.id } })
          }
        />
      )}
      empty={
        <EmptyState
          icon={CalendarCheck}
          title="No appointments today"
          message="Open Appointments on the home screen to see the calendar of every day."
        />
      }
    />
  );
}
