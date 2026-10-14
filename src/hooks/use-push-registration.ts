import { router } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useSavePushTokenMutation } from '@/services/api/patient-api';
import { onNotificationTap, pushToken } from '@/services/notifications/push';

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
        if (data.type === 'chat') router.push('/chats');
      }),
    [],
  );
}
