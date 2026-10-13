import * as SecureStore from 'expo-secure-store';

const REFRESH_KEY = 'dsm.patient.refresh';
const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export const sessionStorage = {
  async getRefreshToken() {
    try {
      return await SecureStore.getItemAsync(REFRESH_KEY, OPTIONS);
    } catch {
      return null;
    }
  },
  async setRefreshToken(token: string) {
    await SecureStore.setItemAsync(REFRESH_KEY, token, OPTIONS);
  },
  async clear() {
    try {
      await SecureStore.deleteItemAsync(REFRESH_KEY, OPTIONS);
    } catch {
      return;
    }
  },
};
