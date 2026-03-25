'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'

// 'use client'
import React, { useEffect, useState } from 'react';
import Loginpage from '@/components/Auth/Loginpage';
// import { useLanguage } from '@/libs/LanguageProvider'
import { useImageVariant } from '@core/hooks/useImageVariant'
import type { Mode } from '@core/types'
import Illustrations from '@/components/Illustrations';
// import MultiLangApi from '@/services/api/general_apis/multilanguage-api';
// import { useSelector } from 'react-redux';
// import { multiLanguageDataFromStore } from '@/store/slices/general_slices/multilang-slice';
import useMultilangHook from '@/hooks/LanguageHook/Multilanguages-hook';
// import { useGlobalData } from '@/app/GlobalProvider';


const login = ({ mode }: { mode: Mode }) => {
  // Hooks
  const authBackground = useImageVariant(mode, "", "")
  const { handleLanguageChange, multiLanguagesData, selectedLang }: any = useMultilangHook();
  // const MultiLanguageFromStore = useSelector(multiLanguageDataFromStore);
  // const globalData = useGlobalData();
  const langData  = multiLanguagesData;
  console.log("globalData", multiLanguagesData);

  return (
    <>
      <div className='flex flex-col justify-center items-center min-bs-[100dvh] relative p-6'>
        <Card className='flex flex-col sm:is-[450px]'>
          <CardContent className='p-6 sm:!p-12'>
            <Loginpage multi_lang={multiLanguagesData} />
          </CardContent>
        </Card>
        <Illustrations maskImg={{ src: authBackground }} />
      </div>
    </>
  );
};

export default login;