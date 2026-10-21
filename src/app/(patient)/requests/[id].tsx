import { useLocalSearchParams } from 'expo-router';
import {
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  History,
  Hospital,
  Tag,
  UserRound,
  type LucideIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { CardSkeleton, ErrorState } from '@/components/feedback/states';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { StatusBadge } from '@/components/ui/status-badge';
import { useRefresh } from '@/hooks/use-refresh';
import { formatDateTime } from '@/lib/format';
import { REQUEST_CATEGORY_LABELS, REQUEST_STATUS } from '@/lib/labels';
import { colors, icon, radius, space } from '@/theme/tokens';
import {
  type ManagementRequest,
  type RequestStatus,
  useGetRequestQuery,
} from '@/redux/features/management-requests';

const STEPS: { status: RequestStatus; label: string }[] = [
  { status: 'submitted', label: 'Sent' },
  { status: 'in_review', label: 'In review' },
  { status: 'in_progress', label: 'Working on it' },
  { status: 'resolved', label: 'Resolved' },
];

function Meta({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <View style={styles.meta}>
      <Icon size={icon.sm} color={colors.textMuted} />
      <AppText variant="caption" tone="muted" numberOfLines={1}>
        {text}
      </AppText>
    </View>
  );
}

function Progress({ status }: { status: RequestStatus }) {
  if (status === 'closed') {
    return (
      <View style={styles.closed}>
        <AppText variant="label" weight="semibold">
          This request was closed
        </AppText>
        <AppText variant="caption" tone="muted">
          Send a new request if you still need help.
        </AppText>
      </View>
    );
  }
  const current = STEPS.findIndex((s) => s.status === status);
  return (
    <View style={styles.steps} accessible accessibilityLabel={`Progress: ${REQUEST_STATUS[status].label}`}>
      {STEPS.map((step, index) => {
        const done = index < current || status === 'resolved';
        const active = index === current && status !== 'resolved';
        return (
          <View key={step.status} style={styles.step}>
            <View style={styles.stepTrack}>
              <View
                style={[styles.stepLine, index === 0 && styles.hidden, index <= current && styles.lineOn]}
              />
              <View style={[styles.dot, done && styles.dotDone, active && styles.dotActive]}>
                {done ? <Check size={12} color={colors.textInverse} strokeWidth={3} /> : null}
              </View>
              <View
                style={[
                  styles.stepLine,
                  index === STEPS.length - 1 && styles.hidden,
                  index < current && styles.lineOn,
                ]}
              />
            </View>
            <AppText
              variant="caption"
              center
              weight={active || done ? 'semibold' : undefined}
              tone={active ? 'primary' : done ? undefined : 'muted'}
            >
              {step.label}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

function Bubble({
  from,
  icon: Icon,
  when,
  children,
  clinic,
}: {
  from: string;
  icon: LucideIcon;
  when: string | null;
  children: string;
  clinic?: boolean;
}) {
  return (
    <View style={[styles.bubble, clinic ? styles.bubbleClinic : styles.bubbleMine]}>
      <View style={styles.bubbleHead}>
        <View style={[styles.avatar, clinic ? styles.avatarClinic : styles.avatarMine]}>
          <Icon size={icon.sm} color={clinic ? colors.textInverse : colors.primary} />
        </View>
        <AppText variant="label" weight="semibold" style={styles.flex}>
          {from}
        </AppText>
        {when ? (
          <AppText variant="caption" tone="muted">
            {formatDateTime(when)}
          </AppText>
        ) : null}
      </View>
      <AppText selectable>{children}</AppText>
    </View>
  );
}

function HistoryList({ history }: { history: NonNullable<ManagementRequest['history']> }) {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`Status history, ${history.length} update${history.length === 1 ? '' : 's'}`}
        onPress={() => setOpen((v) => !v)}
        style={styles.toggle}
      >
        <History size={icon.md} color={colors.primary} />
        <View style={styles.flex}>
          <AppText weight="semibold">Status history</AppText>
          <AppText variant="caption" tone="muted">
            {history.length} update{history.length === 1 ? '' : 's'} · tap to {open ? 'hide' : 'show'}
          </AppText>
        </View>
        {open ? (
          <ChevronUp size={icon.md} color={colors.textMuted} />
        ) : (
          <ChevronDown size={icon.md} color={colors.textMuted} />
        )}
      </Pressable>
      {open ? (
        <View style={styles.timeline}>
          {history.map((h, index) => {
            const look = REQUEST_STATUS[h.status];
            const last = index === history.length - 1;
            return (
              <View key={`${h.at}-${index}`} style={styles.timelineRow}>
                <View style={styles.rail}>
                  <View style={styles.railDot} />
                  {last ? null : <View style={styles.railLine} />}
                </View>
                <View style={[styles.flex, styles.timelineBody]}>
                  <StatusBadge label={look.label} tone={look.tone} icon={look.icon} />
                  <AppText variant="caption" tone="muted">
                    {formatDateTime(h.at)} · {h.byPatient ? 'You' : 'Clinic'}
                  </AppText>
                  {h.note ? <AppText variant="label">{h.note}</AppText> : null}
                </View>
              </View>
            );
          })}
        </View>
      ) : null}
    </Card>
  );
}

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const request = useGetRequestQuery(id ?? '', { skip: !id, refetchOnMountOrArgChange: true });
  const { refreshing, onRefresh } = useRefresh(request.refetch);
  const r = request.data;

  if (request.isLoading) {
    return (
      <Screen>
        <CardSkeleton count={2} />
      </Screen>
    );
  }
  if (!r) {
    return (
      <Screen>
        <ErrorState error={request.error} onRetry={request.refetch} retrying={request.isFetching} />
      </Screen>
    );
  }

  const status = REQUEST_STATUS[r.status];

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <Card>
        <View style={styles.row}>
          <AppText variant="caption" tone="muted" selectable style={styles.flex}>
            Request {r.requestNo}
          </AppText>
          <StatusBadge label={status.label} tone={status.tone} icon={status.icon} />
        </View>
        <AppText variant="subheading" accessibilityRole="header">
          {r.subject}
        </AppText>
        <View style={styles.metaRow}>
          <Meta icon={Tag} text={REQUEST_CATEGORY_LABELS[r.category]} />
          <Meta icon={Building2} text={r.branch.name} />
          <Meta icon={CalendarDays} text={formatDateTime(r.createdAt)} />
        </View>
        <View style={styles.divider} />
        <Progress status={r.status} />
      </Card>

      <View style={styles.thread}>
        <Bubble from="You" icon={UserRound} when={r.createdAt}>
          {r.message}
        </Bubble>
        {r.reply ? (
          <Bubble from="Clinic" icon={Hospital} when={r.repliedAt} clinic>
            {r.reply}
          </Bubble>
        ) : (
          <View style={styles.waiting}>
            <Clock size={icon.md} color={colors.warning} />
            <View style={styles.flex}>
              <AppText variant="label" weight="semibold">
                Waiting for the clinic
              </AppText>
              <AppText variant="caption" tone="muted">
                Their reply will appear here. Pull down to check again.
              </AppText>
            </View>
          </View>
        )}
      </View>

      {r.history?.length ? <HistoryList history={r.history} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  hidden: { opacity: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingHorizontal: space.sm,
    paddingVertical: space.xxs,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: space.xs },
  steps: { flexDirection: 'row' },
  step: { flex: 1, alignItems: 'center', gap: space.xs },
  stepTrack: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch' },
  stepLine: { flex: 1, height: 2, backgroundColor: colors.border },
  lineOn: { backgroundColor: colors.primary },
  dot: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  dotActive: { borderColor: colors.primary, borderWidth: 6 },
  closed: {
    gap: space.xxs,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  thread: { gap: space.md },
  bubble: { gap: space.sm, padding: space.lg, borderRadius: radius.lg },
  bubbleMine: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginRight: space.xl,
  },
  bubbleClinic: {
    backgroundColor: colors.primarySoft,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    marginLeft: space.xl,
  },
  bubbleHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMine: { backgroundColor: colors.primarySoft },
  avatarClinic: { backgroundColor: colors.primary },
  waiting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    marginLeft: space.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.warningSoft,
  },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 44 },
  timeline: { marginTop: space.md },
  timelineRow: { flexDirection: 'row', gap: space.md },
  rail: { width: 12, alignItems: 'center' },
  railDot: {
    width: 10,
    height: 10,
    marginTop: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  railLine: { flex: 1, width: 2, marginTop: space.xxs, backgroundColor: colors.border },
  timelineBody: { gap: space.xs, paddingBottom: space.md, alignItems: 'flex-start' },
});
