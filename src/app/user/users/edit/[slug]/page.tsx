import React, { useState, useEffect } from "react";
import Edituser from '@/components/Users/Users/EditUser';

// Multiple versions of this page will be statically generated
// using the `params` returned by `generateStaticParams`
export default async function UserEditPage({ params: paramsPromise }: { params: Promise<{ slug: string }> }) {
  const params = await paramsPromise
  const name  = params.slug

  const userComp =<Edituser name={name} /> ;

  return (
    <>
    <div>
      {userComp}
      </div>
    </>
  );
  
  
}
