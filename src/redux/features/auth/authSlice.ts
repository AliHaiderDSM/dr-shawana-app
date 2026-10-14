import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type AuthStatus = 'restoring' | 'unreachable' | 'signedOut' | 'signedIn';

interface AuthState {
  status: AuthStatus;
  accessToken: string | null;
  notice: string | null;
}

const initialState: AuthState = { status: 'restoring', accessToken: null, notice: null };

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    signedIn(state, action: PayloadAction<{ accessToken: string }>) {
      state.status = 'signedIn';
      state.accessToken = action.payload.accessToken;
      state.notice = null;
    },
    tokenRefreshed(state, action: PayloadAction<{ accessToken: string }>) {
      state.accessToken = action.payload.accessToken;
    },
    signedOut(state, action: PayloadAction<{ notice?: string } | undefined>) {
      state.status = 'signedOut';
      state.accessToken = null;
      state.notice = action.payload?.notice ?? null;
    },
    unreachable(state) {
      state.status = 'unreachable';
    },
    restoring(state) {
      state.status = 'restoring';
    },
    noticeSeen(state) {
      state.notice = null;
    },
  },
});

export const { signedIn, tokenRefreshed, signedOut, unreachable, restoring, noticeSeen } = authSlice.actions;
export const authReducer = authSlice.reducer;
