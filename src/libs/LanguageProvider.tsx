"use client";

// import "react-toastify/dist/ReactToastify.css";
//  import { ToastContainer } from "react-toastify";
// import { useEffect, useState } from "react";

//  interface ToastProviderProps {
//     children: React.ReactNode;
//   }
  
//   export default function ToastProvider({ children }: ToastProviderProps) {
//     const contextClass = {
//       success: "bg-blue-600",
//       error: "bg-red-600",
//       info: "bg-gray-600",
//       warning: "bg-orange-400",
//       default: "bg-indigo-600",
//       dark: "bg-white-600 font-gray-300",
//     };
//     const [isClient, setIsClient] = useState(false);

//     useEffect(() => {
//       setIsClient(true);
//     }, []);
  
//     if (!isClient) {
//       return null;
//     }
//     return (
//       <>        
//         <ToastContainer
//           toastClassName={
//             " relative flex p-1 min-h-10 rounded-md justify-between overflow-hidden cursor-pointer"
//           }
//           bodyClassName={() => "text-sm font-white font-med block p-3"}
//           position="top-right"
//           autoClose={3000}
//         />
//         {children}
//       </>
//     );
//   }



import React, { createContext, useContext } from 'react';
import MultiLangApi from '@/services/api/general_apis/multilanguage-api';
const LanguageContext = createContext("");



export async function useLanguage() {
  const languageData: any = await MultiLangApi();
  if (languageData?.length > 0) {
    languageData.multiLingualValues = languageData;
  } else {
    languageData.multiLingualValues = [];
  }
  return languageData
    // return languageData;
}