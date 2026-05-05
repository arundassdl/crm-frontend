import React from "react";
import DealDetails from "@/components/Deals/DealDetails";


// Multiple versions of this page will be statically generated
// using the `params` returned by `generateStaticParams`
export default function CustomerDetailsPage({ params }: { params: { slug: string} }) {
  const name  = params.slug
  
  const customerComp = <DealDetails name={name} />;
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