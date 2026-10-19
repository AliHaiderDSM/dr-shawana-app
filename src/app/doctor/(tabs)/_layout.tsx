import { Tabs } from 'expo-router';
import { House, MessageCircle, UserRound, Users } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { colors, fontSize, radius } from '@/theme/tokens';
import { useGetDoctorHomeQuery } from '@/redux/features/doctor';

function WithBadge({ count, children }: { count: number; children: React.ReactNode }) {
  return (
    <View>
      {children}
      {count > 0 ? (
        <View style={styles.badge}>
          <AppText variant="caption" weight="bold" style={styles.badgeText}>
            {count > 99 ? '99+' : count}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

export default function DoctorTabsLayout() {
  const unread = useGetDoctorHomeQuery().data?.counts.unread ?? 0;
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
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <House color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="patients"
        options={{
          title: 'My patients',
          tabBarLabel: 'Patients',
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <WithBadge count={unread}>
              <MessageCircle color={color} size={size} />
            </WithBadge>
          ),
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
  badge: {
    position: 'absolute',
    top: -6,
    right: -12,
    minWidth: 18,
    height: 18,
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
