import { configureStore } from '@reduxjs/toolkit'

export const makeStore = () => {
  return configureStore({
    reducer: {},
  })
}

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>
// Infer the `RootState` and `AppDispatch` types from the store itself
// export type RootState = ReturnType<AppStore['getState']>
// export type AppDispatch = AppStore['dispatch']


export const store = configureStore({
    reducer: {
      // our reducers goes here
    },
  });
  export type AppDispatch = typeof store.dispatch;
  export type RootState = ReturnType<typeof store.getState>;