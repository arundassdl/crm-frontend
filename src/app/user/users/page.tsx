"use client"
import React, { useState, useEffect } from "react";
// import UsersList from '@/components/Users/Users/UsersListDatagrid'; 
import UsersListing from '@/components/Users/Users/Listing'; 
import { useRouter } from "next/navigation";

const UsersLists = () => {

  const router = useRouter();
  let isLoggedIn: any;
  const [userLogged, set] = useState(false)

  return (
    <>
      <div>
      <UsersListing />
      </div>
    </>
  );
};

export default UsersLists;
