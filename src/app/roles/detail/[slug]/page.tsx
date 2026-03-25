import React from "react";
import RoleDetail from '@/components/roles/RoleDetail';

// Multiple versions of this page will be statically generated
// using the `params` returned by `generateStaticParams`
export default function RoleDetailPage({ params }: { params: { slug: string } }) {
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