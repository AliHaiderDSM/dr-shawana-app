import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

type NotificationsModule = typeof import('expo-notifications');

export const MESSAGES_CHANNEL = 'messages';

const unsupported =
  Platform.OS === 'web' ||
  (Platform.OS === 'android' && Constants.executionEnvironment === ExecutionEnvironment.StoreClient);

let loading: Promise<NotificationsModule | null> | null = null;

function notifications() {
  if (unsupported) return Promise.resolve(null);
  loading ??= import('expo-notifications')
    .then((module) => {
      module.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
      return module;
    })
    .catch(() => null);
  return loading;
}

function projectId(): string | null {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? null;
}

export async function pushToken(): Promise<string | null> {
  const id = projectId();
  if (!id) return null;
  const Notifications = await notifications();
  if (!Notifications) return null;
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(MESSAGES_CHANNEL, {
        name: 'Messages from your doctor',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
    const current = await Notifications.getPermissionsAsync();
    const status = current.granted ? current.status : (await Notifications.requestPermissionsAsync()).status;
    if (status !== 'granted') return null;
    return (await Notifications.getExpoPushTokenAsync({ projectId: id })).data;
  } catch {
    return null;
  }
}

export function onNotificationTap(handler: (data: Record<string, unknown>) => void) {
  let remove: (() => void) | null = null;
  let stopped = false;
  void notifications().then((Notifications) => {
    if (!Notifications || stopped) return;
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      handler((response.notification.request.content.data ?? {}) as Record<string, unknown>);
    });
    remove = () => subscription.remove();
  });
  return () => {
    stopped = true;
    remove?.();
  };
}
