import { router } from 'expo-router';
import {
  Building2,
  Cake,
  FileText,
  KeyRound,
  ListChecks,
  LogOut,
  MapPin,
  Pencil,
  Phone,
  UserRound,
} from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { CardSkeleton, ErrorState } from '@/components/feedback/states';
import { AppText } from '@/components/ui/app-text';
import { Avatar, confirm, InfoRow, SectionHeader } from '@/components/ui/bits';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { signOut } from '@/features/auth/auth-actions';
import { useRefresh } from '@/hooks/use-refresh';
import { formatDate, initials } from '@/lib/format';
import { useMeQuery } from '@/services/api/patient-api';
import { useAppDispatch } from '@/store';
import { space } from '@/theme/tokens';

export default function ProfileScreen() {
  const dispatch = useAppDispatch();
  const me = useMeQuery();
  const { refreshing, onRefresh } = useRefresh(me.refetch);
  const [leaving, setLeaving] = useState(false);
  const p = me.data;

  const logout = () =>
    confirm({
      title: 'Log out?',
      message: 'You will need your phone number and password to sign in again.',
      confirmLabel: 'Log out',
      destructive: true,
      onConfirm: () => {
        setLeaving(true);
        void dispatch(signOut());
      },
    });

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      {me.isLoading ? (
        <CardSkeleton count={2} />
      ) : !p ? (
        <ErrorState error={me.error} onRetry={me.refetch} retrying={me.isFetching} />
      ) : (
        <>
          <View style={styles.head}>
            <Avatar text={initials(p.name)} size={64} />
            <View style={styles.flex}>
              <AppText variant="heading" accessibilityRole="header">
                {p.name}
              </AppText>
              <AppText tone="muted">{p.phone}</AppText>
            </View>
          </View>

          <Card>
            <InfoRow icon={Phone} label="Phone" value={p.phone} />
            {p.age !== null ? <InfoRow icon={UserRound} label="Age" value={`${p.age} years`} /> : null}
            {p.dateOfBirth ? (
              <InfoRow icon={Cake} label="Date of birth" value={formatDate(p.dateOfBirth)} />
            ) : null}
            <InfoRow icon={MapPin} label="City" value={[p.city, p.country].filter(Boolean).join(', ')} />
          </Card>
          <Button
            label="Ask to correct my details"
            icon={Pencil}
            variant="secondary"
            onPress={() => router.push({ pathname: '/contact', params: { category: 'profile_correction' } })}
          />

          {p.clinic ? (
            <>
              <SectionHeader title="Clinic" />
              <Card>
                <InfoRow icon={Building2} label="Name" value={p.clinic.name} />
                {p.clinic.phone ? <InfoRow icon={Phone} label="Phone" value={p.clinic.phone} /> : null}
                {p.clinic.address ? <InfoRow icon={MapPin} label="Address" value={p.clinic.address} /> : null}
              </Card>
            </>
          ) : null}

          <SectionHeader title="Account" />
          <View style={styles.actions}>
            <Button
              label="My documents"
              icon={FileText}
              variant="secondary"
              onPress={() => router.push('/documents')}
            />
            <Button
              label="My requests"
              icon={ListChecks}
              variant="secondary"
              onPress={() => router.push('/requests')}
            />
            <Button
              label="Change password"
              icon={KeyRound}
              variant="secondary"
              onPress={() => router.push('/settings')}
            />
            <Button label="Log out" icon={LogOut} variant="danger" loading={leaving} onPress={logout} />
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  flex: { flex: 1, minWidth: 0 },
  actions: { gap: space.md },
});
