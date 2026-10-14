import { router, type Href } from 'expo-router';
import {
  MessagesSquare,
  CalendarDays,
  CalendarPlus,
  FileText,
  History,
  MessageSquarePlus,
  Pill,
  Sparkles,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppointmentCard, PrescriptionCard } from '@/components/medical/cards';
import { CardSkeleton, EmptyState, ErrorState, SkeletonBlock } from '@/components/feedback/states';
import { AppText } from '@/components/ui/app-text';
import { Avatar, Notice, SectionHeader } from '@/components/ui/bits';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { useRefresh } from '@/hooks/use-refresh';
import { firstName, greeting, initials } from '@/lib/format';
import { useChatUnreadQuery, useOverviewQuery } from '@/services/api/patient-api';
import { colors, icon, radius, space, touch } from '@/theme/tokens';

const QUICK: { label: string; icon: LucideIcon; href: Href }[] = [
  { label: 'Medical History', icon: History, href: '/history' },
  { label: 'Prescriptions', icon: Pill, href: '/prescriptions' },
  { label: 'Documents', icon: FileText, href: '/documents' },
  { label: 'Appointments', icon: CalendarDays, href: '/appointments' },
];

function QuickTile({ label, icon: Icon, href }: (typeof QUICK)[number]) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => router.push(href)}
      style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
    >
      <View style={styles.tileIcon}>
        <Icon size={icon.lg} color={colors.primary} />
      </View>
      <AppText variant="label" weight="semibold" numberOfLines={2}>
        {label}
      </AppText>
    </Pressable>
  );
}

export default function HomeScreen() {
  const overview = useOverviewQuery();
  const unread = useChatUnreadQuery(undefined, { pollingInterval: 30_000 }).data?.unread ?? 0;
  const { refreshing, onRefresh } = useRefresh(overview.refetch);
  const o = overview.data;
  const isNew = o ? o.counts.appointments === 0 && o.counts.prescriptions === 0 : false;

  return (
    <Screen edges={['top', 'left', 'right']} refreshing={refreshing} onRefresh={onRefresh}>
      <View style={styles.header}>
        <View style={styles.flex}>
          <AppText tone="muted">{greeting()},</AppText>
          {o ? (
            <AppText variant="title" numberOfLines={2} accessibilityRole="header">
              {firstName(o.patient.name)}
            </AppText>
          ) : (
            <SkeletonBlock width="50%" height={28} />
          )}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open your profile"
          onPress={() => router.push('/profile')}
          hitSlop={4}
        >
          <Avatar text={o ? initials(o.patient.name) : ''} />
        </Pressable>
      </View>

      {overview.isLoading ? (
        <CardSkeleton count={3} />
      ) : overview.isError || !o ? (
        <ErrorState error={overview.error} onRetry={overview.refetch} retrying={overview.isFetching} />
      ) : (
        <>
          {o.openRequests > 0 ? (
            <Pressable accessibilityRole="button" onPress={() => router.push('/requests')}>
              <Notice>
                {`You have ${o.openRequests} open request${o.openRequests === 1 ? '' : 's'} with the clinic. Tap to see the status.`}
              </Notice>
            </Pressable>
          ) : null}

          <SectionHeader
            title="Next appointment"
            actionLabel={o.upcomingCount > 1 ? `All ${o.upcomingCount}` : undefined}
            onAction={() => router.push('/appointments')}
          />
          {o.nextAppointment ? (
            <AppointmentCard
              appointment={o.nextAppointment}
              onPress={() => router.push(`/appointments/${o.nextAppointment!.id}`)}
            />
          ) : (
            <Card>
              <AppText weight="semibold">No upcoming appointment</AppText>
              <AppText tone="muted" variant="label">
                To book or change a visit, send a request to the clinic.
              </AppText>
              <Button
                label="Ask for an appointment"
                icon={CalendarPlus}
                variant="secondary"
                onPress={() => router.push({ pathname: '/contact', params: { category: 'appointment' } })}
              />
            </Card>
          )}

          <SectionHeader title="Quick access" />
          <View style={styles.grid}>
            {QUICK.map((q) => (
              <QuickTile key={q.label} {...q} />
            ))}
          </View>

          {isNew ? (
            <EmptyState
              icon={Sparkles}
              title="Welcome to DSM Clinic"
              message="Your visits, prescriptions and reports will appear here after your first appointment."
            />
          ) : null}

          {o.latestPrescription ? (
            <>
              <SectionHeader
                title="Latest prescription"
                actionLabel="See all"
                onAction={() => router.push('/prescriptions')}
              />
              <PrescriptionCard
                prescription={o.latestPrescription}
                onPress={() => router.push(`/prescriptions/${o.latestPrescription!.id}`)}
              />
            </>
          ) : null}

          {o.recentVisits.length ? (
            <>
              <SectionHeader
                title="Recent visits"
                actionLabel="History"
                onAction={() => router.push('/history')}
              />
              <View style={styles.list}>
                {o.recentVisits.map((visit) => (
                  <AppointmentCard
                    key={visit.id}
                    appointment={visit}
                    onPress={() => router.push(`/appointments/${visit.id}`)}
                  />
                ))}
              </View>
            </>
          ) : null}

          <Card>
            <AppText weight="semibold">Chat with your doctor</AppText>
            <AppText tone="muted" variant="label">
              {unread > 0
                ? `You have ${unread} new message${unread === 1 ? '' : 's'} from your doctor.`
                : 'Ask the doctors who saw you, and send photos of your reports.'}
            </AppText>
            <Button
              label={unread > 0 ? 'Read messages' : 'Open messages'}
              icon={MessagesSquare}
              onPress={() => router.push('/chats')}
            />
          </Card>

          <Card>
            <AppText weight="semibold">Need help from the clinic?</AppText>
            <AppText tone="muted" variant="label">
              Ask about appointments, prescriptions, orders or billing. The team replies in the app.
            </AppText>
            <Button
              label="Contact the clinic"
              icon={MessageSquarePlus}
              onPress={() => router.push('/contact')}
            />
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0, gap: space.xs },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingTop: space.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  tile: {
    flexGrow: 1,
    flexBasis: '45%',
    minHeight: 96,
    padding: space.md,
    gap: space.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    justifyContent: 'space-between',
  },
  tilePressed: { backgroundColor: colors.surfaceMuted },
  tileIcon: {
    width: touch.iconButton,
    height: touch.iconButton,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { gap: space.md },
});
