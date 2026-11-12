import { router } from 'expo-router';
import { ChevronRight, Search, Users } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Initials } from '@/components/doctor/parts';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/feedback/states';
import { AppText } from '@/components/ui/app-text';
import { useRefresh } from '@/hooks/use-refresh';
import { initials } from '@/lib/format';
import { colors, fontSize, icon, maxFontScale, radius, shadow, space, touch } from '@/theme/tokens';
import { type DoctorPatient, useGetDoctorPatientsQuery } from '@/redux/features/doctor';

function PatientRow({ patient }: { patient: DoctorPatient }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${patient.name}, show medicines`}
      onPress={() =>
        router.push({
          pathname: '/doctor/medicines/[patientId]',
          params: { patientId: patient.id, name: patient.name },
        })
      }
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Initials text={initials(patient.name)} tone="soft" />
      <View style={styles.flex}>
        <AppText weight="semibold" numberOfLines={1}>
          {patient.name}
        </AppText>
        <AppText variant="caption" tone="muted" numberOfLines={1}>
          {[patient.phone, patient.city].filter(Boolean).join(' · ')}
        </AppText>
      </View>
      <ChevronRight size={icon.md} color={colors.textMuted} />
    </Pressable>
  );
}

export default function DoctorMedicinesPickScreen() {
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setSearch(input.trim()), 300);
    return () => clearTimeout(timer);
  }, [input]);
  const patients = useGetDoctorPatientsQuery(search);
  const { refreshing, onRefresh } = useRefresh(patients.refetch);

  return (
    <View style={styles.root}>
      <View style={styles.searchWrap}>
        <Search size={icon.md} color={colors.textMuted} />
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Search patient by name or phone"
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
          ListHeaderComponent={
            <AppText variant="label" tone="muted">
              Choose a patient to see the medicines and supplements from every prescription.
            </AppText>
          }
          renderItem={({ item }) => <PatientRow patient={item} />}
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
    gap: space.md,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow,
  },
  pressed: { backgroundColor: colors.surfaceMuted },
});
