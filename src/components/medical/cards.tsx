import {
  CalendarDays,
  ExternalLink,
  FileImage,
  FileText,
  MapPin,
  Pill,
  Stethoscope,
  Trash2,
  type LucideIcon,
} from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDate, formatDateTime, formatDay, formatSize, formatTime } from '@/lib/format';
import { MODE_LABELS, REQUEST_CATEGORY_LABELS, REQUEST_STATUS, appointmentStatus } from '@/lib/labels';
import { colors, icon, radius, space, touch } from '@/theme/tokens';
import { type Appointment } from '@/redux/features/appointments';
import { type DocumentFile, type MedicalDocument } from '@/redux/features/documents';
import { type HistoryVisit } from '@/redux/features/medical-history';
import { type ManagementRequest } from '@/redux/features/management-requests';
import { type PrescriptionSummary } from '@/redux/features/prescriptions';

function Meta({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <View style={styles.meta}>
      <Icon size={icon.sm} color={colors.textMuted} />
      <AppText variant="label" tone="muted" style={styles.flex}>
        {text}
      </AppText>
    </View>
  );
}

export function AppointmentCard({
  appointment: a,
  onPress,
}: {
  appointment: Appointment;
  onPress: () => void;
}) {
  const status = appointmentStatus(a);
  const when = `${formatDay(a.date)}, ${formatTime(a.timeFrom)}`;
  return (
    <Card
      onPress={onPress}
      chevron
      accessibilityLabel={`Appointment ${when} with ${a.doctor?.name ?? 'the clinic'}, ${status.label}`}
      accessibilityHint="Opens the appointment details"
    >
      <StatusBadge label={status.label} tone={status.tone} icon={status.icon} />
      <AppText variant="subheading">{when}</AppText>
      {a.doctor ? <Meta icon={Stethoscope} text={a.doctor.name} /> : null}
      <Meta icon={MapPin} text={`${a.branch.name} · ${MODE_LABELS[a.mode]}`} />
    </Card>
  );
}

export function PrescriptionCard({
  prescription: p,
  onPress,
}: {
  prescription: PrescriptionSummary;
  onPress: () => void;
}) {
  return (
    <Card
      onPress={onPress}
      chevron
      accessibilityLabel={`Prescription of ${formatDate(p.date)}${p.doctor ? ` by ${p.doctor}` : ''}`}
      accessibilityHint="Opens the prescription"
    >
      <AppText variant="caption" tone="muted">
        Prescription #{p.prescriptionNo} · {formatDate(p.date)}
      </AppText>
      <AppText variant="subheading" numberOfLines={1}>
        {p.doctor ? `Prescription by ${p.doctor}` : 'Your prescription'}
      </AppText>
      {p.diagnosis?.trim() ? (
        <AppText variant="label" tone="muted" numberOfLines={1}>
          Diagnosis: {p.diagnosis.trim()}
        </AppText>
      ) : null}
      <Meta icon={Pill} text={`${p.itemCount} item${p.itemCount === 1 ? '' : 's'}`} />
    </Card>
  );
}

export function HistoryItem({
  visit,
  onPress,
  last,
}: {
  visit: HistoryVisit;
  onPress: () => void;
  last: boolean;
}) {
  const status = appointmentStatus(visit);
  return (
    <View style={styles.timelineRow}>
      <View style={styles.rail} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={[styles.dot, visit.status === 'cancelled' && styles.dotMuted]} />
        {last ? null : <View style={styles.line} />}
      </View>
      <View style={styles.timelineCard}>
        <Card
          onPress={onPress}
          chevron
          accessibilityLabel={`Visit on ${formatDate(visit.date)}, ${status.label}`}
          accessibilityHint="Opens the visit details"
        >
          <View style={styles.headerRow}>
            <AppText variant="label" weight="semibold" style={styles.flex}>
              {formatDay(visit.date)}
            </AppText>
            <StatusBadge label={status.label} tone={status.tone} icon={status.icon} />
          </View>
          {visit.doctor ? <Meta icon={Stethoscope} text={visit.doctor.name} /> : null}
          <Meta icon={MapPin} text={visit.branch.name} />
          {visit.prescriptions.map((rx) => (
            <Meta key={rx.id} icon={Pill} text={`Prescription #${rx.prescriptionNo}`} />
          ))}
          {visit.documentCount ? (
            <Meta
              icon={FileText}
              text={`${visit.documentCount} document${visit.documentCount === 1 ? '' : 's'}`}
            />
          ) : null}
        </Card>
      </View>
    </View>
  );
}

export function FileButton({
  file,
  opening,
  onOpen,
}: {
  file: DocumentFile;
  opening: boolean;
  onOpen: (file: DocumentFile) => void;
}) {
  const Icon = file.contentType.startsWith('image/') ? FileImage : FileText;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${file.name}`}
      accessibilityState={{ busy: opening }}
      onPress={() => onOpen(file)}
      style={({ pressed }) => [styles.file, pressed && styles.filePressed]}
    >
      <Icon size={icon.md} color={colors.primary} />
      <View style={styles.flex}>
        <AppText variant="label" numberOfLines={2}>
          {file.name}
        </AppText>
        {file.sizeBytes ? (
          <AppText variant="caption" tone="muted">
            {formatSize(file.sizeBytes)}
          </AppText>
        ) : null}
      </View>
      {opening ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <ExternalLink size={icon.md} color={colors.textMuted} />
      )}
    </Pressable>
  );
}

export function DocumentCard({
  document: d,
  openingId,
  onOpen,
  onDelete,
  deleting = false,
}: {
  document: MedicalDocument;
  openingId: string | null;
  onOpen: (file: DocumentFile) => void;
  onDelete?: (document: MedicalDocument) => void;
  deleting?: boolean;
}) {
  return (
    <Card>
      <View style={styles.headerRow}>
        <AppText variant="label" weight="semibold" style={styles.flex} numberOfLines={2}>
          {d.title || (d.type === 'imaging' ? 'Imaging record' : 'Medical record')}
        </AppText>
        <StatusBadge
          label={d.uploadedByPatient ? 'Uploaded by you' : 'From clinic'}
          tone={d.uploadedByPatient ? 'info' : 'primary'}
        />
        {onDelete && d.uploadedByPatient ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Delete this report"
            onPress={() => onDelete(d)}
            disabled={deleting}
            hitSlop={8}
          >
            {deleting ? (
              <ActivityIndicator color={colors.danger} />
            ) : (
              <Trash2 size={icon.md} color={colors.danger} />
            )}
          </Pressable>
        ) : null}
      </View>
      <Meta
        icon={CalendarDays}
        text={`${formatDate(d.date)} · ${d.type === 'imaging' ? 'Imaging' : 'Lab / medical report'}`}
      />
      <View style={styles.files}>
        {d.files.map((file) => (
          <FileButton key={file.id} file={file} opening={openingId === file.id} onOpen={onOpen} />
        ))}
      </View>
    </Card>
  );
}

export function RequestCard({ request: r, onPress }: { request: ManagementRequest; onPress: () => void }) {
  const status = REQUEST_STATUS[r.status];
  return (
    <Card
      onPress={onPress}
      chevron
      accessibilityLabel={`Request ${r.requestNo}, ${r.subject}, ${status.label}`}
      accessibilityHint="Opens the request"
    >
      <View style={styles.headerRow}>
        <AppText variant="caption" tone="muted" style={styles.flex}>
          {r.requestNo} · {REQUEST_CATEGORY_LABELS[r.category]}
        </AppText>
        <StatusBadge label={status.label} tone={status.tone} icon={status.icon} />
      </View>
      <AppText variant="body" weight="semibold" numberOfLines={2}>
        {r.subject}
      </AppText>
      <AppText variant="caption" tone="muted">
        Sent {formatDateTime(r.createdAt)}
        {r.reply ? ' · Clinic replied' : ''}
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  timelineRow: { flexDirection: 'row', gap: space.md },
  rail: { width: 16, alignItems: 'center' },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: space.xl,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.primarySoft,
  },
  dotMuted: { backgroundColor: colors.textMuted },
  line: { flex: 1, width: 2, backgroundColor: colors.border, marginTop: space.xs },
  timelineCard: { flex: 1, minWidth: 0, paddingBottom: space.md },
  files: { gap: space.sm },
  file: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: touch.minHeight,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  filePressed: { backgroundColor: colors.surfaceMuted },
});
