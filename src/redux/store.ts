import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { AppState } from 'react-native';
import { baseApi } from './api/baseApi';
import { registerNetworkActions } from './api/network';
import { authReducer } from './features/auth/authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefault) => getDefault().concat(baseApi.middleware),
});

setupListeners(store.dispatch, (dispatch, actions) => {
  registerNetworkActions(actions);
  const subscription = AppState.addEventListener('change', (state) => {
    if (state === 'active') dispatch(actions.onFocus());
    else dispatch(actions.onFocusLost());
  });
  return () => subscription.remove();
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
