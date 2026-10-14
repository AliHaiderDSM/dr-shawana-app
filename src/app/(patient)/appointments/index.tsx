import { router } from 'expo-router';
import { CalendarDays } from 'lucide-react-native';
import { useState } from 'react';
import { EmptyState } from '@/components/feedback/states';
import { AppointmentCard } from '@/components/medical/cards';
import { ChoiceChips } from '@/components/ui/bits';
import { ListScreen } from '@/components/ui/list-screen';
import { useRefresh } from '@/hooks/use-refresh';
import { useGetAppointmentsQuery } from '@/redux/features/appointments';

type Filter = 'upcoming' | 'past';

export default function AppointmentsScreen() {
  const appointments = useGetAppointmentsQuery();
  const { refreshing, onRefresh } = useRefresh(appointments.refetch);
  const [filter, setFilter] = useState<Filter>('upcoming');
  const all = appointments.data;
  const upcoming = all
    ?.filter((a) => a.upcoming)
    .sort((a, b) => `${a.date} ${a.timeFrom}`.localeCompare(`${b.date} ${b.timeFrom}`));
  const past = all?.filter((a) => !a.upcoming);
  const shown = filter === 'upcoming' ? upcoming : past;

  return (
    <ListScreen
      data={shown}
      keyExtractor={(a) => a.id}
      isLoading={appointments.isLoading}
      error={appointments.error}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onRetry={appointments.refetch}
      header={
        <ChoiceChips<Filter>
          label="Show"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'upcoming', label: `Upcoming${upcoming ? ` (${upcoming.length})` : ''}` },
            { value: 'past', label: `Past${past ? ` (${past.length})` : ''}` },
          ]}
        />
      }
      renderItem={({ item }) => (
        <AppointmentCard appointment={item} onPress={() => router.push(`/appointments/${item.id}`)} />
      )}
      empty={
        filter === 'upcoming' ? (
          <EmptyState
            icon={CalendarDays}
            title="No upcoming appointments"
            message="To book a visit, send a request to the clinic."
            actionLabel="Ask for an appointment"
            onAction={() => router.push({ pathname: '/contact', params: { category: 'appointment' } })}
          />
        ) : (
          <EmptyState icon={CalendarDays} title="No past appointments" />
        )
      }
    />
  );
}
