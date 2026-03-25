"use client"
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Formik, Form as FormikForm, Field, ErrorMessage, useFormik } from "formik";
import { Card, CardContent, CardHeader, FormHelperText, InputLabel, MenuItem, MobileStepper, Paper, Select, Tooltip, useTheme } from "@mui/material";
import { FormControl, Grid, TextField } from "@mui/material";
import { SelectedFilterLangDataFromStore } from "@/store/slices/general_slices/selected-multilanguage-slice";
import { useDispatch, useSelector } from "react-redux";
import { get_access_token } from "@/store/slices/auth/token-login-slice";
// import { fetchProductmodel, fetchProduct, fetchProductcapacity, fetchdealer } from "@/services/api/installation-api/get-product-model-api";
import {
    FetchCitiesForAddressForm,
    FetchPostalCodeByStateCity,
    FetchStateForAddressForm,
    get_arealist,
} from "@/services/api/general_apis/customer-form-data-api";

import { get_customer_byemailid, get_customer_byphone } from "@/services/api/customer-api/getcustomer-api";
import { get_rolesname_list } from "@/services/api/roles/roles-api"
import InstallationApi from "@/services/api/installation-api/add-installation-api";
import { userFromValidation } from "@/validation/userFromValidation";
import { showToast } from "../../ToastNotificationNew";
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';
import Button from '@mui/material/Button';
import SaveIcon from '@mui/icons-material/Save';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { ArrowBackIosNewOutlined, KeyboardArrowLeft, KeyboardArrowRight } from "@mui/icons-material";
import classNames from "classnames";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { styled } from '@mui/material/styles';
import { TimeField } from '@mui/x-date-pickers/TimeField';
import { get_userby_name, submit_edituser } from "@/services/api/users/users-api";
import { get_designation_list } from "@/services/api/setup/designation-api";
import { get_department_list } from "@/services/api/setup/department-api";
import { get_gender_list } from "@/services/api/setup/gender-api";
import { get_branch_list } from "@/services/api/setup/branch-api";



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

const EditUser: any = (slug) => {
    const router = useRouter();
    const params: any = useParams();
    const dispatch = useDispatch();
    const TokenFromStore: any = useSelector(get_access_token);
    const [userToken, setUserToken] = useState<any>(() => {
        const initialValue = JSON.parse(localStorage.getItem('AccessTokenData') || '{}');
        return initialValue || "";
    });

    const userid = slug?.name;

    const SelectedLangDataFromStore: any = useSelector(
        SelectedFilterLangDataFromStore
    );
    const [selectedMultiLangData, setSelectedMultiLangData] = useState<any>();

    const [err, setErr] = useState<boolean>(false);
    let [selectedCity, setSelectedCity] = useState<any>("");
    let [selectedStates, setSelectedStates] = useState<any>("");
    let [city, setCity] = useState<any>([]);
    let [state, setState] = useState<any>([]);
    let [area, setArea] = useState<any>([]);
    let [selectedPincode, setSelectedPincode] = useState<any>("");
    let [pincode, setPincode] = useState<any>([]);
    let [rolelist, setRolelist] = useState<any>([]);
    let [genderlist, setGenderlist] = useState<any>([]);
    let [designationlist, setDesignationlist] = useState<any>([]);
    let [branchlist, setBranchlist] = useState<any>([]);
    let [departmentlist, setDepartmentlist] = useState<any>([]);
    
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [imgsSrc, setImgsSrc] = useState<any>([]);
    const [userData, setuserData] = useState<any>([]);
    const [selectedAddress, setSelectedAddress] = useState<any | null>(null);

    const theme = useTheme();
    const [activeStep, setActiveStep] = React.useState(0);
    let [selectedRoles, setSelectedRoles] = useState<any>("");
    let [userdetaildata, setUserdetaildata] = useState<any>([]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (localStorage.getItem('userProfileData') != 'undefined') {
                console.log("userdata 1", JSON.parse(localStorage.getItem('userProfileData') || '[]'));

                // alert(localStorage.getItem('userData'))
                setuserData(JSON.parse(localStorage.getItem('userProfileData') || '[]'))
            }
        }
    }, []);
    function getDate() {
        const today = new Date();
        console.log('today', today);
        const month = today.getMonth() + 1;
        const year = today.getFullYear();
        const date = today.getDate();

        // const dt = new Date(`${date}/${month}/${year}`);
        const dt = new Date(`${month}/${date}/${year}`);
        console.log('dt', dt);
        // console.log('format',format(new Date(dt), "dd/MM/Y"));
        // console.log('dt', dt.toLocaleDateString('es-IN'));
        return dt;
    }
    const [initialValues, setInitialValues] = useState({
        id: "",
        firstname: "",
        lastname: "",
        useremailid: "",
        userphonenumber: "",
        employeenumber: "",
        role: "",
        gender: "",
        dateofbirth: "",
        dateofjoining: "",
        designation: "",
        department: "",
        branch: "",
        useraddress: "",
        state: "",
        city: "",
        userpincode: "",
        addressid: "",
    });

    useEffect(() => {
        if (
            Object.keys(SelectedLangDataFromStore?.selectedLanguageData)?.length > 0
        ) {
            setSelectedMultiLangData(SelectedLangDataFromStore?.selectedLanguageData);
        }
        console.log("installation list");
    }, [SelectedLangDataFromStore]);

    useEffect(() => {
        


        const getStateData: any = async () => {
            const stateData: any = await FetchStateForAddressForm(
                userToken?.access_token
            );
            console.log(stateData, 'stateData', stateData?.length);
            if (stateData?.length > 0) {
                let stateValues: any = stateData
                    .map((item: any) => item?.name)
                    .filter((item: any) => item !== null);

                const stateArrys = [{ value: "", label: "" }]
                stateData
                    .map((item: any) => {
                        stateArrys.push({ value: item.name, label: item.name })
                    })

                setState(stateArrys);
            } else {
                setErr(!err);
            }
        };

        const getRoleData: any = async () => {
            const roleData: any = await get_rolesname_list(
                userToken?.access_token
            );
            console.log(roleData, 'roleData', roleData?.length);
            if (roleData?.length > 0) {
                const roleArrys = [{ value: "", label: "" }]
                roleData
                    .map((item: any) => {
                        roleArrys.push({ value: item.rolekey, label: item.label })
                    })

                setRolelist(roleArrys);
            } else {
                setErr(!err);
            }
        };

        const getDesignationlist: any = async () => {
            const roleData: any = await get_designation_list(
                userToken?.access_token
            );
            console.log(roleData, 'roleData', roleData?.length);
            if (roleData?.length > 0) {
                const roleArrys = [{ value: "", label: "" }]
                roleData
                    .map((item: any) => {
                        roleArrys.push({ value: item.key, label: item.label })
                    })

                setDesignationlist(roleArrys);
            } else {
                setErr(!err);
            }
        };

        const getGenderlist: any = async () => {
            const genderData: any = await get_gender_list(
                userToken?.access_token
            );
            console.log(genderData, 'genderData', genderData?.length);
            if (genderData?.length > 0) {
                const AArrys = [{ value: "", label: "" }]
                genderData
                    .map((item: any) => {
                        AArrys.push({ value: item.key, label: item.label })
                    })

                setGenderlist(AArrys);
            } else {
                setErr(!err);
            }
        };

        const getDepartmentlist: any = async () => {
            const departmentData: any = await get_department_list(
                userToken?.access_token
            );
            console.log(departmentData, 'departmentData', departmentData?.length);
            if (departmentData?.length > 0) {
                const AArrys = [{ value: "", label: "" }]
                departmentData
                    .map((item: any) => {
                        AArrys.push({ value: item.key, label: item.label })
                    })

                setDepartmentlist(AArrys);
            } else {
                setErr(!err);
            }
        };

        const getbranchlist: any = async () => {
            const branchData: any = await get_branch_list(
                userToken?.access_token
            );
            console.log(branchData, 'branchData', branchData?.length);
            if (branchData?.length > 0) {
                const AArrys = [{ value: "", label: "" }]
                branchData
                    .map((item: any) => {
                        AArrys.push({ value: item.key, label: item.label })
                    })

                setBranchlist(AArrys);
            } else {
                setErr(!err);
            }
        };
       

        const getAreaData: any = async () => {
            const areaData: any = await get_arealist(
                userToken?.access_token
            );
            console.log(areaData, 'areaData', areaData?.length);
            if (areaData?.length > 0) {
                let areaValues: any = areaData
                    .map((item: any) => item?.name)
                    .filter((item: any) => item !== null);

                const areaArrys = [{ value: "", label: "" }]
                areaData
                    .map((item: any) => {
                        areaArrys.push({ value: item.name, label: item.name })
                    })

                setArea(areaArrys);
            } else {
                setErr(!err);
            }
        };


        getStateData();
        getRoleData();
        getAreaData();
        getDesignationlist();
        getGenderlist();
        getDepartmentlist();
        getbranchlist();
    }, []);

    useEffect(() => {

        const getuserdata: any = async () => {
          const { search } = window.location;
    
          if (userid == undefined)
            return
            // alert(role_name)
            const getuserData: any = await get_userby_name(
                { id: userid },
                userToken?.access_token
                );
          console.log('######rolesData', getuserData);
          if (getuserData != undefined) {
            setInitialValues(getuserData);
            setUserdetaildata(getuserData);
            setSelectedStates(getuserData?.state);
            handleSelectedState(getuserData?.state);
            // formik.setFieldValue('role', getuserData?.role_profile_name);
            handleSelectedPincode(getuserData?.city);
            setSelectedRoles(userdetaildata.role_profile_name);
          } else {
            setErr(!err);
            console.log(!err)
            // location.href='/roles'
          }
        };
    
        getuserdata();
    
    
      }, [params]);

    useEffect(() => {
        console.log('servicerequestdata 348', userdetaildata.id);
        if (userdetaildata.id != undefined) {
            setSelectedStates(userdetaildata.state);
            handleSelectedState(userdetaildata.state);
            // formik.setFieldValue('role', userdetaildata.role);
            handleSelectedPincode(userdetaildata.city);
            // formik.values.role = userdetaildata.role_profile_name;
            console.log('role useeffect', formik?.values?.role);
            
            // setInitialValues(servicerequestdata);
            // handleSelectedState(servicerequestdata.state);
            // setSelectedStates(servicerequestdata.state);
            // console.log(selectedStates, 'pincode 353', servicerequestdata.state, 'city' ,servicerequestdata.city)
            // handleSelectedPincode(servicerequestdata.city)
            // console.log(servicerequestdata.item_code, 'initialValues.productmodel',initialValues.productmodel);
            // getProductModel(servicerequestdata.jobtype);
            // setSelectedPincode(servicerequestdata.customerpincode)
            // formik.setFieldValue('productmodel', servicerequestdata.item_code);
        }
    
      }, [userdetaildata]);


    const handleEmailChange: any = async (emailvalue: string) => {
        console.log(emailvalue)
        // const getCustomerdetails: any = await get_customer_byemailid(
        //     emailvalue,
        //     userToken?.access_token
        // );
        // console.log("get customer by email", getCustomerdetails);
        // if (getCustomerdetails) {

        //     handleSelectedState(getCustomerdetails?.state);
        //     setSelectedStates(getCustomerdetails?.state);
        //     formik.setFieldValue('state', getCustomerdetails?.state);
        //     formik.setFieldValue('city', getCustomerdetails?.city);
        //     console.log(getCustomerdetails?.state)
        //     handleSelectedPincode(getCustomerdetails?.city)
        //     formik.setFieldValue('pincode', getCustomerdetails?.pincode);
        //     formik.setFieldValue('address', getCustomerdetails?.address_line1);
        //     formik.setFieldValue('userphonenumber', getCustomerdetails?.phone);
        //     formik.setFieldValue('customerarea', getCustomerdetails?.territory);
            

        // }
    };

    const handlephoneChange: any = async (phonevalue: string) => {
        console.log(phonevalue)
        // if (formik.values.useremailid == "") {
        //     const getCustomerdetails: any = await get_customer_byphone(
        //         phonevalue,
        //         userToken?.access_token
        //     );
        //     console.log("get customer by phone", getCustomerdetails);
        //     if (getCustomerdetails) {
    
        //         handleSelectedState(getCustomerdetails?.state);
        //         setSelectedStates(getCustomerdetails?.state);
        //         formik.setFieldValue('state', getCustomerdetails?.state);
        //         formik.setFieldValue('city', getCustomerdetails?.city);
        //         console.log(getCustomerdetails?.state)
        //         handleSelectedPincode(getCustomerdetails?.city)
        //         formik.setFieldValue('customerpincode', getCustomerdetails?.pincode);
        //         formik.setFieldValue('customeraddress', getCustomerdetails?.address_line1);
        //         formik.setFieldValue('customerphonenumber', getCustomerdetails?.phone);
        //         formik.setFieldValue('customerarea', getCustomerdetails?.territory);
        //         formik.setFieldValue('customername', getCustomerdetails?.customername);
        //         formik.setFieldValue('customeremailid', getCustomerdetails?.email_id);
        //         // console.log(initialValues, "==============")
    
        //     }
        // }
    };

    const handleSelectedState: any = async (stateValue: string) => {
        setSelectedStates(stateValue);
        setSelectedCity("");
        setCity([]);
        setPincode([]);
        const getCitiesFromState: any = await FetchCitiesForAddressForm(
            stateValue,
            userToken?.access_token
        );
        console.log("cities values", getCitiesFromState);
        if (getCitiesFromState?.length > 0) {
            let citiesValues: any = getCitiesFromState
                .map((item: any) => item.name)
                .filter((item: any) => item !== null);

            const cityArrys = [{ value: "", label: "" }]
            getCitiesFromState
                .map((item: any) => {
                    cityArrys.push({ value: item.name, label: item.name })
                })

            setCity(cityArrys);
        }
    };
    const handleSelectedPincode: any = async (cityValue: string) => {
        console.log("cityValue", cityValue);
        console.log("selectedStates", selectedStates);

        setPincode([]);
        const getPincodesFromStateCity: any = await FetchPostalCodeByStateCity(
            selectedStates,
            cityValue,
            userToken?.access_token
        );
        console.log("pincodes values", getPincodesFromStateCity);
        if (getPincodesFromStateCity?.length > 0) {
            let pincodesValues: any = getPincodesFromStateCity
                .map((item: any) => item.label)
                .filter((item: any) => item !== null);

            const pincodeArrys = [{ value: "", label: "" }]
            getPincodesFromStateCity
                .map((item: any) => {
                    pincodeArrys.push({ value: item.label, label: item.label })
                })
            setPincode(pincodeArrys);
        }
    };
    const handlesubmit: any = async (values: any, action: any) => {

        const formData = new FormData();
        // console.log('selectedFiles', selectedFiles);

        // selectedFiles.forEach((file) => {
        //     formData.append('images[]', file);
        //     // formData.append('file_name', file["name"]);
        //     console.log(file);
        // });
        // values.files = formData;

        Object.keys(values).forEach(function (key) {
            console.log(key, "============", values[key]);
            formData.append(key, values[key])
        });

       

       
        console.log("values userData", values);


        let userApiRes: any = await submit_edituser(formData, userToken?.access_token);


        // console.log(userApiRes, 'hi');


        if (userApiRes?.msg === "success") {
            showToast(userApiRes?.data.msg, "success");
            router.push("/user/users");
        } else {
            showToast(userApiRes?.error, "error");
        }



        // alert(JSON.stringify(InstallationApiRes, null, 2));
    };

    const handleFileChange = (e) => {
        // setImgsSrc([])
        // if (e.target.files.length > 3) {
        //     showToast("Upload only 3 images", "error");
        // } else {
        //     let validimage = true

        //     for (const file of e.target.files) {
        //         if (!file.name.match(/\.(jpg|jpeg|png|gif|JPG|JPEG|PNG|GIF)$/)) {
        //             showToast("Please select valid image", "error");
        //             validimage = false
        //             return false;
        //         }
        //         const reader = new FileReader();
        //         reader.readAsDataURL(file);
        //         reader.onload = () => {
        //             setImgsSrc((imgs: any) => [...imgs, reader.result]);
        //         };
        //         reader.onerror = () => {
        //             console.log(reader.error);
        //         };
        //     }
        //     setSelectedFiles(Array.from(e.target.files));
        //     console.log('selectedFiles11', selectedFiles);
        //     // if(validimage){

        //     // }

        // }
    };
   
    const [inputFile, setInputFile] = useState<HTMLInputElement | null>(null);
    useEffect(() => {
        setInputFile(document.getElementById("input-file") as HTMLInputElement);
    }, []);
    const handleUpload = (e) => {
        e.preventDefault();
        inputFile?.click();

    };
    const deleteRow = (value, index) => {
        const newArray = [...selectedFiles.slice(0, index), ...selectedFiles.slice(index + 1)];
        setSelectedFiles((newArray))
        console.log('selectedFiles1', selectedFiles);
        setImgsSrc(oldValues => {
            oldValues = oldValues.filter(link => link !== value);
            return oldValues
        })
    }
    const handleNext = () => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleStepChange = (step) => {
        setActiveStep(step);
    };

    const formik = useFormik({
        initialValues: initialValues,
        validationSchema: userFromValidation,
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


    useEffect(() => {
        // formik.values.dealer = (userData.userType == "Dealer") ? userData?.contact_name : (userData.userType == "Customer" || userData.userType == "Surveyor") ? userData.associated_to : ""
    }, [userData]);



    return (
        <>
            <form onSubmit={formik.handleSubmit} className='flex flex-col gap-5 py-5 px-5'>

                <Grid container spacing={5}>
                    <Grid item xs={12} md={12} lg={12}>

                        <div className="flex flex-wrap justify-between max-sm:flex-col sm:items-center gap-x-6 gap-y-4">
                            <div className="flex flex-col items-start gap-2">
                                <Typography variant='h4'>{(selectedMultiLangData?.edit_user) ? selectedMultiLangData?.edit_user : "Edit User"}</Typography>
                            </div>
                            {userData?.userType != "Customer" && userData?.userType != "Surveyor" ?
                                (
                                    <>
                                        <div className='flex items-center justify-between flex-wrap gap-3'>
                                            <Button variant="outlined" href={`/user/users`} startIcon={<i className="ri-arrow-go-back-line" />} size="medium">
                                                {selectedMultiLangData?.back}
                                            </Button>
                                            <Button variant="contained" type="submit" startIcon={<i className="ri-save-3-line" />} size="medium">
                                                {(selectedMultiLangData?.save_btn) ? selectedMultiLangData?.save_btn : "Save"}
                                            </Button>
                                        </div>
                                    </>
                                ) : ("")}
                        </div>
                    </Grid>
                    <Grid item xs={12} sm={12}>
                        <Grid container spacing={6}>
                            
                            <Grid item xs={12} sm={12}>
                                <Card sx={{boxShadow:'none'}} className="border">
                                    <CardHeader title={"Basic Info"} />
                                    <CardContent>
                                        <Grid container spacing={6}>
                                            <Grid item xs={12} sm={6}>
                                                <TextField
                                                    fullWidth
                                                    id="firstname"
                                                    name="firstname"
                                                    label={(selectedMultiLangData?.lbl_firstname) ? selectedMultiLangData?.lbl_firstname : "First name"}
                                                    placeholder={'Enter first name'}
                                                    value={formik.values.firstname || ''}
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur}
                                                    error={formik.touched.firstname && Boolean(formik.errors.firstname)}
                                                    helperText={formik.touched.firstname && formik.errors.firstname}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <TextField
                                                    fullWidth
                                                    id="lastname"
                                                    name="lastname"
                                                    label={(selectedMultiLangData?.lbl_lastname) ? selectedMultiLangData?.lbl_lastname : "Last name"}
                                                    placeholder={'Enter last name'}
                                                    value={formik.values.lastname || ''}
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur}
                                                    error={formik.touched.lastname && Boolean(formik.errors.lastname)}
                                                    helperText={formik.touched.lastname && formik.errors.lastname}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <TextField
                                                    disabled
                                                    fullWidth
                                                    id="useremailid"
                                                    name="useremailid"
                                                    label={(selectedMultiLangData?.lbl_useremailid) ? selectedMultiLangData?.lbl_useremailid : "Email"}
                                                    placeholder={'Enter email'}
                                                    value={formik.values.useremailid || ''}
                                                    onChange={formik.handleChange}
                                                    onBlur={(e) => {
                                                        handleEmailChange(e?.target?.value);
                                                        formik.handleBlur;
                                                    }}
                                                    
                                                    error={formik.touched.useremailid && Boolean(formik.errors.useremailid)}
                                                    helperText={formik.touched.useremailid && formik.errors.useremailid}
                                                />
                                            </Grid>

                                            <Grid item xs={12} sm={6}>
                                                <TextField
                                                    fullWidth
                                                    id="userphonenumber"
                                                    name="userphonenumber"
                                                    label={(selectedMultiLangData?.lbl_customerphone) ? selectedMultiLangData?.lbl_customerphone : "Phone number"}
                                                    placeholder={'Enter phone number'}
                                                    value={formik.values.userphonenumber || ''}
                                                    onChange={formik.handleChange}
                                                    onBlur={(e) => {
                                                        handlephoneChange(e?.target?.value);
                                                        formik.handleBlur;
                                                    }}
                                                    error={formik.touched.userphonenumber && Boolean(formik.errors.userphonenumber)}
                                                    helperText={formik.touched.userphonenumber && formik.errors.userphonenumber}
                                                />
                                            </Grid>
                                            
                                            <Grid item xs={12} sm={6}>
                                                <TextField
                                                    fullWidth
                                                    id="employeenumber"
                                                    name="employeenumber"
                                                    label={(selectedMultiLangData?.lbl_employeenumber) ? selectedMultiLangData?.lbl_employeenumber : "Employee number"}
                                                    placeholder={'Enter employee number'}
                                                    value={formik.values.employeenumber || ''}
                                                    onChange={formik.handleChange}
                                                    onBlur={(e) => {
                                                        handlephoneChange(e?.target?.value);
                                                        formik.handleBlur;
                                                    }}
                                                    error={formik.touched.employeenumber && Boolean(formik.errors.employeenumber)}
                                                    helperText={formik.touched.employeenumber && formik.errors.employeenumber}
                                                />
                                            </Grid>
                                           
                                         
                                          
                                           
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={12} sm={12}>
                                <Card sx={{boxShadow:'none'}} className="border">
                                    <CardHeader title={"Role"} />
                                    <CardContent>
                                        <Grid container spacing={6}>
                                            <Grid item xs={12} sm={6}>
                                                <FormControl fullWidth error={formik.touched.role && Boolean(formik.errors.role)}>
                                                        <InputLabel id="role">{(selectedMultiLangData?.lbl_role) ? selectedMultiLangData?.lbl_role : "Role"}</InputLabel>
                                                        <Select
                                                            label={(selectedMultiLangData?.lbl_role) ? selectedMultiLangData?.lbl_role : "Role"}
                                                            id="role"
                                                            name="role"
                                                            placeholder={`Select Role`}
                                                            value={formik?.values?.role || selectedRoles || ""}
                                                            onChange={(e) => {
                                                                const value = e?.target?.value;
                                                                formik.setFieldValue('role', value);
                                                                console.log(value, 'role', formik?.values?.role);
                                                                setSelectedRoles(value);
                                                                formik.handleChange;
                                                            }}
                                                        >
                                                            {rolelist.map((option) => (
                                                                <MenuItem key={option.value} value={option.value}>
                                                                    {option.label}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                        {formik.touched.role && formik.errors.role && (
                                                            <FormHelperText>
                                                                {typeof formik.errors.role === "string"
                                                                ? formik.errors.role
                                                                : " "}
                                                            </FormHelperText>
                                                            )}
                                                    </FormControl>
                                            </Grid>
                                          
                                           
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={12} sm={12}>
                                <Card sx={{boxShadow:'none'}} className="border">
                                    <CardHeader title={"More Information"} />
                                    <CardContent>
                                        <Grid container spacing={6}>
                                            <Grid item xs={12} sm={6}>
                                                <FormControl fullWidth error={formik.touched.gender && Boolean(formik.errors.gender)}>
                                                        <InputLabel id="gender">{(selectedMultiLangData?.lbl_gender) ? selectedMultiLangData?.lbl_gender : "Gender"}</InputLabel>
                                                        <Select
                                                            label={(selectedMultiLangData?.lbl_gender) ? selectedMultiLangData?.lbl_gender : "Gender"}
                                                            id="gender"
                                                            name="gender"
                                                            placeholder={`Select Gender`}
                                                            value={formik?.values?.gender || ""}
                                                            onChange={(e) => {
                                                                const value = e?.target?.value;
                                                                formik.setFieldValue('gender', value);
                                                                formik.handleChange;
                                                            }}
                                                        >
                                                            {genderlist.map((option) => (
                                                                <MenuItem key={option.value} value={option.value}>
                                                                    {option.label}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                        {formik.touched.gender && formik.errors.gender && (
                                                            <FormHelperText>
                                                                {typeof formik.errors.gender === "string"
                                                                ? formik.errors.gender
                                                                : " "}
                                                            </FormHelperText>
                                                            )}
                                                    </FormControl>
                                            </Grid>

                                            <Grid item xs={12} sm={6}>
                                                <TextField
                                                    fullWidth
                                                    id="dateofbirth"
                                                    name="dateofbirth"
                                                    type="date"
                                                    label={(selectedMultiLangData?.lbl_dateofbirth) ? selectedMultiLangData?.lbl_dateofbirth : "Date of birth"}
                                                    placeholder={'Select Date of birth'}
                                                    value={formik.values.dateofbirth || getDate()}
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur}
                                                    error={formik.touched.dateofbirth && Boolean(formik.errors.dateofbirth)}
                                                    helperText={formik.touched.dateofbirth && formik.errors.dateofbirth}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <TextField
                                                    fullWidth
                                                    id="dateofjoining"
                                                    name="dateofjoining"
                                                    type="date"
                                                    label={(selectedMultiLangData?.lbl_dateofjoining) ? selectedMultiLangData?.lbl_dateofjoining : "Date of Joining"}
                                                    placeholder={'Select Date of joining'}
                                                    value={formik.values.dateofjoining || getDate()}
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur}
                                                    error={formik.touched.dateofjoining && Boolean(formik.errors.dateofjoining)}
                                                    helperText={formik.touched.dateofjoining && formik.errors.dateofjoining}
                                                />
                                            </Grid>
                                          
                                           
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={12} sm={12}>
                                <Card sx={{boxShadow:'none'}} className="border">
                                    <CardHeader title={"Company Details"} />
                                    <CardContent>
                                        <Grid container spacing={6}>
                                            <Grid item xs={12} sm={6}>
                                                <FormControl fullWidth error={formik.touched.designation && Boolean(formik.errors.designation)}>
                                                        <InputLabel id="designation">{(selectedMultiLangData?.lbl_designation) ? selectedMultiLangData?.lbl_designation : "Designation"}</InputLabel>
                                                        <Select
                                                            label={(selectedMultiLangData?.lbl_designation) ? selectedMultiLangData?.lbl_designation : "Designation"}
                                                            id="designation"
                                                            name="designation"
                                                            placeholder={`Select designation`}
                                                            value={formik?.values?.designation || ""}
                                                            onChange={(e) => {
                                                                const value = e?.target?.value;
                                                                formik.setFieldValue('designation', value);
                                                                formik.handleChange;
                                                            }}
                                                        >
                                                            {designationlist.map((option) => (
                                                                <MenuItem key={option.value} value={option.value}>
                                                                    {option.label}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                        {formik.touched.designation && formik.errors.designation && (
                                                            <FormHelperText>
                                                                {typeof formik.errors.designation === "string"
                                                                ? formik.errors.designation
                                                                : " "}
                                                            </FormHelperText>
                                                            )}
                                                    </FormControl>
                                            </Grid>

                                            <Grid item xs={12} sm={6}>
                                                <FormControl fullWidth error={formik.touched.department && Boolean(formik.errors.department)}>
                                                        <InputLabel id="department">{(selectedMultiLangData?.lbl_department) ? selectedMultiLangData?.lbl_department : "Department"}</InputLabel>
                                                        <Select
                                                            label={(selectedMultiLangData?.lbl_department) ? selectedMultiLangData?.lbl_department : "Department"}
                                                            id="department"
                                                            name="department"
                                                            placeholder={`Select department`}
                                                            value={formik?.values?.department || ""}
                                                            onChange={(e) => {
                                                                const value = e?.target?.value;
                                                                formik.setFieldValue('department', value);
                                                                formik.handleChange;
                                                            }}
                                                        >
                                                            {departmentlist.map((option) => (
                                                                <MenuItem key={option.value} value={option.value}>
                                                                    {option.label}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                        {formik.touched.department && formik.errors.department && (
                                                            <FormHelperText>
                                                                {typeof formik.errors.department === "string"
                                                                ? formik.errors.department
                                                                : " "}
                                                            </FormHelperText>
                                                            )}
                                                    </FormControl>
                                            </Grid>

                                            <Grid item xs={12} sm={6}>
                                                <FormControl fullWidth error={formik.touched.branch && Boolean(formik.errors.branch)}>
                                                        <InputLabel id="branch">{(selectedMultiLangData?.lbl_branch) ? selectedMultiLangData?.lbl_branch : "Branch"}</InputLabel>
                                                        <Select
                                                            label={(selectedMultiLangData?.lbl_branch) ? selectedMultiLangData?.lbl_branch : "Branch"}
                                                            id="branch"
                                                            name="branch"
                                                            placeholder={`Select Branch`}
                                                            value={formik?.values?.branch || ""}
                                                            onChange={(e) => {
                                                                const value = e?.target?.value;
                                                                formik.setFieldValue('branch', value);
                                                                formik.handleChange;
                                                            }}
                                                        >
                                                            {branchlist.map((option) => (
                                                                <MenuItem key={option.value} value={option.value}>
                                                                    {option.label}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                        {formik.touched.branch && formik.errors.branch && (
                                                            <FormHelperText>
                                                                {typeof formik.errors.branch === "string"
                                                                ? formik.errors.branch
                                                                : " "}
                                                            </FormHelperText>
                                                            )}
                                                    </FormControl>
                                            </Grid>

                                          
                                           
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={12} sm={12}>
                                <Card sx={{boxShadow:'none'}} className="border">
                                    <CardHeader title={"Address"} />
                                    <CardContent>
                                        <Grid container spacing={6}>
                                            <Grid item xs={12} sm={6}>
                                                <TextField
                                                    fullWidth
                                                    multiline
                                                    rows={2}
                                                    id="useraddress"
                                                    name="useraddress"
                                                    label={(selectedMultiLangData?.lbl_useraddress) ? selectedMultiLangData?.lbl_useraddress : "Address"}
                                                    placeholder={'Enter Address'}
                                                    value={formik.values.useraddress || selectedAddress?.address_line1 || ""}
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur}
                                                    error={formik.touched.useraddress && Boolean(formik.errors.useraddress)}
                                                    helperText={formik.touched.useraddress && formik.errors.useraddress}
                                                />
                                            </Grid>
                                            

                                            <Grid item xs={12} sm={6}>
                                                <FormControl fullWidth error={formik.touched.state && Boolean(formik.errors.state)}>
                                                    <InputLabel id="state">{(selectedMultiLangData?.lbl_state) ? selectedMultiLangData?.lbl_state : "State"}</InputLabel>
                                                    {/* {selectedAddress?.state} */}
                                                    <Select
                                                        label={(selectedMultiLangData?.lbl_state) ? selectedMultiLangData?.lbl_state : "State"}
                                                        id="state"
                                                        name="state"
                                                        placeholder={`Select State`}
                                                        value={formik?.values?.state || selectedAddress?.state || ""}
                                                        onChange={(e) => {
                                                            const value = e?.target?.value;
                                                            formik.setFieldValue('state', value);
                                                            setSelectedStates(e?.target?.value);
                                                            handleSelectedState(value);
                                                            formik.handleChange;
                                                        }}
                                                    >
                                                        {state.map((option) => (
                                                            <MenuItem key={option.value} value={option.value}>
                                                                {option.label}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                    {formik.touched.state && formik.errors.state && (
                                                        <FormHelperText>
                                                            {typeof formik.errors.state === "string"
                                                            ? formik.errors.state
                                                            : " "}
                                                        </FormHelperText>
                                                        )}
                                                </FormControl>
                                            </Grid>
                                           
                                            <Grid item xs={12} sm={6}>
                                                <FormControl fullWidth error={formik.touched.city && Boolean(formik.errors.city)}>
                                                    <InputLabel id="city">{(selectedMultiLangData?.lbl_district) ? selectedMultiLangData?.lbl_district : "District"}</InputLabel>
                                                    {/* {selectedAddress?.city} */}
                                                    <Select
                                                        label={"District"}
                                                        id="city"
                                                        name="city"
                                                        placeholder={`Select District`}
                                                        value={formik?.values?.city || selectedAddress?.city || ""}
                                                        onChange={(e) => {
                                                            const value = e?.target?.value;
                                                            formik.setFieldValue('city', value);
                                                            setSelectedCity(value);
                                                            handleSelectedPincode(value);
                                                            formik.handleChange;
                                                        }}
                                                    >
                                                        {city.map((option) => (
                                                            <MenuItem key={option.value} value={option.value}>
                                                                {option.label}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                   {formik.touched.city && formik.errors.city && (
                                                        <FormHelperText>
                                                            {typeof formik.errors.city === "string"
                                                            ? formik.errors.city
                                                            : " "}
                                                        </FormHelperText>
                                                        )}
                                                </FormControl>
                                            </Grid>
                                            
                                            
                                            <Grid item xs={12} sm={6}>
                                                <FormControl fullWidth error={formik.touched.userpincode && Boolean(formik.errors.userpincode)}>
                                                    <InputLabel id="userpincode">{(selectedMultiLangData?.lbl_postalcode) ? selectedMultiLangData?.lbl_postalcode : "Zip/Postal Code"}</InputLabel>
                                                    {/* {selectedAddress?.pincode} */}
                                                    <Select
                                                        label={(selectedMultiLangData?.lbl_postalcode) ? selectedMultiLangData?.lbl_postalcode : "Zip/Postal Code"}
                                                        id="userpincode"
                                                        name="userpincode"
                                                        value={formik.values.userpincode || selectedAddress?.pincode || ""}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            formik.setFieldValue('userpincode', value);
                                                            setSelectedPincode(value);
                                                        }}
                                                    >
                                                        {pincode.map((option) => (
                                                            <MenuItem key={option.value} value={option.value}>
                                                                {option.label}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                    {formik.touched.userpincode && formik.errors.userpincode && (
                                                        <FormHelperText>
                                                            {typeof formik.errors.userpincode === "string"
                                                            ? formik.errors.userpincode
                                                            : " "}
                                                        </FormHelperText>
                                                        )}
                                                </FormControl>
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

export default EditUser;
