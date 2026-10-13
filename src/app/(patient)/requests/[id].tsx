import { useLocalSearchParams } from 'expo-router';
import { Building2, CalendarDays, MessageCircleReply, Tag } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { CardSkeleton, ErrorState } from '@/components/feedback/states';
import { AppText } from '@/components/ui/app-text';
import { InfoRow, SectionHeader } from '@/components/ui/bits';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { StatusBadge } from '@/components/ui/status-badge';
import { useRefresh } from '@/hooks/use-refresh';
import { formatDateTime } from '@/lib/format';
import { REQUEST_CATEGORY_LABELS, REQUEST_STATUS } from '@/lib/labels';
import { useRequestQuery } from '@/services/api/patient-api';
import { colors, radius, space } from '@/theme/tokens';

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const request = useRequestQuery(id ?? '', { skip: !id, pollingInterval: 60_000 });
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
          <AppText variant="label" tone="muted" selectable style={styles.flex}>
            {r.requestNo}
          </AppText>
          <StatusBadge label={status.label} tone={status.tone} icon={status.icon} />
        </View>
        <AppText variant="subheading" accessibilityRole="header">
          {r.subject}
        </AppText>
        <InfoRow icon={Tag} label="Category" value={REQUEST_CATEGORY_LABELS[r.category]} />
        <InfoRow icon={CalendarDays} label="Sent" value={formatDateTime(r.createdAt)} />
        <InfoRow icon={Building2} label="Branch" value={r.branch.name} />
      </Card>

      <SectionHeader title="Your message" />
      <Card>
        <AppText selectable>{r.message}</AppText>
      </Card>

      <SectionHeader title="Clinic reply" />
      {r.reply ? (
        <View style={styles.reply}>
          <View style={styles.row}>
            <MessageCircleReply size={18} color={colors.primary} />
            <AppText variant="caption" tone="muted">
              {formatDateTime(r.repliedAt)}
            </AppText>
          </View>
          <AppText selectable>{r.reply}</AppText>
        </View>
      ) : (
        <Card>
          <AppText tone="muted">No reply yet. You will see it here when the clinic answers.</AppText>
        </Card>
      )}

      {r.history?.length ? (
        <>
          <SectionHeader title="Status history" />
          <Card>
            {r.history.map((h, index) => {
              const look = REQUEST_STATUS[h.status];
              return (
                <View key={`${h.at}-${index}`} style={[styles.historyRow, index > 0 && styles.historyBorder]}>
                  <StatusBadge label={look.label} tone={look.tone} icon={look.icon} />
                  <AppText variant="caption" tone="muted" style={styles.flex}>
                    {formatDateTime(h.at)} · {h.byPatient ? 'You' : 'Clinic'}
                  </AppText>
                </View>
              );
            })}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  reply: {
    gap: space.sm,
    padding: space.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.sm,
    flexWrap: 'wrap',
  },
  historyBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
});
