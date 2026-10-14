import { Tabs } from 'expo-router';
import { History, House, MessageSquarePlus, Pill, UserRound } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { useChatUnreadQuery } from '@/services/api/patient-api';
import { colors, fontSize, radius, shadow, space } from '@/theme/tokens';

function ContactButton({ onPress, focused }: { onPress?: () => void; focused: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Contact the clinic"
      accessibilityHint="Send a request to clinic management"
      accessibilityState={{ selected: focused }}
      style={styles.contactWrap}
    >
      {({ pressed }) => (
        <>
          <View style={[styles.contact, pressed && styles.contactPressed]}>
            <MessageSquarePlus size={24} color={colors.textInverse} />
          </View>
          <AppText variant="caption" weight="semibold" tone={focused ? 'primary' : 'muted'} numberOfLines={1}>
            Contact
          </AppText>
        </>
      )}
    </Pressable>
  );
}

export default function TabsLayout() {
  const unread = useChatUnreadQuery(undefined, { pollingInterval: 30_000 }).data?.unread ?? 0;
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
          tabBarBadge: unread > 0 ? (unread > 99 ? '99+' : unread) : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.danger, color: colors.textInverse },
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
        name="contact"
        options={{
          title: 'Contact the clinic',
          tabBarLabel: 'Contact',
          tabBarButton: (props) => (
            <ContactButton
              onPress={() => props.onPress?.(undefined as never)}
              focused={Boolean(props['aria-selected'])}
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
  contactWrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: space.xs, gap: 2 },
  contact: {
    width: 52,
    height: 52,
    marginTop: -18,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.surface,
    ...shadow,
  },
  contactPressed: { backgroundColor: colors.primaryPressed },
});
