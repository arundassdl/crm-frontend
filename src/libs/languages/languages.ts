'use client'
import { experimental_taintObjectReference, useEffect, useState } from 'react';
import MultiLangApi from '@/services/api/general_apis/multilanguage-api';
import { NextRequest } from 'next/server';

//  const GetLanguage = async (request: NextRequest)=>{
//     const langCookieData = request.cookies.get("languages")
//     const langCookieData1 = await MultiLangApi();
    
//     // const [language, setLanguage] = useState<any>(langCookieData);
//     console.log("langCookieData",langCookieData1);
    
 
//     return langCookieData1;
// };

// export default GetLanguage;



export async function getLanguageData(request: NextRequest) {
    const langCookieData = request.cookies.get("lang")
    const data = await MultiLangApi()   
    console.log("langCookieData",langCookieData);
    document.cookie = "lang="+data
    if(data){
        document.cookie = "lang="+data
    }


    return data
  }