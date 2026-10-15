import { router } from 'expo-router';
import { MessagesSquare } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { EmptyState } from '@/components/feedback/states';
import { AppText } from '@/components/ui/app-text';
import { Avatar, Notice } from '@/components/ui/bits';
import { Card } from '@/components/ui/card';
import { ListScreen } from '@/components/ui/list-screen';
import { useRefresh } from '@/hooks/use-refresh';
import { formatDate, initials } from '@/lib/format';
import { colors, radius, space } from '@/theme/tokens';
import { useGetChatDoctorsQuery } from '@/redux/features/chat';

export default function ChatsScreen() {
  const doctors = useGetChatDoctorsQuery(undefined, { refetchOnMountOrArgChange: true });
  const { refreshing, onRefresh } = useRefresh(doctors.refetch);

  return (
    <ListScreen
      data={doctors.data}
      keyExtractor={(d) => d.doctorId}
      isLoading={doctors.isLoading}
      error={doctors.error}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onRetry={doctors.refetch}
      header={
        <Notice>
          Message the doctors who saw you. Not for emergencies: if you feel very unwell, go to the nearest
          hospital.
        </Notice>
      }
      renderItem={({ item }) => (
        <Card
          onPress={() =>
            router.push({
              pathname: '/chats/[doctorId]',
              params: { doctorId: item.doctorId, name: item.name },
            })
          }
          chevron
          accessibilityLabel={`Chat with ${item.name}${item.unread ? `, ${item.unread} new` : ''}`}
        >
          <View style={styles.row}>
            <Avatar text={initials(item.name)} size={44} />
            <View style={styles.flex}>
              <View style={styles.row}>
                <AppText weight="semibold" style={styles.flex} numberOfLines={1}>
                  {item.name}
                </AppText>
                {item.lastMessageAt ? (
                  <AppText variant="caption" tone="muted">
                    {formatDate(item.lastMessageAt)}
                  </AppText>
                ) : null}
              </View>
              <View style={styles.row}>
                <AppText variant="label" tone="muted" style={styles.flex} numberOfLines={1}>
                  {item.lastMessage ??
                    (item.lastVisit ? `Last visit ${formatDate(item.lastVisit)}` : 'Start a chat')}
                </AppText>
                {item.unread ? (
                  <View style={styles.badge}>
                    <AppText variant="caption" weight="bold" style={styles.badgeText}>
                      {item.unread > 99 ? '99+' : item.unread}
                    </AppText>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        </Card>
      )}
      empty={
        <EmptyState
          icon={MessagesSquare}
          title="No doctors yet"
          message="After your first appointment you can message your doctor here."
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  flex: { flex: 1, minWidth: 0 },
  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: space.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.textInverse },
});
