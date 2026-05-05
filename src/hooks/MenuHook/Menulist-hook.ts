// import React, { useEffect, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import {
//   fetchMenulistThunkAPI,
//   menuListDataFromStore,
// } from '../../store/slices/general_slices/menu-list-slice';
// // import {
// //   SelectedFilterLangDataFromStore,
// //   SelectedLangData,
// // } from '../../store/slices/general_slices/selected-multilanguage-slice';
// // import { get_access_token } from '../../store/slices/auth/token-login-slice';

// const useMenuListHook = () => {
//   const dispatch = useDispatch();
//   const MenuListFromStore = useSelector(menuListDataFromStore);


//   // console.log("MultiLanguageFromStore hoooook", MultiLanguageFromStore);
//   const [menuLisgData, SetMenuLisgData] = useState<any>([]);
  
  

//   // useEffect(() => {
//   //   dispatch(fetchMultiLanguagesThunkAPI(TokenFromStore?.token) as any);
//   // }, []);
//   useEffect(() => {
//     dispatch(fetchMenulistThunkAPI() as any);
//   });

//   useEffect(() => {
//     console.log("check data of server obj - hook1", menuListDataFromStore);
//     // if ((MultiLanguageFromStore)?.length > 0) {
      
//       // SetMenuLisgData(menuListDataFromStore?.menuData);
//     // }
//   }, [MenuListFromStore]);

  
//   console.log(
//     "menuLisgData hoooook",
//     menuLisgData
//   );

//   return {
//     menuLisgData,
//   };
// };

// export default useMenuListHook;
