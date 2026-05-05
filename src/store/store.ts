import rootReducer from './root-reducer';
import { configureStore } from '@reduxjs/toolkit';
import createWebStorage from "redux-persist/lib/storage/createWebStorage";

const createNoopStorage = () => {
  return {
    getItem(_key: any) {
      return Promise.resolve(null);
    },
    setItem(_key: any, value: any) {
      return Promise.resolve(value);
    },
    removeItem(_key: any) {
      return Promise.resolve();
    },
  };
};

const storage = typeof window !== "undefined" ? createWebStorage("local") : createNoopStorage();
import { persistReducer, persistStore } from 'redux-persist';

import hardSet from 'redux-persist/es/stateReconciler/hardSet';
import storageSession from 'redux-persist/lib/storage/session'


const persistConfig = {
  key: 'root',
  storage,
  // stateReconciler: hardSet,
  whitelist: ['viewMode'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);
// console.log('persisted Reducer', persistedReducer);

/** `redux-persist` dispatches actions with non-serializable `register` / `rehydrate` fns. */
const middlewareConfig = {
  serializableCheck: {
    ignoredActions: [
      'persist/FLUSH',
      'persist/REHYDRATE',
      'persist/PAUSE',
      'persist/PERSIST',
      'persist/PURGE',
      'persist/REGISTER',
    ],
    ignoredActionPaths: ['register', 'rehydrate'],
  },
}

export const makeStore = () => {
  return configureStore({
    reducer: persistedReducer,
    devTools: process.env.NODE_ENV !== 'production',
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware(middlewareConfig),
  })
}

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>
export const store = configureStore({
  reducer: persistedReducer,
  devTools: process.env.NODE_ENV !== 'production',
  middleware: (getDefaultMiddleware) => getDefaultMiddleware(middlewareConfig),
});

export const persistor = persistStore(store);

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
