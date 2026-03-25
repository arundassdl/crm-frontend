import React, { useState, useEffect } from "react";
import EditRole from '@/components/roles/EditRole';
import { useRouter } from "next/router";

// Multiple versions of this page will be statically generated
// using the `params` returned by `generateStaticParams`
export default function InstallationEditPage({ params }: { params: { slug: string } }) {
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