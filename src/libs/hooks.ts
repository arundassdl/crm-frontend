import { TypedUseSelectorHook,useDispatch, useSelector, useStore } from 'react-redux'

import type { RootState, AppDispatch, AppStore } from '@/store/store'

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();

// export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
// export const useAppStore = useStore<AppStore>()

 