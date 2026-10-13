import { useState } from 'react';

export function useRefresh(...refetchers: (() => unknown)[]) {
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all(refetchers.map((refetch) => Promise.resolve(refetch())));
    } finally {
      setRefreshing(false);
    }
  };
  return { refreshing, onRefresh };
}
