"use client";
import { readAccessTokenDataRaw } from '@/utils/accessTokenDataStorage'
import React, { useState, useEffect } from "react";
import { forwardRef, useImperativeHandle } from 'react';
import {
  Card,
  CardContent,
  Checkbox,
  Paper,
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Divider,
  Stack,
} from "@mui/material";

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import tableStyles from '@core/styles/table.module.css'
import Collapse from '@mui/material/Collapse';
// import TreeDropdown from "@/components/roles/TreeDropdown";



import { Grid } from "@mui/material";
import { SelectedFilterLangDataFromStore } from "@/store/slices/general_slices/selected-multilanguage-slice";
import { useSelector } from "react-redux";
import { fetchpermissionmodule, get_roleby_name, get_full_roles_withouttree } from "@/services/api/roles/roles-api";

import RoleSkeleton from "@/components/Common/Skeletons/RoleSkeleton";
import Button from '@mui/material/Button';
import { Tooltip, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { GridCheckCircleIcon, GridCloseIcon } from "@mui/x-data-grid";
import EditableField from "@/components/Common/EditableField";
import { submit_editroles, get_full_roles_tree } from "@/services/api/roles/roles-api";


// type SlugType = {
//   role_name: string;
  
// };

type RoleDetailsProps = {
  slug: string;
};

export type ChildRefType = {
  submitEditable: () => void;
  handleCloseClick: () => void;
};

// const RoleOverview: any = (slug) => {
const RoleOverview = forwardRef<ChildRefType,RoleDetailsProps>(( { slug }, ref) => {
  // const { slug } = props
  const [userToken, setUserToken] = useState<any>(() => {
    const initialValue = JSON.parse(
      readAccessTokenDataRaw()
    );
    return initialValue || "";
  });

  const [isEditPermission, setIsEditPermission] = useState(false);
  const module_name = "Roles";
  const [userPermission, setUserPermission] = useState<any>(() => {
      const initialValue = JSON.parse(
        localStorage.getItem("userpermission") || "[]"
      );
      // Ensure initialValue is an array before calling .find()
      const permissionArray = Array.isArray(initialValue) ? initialValue : [];
      return permissionArray.find(module => module.frontend_module === module_name) || "";
    });
    
    useEffect(() => {
      if (userPermission.hasOwnProperty('create')) {
        setIsEditPermission(userPermission.edit == 1 ? true : false);
      }
    }, [userPermission]);


  const SelectedLangDataFromStore: any = useSelector(
    SelectedFilterLangDataFromStore
  );
  const [selectedMultiLangData, setSelectedMultiLangData] = useState<any>();

  const [err, setErr] = useState<boolean>(false);
  const [editable, setEditable] = useState<boolean>(false);

  const [treeRoleData, setTreeRoleData] = useState<any>([]);
  const [selectedRole, setSelectedRole] = useState<any>('');

  const [selectedValue, setSelectedValue] = useState("");
  const [treewoRoleData, setTreewoRoleData] = useState<any>([]);

  const departments = [
      {
        id: 1,
        name: "Engineering",
        children: [
          { id: 101, name: "Frontend" },
          { id: 102, name: "Backend" },
        ],
      },
      {
        id: 2,
        name: "HR",
        children: [{ id: 201, name: "Recruitment" }],
      },
    ];


  console.log("slug=========222", slug);

  // Expose the function to parent via ref
  useImperativeHandle(ref, () => ({
    submitEditable,
    handleCloseClick
  }));


  const submitEditable = () => {
    setEditable(true);
  };

  const ifownerOptions = [
    { label: "Private", value: "Private" },
    { label: "Public", value: "Public" },
  ];



  let [roledata, setRoledata] = useState<any>([]);
  let [rolename, setRolename] = useState<any>('');
  const [profile, setProfile] = useState<any>([]);
  let [permission, setPermission] = useState<any>([]);
  let [permissionmem, setPermissionmem] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [permissionloading, setPermissionloading] = useState<boolean>(false);

  const handleChange = (e) => {
        // console.log(e.target.checked);
        console.log("e.answers", e.target.id);
        var chkindex = e.target.id.split('.')

        const indexOf = permission.findIndex(x=> x.order_sequence === parseInt(chkindex[1]))
        console.log('indexof', indexOf);

        console.log(chkindex[0]);
        console.log(chkindex[1]);
        console.log(chkindex[2]);
        var permissions_array = [...permission];
        if (chkindex[2].trim() === "full_access") {
            permissions_array[indexOf].full_access = e.target.checked;
            permissions_array[indexOf].view = e.target.checked;
            permissions_array[indexOf].create = e.target.checked;
            permissions_array[indexOf].edit = e.target.checked;
            permissions_array[indexOf].delete = e.target.checked;
            permissions_array[indexOf].print = e.target.checked;
            permissions_array[indexOf].cimport = e.target.checked;
            permissions_array[indexOf].export = e.target.checked;
            permissions_array[indexOf].email = e.target.checked;
        } else if (chkindex[2].trim() == 'ifowner') {
            permissions_array[indexOf].ifowner = e.target.checked;
            if (e.target.checked == true) {
                permissions_array[indexOf].view = e.target.checked;
                permissions_array[indexOf].create = e.target.checked;    
            }
        } else if (chkindex[2].trim() == 'view') {
            permissions_array[indexOf].view = e.target.checked;
        } else if (chkindex[2].trim() == 'edit') {
            permissions_array[indexOf].edit = e.target.checked;
        } else if (chkindex[2].trim() == 'create') {
            permissions_array[indexOf].create = e.target.checked;
        } else if (chkindex[2].trim() == 'delete') {
            permissions_array[indexOf].delete = e.target.checked;
        } else if (chkindex[2].trim() == 'print') {
            permissions_array[indexOf].print = e.target.checked;
        } else if (chkindex[2].trim() == 'cimport') {
            permissions_array[indexOf].cimport = e.target.checked;
        } else if (chkindex[2].trim() == 'export') {
            permissions_array[indexOf].export = e.target.checked;
        } else if (chkindex[2].trim() == 'email') {
            permissions_array[indexOf].email = e.target.checked;
        }
        
        if (chkindex[2].trim() != "full_access" && chkindex[2].trim() != "ifowner" ) {
            console.log(chkindex[2].trim() != "ifowner", 'chkindex[2].trim() != "ifowner"', chkindex[2].trim());
            if (e.target.checked ==  false && chkindex[2].trim() != "ifowner" ) {
                permissions_array[indexOf].full_access = e.target.checked;
            } else {
                if (permissions_array[indexOf].view == true && permissions_array[indexOf].edit == true && permissions_array[indexOf].create == true && permissions_array[indexOf].delete == true && permissions_array[indexOf].print == true && permissions_array[indexOf].cimport == true && permissions_array[indexOf].export == true && permissions_array[indexOf].email == true) {
                    permissions_array[indexOf].full_access = e.target.checked;
                }
            }
        }
        setPermission(permissions_array);
        console.log("e.answers", e.target.checked);
        console.log(permission, "=====");
  };

   const handleChangeselect = (e) => {
        // console.log(e.target.checked);
        var chkindex = ""
        if (e.target.hasOwnProperty('id')) {
          chkindex = e.target.id.split('.')
        } else {
          chkindex = e.target.name.split('.')
        }
        console.log(chkindex);

        // // var chkindex = e.target.id.split('.')

        const indexOf = permission.findIndex(x=> x.order_sequence === parseInt(chkindex[1]))
        var permissions_array = [...permission];
        console.log('indexof', indexOf, permissions_array[indexOf]);
        if (e.target.value == 'Private') {
           permissions_array[indexOf].ifowner = true;
        } else {
           permissions_array[indexOf].ifowner = false;
        }
        permissions_array[indexOf].ifownertext = e.target.value;
        setPermission(permissions_array);
    };


  const handleEditClick = (index: number) => {
    const indexOf = permission.findIndex(x=> x.order_sequence === index)
    console.log('indexof', indexOf);
    const updated = [...permission];
    console.log(updated[indexOf], 'updated[indexOf]');
    updated[indexOf].editable = true;
    setPermission(updated);
  };
  const handleCloseClick = () => {

    getroledata();
    setEditable(false)
    // if (slug) {
    //     setRoledata(slug);
    //     setPermission(slug.permission);
    //     setPermissionmem(slug.permission);
    //     setProfile({
    //       role_name: slug.role_name,
    //       role_description: slug.role_description,
    //       disabled: slug.disabled,
    //       is_admin: slug.is_admin,
    //       share_data_with_peers: slug.share_data_with_peers,
    //       name: slug.name,
    //       permission: slug.permission,
    //     });
    //     setEditable(false)
    //   }
    
    // const indexOf = permission.findIndex(x=> x.order_sequence === index)
    // console.log('indexof', indexOf);
    // const updated = [...permission];
    // console.log(updated[indexOf], 'updated[indexOf]');
    // updated[indexOf].editable = false;


    // const pmem = [...permissionmem];
    // console.log(pmem[indexOf], 'pmem', permissionmem);

    // const updatedmem = [...permissionmem]
    // // alert(updatedmem[indexOf].full_access);
    // // updated[indexOf].full_access =  false;

    // updated[indexOf].full_access =  updatedmem[indexOf].full_access;
    // updated[indexOf].ifowner =  updatedmem[indexOf].ifowner;
    // updated[indexOf].view =  updatedmem[indexOf].view;
    // updated[indexOf].create =  updatedmem[indexOf].create;
    // updated[indexOf].edit =  updatedmem[indexOf].edit;
    // updated[indexOf].delete =  updatedmem[indexOf].delete;
    // updated[indexOf].print =  updatedmem[indexOf].print;
    // updated[indexOf].cimport =  updatedmem[indexOf].cimport;
    // updated[indexOf].export =  updatedmem[indexOf].export;
    // updated[indexOf].email =  updatedmem[indexOf].email;

    // setPermission(updated);

  };
  // const handleSaveClick = (index: number) => {
  //   const indexOf = permission.findIndex(x=> x.order_sequence === index)
  //   console.log('indexof', indexOf);
  //   const updated = [...permission];
  //   console.log(updated[indexOf], 'updated[indexOf]');
  //   updated[indexOf].editable = false;
  //   setPermission(updated);


  //   // setPermissionmem(slug?.detail?.permission);
  //   const updatedmem = [...permissionmem];
    

  //   updatedmem[indexOf].full_access =  updated[indexOf].full_access;
  //   updatedmem[indexOf].ifowner =  updated[indexOf].ifowner;
  //   updatedmem[indexOf].view =  updated[indexOf].view;
  //   updatedmem[indexOf].create =  updated[indexOf].create;
  //   updatedmem[indexOf].edit =  updated[indexOf].edit;
  //   updatedmem[indexOf].delete =  updated[indexOf].delete;
  //   updatedmem[indexOf].print =  updated[indexOf].print;
  //   updatedmem[indexOf].cimport =  updated[indexOf].cimport;
  //   updatedmem[indexOf].export =  updated[indexOf].export;
  //   updatedmem[indexOf].email =  updated[indexOf].email;
  //   setPermissionmem(updatedmem);




    
  //   // const updatedTarget = permissionmem.map(targetItem => {
  //   //   const match = permission.find(sourceItem => sourceItem.order_sequence === index);
  //   //   console.log(match, 'match');
  //   //   return match ? { ...permissionmem, ...match } : permissionmem;
  //   // });
  //   console.log(permissionmem, 'updatedTarget', updatedmem);
  //   // setPermissionmem(updatedTarget);
  //   // handleSave('permission', permissionmem);
  // }


  useEffect(() => {
    if (
      Object.keys(SelectedLangDataFromStore?.selectedLanguageData)?.length > 0
    ) {
      setSelectedMultiLangData(SelectedLangDataFromStore?.selectedLanguageData);
    }
    console.log("installation list");
  }, [SelectedLangDataFromStore]);


    const getroledata: any = async () => {
      const { search } = window.location;

      if (slug == undefined)
        return
        // alert(role_name)
      const getroleData: any = await get_roleby_name(
        { "rolename": slug }, userToken?.access_token,
      );
      console.log('######rolesData 284', getroleData);
      if (getroleData != undefined) {
        console.log('######rolesData', getroleData?.parent_sdl_role);
        setPermission(getroleData?.permission);


        setRoledata(getroleData);
        setPermission(getroleData.permission);
        setPermissionmem(getroleData.permission);
        setProfile({
          role_name: getroleData.role_name,
          role_description: getroleData.role_description,
          disabled: getroleData.disabled,
          is_admin: getroleData.is_admin,
          share_data_with_peers: getroleData.share_data_with_peers,
          name: getroleData.name,
          permission: getroleData.permission,
          reports_to: getroleData?.parent_sdl_role,
        });
        if (permissionloading == false) {
          setPermissionloading(true);
        }
        // setRoledata(getroleData);
        // setPermission(getroleData?.permission);
        // console.log(roledata, '===rolesData');
        setTimeout(() => {
          setLoading(false);
        }, 1000);

      } else {
        setErr(!err);
        setLoading(false);
        console.log(!err)
        // location.href='/roles'
      }
    };

       const getroletree: any = async () => {
            // const roletreeData: any = await get_full_roles_tree(
            //     userToken?.access_token
            // );
            const roletreeData: any = await get_full_roles_tree();
            console.log(roletreeData, 'roletreeData', roletreeData?.length);

            if (Array.isArray(roletreeData) && roletreeData?.length > 0) {
                console.log(roletreeData, 'roletreeData');
                setTreeRoleData(roletreeData);
                // console.log('permission', permission);
            } else {
                setErr(!err);
            }
        };


    const getrolewotree: any = async () => {
            // const roletreeData: any = await get_full_roles_withouttree(
            //     userToken?.access_token
            // );
            const roletreeData: any = await get_full_roles_withouttree(decodeURIComponent(slug));
            console.log(roletreeData, 'roletreeData', roletreeData?.length);

            if (Array.isArray(roletreeData) && roletreeData?.length > 0) {
                console.log(roletreeData, 'roletreeData');
                setTreewoRoleData(roletreeData);
                // setSelectedRole("Manager");
                // console.log('permission', permission);
            } else {
                setErr(!err);
            }
        };


    useEffect(() => {
      console.log("Initial load with slug:", slug);
      getroletree();
      getrolewotree();
      setLoading(true);
      if (slug) {
        getroledata();

      }
    }, [slug]);

  
    const handleSave = async (field, value) => {

      const updatedData = {
        [field]: value,
      };
      profile[field] = value
      console.log(profile)

      setLoading(true);
      setPermissionloading(false);
      const formData = new FormData();
      Object.keys(profile).forEach(function (key) {
        if (key != "permission" ) {
          console.log(key,'========', profile[key]);
          formData.append(key, profile[key]); 
        }
      });
      formData.append('permission', JSON.stringify(permission));  
      


      let addrolesApiRes: any = await submit_editroles(formData, userToken?.access_token);
      console.log(addrolesApiRes, 'editrolesApiRes hi');

      getroledata();
      setLoading(false);
      setPermissionloading(true);
      

      
      
      
    };

  return (
    <Box sx={{ pt: 3, px: 2 }}>
      <Card
        sx={{
          mb: 4,
          boxShadow: "0px 0px 10px 0px rgba(0, 0, 0, 0.1)",
        }}
        className="border"
      >
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Role Information
          </Typography>
          <Divider sx={{ borderBottomWidth: "2px", mb: 3 }} />
          {loading ? (
            <RoleSkeleton />
          ) : (
            <Stack direction="column" spacing={2}>
              <Box sx={{ width: "100%" }}>
                <EditableField
                  label="Role Name"
                  field="role_name"
                  value={profile?.role_name}
                  onSave={handleSave}
                  isEditpermission={false}
                />
              </Box>
              <Box sx={{ width: "100%" }}>
                <EditableField
                  label="Role Description"
                  field="role_description"
                  value={profile?.role_description}
                  type="textarea"
                  onSave={handleSave}
                  isEditpermission={isEditPermission}
                />
              </Box>
              {profile?.is_admin != 1 && (
                <Box sx={{ width: "100%" }}>
                  <EditableField
                    label="Reports To"
                    field="reports_to"
                    value={profile?.reports_to}
                    type="select"
                    options={treewoRoleData.map((option) => ({
                      value: option.name,
                      label: option.role_name,
                    }))}
                    onSave={handleSave}
                    isEditpermission={isEditPermission}
                  />
                </Box>
              )}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Box>
  );
});

export default RoleOverview;

