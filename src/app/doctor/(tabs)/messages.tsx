import { router } from 'expo-router';
import { MessageCircle } from 'lucide-react-native';
import { FlatList, StyleSheet, View } from 'react-native';
import { ChatRow } from '@/components/doctor/parts';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/feedback/states';
import { useRefresh } from '@/hooks/use-refresh';
import { colors, space } from '@/theme/tokens';
import { useGetDoctorPatientsQuery } from '@/redux/features/doctor';

export default function DoctorMessagesScreen() {
  const patients = useGetDoctorPatientsQuery('');
  const { refreshing, onRefresh } = useRefresh(patients.refetch);
  const chats = (patients.data ?? [])
    .filter((p) => p.conversationId && p.lastMessageAt)
    .sort((a, b) => (b.lastMessageAt ?? '').localeCompare(a.lastMessageAt ?? ''));

  if (patients.isLoading)
    return (
      <View style={styles.pad}>
        <CardSkeleton count={4} />
      </View>
    );
  if (patients.isError && !patients.data)
    return (
      <View style={styles.pad}>
        <ErrorState error={patients.error} onRetry={patients.refetch} retrying={patients.isFetching} />
      </View>
    );

  return (
    <FlatList
      style={styles.root}
      data={chats}
      keyExtractor={(p) => p.id}
      contentContainerStyle={styles.list}
      refreshing={refreshing}
      onRefresh={onRefresh}
      renderItem={({ item }) => (
        <ChatRow
          name={item.name}
          lastMessage={item.lastMessage}
          lastMessageAt={item.lastMessageAt}
          unread={item.unread}
          onPress={() =>
            router.push({
              pathname: '/doctor/chat/[conversationId]',
              params: { conversationId: item.conversationId!, patientId: item.id, name: item.name },
            })
          }
        />
      )}
      ListEmptyComponent={
        <EmptyState
          icon={MessageCircle}
          title="No conversations yet"
          message="Open My patients and tap the message icon to write to a patient."
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  pad: { flex: 1, padding: space.lg, backgroundColor: colors.background },
  list: { padding: space.lg, gap: space.md, flexGrow: 1 },
});
