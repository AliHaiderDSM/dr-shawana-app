import { router, Stack, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import {
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  FileImage,
  FileText,
  FlaskConical,
  FolderHeart,
  MessageCircle,
  Pencil,
  Pill,
  Ruler,
  Scale,
  Stethoscope,
} from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { BloodWorkView } from '@/components/doctor/blood-work';
import { openChatWith } from '@/components/doctor/open-chat';
import { Initials } from '@/components/doctor/parts';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/feedback/states';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { RichTextView } from '@/components/ui/rich-text-view';
import { Screen } from '@/components/ui/screen';
import { StatusBadge } from '@/components/ui/status-badge';
import { useRefresh } from '@/hooks/use-refresh';
import { errorMessage } from '@/lib/errors';
import { formatDate, formatDay, initials } from '@/lib/format';
import { groupRecords } from '@/lib/record-groups';
import { htmlToMarkup } from '@/lib/rich-text';
import { colors, icon, radius, shadow, space, touch } from '@/theme/tokens';
import {
  type BloodWork,
  type PatientFile,
  useGetDoctorPatientFileQuery,
  useLazyGetDoctorRecordUrlQuery,
  useOpenDoctorChatMutation,
} from '@/redux/features/doctor';

type Tab = 'visits' | 'records';

const TABS: { key: Tab; label: string; icon: typeof Pill }[] = [
  { key: 'visits', label: 'Visits', icon: CalendarDays },
  { key: 'records', label: 'Medical records', icon: FolderHeart },
];

const openRemarks = (consultationId: string, patientId: string) =>
  router.push({ pathname: '/doctor/remarks/[consultationId]', params: { consultationId, patientId } });

function Segment<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { key: T; label: string; icon: typeof Pill; count: number }[];
}) {
  return (
    <View style={styles.segment} accessibilityRole="tablist">
      {options.map((o) => {
        const on = value === o.key;
        const Icon = o.icon;
        return (
          <Pressable
            key={o.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${o.label}, ${o.count}`}
            onPress={() => onChange(o.key)}
            style={[styles.segmentItem, on && styles.segmentOn]}
          >
            <Icon size={icon.sm} color={on ? colors.primary : colors.textMuted} />
            <AppText variant="label" weight="semibold" tone={on ? 'primary' : 'muted'}>
              {o.label}
            </AppText>
            <AppText variant="caption" weight="bold" tone={on ? 'primary' : 'muted'}>
              {o.count}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

function Entry({ date, last, children }: { date: string; last: boolean; children: ReactNode }) {
  return (
    <View style={styles.entry}>
      <View style={styles.rail}>
        <View style={styles.dot} />
        {last ? null : <View style={styles.line} />}
      </View>
      <View style={styles.flex}>
        <AppText variant="caption" weight="semibold" tone="primary" style={styles.date}>
          {formatDay(date)}
        </AppText>
        <View style={styles.card}>{children}</View>
      </View>
    </View>
  );
}

function Source({ doctor, branch, verb }: { doctor: string | null; branch?: string | null; verb: string }) {
  return (
    <View style={styles.source}>
      <View style={styles.sourceItem}>
        <Stethoscope size={icon.sm} color={colors.textMuted} />
        <AppText variant="caption" tone="muted" numberOfLines={1} style={styles.flex}>
          {verb} {doctor ?? 'a doctor'}
        </AppText>
      </View>
      {branch ? (
        <View style={styles.sourceItem}>
          <Building2 size={icon.sm} color={colors.textMuted} />
          <AppText variant="caption" tone="muted" numberOfLines={1} style={styles.flex}>
            {branch} branch
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

function Prescriptions({ file }: { file: PatientFile }) {
  const [open, setOpen] = useState<string | null>(null);
  if (!file.prescriptions.length)
    return (
      <EmptyState
        icon={Pill}
        title="No prescriptions"
        message="Prescriptions written for this patient show here."
      />
    );
  return (
    <>
      {file.prescriptions.map((p, index) => {
        const expanded = open === p.id;
        const remark = p.consultationId
          ? file.remarks.find((r) => r.consultationId === p.consultationId)
          : undefined;
        return (
          <Entry key={p.id} date={p.date} last={index === file.prescriptions.length - 1}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              accessibilityLabel={`Prescription ${p.prescriptionNo}`}
              onPress={() => setOpen(expanded ? null : p.id)}
              style={styles.gap}
            >
              <View style={styles.between}>
                <AppText weight="semibold">Prescription #{p.prescriptionNo}</AppText>
                <View style={styles.toggle}>
                  <AppText variant="caption" tone="primary" weight="semibold">
                    {expanded ? 'Hide' : `${p.items.length} items`}
                  </AppText>
                  {expanded ? (
                    <ChevronUp size={icon.sm} color={colors.primary} />
                  ) : (
                    <ChevronDown size={icon.sm} color={colors.primary} />
                  )}
                </View>
              </View>
              <AppText variant="label">{p.diagnosis}</AppText>
              <Source verb="Prescribed by" doctor={p.doctor} branch={p.branch} />
              {p.followupDate ? (
                <AppText variant="caption" tone="muted">
                  Follow up {formatDate(p.followupDate)}
                </AppText>
              ) : null}
              {!expanded && remark?.remarks ? (
                <View style={styles.remarkTag}>
                  <ClipboardList size={12} color={colors.primary} />
                  <AppText variant="caption" tone="primary" weight="semibold">
                    Clinical remarks added
                  </AppText>
                </View>
              ) : null}
            </Pressable>
            {expanded ? (
              <View style={styles.items}>
                {p.items.map((i, n) => (
                  <View key={n} style={styles.item}>
                    <View style={styles.bullet} />
                    <View style={styles.flex}>
                      <AppText variant="label" weight="semibold">
                        {i.name}
                      </AppText>
                      {i.dose || i.instructions ? (
                        <AppText variant="caption" tone="muted">
                          {[i.dose, i.instructions].filter(Boolean).join(' · ')}
                        </AppText>
                      ) : null}
                    </View>
                  </View>
                ))}
                {htmlToMarkup(p.planTreatment) ? (
                  <View style={styles.plan}>
                    <AppText variant="caption" weight="semibold" tone="muted">
                      PLAN OF TREATMENT
                    </AppText>
                    <RichTextView html={p.planTreatment} />
                  </View>
                ) : null}
                {remark ? (
                  <View style={styles.remarkBox}>
                    <View style={styles.between}>
                      <AppText variant="caption" weight="semibold" tone="muted">
                        CLINICAL REMARKS
                      </AppText>
                      {remark.editable && remark.remarks ? (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="Edit clinical remarks"
                          hitSlop={8}
                          onPress={() => openRemarks(remark.consultationId, file.patient.id)}
                          style={styles.pencil}
                        >
                          <Pencil size={icon.sm} color={colors.primary} />
                        </Pressable>
                      ) : null}
                    </View>
                    {remark.remarks ? (
                      <RichTextView html={remark.remarks} />
                    ) : (
                      <AppText variant="label" tone="muted">
                        No clinical remarks for this visit yet.
                      </AppText>
                    )}
                    {remark.editable && !remark.remarks ? (
                      <Button
                        label="Write clinical remarks"
                        icon={Pencil}
                        variant="secondary"
                        onPress={() => openRemarks(remark.consultationId, file.patient.id)}
                      />
                    ) : null}
                  </View>
                ) : null}
              </View>
            ) : null}
          </Entry>
        );
      })}
    </>
  );
}

function Remarks({ file }: { file: PatientFile }) {
  if (!file.remarks.length)
    return (
      <EmptyState
        icon={ClipboardList}
        title="No clinical remarks"
        message="Remarks appear once a consultation for this patient is opened."
      />
    );
  return (
    <>
      {file.remarks.map((r, index) => (
        <Entry key={r.consultationId} date={r.date} last={index === file.remarks.length - 1}>
          <View style={styles.between}>
            <AppText weight="semibold">Visit #{r.appointmentNo}</AppText>
            {r.editable ? <StatusBadge label="Yours" tone="primary" /> : null}
          </View>
          <Source verb="Written by" doctor={r.doctor} branch={r.branch} />
          {r.remarks ? (
            <RichTextView html={r.remarks} />
          ) : (
            <AppText variant="label" tone="muted">
              No remarks written yet.
            </AppText>
          )}
          {r.editable ? (
            <Button
              label={r.remarks ? 'Edit remarks' : 'Write remarks'}
              icon={Pencil}
              variant="secondary"
              onPress={() => openRemarks(r.consultationId, file.patient.id)}
            />
          ) : null}
        </Entry>
      ))}
    </>
  );
}

function RecordFiles({ file }: { file: PatientFile }) {
  const [getUrl] = useLazyGetDoctorRecordUrlQuery();
  const [opening, setOpening] = useState<string | null>(null);
  const open = async (fileId: string) => {
    if (opening) return;
    setOpening(fileId);
    try {
      const { url } = await getUrl({ patientId: file.patient.id, fileId }).unwrap();
      await WebBrowser.openBrowserAsync(url, {
        toolbarColor: colors.surface,
        controlsColor: colors.primary,
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      });
    } catch (error) {
      Alert.alert('Could not open the file', errorMessage(error));
    } finally {
      setOpening(null);
    }
  };
  if (!file.records.length)
    return (
      <EmptyState
        icon={FolderHeart}
        title="No medical records"
        message="Reports and scans of this patient show here."
      />
    );
  const groups = groupRecords(file.records);
  return (
    <>
      {groups.map((r, index) => (
        <Entry key={r.key} date={r.date} last={index === groups.length - 1}>
          <View style={styles.between}>
            <StatusBadge
              label={r.type === 'imaging' ? 'Imaging' : 'Lab / medical report'}
              tone={r.type === 'imaging' ? 'info' : 'primary'}
            />
            <AppText variant="caption" tone="muted">
              {r.files.length} file{r.files.length === 1 ? '' : 's'} ·{' '}
              {r.uploadedByPatient ? 'From the app' : 'By the clinic'}
            </AppText>
          </View>
          {r.branch ? (
            <View style={styles.branchRow}>
              <Building2 size={icon.sm} color={colors.textMuted} />
              <AppText variant="caption" tone="muted" numberOfLines={1} style={styles.flex}>
                {r.branch} branch
              </AppText>
            </View>
          ) : null}
          {r.notes.map((note) => (
            <AppText key={note} variant="label">
              {note}
            </AppText>
          ))}
          {r.files.map((f) => {
            const Icon = f.contentType.startsWith('image/') ? FileImage : FileText;
            return (
              <Pressable
                key={f.id}
                accessibilityRole="button"
                accessibilityLabel={`Open ${f.name}`}
                onPress={() => void open(f.id)}
                style={({ pressed }) => [styles.file, pressed && styles.filePressed]}
              >
                {opening === f.id ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <Icon size={icon.md} color={colors.primary} />
                )}
                <AppText variant="label" numberOfLines={2} style={styles.flex}>
                  {f.name}
                </AppText>
              </Pressable>
            );
          })}
        </Entry>
      ))}
    </>
  );
}

type VisitsView = 'prescriptions' | 'remarks';

function Visits({ file }: { file: PatientFile }) {
  const [view, setView] = useState<VisitsView>('prescriptions');
  return (
    <View style={styles.records}>
      <Segment
        value={view}
        onChange={setView}
        options={[
          { key: 'prescriptions', label: 'Prescriptions', icon: Pill, count: file.prescriptions.length },
          { key: 'remarks', label: 'Clinical remarks', icon: ClipboardList, count: file.remarks.length },
        ]}
      />
      {view === 'prescriptions' ? <Prescriptions file={file} /> : <Remarks file={file} />}
    </View>
  );
}

const NO_BLOOD_WORK: BloodWork = { dates: [], tests: [] };

function Records({ file }: { file: PatientFile }) {
  const blood = file.bloodWork ?? NO_BLOOD_WORK;
  const fileCount = file.records.reduce((sum, r) => sum + r.files.length, 0);
  return (
    <View style={styles.records}>
      <View style={styles.sectionHead}>
        <FlaskConical size={icon.md} color={colors.primary} />
        <AppText weight="semibold" style={styles.flex}>
          Blood work
        </AppText>
        <AppText variant="caption" tone="muted">
          {blood.dates.length} test date{blood.dates.length === 1 ? '' : 's'}
        </AppText>
      </View>
      <BloodWorkView data={blood} />
      <View style={styles.sectionHead}>
        <FileText size={icon.md} color={colors.primary} />
        <AppText weight="semibold" style={styles.flex}>
          Files
        </AppText>
        <AppText variant="caption" tone="muted">
          {fileCount} file{fileCount === 1 ? '' : 's'}
        </AppText>
      </View>
      <RecordFiles file={file} />
    </View>
  );
}

export default function DoctorPatientFileScreen() {
  const { patientId = '', from } = useLocalSearchParams<{ patientId: string; from?: string }>();
  const fromChat = from === 'chat';
  const file = useGetDoctorPatientFileQuery(patientId, { skip: !patientId, refetchOnMountOrArgChange: true });
  const [openChat, openState] = useOpenDoctorChatMutation();
  const [tab, setTab] = useState<Tab>('visits');
  const { refreshing, onRefresh } = useRefresh(file.refetch);
  const f = file.data;

  if (file.isLoading)
    return (
      <Screen>
        <CardSkeleton count={3} />
      </Screen>
    );
  if (!f)
    return (
      <Screen>
        <ErrorState error={file.error} onRetry={file.refetch} retrying={file.isFetching} />
      </Screen>
    );

  const p = f.patient;
  const counts: Record<Tab, number> = {
    visits: f.prescriptions.length,
    records: f.records.reduce((sum, r) => sum + r.files.length, 0),
  };

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      {fromChat ? <Stack.Screen options={{ title: p.name }} /> : null}
      {fromChat ? null : (
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <Initials text={initials(p.name)} size={56} />
            <View style={styles.flex}>
              <AppText variant="heading" numberOfLines={2} style={styles.heroText}>
                {p.name}
              </AppText>
              <AppText variant="caption" style={styles.heroMuted}>
                {[p.phone, p.age !== null ? `${p.age} years` : null, p.city].filter(Boolean).join(' · ')}
              </AppText>
            </View>
          </View>
          {p.weightKg || p.heightCm ? (
            <View style={styles.vitals}>
              {p.weightKg ? (
                <View style={styles.vital}>
                  <Scale size={icon.sm} color={colors.textInverse} />
                  <AppText variant="caption" weight="semibold" style={styles.heroText}>
                    {Number(p.weightKg)} kg
                  </AppText>
                </View>
              ) : null}
              {p.heightCm ? (
                <View style={styles.vital}>
                  <Ruler size={icon.sm} color={colors.textInverse} />
                  <AppText variant="caption" weight="semibold" style={styles.heroText}>
                    {Number(p.heightCm)} cm
                  </AppText>
                </View>
              ) : null}
            </View>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Message ${p.name}`}
            disabled={openState.isLoading}
            onPress={() =>
              void openChatWith({ id: p.id, name: p.name, conversationId: f.conversationId }, (id) =>
                openChat(id).unwrap(),
              )
            }
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          >
            {openState.isLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <MessageCircle size={icon.md} color={colors.primary} />
            )}
            <AppText weight="semibold" tone="primary">
              Message {p.name.split(' ')[0]}
            </AppText>
          </Pressable>
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {TABS.map((t) => {
          const active = tab === t.key;
          const Icon = t.icon;
          return (
            <Pressable
              key={t.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setTab(t.key)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Icon size={icon.sm} color={active ? colors.textInverse : colors.primary} />
              <AppText variant="label" weight="semibold" style={active ? styles.heroText : styles.tabText}>
                {t.label}
              </AppText>
              <View style={[styles.count, active && styles.countActive]}>
                <AppText variant="caption" weight="bold" style={active ? styles.heroText : styles.tabText}>
                  {counts[t.key]}
                </AppText>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <View>
        {tab === 'visits' ? <Visits file={f} /> : null}
        {tab === 'records' ? <Records file={f} /> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  gap: { gap: space.xs },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  hero: { padding: space.lg, gap: space.md, borderRadius: radius.lg, backgroundColor: colors.primary },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  heroText: { color: colors.textInverse },
  heroMuted: { color: colors.textInverseMuted },
  vitals: { flexDirection: 'row', gap: space.sm },
  vital: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingHorizontal: space.sm,
    paddingVertical: space.xxs,
    borderRadius: radius.pill,
    backgroundColor: colors.onPrimarySoft,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    minHeight: touch.minHeight,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  ctaPressed: { backgroundColor: colors.surfaceMuted },
  tabs: { gap: space.sm, paddingVertical: space.xs },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingHorizontal: space.md,
    minHeight: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { color: colors.primarySoftText },
  count: {
    minWidth: 22,
    paddingHorizontal: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  countActive: { backgroundColor: colors.onPrimarySoft },
  entry: { flexDirection: 'row', gap: space.md },
  rail: { width: 14, alignItems: 'center' },
  dot: {
    width: 12,
    height: 12,
    marginTop: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.primarySoft,
  },
  line: { flex: 1, width: 2, backgroundColor: colors.border, marginTop: space.xxs },
  date: { marginBottom: space.xs },
  card: {
    gap: space.xs,
    padding: space.md,
    marginBottom: space.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow,
  },
  items: {
    gap: space.sm,
    marginTop: space.sm,
    paddingTop: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  item: { flexDirection: 'row', gap: space.sm },
  bullet: { width: 6, height: 6, marginTop: 7, borderRadius: radius.pill, backgroundColor: colors.primary },
  plan: { gap: space.xs, padding: space.sm, borderRadius: radius.md, backgroundColor: colors.primarySoft },
  file: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.sm,
    minHeight: touch.iconButton,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  filePressed: { opacity: 0.8 },
  records: { gap: space.lg },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: space.xxs },
  remarkTag: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  remarkBox: {
    gap: space.xs,
    padding: space.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pencil: { padding: space.xs, borderRadius: radius.pill, backgroundColor: colors.primarySoft },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  branchRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  source: { gap: space.xxs },
  sourceItem: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  segment: {
    flexDirection: 'row',
    padding: space.xs,
    gap: space.xs,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    minHeight: 40,
    borderRadius: radius.sm,
  },
  segmentOn: { backgroundColor: colors.surface, ...shadow },
});
