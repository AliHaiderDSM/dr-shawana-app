import { RealtimeClient } from '@supabase/realtime-js';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { chatArrived, useGetChatRealtimeQuery } from '@/redux/features/chat';
import { useAppDispatch } from '@/redux/hooks';

export function useChatRealtime() {
  const dispatch = useAppDispatch();
  const config = useGetChatRealtimeQuery().data;

  useEffect(() => {
    if (!config) return;
    const client = new RealtimeClient(`${config.url}/realtime/v1`, {
      params: { apikey: config.key, eventsPerSecond: 5 },
    });
    const channel = client
      .channel(config.topic)
      .on('broadcast', { event: 'message' }, ({ payload }) => {
        const doctorId = typeof payload?.doctorId === 'string' ? payload.doctorId : undefined;
        dispatch(chatArrived(doctorId));
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') dispatch(chatArrived());
      });
    return () => {
      void client.removeChannel(channel);
      client.disconnect();
    };
  }, [config, dispatch]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') dispatch(chatArrived());
    });
    return () => subscription.remove();
  }, [dispatch]);
}
