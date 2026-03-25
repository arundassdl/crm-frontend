'use client'
// React Imports
import type { ReactElement } from 'react'

// Next Imports
import dynamic from 'next/dynamic'

// Component Imports
import AccountSettings from '@views/account-settings'
import useProfilePage from '@/hooks/GeneralHooks/ProfileHooks/ProfileHooks';


const AccountTab = dynamic(() => import('@views/account-settings/account'))
const NotificationsTab = dynamic(() => import('@views/account-settings/notifications'))
const ConnectionsTab = dynamic(() => import('@views/account-settings/connections'))
const ProfileMasterTab = dynamic(() => import('@components/ProfilePage/ProfileMaster'))
const AddressTab = dynamic(() => import('@views/account-settings/address'))

// Vars
const tabContentList = (profileList): { [key: string]: ReactElement } => ({
  account: <AccountTab profileList={profileList} />,
  address: <AddressTab profileList={profileList} />,
  // connections: <ConnectionsTab />
})


const AccountSettingsPage = () => {

  const  {profileList} = useProfilePage();  
  console.log("profileList=>profileList",profileList);
  
  
  return <AccountSettings tabContentList={tabContentList(profileList)} />
}

export default AccountSettingsPage

// import React from 'react';
// import ProfileMaster from '@/components/ProfilePage/ProfileMaster';
// import { CONSTANTS } from '@/services/config/app-config';
// import MetaTag from '@/services/api/general_apis/meta-tag-api';

// const QuickOrder = () => {
//   return (
//     <>
//       <ProfileMaster />
//     </>
//   );
// };

// export async function getServerSideProps1(context: any) {
//   const method = 'get_meta_tags';
//   const version = 'v1';
//   const entity = 'seo';
//   const params = `?version=${version}&method=${method}&entity=${entity}`;
//   const url = `${context.resolvedUrl.split('?')[0]}`;
//   console.log('context url', context.resolvedUrl);
//   if (CONSTANTS.ENABLE_META_TAGS) {
//     let meta_data: any = await MetaTag(
//       `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}${params}&page_name=${url}`
//     );

//     if (meta_data !== null && Object.keys(meta_data).length > 0) {
//       const metaData = meta_data?.data?.message?.data;
//       // console.log("meta data in page server", metaData);
//       return { props: { metaData } };
//     } else {
//       return { props: {} };
//     }
//   } else {
//     return { props: {} };
//   }
// }

// export default QuickOrder;
