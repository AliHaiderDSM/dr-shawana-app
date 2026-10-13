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
