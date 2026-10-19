import { Building2, LogOut, Stethoscope, Users } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Initials } from '@/components/doctor/parts';
import { CardSkeleton } from '@/components/feedback/states';
import { AppText } from '@/components/ui/app-text';
import { confirm, InfoRow, SectionHeader } from '@/components/ui/bits';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { initials } from '@/lib/format';
import { useAppDispatch } from '@/redux/hooks';
import { space } from '@/theme/tokens';
import { signOut } from '@/redux/features/auth';
import { useGetDoctorHomeQuery } from '@/redux/features/doctor';

export default function DoctorProfileScreen() {
  const dispatch = useAppDispatch();
  const home = useGetDoctorHomeQuery();
  const [leaving, setLeaving] = useState(false);
  const d = home.data?.doctor;

  const logout = () =>
    confirm({
      title: 'Log out?',
      message: 'You will stop getting patient message alerts on this phone.',
      confirmLabel: 'Log out',
      destructive: true,
      onConfirm: () => {
        setLeaving(true);
        void dispatch(signOut());
      },
    });

  return (
    <Screen>
      {!d ? (
        <CardSkeleton count={2} />
      ) : (
        <>
          <View style={styles.head}>
            <Initials text={initials(d.name.replace(/^dr\.?\s*/i, ''))} size={64} />
            <View style={styles.flex}>
              <AppText variant="heading" accessibilityRole="header">
                {d.name}
              </AppText>
              <AppText tone="muted">{d.details ?? 'Doctor'}</AppText>
            </View>
          </View>
          <Card>
            <InfoRow icon={Stethoscope} label="Role" value="Doctor" />
            <InfoRow icon={Building2} label="Branch" value={d.branch} />
            <InfoRow
              icon={Users}
              label="Patients"
              value={`${home.data?.counts.patients ?? 0} in every branch`}
            />
          </Card>
          <SectionHeader title="Account" />
          <AppText variant="label" tone="muted">
            Prescriptions and the full consultation form stay on the clinic dashboard. Here you chat with
            patients, read their records and write clinical remarks.
          </AppText>
          <Button label="Log out" icon={LogOut} variant="danger" loading={leaving} onPress={logout} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  flex: { flex: 1, minWidth: 0 },
});
