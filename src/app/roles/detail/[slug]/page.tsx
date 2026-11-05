import React from "react";
import RoleDetail from '@/components/roles/RoleDetail';

// Multiple versions of this page will be statically generated
// using the `params` returned by `generateStaticParams`
export default async function RoleDetailPage({ params: paramsPromise }: { params: Promise<{ slug: string }> }) {
  const params = await paramsPromise
  const rolename  = params.slug

  const roleComp = <RoleDetail role_name={rolename} />;



  return (
    <>
    <div>
      {roleComp}
      </div>
    </>
  );
  
  
}
