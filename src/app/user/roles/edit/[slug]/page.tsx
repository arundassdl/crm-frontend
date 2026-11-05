import React, { useState, useEffect } from "react";
import EditRole from '@/components/roles/EditRole';

// Multiple versions of this page will be statically generated
// using the `params` returned by `generateStaticParams`
export default async function InstallationEditPage({ params: paramsPromise }: { params: Promise<{ slug: string }> }) {
  const params = await paramsPromise
  const rolename  = params.slug

  const roleComp =<EditRole role_name={rolename} /> ;

  return (
    <>
    <div>
      {roleComp}
      </div>
    </>
  );
  
  
}
