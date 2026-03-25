import React from "react";
import UserDetail from '@/components/Users/Users/UserDetails';


// Multiple versions of this page will be statically generated
// using the `params` returned by `generateStaticParams`
export default function ContactDetailsPage({ params }: { params: { slug: string} }) {
  const name  = params.slug
  
  const userComp = <UserDetail name={name} />;
  //console.log("name "+name +" type "+params.viewtyp)

  return (
    <>
    <div>
      {userComp}
      {/* {params.viewtyp=='d'?contactCompDet:contactComp} */}
      </div>
    </>
  );
  
  
}