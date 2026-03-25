"use client"
import React, { useState, useEffect } from "react";
import Adduser from '@/components/Users/Users/AddUser'; 
import { useRouter } from "next/navigation";

const Addusers = () => {

  const router = useRouter();
  let isLoggedIn: any;
  const [userLogged, set] = useState(false)

  return (
    <>
      <div>
      <Adduser />
      </div>
    </>
  );
};

export default Addusers;


// "use client"
// import React, { useState, useEffect } from "react";
// import UsersList from '@/components/Users/Users/UsersListDatagrid'; 
// import { useRouter } from "next/navigation";

// const UsersLists = () => {

//   const router = useRouter();
//   let isLoggedIn: any;
//   const [userLogged, set] = useState(false)

//   return (
//     <>
//       <div>
//       <UsersList />
//       </div>
//     </>
//   );
// };

// export default UsersLists;