import { Tabs } from 'expo-router';
import { History, House, Pill, UserRound } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { WhatsAppIcon } from '@/components/ui/whatsapp-icon';
import { colors, fontSize, radius, shadow, space } from '@/theme/tokens';
import { useGetChatUnreadQuery } from '@/redux/features/chat';

function MessagesButton({
  onPress,
  focused,
  unread,
}: {
  onPress?: () => void;
  focused: boolean;
  unread: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={unread > 0 ? `Messages, ${unread} new` : 'Messages'}
      accessibilityHint="Chat with your doctor"
      accessibilityState={{ selected: focused }}
      style={styles.centerWrap}
    >
      {({ pressed }) => (
        <>
          <View style={[styles.center, pressed && styles.centerPressed]}>
            <WhatsAppIcon size={28} color={colors.textInverse} />
            {unread > 0 ? (
              <View style={styles.badge}>
                <AppText variant="caption" weight="bold" style={styles.badgeText}>
                  {unread > 99 ? '99+' : unread}
                </AppText>
              </View>
            ) : null}
          </View>
          <AppText variant="caption" weight="semibold" tone={focused ? 'primary' : 'muted'} numberOfLines={1}>
            Messages
          </AppText>
        </>
      )}
    </Pressable>
  );
}

export default function TabsLayout() {
  const unread = useGetChatUnreadQuery().data?.unread ?? 0;
  return (
    <Tabs
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { color: colors.text },
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: fontSize.xs, fontWeight: '600' },
        tabBarAllowFontScaling: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, minHeight: 60 },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <House color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Medical History',
          tabBarLabel: 'History',
          tabBarIcon: ({ color, size }) => <History color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Messages',
          tabBarButton: (props) => (
            <MessagesButton
              onPress={() => props.onPress?.(undefined as never)}
              focused={Boolean(props['aria-selected'])}
              unread={unread}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="prescriptions"
        options={{
          title: 'Prescriptions',
          tabBarIcon: ({ color, size }) => <Pill color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: space.xs, gap: 2 },
  center: {
    width: 54,
    height: 54,
    marginTop: -20,
    borderRadius: radius.pill,
    backgroundColor: colors.whatsapp,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.surface,
    ...shadow,
  },
  centerPressed: { backgroundColor: colors.whatsappPressed },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.danger,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.textInverse, fontSize: 10, lineHeight: 12 },
});
