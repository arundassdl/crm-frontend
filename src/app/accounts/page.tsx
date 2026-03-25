"use client"
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CustomersListing from "@/components/Customer/CustomerListing";

const Customer = () => {

  const router = useRouter();
  let isLoggedIn: any;
  const [userLogged, set] = useState(false)


  return (
    <>
      <div>
      <CustomersListing />
      </div>
    </>
  );
};

export default Customer;