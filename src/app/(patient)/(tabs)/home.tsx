import { router, type Href } from 'expo-router';
import {
  ChevronRight,
  CalendarDays,
  CalendarPlus,
  FileText,
  History,
  MessageSquarePlus,
  Pill,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppointmentCard, PrescriptionCard } from '@/components/medical/cards';
import { CardSkeleton, EmptyState, ErrorState, SkeletonBlock } from '@/components/feedback/states';
import { AppText } from '@/components/ui/app-text';
import { Notice, SectionHeader } from '@/components/ui/bits';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { WhatsAppIcon } from '@/components/ui/whatsapp-icon';
import { useRefresh } from '@/hooks/use-refresh';
import { firstName, greeting, initials } from '@/lib/format';
import { colors, icon, radius, space, touch } from '@/theme/tokens';
import { useGetChatUnreadQuery } from '@/redux/features/chat';
import { useGetOverviewQuery } from '@/redux/features/patient';

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

function Stat({ label, value, onPress }: { label: string; value: number | undefined; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value ?? 'loading'}`}
      onPress={onPress}
      style={({ pressed }) => [styles.stat, pressed && styles.statPressed]}
    >
      <AppText variant="heading" style={styles.heroText}>
        {value ?? '–'}
      </AppText>
      <AppText variant="caption" numberOfLines={1} style={styles.heroMuted}>
        {label}
      </AppText>
    </Pressable>
  );
}

export default function HomeScreen() {
  const overview = useGetOverviewQuery();
  const unread = useGetChatUnreadQuery(undefined, { pollingInterval: 30_000 }).data?.unread ?? 0;
  const { refreshing, onRefresh } = useRefresh(overview.refetch);
  const o = overview.data;
  const isNew = o ? o.counts.appointments === 0 && o.counts.prescriptions === 0 : false;

  return (
    <Screen edges={['top', 'left', 'right']} refreshing={refreshing} onRefresh={onRefresh}>
      <View style={styles.hero}>
        <View style={[styles.ring, styles.ringLarge]} />
        <View style={[styles.ring, styles.ringSmall]} />
        <View style={styles.heroTop}>
          <View style={styles.flex}>
            <AppText variant="label" style={styles.heroMuted}>
              {greeting()},
            </AppText>
            {o ? (
              <AppText variant="title" numberOfLines={2} accessibilityRole="header" style={styles.heroText}>
                {firstName(o.patient.name)}
              </AppText>
            ) : (
              <SkeletonBlock width="50%" height={28} />
            )}
            <View style={styles.brandRow}>
              <ShieldCheck size={icon.sm} color={colors.textInverseMuted} />
              <AppText variant="caption" style={styles.heroMuted}>
                DSM Clinic · Your health, in one place
              </AppText>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open your profile"
            onPress={() => router.push('/profile')}
            hitSlop={4}
            style={styles.heroAvatar}
          >
            <AppText weight="bold" style={styles.heroText}>
              {o ? initials(o.patient.name) : ''}
            </AppText>
          </Pressable>
        </View>

        <View style={styles.stats}>
          <Stat label="Visits" value={o?.counts.appointments} onPress={() => router.push('/history')} />
          <Stat label="Prescriptions" value={o?.counts.prescriptions} onPress={() => router.push('/prescriptions')} />
          <Stat label="New messages" value={o ? unread : undefined} onPress={() => router.push('/chats')} />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={unread > 0 ? `Read ${unread} new messages from your doctor` : 'Message your doctor'}
          onPress={() => router.push('/chats')}
          style={({ pressed }) => [styles.heroCta, pressed && styles.heroCtaPressed]}
        >
          <View style={styles.heroCtaIcon}>
            <WhatsAppIcon size={22} color={colors.textInverse} />
          </View>
          <View style={styles.flex}>
            <AppText weight="semibold">{unread > 0 ? 'You have new messages' : 'Message your doctor'}</AppText>
            <AppText variant="caption" tone="muted" numberOfLines={1}>
              Ask questions and send photos of your reports
            </AppText>
          </View>
          <ChevronRight size={icon.md} color={colors.primary} />
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
            <AppText weight="semibold">Need help from the clinic?</AppText>
            <AppText tone="muted" variant="label">
              Ask about appointments, prescriptions, orders or billing. The team replies in the app.
            </AppText>
            <Button
              label="Ask Dr. Shawana"
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
  hero: {
    marginTop: space.sm,
    padding: space.lg,
    gap: space.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    overflow: 'hidden',
  },
  ring: { position: 'absolute', borderRadius: radius.pill, backgroundColor: colors.heroAccent },
  ringLarge: { width: 220, height: 220, top: -90, right: -70 },
  ringSmall: { width: 120, height: 120, bottom: -50, left: -40 },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  heroText: { color: colors.textInverse },
  heroMuted: { color: colors.textInverseMuted },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: space.xs },
  heroAvatar: {
    width: touch.iconButton + 4,
    height: touch.iconButton + 4,
    borderRadius: radius.pill,
    backgroundColor: colors.onPrimarySoft,
    borderWidth: 2,
    borderColor: colors.textInverseMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: { flexDirection: 'row', gap: space.sm },
  stat: {
    flex: 1,
    minWidth: 0,
    paddingVertical: space.sm,
    paddingHorizontal: space.sm,
    borderRadius: radius.md,
    backgroundColor: colors.onPrimarySoft,
    gap: space.xxs,
  },
  statPressed: { opacity: 0.8 },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    minHeight: touch.iconButton,
  },
  heroCtaPressed: { backgroundColor: colors.surfaceMuted },
  heroCtaIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.whatsapp,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
