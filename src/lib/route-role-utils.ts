// import { verticalMenuItems } from '@/components/layout/vertical/vertical-menu-config';
// import { useState } from 'react'

export const getAllowedRolesForPath = (pathname: string, menuListData: string): string[] => {
  // Handle empty or invalid menuListData
  if (!menuListData || menuListData.trim() === '') {
    return []; // Return empty array if no menu data
  }

  try {
    // console.log(JSON.parse(menuListData), 'menuListData route-role-ulils');
    const verticalMenuItems = JSON.parse(menuListData);

    // Ensure verticalMenuItems is an array
    if (!Array.isArray(verticalMenuItems)) {
      return [];
    }

    for (const section of verticalMenuItems) {
      if (!section || !section.items) continue;
      
      for (const item of section.items) {
        if (item.submenu && item.children) {
          for (const child of item.children) {
            if (child.path === pathname) return child.roles || [];
          }
        }
        if (item.path === pathname) return item.roles || [];
      }
    }
  } catch (error) {
    console.error('Error parsing menuListData:', error);
    return []; // Return empty array on parse error
  }
  
  return []; // Public or not configured
};