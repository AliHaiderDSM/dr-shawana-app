import { router, useLocalSearchParams } from 'expo-router';
import {
  Building2,
  CalendarDays,
  Clock,
  MapPin,
  MessageSquarePlus,
  Phone,
  Stethoscope,
  Video,
} from 'lucide-react-native';
import { View } from 'react-native';
import { CardSkeleton, ErrorState } from '@/components/feedback/states';
import { DocumentCard, PrescriptionCard } from '@/components/medical/cards';
import { AppText } from '@/components/ui/app-text';
import { InfoRow, SectionHeader } from '@/components/ui/bits';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { StatusBadge } from '@/components/ui/status-badge';
import { useOpenDocument } from '@/hooks/use-open-document';
import { useRefresh } from '@/hooks/use-refresh';
import { formatDay, formatTime } from '@/lib/format';
import { MODE_LABELS, VISIT_LABELS, appointmentStatus } from '@/lib/labels';
import { useAppointmentQuery } from '@/services/api/patient-api';
import { space } from '@/theme/tokens';

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const appointment = useAppointmentQuery(id ?? '', { skip: !id });
  const { refreshing, onRefresh } = useRefresh(appointment.refetch);
  const { open, openingId } = useOpenDocument();
  const a = appointment.data;

  if (appointment.isLoading) {
    return (
      <Screen>
        <CardSkeleton count={2} />
      </Screen>
    );
  }
  if (!a) {
    return (
      <Screen>
        <ErrorState
          error={appointment.error}
          onRetry={appointment.refetch}
          retrying={appointment.isFetching}
        />
      </Screen>
    );
  }

  const status = appointmentStatus(a);
  const branchLine = [a.branch.name, a.branch.city].filter(Boolean).join(', ');

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <Card>
        <StatusBadge label={status.label} tone={status.tone} icon={status.icon} />
        <AppText variant="heading" accessibilityRole="header">
          {formatDay(a.date)}
        </AppText>
        <AppText variant="caption" tone="muted">
          Appointment #{a.appointmentNo} · {VISIT_LABELS[a.visitType]}
        </AppText>
      </Card>

      <Card>
        <InfoRow icon={Clock} label="Time" value={`${formatTime(a.timeFrom)} – ${formatTime(a.timeTo)}`} />
        <InfoRow icon={a.mode === 'online' ? Video : CalendarDays} label="Type" value={MODE_LABELS[a.mode]} />
        {a.doctor ? (
          <InfoRow
            icon={Stethoscope}
            label="Doctor"
            value={a.doctor.details ? `${a.doctor.name}\n${a.doctor.details}` : a.doctor.name}
          />
        ) : null}
        <InfoRow icon={Building2} label="Branch" value={branchLine} />
        {a.branch.address ? <InfoRow icon={MapPin} label="Address" value={a.branch.address} /> : null}
        {a.branch.phone ? <InfoRow icon={Phone} label="Branch phone" value={a.branch.phone} /> : null}
      </Card>

      {a.upcoming ? (
        <Button
          label="Need to change this visit?"
          icon={MessageSquarePlus}
          variant="secondary"
          accessibilityHint="Sends a request to the clinic"
          onPress={() => router.push({ pathname: '/contact', params: { category: 'appointment' } })}
        />
      ) : null}

      {a.prescriptions.length ? (
        <>
          <SectionHeader title="Prescription" />
          <View style={{ gap: space.md }}>
            {a.prescriptions.map((p) => (
              <PrescriptionCard
                key={p.id}
                prescription={p}
                onPress={() => router.push(`/prescriptions/${p.id}`)}
              />
            ))}
          </View>
        </>
      ) : null}

      {a.documents.length ? (
        <>
          <SectionHeader title="Documents" />
          <View style={{ gap: space.md }}>
            {a.documents.map((d) => (
              <DocumentCard
                key={d.id}
                document={d}
                openingId={openingId}
                onOpen={(file) => void open(file)}
              />
            ))}
          </View>
        </>
      ) : null}
    </Screen>
  );
}
