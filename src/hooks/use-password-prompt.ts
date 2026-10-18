import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useGetMeQuery } from '@/redux/features/patient';

export function usePasswordPrompt() {
  const me = useGetMeQuery();
  const asked = useRef(false);
  const missing = me.data ? !me.data.hasPassword : false;

  useEffect(() => {
    if (!missing || asked.current) return;
    asked.current = true;
    router.push({ pathname: '/password', params: { first: '1' } });
  }, [missing]);
}
