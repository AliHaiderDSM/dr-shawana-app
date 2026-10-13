import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { AppState } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { authReducer } from '@/features/auth/auth-slice';
import { api } from '@/services/api/base-api';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefault) => getDefault().concat(api.middleware),
});

setupListeners(store.dispatch, (dispatch, actions) => {
  const subscription = AppState.addEventListener('change', (state) => {
    if (state === 'active') dispatch(actions.onFocus());
    else dispatch(actions.onFocusLost());
  });
  return () => subscription.remove();
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
