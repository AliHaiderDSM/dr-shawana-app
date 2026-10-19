import { router } from 'expo-router';
import { MessageCircle, Search, Users } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { openChatWith } from '@/components/doctor/open-chat';
import { Initials, UnreadBadge } from '@/components/doctor/parts';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/feedback/states';
import { AppText } from '@/components/ui/app-text';
import { useRefresh } from '@/hooks/use-refresh';
import { formatDate, initials } from '@/lib/format';
import { colors, fontSize, icon, maxFontScale, radius, shadow, space, touch } from '@/theme/tokens';
import {
  type DoctorPatient,
  useGetDoctorPatientsQuery,
  useOpenDoctorChatMutation,
} from '@/redux/features/doctor';

function PatientCard({
  patient,
  opening,
  onMessage,
}: {
  patient: DoctorPatient;
  opening: boolean;
  onMessage: () => void;
}) {
  const sub = [
    patient.phone,
    patient.city,
    patient.nextVisit
      ? `Next ${formatDate(patient.nextVisit)}`
      : patient.lastVisit
        ? `Last ${formatDate(patient.lastVisit)}`
        : null,
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${patient.name}, open patient file`}
        onPress={() =>
          router.push({ pathname: '/doctor/patient/[patientId]', params: { patientId: patient.id } })
        }
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
      >
        <Initials text={initials(patient.name)} tone="soft" />
        <View style={styles.flex}>
          <AppText weight="semibold" numberOfLines={1}>
            {patient.name}
          </AppText>
          <AppText variant="caption" tone="muted" numberOfLines={1}>
            {sub}
          </AppText>
          <AppText variant="caption" tone="primary" weight="semibold">
            {patient.visits} {patient.visits === 1 ? 'visit' : 'visits'}
          </AppText>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Message ${patient.name}`}
        onPress={onMessage}
        disabled={opening}
        hitSlop={6}
        style={styles.message}
      >
        {opening ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <MessageCircle size={icon.md} color={colors.primary} />
        )}
        <View style={styles.badge}>
          <UnreadBadge count={patient.unread} />
        </View>
      </Pressable>
    </View>
  );
}

export default function DoctorPatientsScreen() {
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setSearch(input.trim()), 300);
    return () => clearTimeout(timer);
  }, [input]);
  const patients = useGetDoctorPatientsQuery(search);
  const [openChat] = useOpenDoctorChatMutation();
  const [openingId, setOpeningId] = useState<string | null>(null);
  const { refreshing, onRefresh } = useRefresh(patients.refetch);

  const message = (patient: DoctorPatient) => {
    setOpeningId(patient.id);
    void openChatWith(patient, (id) => openChat(id).unwrap()).finally(() => setOpeningId(null));
  };

  return (
    <View style={styles.root}>
      <View style={styles.searchWrap}>
        <Search size={icon.md} color={colors.textMuted} />
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Search by name or phone"
          placeholderTextColor={colors.textMuted}
          maxFontSizeMultiplier={maxFontScale}
          accessibilityLabel="Search patients"
          autoCorrect={false}
          style={styles.search}
        />
      </View>
      {patients.isLoading ? (
        <View style={styles.pad}>
          <CardSkeleton count={4} />
        </View>
      ) : patients.isError && !patients.data ? (
        <View style={styles.pad}>
          <ErrorState error={patients.error} onRetry={patients.refetch} retrying={patients.isFetching} />
        </View>
      ) : (
        <FlatList
          data={patients.data ?? []}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={onRefresh}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <PatientCard patient={item} opening={openingId === item.id} onMessage={() => message(item)} />
          )}
          ListEmptyComponent={
            <EmptyState
              icon={Users}
              title={search ? 'No patient found' : 'No patients yet'}
              message={
                search
                  ? 'Try another name or phone number.'
                  : 'Patients you see in any branch appear here after their first appointment.'
              }
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  pad: { padding: space.lg },
  flex: { flex: 1, minWidth: 0, gap: space.xxs },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginHorizontal: space.lg,
    marginTop: space.sm,
    marginBottom: space.xs,
    paddingHorizontal: space.md,
    minHeight: touch.minHeight,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  search: { flex: 1, fontSize: fontSize.md, color: colors.text, paddingVertical: space.sm },
  list: { padding: space.lg, gap: space.md, flexGrow: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow,
  },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md },
  pressed: { backgroundColor: colors.surfaceMuted },
  message: {
    width: touch.minHeight + 8,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.border,
  },
  badge: { position: 'absolute', top: 8, right: 6 },
});
