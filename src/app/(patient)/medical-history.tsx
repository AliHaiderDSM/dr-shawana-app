import { router } from 'expo-router';
import { CalendarPlus, ClipboardList, Lock } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/feedback/states';
import { IntakeCard } from '@/components/forms/intake-card';
import { AppText } from '@/components/ui/app-text';
import { Notice } from '@/components/ui/bits';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { useRefresh } from '@/hooks/use-refresh';
import { appointmentNumber, formatDay } from '@/lib/format';
import { INTAKE_PARTS } from '@/lib/intake-fields';
import { useGetIntakeQuery } from '@/redux/features/intake';
import { colors, icon, space } from '@/theme/tokens';

export default function MedicalHistoryScreen() {
  const intake = useGetIntakeQuery();
  const { refreshing, onRefresh } = useRefresh(intake.refetch);
  const form = intake.data;

  if (intake.isLoading) {
    return (
      <Screen>
        <CardSkeleton count={3} />
      </Screen>
    );
  }
  if (intake.error || !form) {
    return (
      <Screen>
        <ErrorState error={intake.error} onRetry={intake.refetch} />
      </Screen>
    );
  }
  if (!form.appointment) {
    return (
      <Screen>
        <EmptyState
          icon={ClipboardList}
          title="No appointment yet"
          message="Your medical history form opens with your appointment. Ask the clinic for an appointment first."
          actionLabel="Ask for an appointment"
          onAction={() => router.push({ pathname: '/contact', params: { category: 'appointment' } })}
        />
      </Screen>
    );
  }

  const visit = form.appointment;
  return (
    <Screen keyboard refreshing={refreshing} onRefresh={onRefresh}>
      <Card>
        <View style={styles.visit}>
          <CalendarPlus size={icon.md} color={colors.primary} />
          <View style={styles.flex}>
            <AppText weight="semibold">
              For your visit on {formatDay(visit.date)} at {visit.timeFrom}
            </AppText>
            <AppText variant="label" tone="muted">
              Appointment #{appointmentNumber(visit)}
              {visit.doctor ? ` · ${visit.doctor}` : ''}
            </AppText>
          </View>
        </View>
      </Card>
      {form.editable ? (
        <Notice>
          Fill in what you know and save each part. Your doctor sees it and can update it at the visit.
        </Notice>
      ) : (
        <View style={styles.locked}>
          <Lock size={icon.sm} color={colors.textMuted} />
          <AppText variant="label" tone="muted" style={styles.flex}>
            Your doctor has completed this visit, so the form can no longer be changed.
          </AppText>
        </View>
      )}
      {INTAKE_PARTS.map((part) => (
        <IntakeCard
          key={`${visit.id}-${part.id}-${form.editable}`}
          part={part}
          data={form.sections[part.key]}
          defaults={part.key === 'basic_info' ? form.defaults : undefined}
          editable={form.editable}
        />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  visit: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  locked: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.xs },
});
