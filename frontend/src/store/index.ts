import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import sessionReducer from './slices/sessionSlice';
import chatReducer from './slices/chatSlice';
import homeReducer from './slices/homeSlice';
import connectionReducer from './slices/connectionSlice';

const rootReducer = combineReducers({
  session: sessionReducer,
  chat: chatReducer,
  home: homeReducer,
  connection: connectionReducer,
});

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['session', 'chat'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
