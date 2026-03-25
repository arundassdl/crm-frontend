"use client"
import React, { useState, useEffect } from "react";
import RolesList from '@/components/roles/Listing'; 
import { useRouter } from "next/navigation";

const Roleslists = () => {

  const router = useRouter();
  let isLoggedIn: any;
  const [userLogged, set] = useState(false)

  return (
    <>
      <div>
      <RolesList />
      </div>
    </>
  );
};

export default Roleslists;