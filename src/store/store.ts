import rootReducer from './root-reducer';
import { configureStore } from '@reduxjs/toolkit';
import storage from 'redux-persist/lib/storage';
import { persistReducer, persistStore } from 'redux-persist';
// import thunk from 'redux-thunk';
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

export const makeStore = () => {
  return configureStore({
    reducer: persistedReducer,
    devTools: process.env.NODE_ENV !== 'production',
  middleware: [],
  })
}

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>
export const store = configureStore({
  reducer: persistedReducer,
  devTools: process.env.NODE_ENV !== 'production',
  middleware: [],
});

export const persistor = persistStore(store);

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
