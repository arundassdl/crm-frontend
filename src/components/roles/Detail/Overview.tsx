"use client";
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Divider,
  Typography,
  Checkbox,
  Paper,
  Box,
} from "@mui/material";

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import tableStyles from '@core/styles/table.module.css'
import Collapse from '@mui/material/Collapse';


import { Grid } from "@mui/material";
import { SelectedFilterLangDataFromStore } from "@/store/slices/general_slices/selected-multilanguage-slice";
import { useSelector } from "react-redux";
import { fetchpermissionmodule, get_roleby_name} from "@/services/api/roles/roles-api";

import DealSkeleton from "@/components/Common/Skeletons/DealSkeleton";
import Button from '@mui/material/Button';

const RoleOverview: any = (slug) => {
  const [userToken, setUserToken] = useState<any>(() => {
    const initialValue = JSON.parse(
      localStorage.getItem("AccessTokenData") || "{}"
    );
    return initialValue || "";
  });

  const SelectedLangDataFromStore: any = useSelector(
    SelectedFilterLangDataFromStore
  );
  const [selectedMultiLangData, setSelectedMultiLangData] = useState<any>();

  const [err, setErr] = useState<boolean>(false);

  const role_name = slug?.name;
  console.log("slug=========222", slug?.detail);


  let [roledata, setRoledata] = useState<any>([]);
  let [rolename, setRolename] = useState<any>('');
  let [permission, setPermission] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const handleChange = (e) => {
    console.log(e);
  }



  useEffect(() => {
    if (
      Object.keys(SelectedLangDataFromStore?.selectedLanguageData)?.length > 0
    ) {
      setSelectedMultiLangData(SelectedLangDataFromStore?.selectedLanguageData);
    }
    console.log("installation list");
  }, [SelectedLangDataFromStore]);


    useEffect(() => {
      setLoading(true);
      if (slug?.detail) {
        setRoledata(slug?.detail);
        setPermission(slug?.detail?.permission);
      }
      setTimeout(() => {
        setLoading(false);
      }, 1000);

    }, [slug]);



  return (
    <>
      <Grid container spacing={12} sx={{ boxShadow: "none", pt: 8, pl: 8, pr: 8 }}>
        <Grid item xs={24} sm={12}>

          {loading ? (
            <DealSkeleton />
          ) : (
            <Grid item xs={12} sm={6} md={12}>
              <Grid
                container
                spacing={2}
                direction="row"
                rowSpacing={2}
                sx={{
                  // borderLeft: "1px solid #e5e5e5",
                  borderRadius: 0,
                  // height: "100%",
                  paddingLeft: 10,
                }}
              >
                <>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <Typography variant="h6" sx={{ mb: 4 }}>
                            Role information
                          </Typography>
                          <Divider sx={{borderBottomWidth:"2px", mb: 4}} />
                        </Grid>
                         <Grid item xs={12} sm={12}>
                            <Box
                              display="flex"
                              alignItems="flex-start"
                              gap={12}
                              flexDirection="row"
                              sx={{ mb: 4 }}
                            >
                              <Typography
                                className="font-normal text-1xl"
                                color={"GrayText"}
                              >
                               Role Name:</Typography>
                              <Typography color={"var(--mui-palette-secondary-dark)"} sx={{ pl: 8 }}>{roledata?.role_name}</Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={12}>
                            <Box
                              display="flex"
                              alignItems="flex-start"
                              gap={2}
                              flexDirection="row"
                              sx={{ mb: 4 }}
                            >
                              <Typography
                                className="font-normal text-1xl"
                                color={"GrayText"}
                              >
                               Role Description:</Typography>
                              <Typography color={"var(--mui-palette-secondary-dark)"} sx={{ pl: 8 }}>{roledata?.role_description}</Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12}>
                          <Typography variant="h6" sx={{ mb: 4 }}>
                              Role Permissions
                            </Typography>
                            <Divider sx={{borderBottomWidth:"2px", mb: 4}} />
                          </Grid>
                        
                           
                            <Grid container spacing={2}>
                                <Grid  item xs={12} sm={12}>
                                    <TableContainer component={Paper}>
                                        <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
                                          <TableHead>
                                            <TableRow>
                                              <TableCell sx={{ width: '30%' }}>Module</TableCell>
                                              <TableCell sx={{ width: '7%', textAlign: 'center' }}>Full Access</TableCell>
                                              <TableCell sx={{ width: '7%', textAlign: 'center'}}>IF owner</TableCell>
                                              <TableCell sx={{ width: '7%', textAlign: 'center' }}>View</TableCell>
                                              <TableCell sx={{ width: '7%', textAlign: 'center' }}>Create</TableCell>
                                              <TableCell sx={{ width: '7%', textAlign: 'center' }}>Edit</TableCell>
                                              <TableCell sx={{ width: '7%', textAlign: 'center' }}>Delete</TableCell>
                                              <TableCell sx={{ width: '7%', textAlign: 'center' }}>Print</TableCell>
                                              <TableCell sx={{ width: '7%', textAlign: 'center' }}>Import</TableCell>
                                              <TableCell sx={{ width: '7%', textAlign: 'center' }}>Export</TableCell>
                                              <TableCell sx={{ width: '7%', textAlign: 'center' }}>Emial</TableCell>
                                            </TableRow>
                                          </TableHead>
                                          <TableBody>
                                            {permission?.length > 0 ? (
                                                <>
                                                    {permission.map((data: any, index: any) => (
                                                        <>
                                                            {data?.chkcategory == 1 ? (
                                                                <>
                                                                    <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                                                                      <TableCell  style={{ width: '30%', color: "#616161" }}>{data?.frontend_module}</TableCell>
                                                                      <TableCell  sx={{ width: '7%' }} ></TableCell>
                                                                      <TableCell  sx={{ width: '7%' }} ></TableCell>
                                                                      <TableCell  sx={{ width: '7%' }} ></TableCell>
                                                                      <TableCell  sx={{ width: '7%' }} ></TableCell>
                                                                      <TableCell  sx={{ width: '7%' }} ></TableCell>
                                                                      <TableCell  sx={{ width: '7%' }} ></TableCell>
                                                                      <TableCell  sx={{ width: '7%' }} ></TableCell>
                                                                      <TableCell  sx={{ width: '7%' }} ></TableCell>
                                                                      <TableCell  sx={{ width: '7%' }} ></TableCell>
                                                                      <TableCell  sx={{ width: '7%' }} ></TableCell>
                                                                    </TableRow>
                                                                    {permission?.length > 0 ? (
                                                                        <>
                                                                        {permission.map((historyRow, index1) => (
                                                                            <>
                                                                                {historyRow?.category_order_sequence ==  data.order_sequence  ? (
                                                                                    <TableRow key={historyRow.order_sequence} sx={{ '& > *': { borderBottom: 'unset' } }}>
                                                                                        <TableCell sx={{ width: '30%' }}>{historyRow?.frontend_module}</TableCell>
                                                                                        <TableCell  sx={{ width: '7%', textAlign: 'center' }} > <Checkbox disabled id={`permission.${historyRow?.order_sequence}.full_access `} checked={historyRow?.full_access}  onChange={handleChange} /></TableCell>
                                                                                        <TableCell  sx={{ width: '7%', textAlign: 'center' }} > <Checkbox disabled id={`permission.${historyRow?.order_sequence}.ifowner `} checked={historyRow?.ifowner}  onChange={handleChange} /></TableCell>
                                                                                        <TableCell  sx={{ width: '7%', textAlign: 'center' }}   > <Checkbox disabled id={`permission.${historyRow?.order_sequence}.view `} checked={historyRow?.view}  onChange={handleChange} /></TableCell>
                                                                                        <TableCell  sx={{ width: '7%', textAlign: 'center' }}  > <Checkbox disabled id={`permission.${historyRow?.order_sequence}.create `} checked={historyRow?.create}  onChange={handleChange} /></TableCell>
                                                                                        <TableCell  sx={{ width: '7%', textAlign: 'center' }}  > <Checkbox disabled id={`permission.${historyRow?.order_sequence}.edit `} checked={historyRow?.edit}  onChange={handleChange} /></TableCell>
                                                                                        <TableCell  sx={{ width: '7%', textAlign: 'center' }}  > <Checkbox disabled id={`permission.${historyRow?.order_sequence}.delete `} checked={historyRow?.delete}  onChange={handleChange} /></TableCell>
                                                                                        <TableCell sx={{ width: '7%', textAlign: 'center' }}  > <Checkbox disabled id={`permission.${historyRow?.order_sequence}.print `} checked={historyRow?.print}  onChange={handleChange} /></TableCell>
                                                                                        <TableCell sx={{ width: '7%', textAlign: 'center' }}  > <Checkbox disabled id={`permission.${historyRow?.order_sequence}.cimport `} checked={historyRow?.cimport}  onChange={handleChange} /></TableCell>
                                                                                        <TableCell sx={{ width: '7%', textAlign: 'center' }} > <Checkbox disabled id={`permission.${historyRow?.order_sequence}.export `} checked={historyRow?.export}  onChange={handleChange} /></TableCell>
                                                                                        <TableCell sx={{ width: '7%', textAlign: 'center' }}  > <Checkbox disabled id={`permission.${historyRow?.order_sequence}.email `} checked={historyRow?.email}  onChange={handleChange} /></TableCell>
                                                                                    </TableRow>
                                                                                ): (null)}
                                                                            </>
                                                                        ))}
                                                                        </>
                                                                    ) : (null)}
                                                                </>
                                                            ): (<>
                                                                {data?.category_order_sequence == 0 ? (
                                                                    <>
                                                                                <TableRow key={data.order_sequence} sx={{ '& > *': { borderBottom: 'unset' } }}>
                                                                                    <TableCell sx={{ width: '30%' }} >{data?.frontend_module}</TableCell>
                                                                                    <TableCell sx={{ width: '7%', textAlign: 'center' }} > <Checkbox disabled id={`permission.${data?.order_sequence}.full_access `} checked={data?.full_access}  onChange={handleChange} /></TableCell>
                                                                                    <TableCell sx={{ width: '7%', textAlign: 'center' }} > <Checkbox disabled id={`permission.${data?.order_sequence}.ifowner `} checked={data?.ifowner}  onChange={handleChange} /></TableCell>
                                                                                    <TableCell sx={{ width: '7%', textAlign: 'center' }}  > <Checkbox disabled id={`permission.${data?.order_sequence}.view `} checked={data?.view}  onChange={handleChange} /></TableCell>
                                                                                    <TableCell sx={{ width: '7%', textAlign: 'center' }}  > <Checkbox disabled id={`permission.${data?.order_sequence}.create `} checked={data?.create}  onChange={handleChange} /></TableCell>
                                                                                    <TableCell sx={{ width: '7%', textAlign: 'center' }}  > <Checkbox disabled id={`permission.${data?.order_sequence}.edit `} checked={data?.edit}  onChange={handleChange} /></TableCell>
                                                                                    <TableCell sx={{ width: '7%', textAlign: 'center' }} > <Checkbox disabled id={`permission.${data?.order_sequence}.delete `} checked={data?.delete}  onChange={handleChange} /></TableCell>
                                                                                    <TableCell sx={{ width: '7%', textAlign: 'center' }} > <Checkbox disabled id={`permission.${data?.order_sequence}.print `} checked={data?.print}  onChange={handleChange} /></TableCell>
                                                                                    <TableCell sx={{ width: '7%', textAlign: 'center' }} > <Checkbox disabled id={`permission.${data?.order_sequence}.cimport `} checked={data?.cimport}  onChange={handleChange} /></TableCell>
                                                                                    <TableCell sx={{ width: '7%', textAlign: 'center' }} > <Checkbox disabled id={`permission.${data?.order_sequence}.export `} checked={data?.export}  onChange={handleChange} /></TableCell>
                                                                                    <TableCell sx={{ width: '7%', textAlign: 'center' }} > <Checkbox disabled id={`permission.${data?.order_sequence}.email `} checked={data?.email}  onChange={handleChange} /></TableCell>
                                                                                </TableRow>    
                                                                    </>
                                                                ): (null)}
                                                                </>
                                                            )}
                                                        </>
                                                    ))}
                                                </>
                                            ) : (null)}
                                          </TableBody>
                                        </Table>
                                      </TableContainer>
                                </Grid>
                            </Grid>
                        
                      </Grid>
                </>
              </Grid>
            </Grid>
          )}
        </Grid>
      </Grid>
    </>
  );
};

export default RoleOverview;

