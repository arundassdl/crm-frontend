import React from "react";
import CustomerDetails from '@/components/Customer/CustomerDetails';


// Multiple versions of this page will be statically generated
// using the `params` returned by `generateStaticParams`
export default async function CustomerDetailsPage({ params: paramsPromise }: { params: Promise<{ slug: string}> }) {
  const params = await paramsPromise;
  const name = decodeURIComponent(params.slug);
  
  const customerComp = <CustomerDetails name={name} />;
  //console.log("name "+name +" type "+params.viewtyp)

  return (
    <>
    <div>
      {customerComp}
      {/* {params.viewtyp=='d'?contactCompDet:contactComp} */}
      </div>
    </>
  );
  
  
}
