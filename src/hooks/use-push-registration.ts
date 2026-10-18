import { router } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { onNotificationTap, pushToken } from '@/lib/push-notifications';
import { useSavePushTokenMutation } from '@/redux/features/chat';

export function usePushRegistration() {
  const [save] = useSavePushTokenMutation();

  useEffect(() => {
    let active = true;
    void pushToken().then((token) => {
      if (active && token) void save({ token, platform: Platform.OS });
    });
    return () => {
      active = false;
    };
  }, [save]);

  useEffect(
    () =>
      onNotificationTap((data) => {
        if (data.type !== 'chat') return;
        if (typeof data.doctorId === 'string') {
          router.push({ pathname: '/chats/[doctorId]', params: { doctorId: data.doctorId } });
        } else {
          router.push('/chats');
        }
      }),
    [],
  );
}
