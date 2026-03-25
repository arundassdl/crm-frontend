import React from "react";
import LeadDetails from "@/components/Leads/LeadDetails";


// Multiple versions of this page will be statically generated
// using the `params` returned by `generateStaticParams`
export default function CustomerDetailsPage({ params }: { params: { slug: string} }) {
  const name  = params.slug
  
  const customerComp = <LeadDetails name={name} />;
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