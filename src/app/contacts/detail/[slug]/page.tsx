import React from "react";
import ContactDetails from '@/components/Contact/ContactDetails';


// Multiple versions of this page will be statically generated
// using the `params` returned by `generateStaticParams`
export default function ContactDetailsPage({ params }: { params: { slug: string} }) {
  const name  = params.slug
  
  const contactComp = <ContactDetails name={name} />;
  //console.log("name "+name +" type "+params.viewtyp)

  return (
    <>
    <div>
      {contactComp}
      {/* {params.viewtyp=='d'?contactCompDet:contactComp} */}
      </div>
    </>
  );
  
  
}