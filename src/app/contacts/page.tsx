"use client"
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ContactListingMain from "@/components/Contact/ContactListing";

const Contact = () => {

  const router = useRouter();
  let isLoggedIn: any;
  const [userLogged, set] = useState(false)


  return (
    <>
      <div>
      <ContactListingMain />
      </div>
    </>
  );
};

export default Contact;