const raw = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '') ?? '';

function resolveApiUrl() {
  if (!raw) {
    throw new Error('EXPO_PUBLIC_API_URL is not set. Copy .env.example to .env and set the backend URL.');
  }
  if (!__DEV__ && !raw.startsWith('https://')) {
    throw new Error('EXPO_PUBLIC_API_URL must use https:// in production builds.');
  }
  return raw;
}

export const API_URL = resolveApiUrl();

export const SERVER_ORIGIN = API_URL.replace(/^(https?:\/\/[^/]+).*$/, '$1');

const privacy = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL?.trim() ?? '';

export const PRIVACY_POLICY_URL = privacy.startsWith('https://') ? privacy : null;
