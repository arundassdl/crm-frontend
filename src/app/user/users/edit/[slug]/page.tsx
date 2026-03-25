import React, { useState, useEffect } from "react";
import Edituser from '@/components/Users/Users/EditUser'; 
import { useRouter } from "next/router";

// Multiple versions of this page will be statically generated
// using the `params` returned by `generateStaticParams`
export default function UserEditPage({ params }: { params: { slug: string } }) {
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