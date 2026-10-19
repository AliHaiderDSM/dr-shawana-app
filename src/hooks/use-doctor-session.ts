import { RealtimeClient } from '@supabase/realtime-js';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { onNotificationTap, pushToken } from '@/lib/push-notifications';
import { useAppDispatch } from '@/redux/hooks';
import {
  doctorChatArrived,
  useGetDoctorRealtimeQuery,
  useSaveDoctorPushTokenMutation,
} from '@/redux/features/doctor';

export function useDoctorSession() {
  const dispatch = useAppDispatch();
  const config = useGetDoctorRealtimeQuery().data;
  const [savePushToken] = useSaveDoctorPushTokenMutation();

  useEffect(() => {
    if (!config) return;
    let joined = false;
    const client = new RealtimeClient(`${config.url}/realtime/v1`, {
      params: { apikey: config.key, eventsPerSecond: 5 },
    });
    const channel = client
      .channel(config.topic)
      .on('broadcast', { event: 'message' }, ({ payload }) => {
        const conversationId =
          typeof payload?.conversationId === 'string' ? payload.conversationId : undefined;
        dispatch(doctorChatArrived(conversationId));
      })
      .subscribe((status) => {
        if (status !== 'SUBSCRIBED') return;
        if (joined) dispatch(doctorChatArrived());
        joined = true;
      });
    return () => {
      void client.removeChannel(channel);
      client.disconnect();
    };
  }, [config, dispatch]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') dispatch(doctorChatArrived());
    });
    return () => subscription.remove();
  }, [dispatch]);

  useEffect(() => {
    let active = true;
    void pushToken().then((token) => {
      if (active && token) void savePushToken({ token, platform: Platform.OS });
    });
    return () => {
      active = false;
    };
  }, [savePushToken]);

  useEffect(
    () =>
      onNotificationTap((data) => {
        if (data.type !== 'doctor_chat' || typeof data.conversationId !== 'string') return;
        router.push({
          pathname: '/doctor/chat/[conversationId]',
          params: {
            conversationId: data.conversationId,
            patientId: typeof data.patientId === 'string' ? data.patientId : '',
          },
        });
      }),
    [],
  );
}
