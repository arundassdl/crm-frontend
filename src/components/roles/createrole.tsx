import React, { useEffect, useState } from "react";
import {
  Formik,
  Form as FormikForm,
  Field,
  ErrorMessage,
  useFormik,
  FormikProvider,
  Form,
} from "formik";
import {
  Button,
  TextField,
  Typography,
  IconButton,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Box,
  Drawer,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card, CardContent, CardHeader,Paper,Checkbox,Divider,
} from "@mui/material";
import Switch from '@mui/material/Switch';
import { showToast } from "@/components/ToastNotificationNew";

import { fetchpermissionmodule, submit_addroles, get_roleby_name, submit_editroles } from "@/services/api/roles/roles-api";

import { useSelector } from "react-redux";
import { get_access_token } from "@/store/slices/auth/token-login-slice";
import CloseIcon from "@mui/icons-material/Close";
import { GridExpandMoreIcon } from "@mui/x-data-grid";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useRouter } from "next/navigation";
import { updateResource } from "@/services/api/common-erpnext-api/create-edit-api";
import { SelectedFilterLangDataFromStore } from "@/store/slices/general_slices/selected-multilanguage-slice";
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { Option } from "@/types/customer";
import DrawerComponent from "@/components/Common/Form/Drawer/DrawerComponent";
import { roleFormValidation } from "@/validation/roleFormValidation";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import tableStyles from '@core/styles/table.module.css'
import Collapse from '@mui/material/Collapse';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';


interface FormValueType {
    role_name: string;
    role_description: string;
    data_share: boolean;
    disabled: boolean,
    is_admin: boolean,
    username: "",
    useremailid: ""
}


const formInitialValues: FormValueType = {
    role_name: "",
    role_description: "",
    data_share : false,
    disabled : false,
    is_admin : false,
    username: "",
    useremailid: ""
  
};

interface AddEditRoleDrawerProps {
  initialValues: FormValueType;
  open: boolean;
  onClose: () => void;
  operation: string;
  onSubmit?: () => void;
}

export default function AddEditRoleDrawer({
  initialValues,
  open,
  onClose,
  operation,
  onSubmit,
}: AddEditRoleDrawerProps) {

  const [selectedMultiLangData, setSelectedMultiLangData] = useState<any>();

  const SelectedLangDataFromStore: any = useSelector(
      SelectedFilterLangDataFromStore
  );

  let [permission, setPermission] = useState<any>([]);
  let [permissionsub, setPermissionsub] = useState<any>([]);
  const [err, setErr] = useState<boolean>(false);
  let [rolename, setRolename] = useState<any>('');

  useEffect(() => {
    
    console.log('userToken', userToken?.username);
    
    if (Object.keys(initialValues).length > 0) {
      const mergedValues: FormValueType = {
        ...initialValues, // Override with actual data
      };
      console.log('initialValues', initialValues?.role_name);
      setRolename(initialValues?.role_name);
      formik.setValues(mergedValues);
    } else {
      formik.setValues(formInitialValues);
    }

    formik.values.username = userToken?.username
    formik.values.useremailid = userToken?.email

  }, [initialValues]);

  useEffect(() => {
      if (
          Object.keys(SelectedLangDataFromStore?.selectedLanguageData)?.length > 0
      ) {
          setSelectedMultiLangData(SelectedLangDataFromStore?.selectedLanguageData);
      }
      console.log("installation list");
  }, [SelectedLangDataFromStore]);


   useEffect(() => {
        console.log('auth()', 'currentUser');

        const getPermissions: any = async () => {
            const permissionmoduleData: any = await fetchpermissionmodule(
                userToken?.access_token
            );
            console.log(permissionmoduleData, 'permissionmoduleData', permissionmoduleData?.length);

            if (Array.isArray(permissionmoduleData) && permissionmoduleData?.length > 0) {
                console.log(permissionmoduleData, 'quesValues');
                setPermission(permissionmoduleData);
                setPermissionsub(permissionmoduleData);
                console.log('permission', permission);
            } else {
                setErr(!err);
            }
        };

        const getroledata: any = async () => {
          const { search } = window.location;
    
          if (formik.values.role_name == undefined)
            return
            // alert(role_name)
          const getroleData: any = await get_roleby_name(
            { "rolename": formik.values.role_name }, userToken?.access_token,
          );
          console.log('######rolesData', getroleData?.permission);
          if (getroleData != undefined) {
            // console.log('######get rolesData===> ', getroleData?.role_description);
            // setRoledata(getroleData);
            // formik.values.role_description = getroleData?.role_description;
            setPermission(getroleData?.permission);
            // console.log(roledata, '===rolesData');
    
          } else {
            setErr(!err);
            console.log(!err)
            // location.href='/roles'
          }
        };
    
        

        getPermissions();
        if (operation == 'Edit') {
            getroledata();    
        }
    }, []);


    useEffect(() => {
        console.log('auth()', 'currentUser');

        const getroledata: any = async () => {
          const { search } = window.location;
    
          if (formik.values.role_name == undefined)
            return
            // alert(role_name)
          const getroleData: any = await get_roleby_name(
            { "rolename": formik.values.role_name }, userToken?.access_token,
          );
          console.log('######rolesData', getroleData?.permission);
          if (getroleData != undefined) {
            // console.log('######get rolesData===> ', getroleData?.role_description);
            // setRoledata(getroleData);
            // formik.values.role_description = getroleData?.role_description;
            setPermission(getroleData?.permission);
            // console.log(roledata, '===rolesData');
    
          } else {
            setErr(!err);
            console.log(!err)
            // location.href='/roles'
          }
        };
    
        if (operation == 'Edit') {
            getroledata();    
        }
    }, [rolename]);





  const [userToken, setUserToken] = useState<any>(() => {
    const initialValue = JSON.parse(
      localStorage.getItem("AccessTokenData") || "{}"
    );
    return initialValue || "";
  });

  const TokenFromStore: any = useSelector(get_access_token);
  
  const router = useRouter();


  // Handle form submission
  const handleSave = () => {
    console.log("New User Data:");
    // Add your API call here to save the user
    onClose(); // Close the popup after saving
  };

  





  const formik = useFormik({
    initialValues: formInitialValues || initialValues,
    validationSchema: roleFormValidation,
    enableReinitialize: true,
    isInitialValid: true,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values, action) => {
      // alert(JSON.stringify(values, null, 2));
      const requestParams = {
        value: { ...values },
        token: userToken?.access_token,
      };
      handlesubmit(values, action);
    },
  });


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

  const handlesubmit: any = async (values, action) => {
    // if(!Boolean(formik.errors.custom_error))
    formik.setFieldValue('username', userToken?.username);
    formik.setFieldValue('useremailid', userToken?.email);
    if (formik.isValid) {
      const formData = new FormData();

      values['permission'] = JSON.stringify(permission)

      Object.keys(values).forEach(function (key) {
        console.log(key, "============", values[key]);
        formData.append(key, values[key])
      });
      values['username'] = userToken?.username;
      values['useremailid'] = userToken?.email;
      console.log("values form Data", values);

      if (operation == 'New') {
        let addrolesApiRes: any = await submit_addroles(formData, userToken?.access_token);
        console.log(addrolesApiRes, 'addrolesApiRes hi');

        // let jobApiRes: any = await submit_addjob(formData, userToken?.access_token);
          if (addrolesApiRes?.msg === "success") {
              showToast(addrolesApiRes?.data.msg, "success");
              action.resetForm();
              setTimeout(() => {
                onSubmit ? onSubmit() : location.reload(); 
                onClose();
              }, 1000);
          } else {
              showToast(addrolesApiRes?.error, "error");
          }

      } else {
        let addrolesApiRes: any = await submit_editroles(formData, userToken?.access_token);
        console.log(addrolesApiRes, 'editrolesApiRes hi');

         // let jobApiRes: any = await submit_addjob(formData, userToken?.access_token);
          if (addrolesApiRes?.msg === "success") {
              showToast(addrolesApiRes?.data.msg, "success");
              action.resetForm();
              setTimeout(() => {
                onSubmit ? onSubmit() : location.reload(); 
                onClose();
              }, 1000);
          } else {
              showToast(addrolesApiRes?.error, "error");
          }
      }
      


     
      
      
    }
    // }
  };



 

  

  useEffect(() => {
    console.log("Formik Touched:", formik.touched);
  }, [formik.errors, formik.touched]);

  return (
    <DrawerComponent open={open} onClose={onClose} title={`${operation} Role`} width={1200}>
      <FormikProvider value={formik}>
        <Form>
          <Box
            sx={{
              flexGrow: 1,
              overflowY: "auto",
              padding: 2,
              height: "100%",
            }}
          >
            <Grid
              container
              spacing={6}
              p={5}
              sx={{
                paddingTop: "30px",
                paddingLeft: "50px",
                paddingRight: "30px",
              }}
            >
              <Typography variant="h6">Role Details</Typography>
              <Grid
                container
                spacing={6}
                sx={{ paddingTop: "20px", paddingLeft: "10px" }}
              >
                <Grid item xs={12} sm={12}>
                     <TextField
                        fullWidth
                        id="role_name"
                        name="role_name"
                        label={selectedMultiLangData?.lbl_role_name ? selectedMultiLangData?.lbl_role_name : "Role Name"}
                        placeholder={'Enter Role name'}
                        value={formik.values.role_name || ''}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.role_name && Boolean(formik.errors.role_name)}
                        helperText={formik.touched.role_name && formik.errors.role_name}
                    />
                </Grid>
                <Grid item xs={12} sm={12}>
                     <TextField
                        fullWidth
                        multiline
                        rows={3}
                        id="role_description"
                        name="role_description"
                        label={selectedMultiLangData?.lbl_role_desc ? selectedMultiLangData?.lbl_role_desc : "Role Description"}
                        placeholder={'Enter Role description'}
                        value={formik.values.role_description || ''}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.role_description && Boolean(formik.errors.role_description)}
                        helperText={formik.touched.role_description && formik.errors.role_description}
                    />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 4 }}>
                      Role Permissions
                    </Typography>
                    <Divider sx={{borderBottomWidth:"2px", mb: 4}} />
                </Grid>

                 <Grid item xs={12} sm={12}>
                        <Grid container spacing={6}>

                            
                                <Card sx={{boxShadow:'none'}}>
                                    {/*<CardHeader title={<Typography variant="h5">{(selectedMultiLangData?.survey_questionnaire) ? selectedMultiLangData?.survey_questionnaire : 'Role Permissions'}</Typography>} />*/}
                                    <CardContent>
                                        <Grid container spacing={6}>
                                            <Grid item xs={12} sm={12}>
                                                <TableContainer component={Paper}>
                                                    <Table sx={{ tableLayout: 'fixed', width: '100%',borderBottom: 'unset' }} >
                                                        <TableHead>
                                                            <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                                                                <TableCell style={{ width: '30%', color: "#616161" }}>Module</TableCell>
                                                                <TableCell sx={{ width: '7%', textAlign: 'center' }}>Full Access</TableCell>
                                                                <TableCell sx={{ width: '7%', textAlign: 'center' }}>IF Owner</TableCell>
                                                                <TableCell sx={{ width: '7%' , textAlign: 'center'}}>View</TableCell>
                                                                <TableCell sx={{ width: '7%' , textAlign: 'center'}}>Create</TableCell>
                                                                <TableCell sx={{ width: '7%' , textAlign: 'center'}}>Edit</TableCell>
                                                                <TableCell sx={{ width: '7%', textAlign: 'center' }}>Delete</TableCell>
                                                                <TableCell sx={{ width: '7%' , textAlign: 'center'}}>Print</TableCell>
                                                                <TableCell sx={{ width: '7%', textAlign: 'center' }}>Import</TableCell>
                                                                <TableCell sx={{ width: '7%', textAlign: 'center' }}>Export</TableCell>
                                                                <TableCell sx={{ width: '7%', textAlign: 'center' }}>Email</TableCell>
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
                                                                                        {/* <TableCell style={{ width: '5%' }} component="td" colSpan="9">
                                                                                            <IconButton
                                                                                                aria-label="expand row"
                                                                                                size="small"
                                                                                                onClick={() => setOpen(!open)}
                                                                                            >
                                                                                                {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                                                                            </IconButton>
                                                                                        </TableCell> */}
                                                                                    </TableRow>
                                                                                    {permission?.length > 0 ? (
                                                                                        <>
                                                                                            {open ? (
                                                                                                    // <TableRow>
                                                                                                        // <TableCell style={{ paddingBottom: 0, paddingTop: 0, paddingLeft: 0,  paddingRight: 0 }} colSpan={10}>
                                                                                                            // <Collapse in={open} timeout="auto" unmountOnExit>
                                                                                                            <>
                                                                                                                {permission.map((historyRow, index1) => (
                                                                                                                    <>
                                                                                                                        {historyRow?.category_order_sequence ==  data.order_sequence  ? (
                                                                                                                            <TableRow key={historyRow.order_sequence} sx={{ '& > *': { borderBottom: 'unset' } }}>
                                                                                                                                <TableCell style={{ width: '30%', color: "#616161", paddingLeft: 35 }} component="td">{historyRow?.frontend_module}</TableCell>
                                                                                                                                <TableCell sx={{ width: '7%', textAlign: 'center' }} ><Checkbox id={`permission.${historyRow?.order_sequence}.full_access `} checked={historyRow?.full_access}  onChange={handleChange} /></TableCell>
                                                                                                                                <TableCell sx={{ width: '5%', textAlign: 'center' }} > <Checkbox id={`permission.${historyRow?.order_sequence}.ifowner `} checked={historyRow?.ifowner}  onChange={handleChange} /></TableCell>
                                                                                                                                <TableCell sx={{ width: '5%', textAlign: 'center' }}> <Checkbox id={`permission.${historyRow?.order_sequence}.view `} checked={historyRow?.view}  onChange={handleChange} /></TableCell>
                                                                                                                                <TableCell sx={{ width: '5%', textAlign: 'center' }}> <Checkbox id={`permission.${historyRow?.order_sequence}.create `} checked={historyRow?.create}  onChange={handleChange} /></TableCell>
                                                                                                                                <TableCell sx={{ width: '5%', textAlign: 'center' }}> <Checkbox id={`permission.${historyRow?.order_sequence}.edit `} checked={historyRow?.edit}  onChange={handleChange} /></TableCell>
                                                                                                                                <TableCell sx={{ width: '5%', textAlign: 'center' }}> <Checkbox id={`permission.${historyRow?.order_sequence}.delete `} checked={historyRow?.delete}  onChange={handleChange} /></TableCell>
                                                                                                                                <TableCell sx={{ width: '5%', textAlign: 'center' }}> <Checkbox id={`permission.${historyRow?.order_sequence}.print `} checked={historyRow?.print}  onChange={handleChange} /></TableCell>
                                                                                                                                <TableCell sx={{ width: '5%', textAlign: 'center' }}> <Checkbox id={`permission.${historyRow?.order_sequence}.cimport `} checked={historyRow?.cimport}  onChange={handleChange} /></TableCell>
                                                                                                                                <TableCell sx={{ width: '5%', textAlign: 'center' }}> <Checkbox id={`permission.${historyRow?.order_sequence}.export `} checked={historyRow?.export}  onChange={handleChange} /></TableCell>
                                                                                                                                <TableCell sx={{ width: '5%', textAlign: 'center' }}> <Checkbox id={`permission.${historyRow?.order_sequence}.email `} checked={historyRow?.email}  onChange={handleChange} /></TableCell>
                                                                                                                            </TableRow>
                                                                                                                        ): (null)}
                                                                                                                    </>
                                                                                                                ))}
                                                                                                            </>
                                                                                                            // </Collapse>
                                                                                                        // </TableCell>
                                                                                                    // </TableRow>
                                                                                            ) : (null)}
                                                                                        </>
                                                                                    ) : (null)}
                                                                                </>
                                                                            ): (<>
                                                                                {data?.category_order_sequence == 0 ? (
                                                                                    <>
                                                                                        {/*<TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>*/}
                                                                                            {/*<TableCell style={{ paddingBottom: 0, paddingTop: 0, paddingLeft: 0,  paddingRight: 0 }} colSpan={10}>*/}
                                                                                                <TableRow key={data.order_sequence} sx={{ '& > *': { borderBottom: 'unset' } }}>
                                                                                                    <TableCell sx={{ width: '30%', color: "#616161" }} >{data?.frontend_module}</TableCell>
                                                                                                    <TableCell sx={{ width: '7%', textAlign: 'center' }}> <Checkbox id={`permission.${data?.order_sequence}.full_access `} checked={data?.full_access}  onChange={handleChange} /></TableCell>
                                                                                                    <TableCell sx={{ width: '5%', textAlign: 'center' }}> <Checkbox id={`permission.${data?.order_sequence}.ifowner `} checked={data?.ifowner}  onChange={handleChange} /></TableCell>
                                                                                                    <TableCell sx={{ width: '5%', textAlign: 'center' }}> <Checkbox id={`permission.${data?.order_sequence}.view `} checked={data?.view}  onChange={handleChange} /></TableCell>
                                                                                                    <TableCell sx={{ width: '5%', textAlign: 'center' }}> <Checkbox id={`permission.${data?.order_sequence}.create `} checked={data?.create}  onChange={handleChange} /></TableCell>
                                                                                                    <TableCell sx={{ width: '5%', textAlign: 'center' }}> <Checkbox id={`permission.${data?.order_sequence}.edit `} checked={data?.edit}  onChange={handleChange} /></TableCell>
                                                                                                    <TableCell sx={{ width: '5%', textAlign: 'center' }}> <Checkbox id={`permission.${data?.order_sequence}.delete `} checked={data?.delete}  onChange={handleChange} /></TableCell>
                                                                                                    <TableCell sx={{ width: '5%', textAlign: 'center' }}> <Checkbox id={`permission.${data?.order_sequence}.print `} checked={data?.print}  onChange={handleChange} /></TableCell>
                                                                                                    <TableCell sx={{ width: '5%', textAlign: 'center' }}> <Checkbox id={`permission.${data?.order_sequence}.cimport `} checked={data?.cimport}  onChange={handleChange} /></TableCell>
                                                                                                    <TableCell sx={{ width: '5%', textAlign: 'center' }}> <Checkbox id={`permission.${data?.order_sequence}.export `} checked={data?.export}  onChange={handleChange} /></TableCell>
                                                                                                    <TableCell sx={{ width: '5%', textAlign: 'center' }}> <Checkbox id={`permission.${data?.order_sequence}.email `} checked={data?.email}  onChange={handleChange} /></TableCell>
                                                                                                </TableRow>    
                                                                                            {/*</TableCell>*/}
                                                                                        {/*</TableRow>*/}
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
                                    </CardContent>
                                </Card>
                            
                        </Grid>
                    </Grid>

              </Grid>
            </Grid>
          </Box>
          <Box
            sx={{
              position: "sticky",
              bottom: 0,
              width: "100%",
              display: "flex",
              justifyContent: "flex-end",
              padding: 2,
              borderTop: "1px solid #ccc",
              background: "var(--mui-palette-background-paper)",
              zIndex: 1100,
            }}
            // sx={{
            //   display: "flex",
            //   justifyContent: "flex-end",
            //   gap: 2,
            //   paddingTop: 2,
            //   marginTop: 18,
            //   paddingRight: 6,

            // }}
          >
            <Button onClick={onClose} color="secondary">
              Cancel
            </Button>
            <Button
              color="primary"
              type="submit"
              variant="contained"
              sx={{ ml: 2 }}
            >
              Submit
            </Button>
          </Box>
        </Form>
      </FormikProvider>
    </DrawerComponent>
  );
}
