import * as SecureStore from 'expo-secure-store';

export type AppRole = 'patient' | 'doctor';

const REFRESH_KEY = 'dsm.patient.refresh';
const ROLE_KEY = 'dsm.app.role';
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
  async getRole(): Promise<AppRole> {
    try {
      return (await SecureStore.getItemAsync(ROLE_KEY, OPTIONS)) === 'doctor' ? 'doctor' : 'patient';
    } catch {
      return 'patient';
    }
  },
  async setSession(token: string, role: AppRole) {
    await SecureStore.setItemAsync(REFRESH_KEY, token, OPTIONS);
    await SecureStore.setItemAsync(ROLE_KEY, role, OPTIONS);
  },
  async clear() {
    try {
      await SecureStore.deleteItemAsync(REFRESH_KEY, OPTIONS);
      await SecureStore.deleteItemAsync(ROLE_KEY, OPTIONS);
    } catch {
      return;
    }
  },
};
