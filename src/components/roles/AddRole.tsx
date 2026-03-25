"use client"
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Formik, Form as FormikForm, Field, ErrorMessage, useFormik } from "formik";
import { Card, CardContent, CardHeader, FormHelperText, IconButton, InputLabel, MenuItem, MobileStepper, Paper, Select, Tooltip, useTheme } from "@mui/material";
import { FormControl, Grid, TextField, Checkbox } from "@mui/material";
import FormControlLabel from '@mui/material/FormControlLabel';
import { SelectedFilterLangDataFromStore } from "../../store/slices/general_slices/selected-multilanguage-slice";
import { useDispatch, useSelector } from "react-redux";
import { get_access_token } from "../../store/slices/auth/token-login-slice";
import { fetchpermissionmodule, submit_addroles } from "../../services/api/roles/roles-api";
import { roleFormValidation } from "../../validation/roleFormValidation";
import { showToast } from "../ToastNotificationNew";
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import 'react-tooltip/dist/react-tooltip.css'
import Button from '@mui/material/Button';
import SaveIcon from '@mui/icons-material/Save';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { ArrowBack, ArrowBackIosNewOutlined, KeyboardArrowLeft, KeyboardArrowRight, Label } from "@mui/icons-material";
import { string } from "yup";
import { styled } from '@mui/material/styles';
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


const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
});


const AddRole: any = () => {
    const router = useRouter();
    const dispatch = useDispatch();
    const TokenFromStore: any = useSelector(get_access_token);

    const [userToken, setUserToken] = useState<any>(() => {
        const initialValue = JSON.parse(localStorage.getItem('AccessTokenData') || '{}');
        return initialValue || "";
    });

    const SelectedLangDataFromStore: any = useSelector(
        SelectedFilterLangDataFromStore
    );
    const [selectedMultiLangData, setSelectedMultiLangData] = useState<any>();

    const [err, setErr] = useState<boolean>(false);
    
    let [Questions, setQuestions] = useState<any>([]);

    let [rolename, setRolename] = useState<any>('');
    let [permission, setPermission] = useState<any>([]);
    let [permissionsub, setPermissionsub] = useState<any>([]);

    
    

    
    const theme = useTheme();
    const [activeStep, setActiveStep] = React.useState(0);
    const [open, setOpen] = React.useState(true);

    let userData: any;
    let userAddress: any;
    if (typeof window !== 'undefined') {
        if (localStorage.getItem('userProfileData') != 'undefined') {
            // alert(localStorage.getItem('userData'))
            userData = JSON.parse(localStorage.getItem('userProfileData') || '[]')
        }

    }
    console.log("userData", userData)
  
    interface IValue {
        role_name: string,
        role_description: string,
        data_share: boolean,
    }
    const initialValues: IValue = {
        // const [initialValues, setInitialValues] = useState({
        role_name: '',
        role_description: '',
        data_share: true,
    };

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

        getPermissions();
    }, []);


    const handlesubmit: any = async (values: IValue, action: any) => {

        const formData = new FormData();
        console.log("values=>", values);
        

        values['permission'] = JSON.stringify(permission)

        Object.keys(values).forEach(function (key) {
            console.log(key, "============", values[key]);
            formData.append(key, values[key])
        });

        console.log('valuesdddformData', formData);
        // // return false;
        let AddRoleApiRes: any = await submit_addroles(formData, userToken?.access_token);
        setTimeout(() => {
            console.log('here', AddRoleApiRes);
            if (AddRoleApiRes?.msg === "success") {
                showToast(AddRoleApiRes?.data.msg, "success");
                router.push("/roles");
            } else {
                showToast(AddRoleApiRes?.error, "error");
            }    
        }, 1000);
        
    };


   

    const {
        handleSubmit,
        control,
        formState: { errors },
        trigger
    } = useForm({
        resolver: yupResolver(roleFormValidation)
        // mode: "onTouched",
        //reValidateMode: "onChange"
    });

    const handleChange = (e) => {
        // console.log(e.target.checked);
        console.log("e.answers", e.target.id);
        var chkindex = e.target.id.split('.')

        const indexOf = permission.findIndex(x=> x.order_sequence === parseInt(chkindex[1]))
        console.log('indexof', indexOf);

        // console.log(chkindex[0]);
        // console.log(chkindex[1]);
        // console.log(chkindex[2]);
        var permissions_array = [...permission];
        if (chkindex[2].trim() === "full_access") {
            permissions_array[indexOf].full_access = e.target.checked;
            permissions_array[indexOf].view = e.target.checked;
            permissions_array[indexOf].create = e.target.checked;
            permissions_array[indexOf].edit = e.target.checked;
            permissions_array[indexOf].delete = e.target.checked;
            permissions_array[indexOf].print = e.target.checked;
            permissions_array[indexOf].import = e.target.checked;
            permissions_array[indexOf].export = e.target.checked;
            permissions_array[indexOf].email = e.target.checked;
        } else if (chkindex[2].trim() == 'if_owner') {
            permissions_array[indexOf].if_owner = e.target.checked;
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
        } else if (chkindex[2].trim() == 'import') {
            permissions_array[indexOf].import = e.target.checked;
        } else if (chkindex[2].trim() == 'export') {
            permissions_array[indexOf].export = e.target.checked;
        } else if (chkindex[2].trim() == 'email') {
            permissions_array[indexOf].email = e.target.checked;
        }
        
        if (chkindex[2].trim() != "full_access") {
            if (e.target.checked ==  false) {
                permissions_array[indexOf].full_access = e.target.checked;
            } else {
                if (permissions_array[indexOf].view == true && permissions_array[indexOf].edit == true && permissions_array[indexOf].create == true && permissions_array[indexOf].delete == true && permissions_array[indexOf].print == true && permissions_array[indexOf].import == true && permissions_array[indexOf].export == true && permissions_array[indexOf].email == true) {
                    permissions_array[indexOf].full_access = e.target.checked;
                }
            }
        }
        setPermission(permissions_array);
        console.log("e.answers", e.target.checked);
        console.log(permission, "=====");
    };

    const onSubmit = async (values, action) => {
        console.log('values', values);
        roleFormValidation;
        handlesubmit(values, action);
    };
  

    const formik = useFormik({
        initialValues: initialValues,
        validationSchema: roleFormValidation,
        enableReinitialize: true,
        onSubmit: async (values, action) => {
            // alert(JSON.stringify(values, null, 2));
            const requestParams = {
                value: { ...values },
                token: userToken?.access_token,
            };
            handlesubmit(values, action);
        },
    });

    return (
        <>
            <form onSubmit={formik.handleSubmit} className='flex flex-col gap-5 mbe-5'>

                <Grid container spacing={5} className="px-5">
                    <Grid item xs={12} md={12} lg={12}>

                        <div className="flex flex-wrap justify-between max-sm:flex-col sm:items-center gap-x-6 gap-y-4">
                            <div className="flex flex-col items-start gap-2">
                                <Typography variant='h5'>{(selectedMultiLangData?.add_role) ? selectedMultiLangData?.add_role : "Add Role"}</Typography>
                            </div>
                                <>
                                    <div className='flex items-center justify-between flex-wrap gap-3'>
                                        <Button variant="outlined" href={`/roles`} startIcon={<i className="ri-arrow-go-back-line" />} size="medium">
                                            {selectedMultiLangData?.back}
                                        </Button>
                                        <Button variant="contained" type="submit" startIcon={<i className="ri-save-3-line" />} size="medium">
                                            {(selectedMultiLangData?.save_btn) ? selectedMultiLangData?.save_btn : "Save"}
                                        </Button>
                                    </div>
                                </>
                        </div>
                    </Grid>
                    <Grid item xs={24} sm={12}>
                        <Grid container spacing={6}>
                            <Grid item xs={24} sm={12}>
                                <Card sx={{boxShadow:'none'}}  className="border">
                                    <CardContent>
                                        <Grid container spacing={6}>
                                            <Grid item xs={24} sm={12}>

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
                                            <Grid item xs={24} sm={12}>
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
                                            {/*<Grid item xs={24} sm={12}>
                                                <FormControlLabel control={<Checkbox id="data_share" checked={formik.values.data_share}  onChange={formik.handleChange} />}  label={selectedMultiLangData?.lbl_role_data_share ? selectedMultiLangData?.role_data_share : "Share Data with Peers"} /><Tooltip title="By default, users with the same role cannot view each other's data. However, if Share Data with Peers is enabled for a role, then users with that role can see each other's data." placement="top" style={{ fontSize: "28px" }}><InfoOutlinedIcon color="success" /></Tooltip>
                                            </Grid>*/}
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item xs={12} sm={12}>
                        <Grid container spacing={6}>

                            <Grid item xs={12} sm={12}>
                                <Card sx={{boxShadow:'none'}}  className="border">
                                    <CardHeader title={<Typography variant="h5">{(selectedMultiLangData?.survey_questionnaire) ? selectedMultiLangData?.survey_questionnaire : 'Role Permissions'}</Typography>} />
                                    <CardContent>
                                        <Grid container spacing={6}>
                                            <Grid item xs={12} sm={12}>
                                                <TableContainer component={Paper}>
                                                    <Table aria-label="collapsible table" className={tableStyles.table} >
                                                        <TableHead>
                                                            <TableRow>
                                                                <TableCell style={{ paddingBottom: 0, paddingTop: 0, paddingLeft: 0,  paddingRight: 0 }} colSpan={10}>
                                                                    <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                                                                        <TableCell  style={{ width: '15%', color: "#616161" }} component="td" >Module</TableCell>
                                                                        <TableCell width={"5%"}>Full Access</TableCell>
                                                                        <TableCell width={"5%"}>If Owner</TableCell>
                                                                        <TableCell width={"5%"}>View</TableCell>
                                                                        <TableCell width={"5%"}>Create</TableCell>
                                                                        <TableCell width={"5%"}>Edit</TableCell>
                                                                        <TableCell width={"5%"}>Delete</TableCell>
                                                                        <TableCell width={"5%"}>Print</TableCell>
                                                                        <TableCell width={"5%"}>Import</TableCell>
                                                                        <TableCell width={"5%"}>Export</TableCell>
                                                                        <TableCell width={"5%"}>Email</TableCell>
                                                                    </TableRow>
                                                                </TableCell>
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
                                                                                        <TableCell  style={{ width: '15%', color: "#616161" }} component="td" >{data?.frontend_module}</TableCell>
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
                                                                                                    <TableRow>
                                                                                                        <TableCell style={{ paddingBottom: 0, paddingTop: 0, paddingLeft: 0,  paddingRight: 0 }} colSpan={10}>
                                                                                                            <Collapse in={open} timeout="auto" unmountOnExit>
                                                                                                                {permission.map((historyRow, index1) => (
                                                                                                                    <>
                                                                                                                        {historyRow?.category_order_sequence ==  data.order_sequence  ? (
                                                                                                                            <TableRow key={historyRow.order_sequence} sx={{ '& > *': { borderBottom: 'unset' } }}>
                                                                                                                                <TableCell style={{ width: '15%', color: "#616161", paddingLeft: 35 }} component="td">{historyRow?.frontend_module}</TableCell>
                                                                                                                                <TableCell width="5%" component="td" > <Checkbox id={`permission.${historyRow?.order_sequence}.full_access `} checked={historyRow?.full_access}  onChange={handleChange} /></TableCell>
                                                                                                                                <TableCell width="5%" component="td" > <Checkbox id={`permission.${historyRow?.order_sequence}.if_owner `} checked={historyRow?.if_owner}  onChange={handleChange} /></TableCell>
                                                                                                                                <TableCell width="5%" component="td"> <Checkbox id={`permission.${historyRow?.order_sequence}.view `} checked={historyRow?.view}  onChange={handleChange} /></TableCell>
                                                                                                                                <TableCell width="5%" component="td"> <Checkbox id={`permission.${historyRow?.order_sequence}.create `} checked={historyRow?.create}  onChange={handleChange} /></TableCell>
                                                                                                                                <TableCell width="5%" component="td"> <Checkbox id={`permission.${historyRow?.order_sequence}.edit `} checked={historyRow?.edit}  onChange={handleChange} /></TableCell>
                                                                                                                                <TableCell width="5%" component="td"> <Checkbox id={`permission.${historyRow?.order_sequence}.delete `} checked={historyRow?.delete}  onChange={handleChange} /></TableCell>
                                                                                                                                <TableCell width="5%" component="td"> <Checkbox id={`permission.${historyRow?.order_sequence}.print `} checked={historyRow?.print}  onChange={handleChange} /></TableCell>
                                                                                                                                <TableCell width="5%" component="td"> <Checkbox id={`permission.${historyRow?.order_sequence}.import `} checked={historyRow?.import}  onChange={handleChange} /></TableCell>
                                                                                                                                <TableCell width="5%" component="td"> <Checkbox id={`permission.${historyRow?.order_sequence}.export `} checked={historyRow?.export}  onChange={handleChange} /></TableCell>
                                                                                                                                <TableCell width="5%" component="td"> <Checkbox id={`permission.${historyRow?.order_sequence}.email `} checked={historyRow?.email}  onChange={handleChange} /></TableCell>
                                                                                                                            </TableRow>
                                                                                                                        ): (null)}
                                                                                                                    </>
                                                                                                                ))}
                                                                                                            </Collapse>
                                                                                                        </TableCell>
                                                                                                    </TableRow>
                                                                                            ) : (null)}
                                                                                        </>
                                                                                    ) : (null)}
                                                                                </>
                                                                            ): (<>
                                                                                {data?.category_order_sequence == 0 ? (
                                                                                    <>
                                                                                        <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                                                                                            <TableCell style={{ paddingBottom: 0, paddingTop: 0, paddingLeft: 0,  paddingRight: 0 }} colSpan={10}>
                                                                                                <TableRow key={data.order_sequence} sx={{ '& > *': { borderBottom: 'unset' } }}>
                                                                                                    <TableCell  style={{ width: '15%', color: "#616161" }} component="td" >{data?.frontend_module}</TableCell>
                                                                                                    <TableCell width="5%" component="td" > <Checkbox id={`permission.${data?.order_sequence}.full_access `} checked={data?.full_access}  onChange={handleChange} /></TableCell>
                                                                                                    <TableCell width="5%" component="td" > <Checkbox id={`permission.${data?.order_sequence}.if_owner `} checked={data?.if_owner}  onChange={handleChange} /></TableCell>
                                                                                                    <TableCell width="5%" component="td"> <Checkbox id={`permission.${data?.order_sequence}.view `} checked={data?.view}  onChange={handleChange} /></TableCell>
                                                                                                    <TableCell width="5%" component="td"> <Checkbox id={`permission.${data?.order_sequence}.create `} checked={data?.create}  onChange={handleChange} /></TableCell>
                                                                                                    <TableCell width="5%" component="td"> <Checkbox id={`permission.${data?.order_sequence}.edit `} checked={data?.edit}  onChange={handleChange} /></TableCell>
                                                                                                    <TableCell width="5%" component="td"> <Checkbox id={`permission.${data?.order_sequence}.delete `} checked={data?.delete}  onChange={handleChange} /></TableCell>
                                                                                                    <TableCell width="5%" component="td"> <Checkbox id={`permission.${data?.order_sequence}.print `} checked={data?.print}  onChange={handleChange} /></TableCell>
                                                                                                    <TableCell width="5%" component="td"> <Checkbox id={`permission.${data?.order_sequence}.import `} checked={data?.import}  onChange={handleChange} /></TableCell>
                                                                                                    <TableCell width="5%" component="td"> <Checkbox id={`permission.${data?.order_sequence}.export `} checked={data?.export}  onChange={handleChange} /></TableCell>
                                                                                                    <TableCell width="5%" component="td"> <Checkbox id={`permission.${data?.order_sequence}.email `} checked={data?.email}  onChange={handleChange} /></TableCell>
                                                                                                </TableRow>    
                                                                                            </TableCell>
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
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </form>



        </>
    );
};

export default AddRole;
