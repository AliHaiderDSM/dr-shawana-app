import { Tabs } from 'expo-router';
import { House, UserRound, Users } from 'lucide-react-native';
import { MessagesTabButton } from '@/components/navigation/messages-tab-button';
import { colors, fontSize } from '@/theme/tokens';
import { useGetDoctorHomeQuery } from '@/redux/features/doctor';

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
          tabBarButton: (props) => (
            <MessagesTabButton
              onPress={() => props.onPress?.(undefined as never)}
              focused={Boolean(props['aria-selected'])}
              unread={unread}
              hint="Chat with your patients"
            />
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
