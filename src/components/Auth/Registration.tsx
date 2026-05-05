import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Formik, Form as FormikForm, Field, ErrorMessage } from "formik";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RegistrationValidation } from "../../validation/registrationValidation";
import Image from "next/image";
import { register_details } from "../dataSets/registrationDataset";
import {
  getRegistrationData,
  registration_state,
} from "../../store/slices/auth/registration_slice";
import {
  FetchCitiesForAddressForm,
  FetchPostalCodeByStateCity,
  FetchStateForAddressForm,
} from "../../services/api/general_apis/customer-form-data-api";
import { SelectedFilterLangDataFromStore } from "../../store/slices/general_slices/selected-multilanguage-slice";
import { get_access_token } from "../../store/slices/auth/token-login-slice";
import RegistrationApi from "../../services/api/auth/registration_api";
import useMultilangHook from "../../hooks/LanguageHook/Multilanguages-hook";
import { showToast } from "../ToastNotificationNew";
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { InputLabel } from "@mui/material";

const Registration = (multi_lang: any) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const TokenFromStore: any = useSelector(get_access_token);

  const [selectedMultiLangData, setSelectedMultiLangData] = useState<any>();
  const SelectedLangDataFromStore: any = useSelector(
    SelectedFilterLangDataFromStore
  );
  const { handleLanguageChange, multiLanguagesData }: any = useMultilangHook();
  const RegistrationDataFromStore: any = useSelector(registration_state);
  useEffect(() => {
    if (
      multi_lang?.multi_lang?.multiLingualValues.length>0 && Object.keys(multi_lang?.multi_lang?.multiLingualValues[0]?.value)?.length > 0
    ) {
      setSelectedMultiLangData(multi_lang?.multi_lang?.multiLingualValues[0]?.value);
    }
  });
  console.log("register details", RegistrationDataFromStore);
  let [selectedCity, setSelectedCity] = useState<any>("");
  let [selectedStates, setSelectedStates] = useState<any>("");
  let [selectedPincode, setSelectedPincode] = useState<any>("");
  let [selectedusertype, setSelectedUsertype] = useState<any>("");
  let [user_type, setUsertype] = useState<any>(["Select a usertype", "Distributor","Dealer","Sub Dealer", "Customer", "Surveyor", "Employee"]);

  let [city, setCity] = useState<any>([]);
  let [pincode, setPincode] = useState<any>([]);
  const [err, setErr] = useState<boolean>(false);
  let [state, setState] = useState<any>([]);

  useEffect(() => {
    const getStateData: any = async () => {
      const stateData: any = await FetchStateForAddressForm(
        TokenFromStore?.token
      );
      console.log(stateData, 'stateData', stateData?.length);
      if (stateData?.length > 0) {
        let stateValues: any = stateData
          .map((item: any) => item?.name)
          .filter((item: any) => item !== null);
        setState(stateValues);
      } else {
        setErr(!err);
      }
    };
    getStateData();
  }, []);
  const handleSelectedState: any = async (stateValue: string) => {
    setSelectedCity("");
    setCity([]);
    setPincode([]);
    const getCitiesFromState: any = await FetchCitiesForAddressForm(
      stateValue,
      TokenFromStore?.token
    );
    console.log("cities values", getCitiesFromState);
    if (getCitiesFromState?.length > 0) {
      let citiesValues: any = getCitiesFromState
        .map((item: any) => item.name)
        .filter((item: any) => item !== null);

      console.log("cities values new", citiesValues);
      setCity(citiesValues);
    }
  };

  const handleSelectedPincode: any = async (cityValue: string) => {
    console.log("cityValue",cityValue);
    console.log("selectedStates",selectedStates);
    
    setPincode([]);
    const getPincodesFromStateCity: any = await FetchPostalCodeByStateCity(
      selectedStates,
      cityValue,
      TokenFromStore?.token
    );
    console.log("pincodes values", getPincodesFromStateCity);
    if (getPincodesFromStateCity?.length > 0) {
      let pincodesValues: any = getPincodesFromStateCity
        .map((item: any) => item.label)
        .filter((item: any) => item !== null);

      console.log("pincodes values new", pincodesValues);
      setPincode(pincodesValues);
    }
  };

  const handlesubmit: any = async (values: any, action: any) => {
    console.log("Reg values",values);
    
    let RegistrationApiRes: any = await RegistrationApi(values);

    if (RegistrationApiRes?.data?.message?.msg === "success") {
      showToast("Registerd sucessfully", "success");
      router.push("/login");
    } else {
      showToast(RegistrationApiRes?.data?.message?.error, "error");
    }
    action.resetForm();
  };

  const HandleRegistrationForm: any = (details: any) => {
    if (details.label === "full name") {
      return selectedMultiLangData?.full_name;
    } else if (details.label === "email address") {
      return selectedMultiLangData?.email;
    } else if (details.label === "mobile number") {
      return selectedMultiLangData?.mobile_number;
    } else if (details.label === "address") {
      return selectedMultiLangData?.address;
    } else if (details.label === "Street / Road Name") {
      return selectedMultiLangData?.address_2;
    } else if (details.label === "GST Number") {
      return selectedMultiLangData?.gst;
    } else if (details.label === "state") {
      return selectedMultiLangData?.state;
    } else if (details.label === "district") {
      return selectedMultiLangData?.district;
    } else if (details.label === "Pincode") {
      return selectedMultiLangData?.postal_code;
    } else if (details.label === "Password") {
      return selectedMultiLangData?.password;
    } else if (details.label === "Confirm Password") {
      return selectedMultiLangData?.confirm_password;
    } else if (details.label === "User type") {
      return selectedMultiLangData?.user_type;
    }else if (details.label === "Associated to") {
      return Capitalize(checkUserType(selectedusertype));
    }
  };
    const Capitalize = (str) => {      
    return str.charAt(0).toUpperCase() + str.slice(1);
    }
  const checkUserType = (user_type) => {
    let asso_data ="";
    if (user_type === "Dealer") {
      asso_data ="distributor name";
    } else if (user_type === "Sub Dealer" || user_type === "Customer" ||user_type === "Surveyor") {
      asso_data ="dealer name";
    };
    return asso_data;
 };
 const handleSelectChange = (event: SelectChangeEvent) => {
   
  setSelectedStates(event?.target?.value);
  handleSelectedState(event?.target?.value);
};

  return (
    <>
      
                  <div className="registration_form">
                    <div className="registr-heading text-center mb-2">
                      <h2 className="registration_title text-start">
                        {selectedMultiLangData?.signup}
                      </h2>
                    </div>
                    <Formik
                      initialValues={{
                        name: "",
                        email: "",
                        contact: "",
                        address_1: "",
                        address_2: "",
                        gst_number: "",
                        city: "",
                        state: "",
                        postal_code: "",
                        confirm_password: "",
                        user_type: selectedusertype,
                        associated_to: ""
                      }}
                      validationSchema={RegistrationValidation}                     
                      onSubmit={async (values, action) => {
                        console.log("submit values body",values)
                        // alert('herr');
                        handlesubmit(values, action); 
                        action.resetForm();
                    }}
                    >
                      {({ handleChange, handleBlur }) => (
                        <FormikForm>
                        <>
                                  {register_details.map((details: any, i) => (
                                    
                                    // <div className="row mt-3" key={i}>
                                      <FormControl sx={{ m: 1, minWidth: 120 }} size="small">

                                        {/* <div className="row"> */}
                                          {/* <div className="col-md-6"> */}
                                          <InputLabel id={details?.name}>{HandleRegistrationForm(details)}</InputLabel>
                                            {/* <Form.Label className="registration_label">
                                              {HandleRegistrationForm(details)}
                                            </Form.Label> */}
                                          {/* </div> */}
                                          {details?.name !== "state" &&
                                            details?.name !== "city" &&
                                            details?.name !== "postal_code" &&
                                            details?.name !== "user_type" ? (
                                            < >
                                              {details?.name==='associated_to'?
                                              (
                                                <>
                                                {selectedusertype==='Dealer' ||  selectedusertype==='Sub Dealer' || selectedusertype==='Customer' ||
                                                selectedusertype==='Surveyor' ? (
                                                <>
                                                  <TextField
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                onClick={handleChange}
                                                type={details?.type}
                                                name={details?.name}
                                                placeholder={`Enter ${checkUserType(selectedusertype)}`}
                                                label={` ${(HandleRegistrationForm(details))?HandleRegistrationForm(details):Capitalize(details.label)}`}
                                                fullWidth
                                              />
                                             
                                                <ErrorMessage
                                                  className="error_message"
                                                  name={details?.name}
                                                />
                                             </>

                                                ):(
                                                <>
                                                </>
                                                )}
                                                </>
                                              ):(
                                              <>
                                                <TextField
                                                  onChange={handleChange}
                                                  onBlur={handleBlur}
                                                  onClick={handleChange}
                                                  type={details?.type}
                                                  name={details?.name}
                                                  placeholder={`Enter ${details?.label}`}
                                        
                                                  label={` ${(HandleRegistrationForm(details))?HandleRegistrationForm(details):Capitalize(details.label)}`}
                                                  fullWidth
                                                />
                                                
                                                  <ErrorMessage
                                                    className="error_message"
                                                    name={details?.name}
                                                  />
                                                
                                              </>
                                              )}
                                            </>
                                          ) : (
                                            ""
                                          )}

                                          {details?.name === "state" && (
                                             <div> 
                                              
                                              <Select
                                                className="form-control rounded-0"
                                                id={details?.name}
                                                name={details?.name}
                                                value={selectedStates}
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                                
                                                onClick={handleChange}
                                                defaultValue={selectedStates}
                                                label={Capitalize(details?.name)}
                                                   fullWidth
                                              >
                                                {/* <MenuItem value="">{selectedMultiLangData?.please_select_a_state}</MenuItem> */} 
                                                {state?.length > 0 && (
                                                  <>
                                                    {state?.map(
                                                      (data: any, index: any) => {
                                                        return (
                                                          <>
                                                          <MenuItem value={data} key={index}>{data}</MenuItem>                                                            
                                                          </>
                                                        );
                                                      }
                                                    )}
                                                  </>
                                                )}
                                              </Select>
                                              <div className="error_message">
                                             <ErrorMessage
                                               className="error_message"
                                               name={details?.name}
                                             />
                                           </div>
                                           </div>
                                          )}

                                          {details?.name === "city" && (
                                             <div>
                                                <Select
                                                 className="form-control rounded-0"
                                                 id="city"
                                                 name="city"
                                                 value={selectedCity}
                                                 defaultValue=""
                                                 onChange={(e: any) => {
                                                   setSelectedCity(e.target.value);
                                                   handleChange;
                                                   handleSelectedPincode(e?.target?.value);
                                                 }}
                                                 onClick={handleChange}
                                                 onBlur={handleBlur}
                                                 >
                                                  <option>
                                                  {
                                                    selectedMultiLangData?.please_select_district
                                                  }
                                                </option>
                                                {city?.length > 0 && (
                                                  <>
                                                    {city.map((data: any, index: any) => (
                                                      <option value={data} key={index}>
                                                        {data}
                                                      </option>
                                                    ))}
                                                  </>
                                                )}
                                                </Select>
                                              
                                              <div className="error_message">
                                             <ErrorMessage
                                               className="error_message"
                                               name={details?.name}
                                             />
                                           </div>
                                           </div>
                                          )}
                                          {details?.name === "postal_code" && (
                                             <div>
                                             <Select
                                               className="form-control rounded-0"
                                               id="postal_code"
                                               name="postal_code"
                                               value={selectedPincode}
                                               defaultValue=""
                                               onChange={(e: any) => {
                                                 setSelectedPincode(e.target.value);
                                                 handleChange;
                                               }}
                                               onClick={handleChange}
                                               onBlur={handleBlur}
                                             >
                                              {/* <MenuItem value={""}>{selectedMultiLangData?.please_select_pincode}</MenuItem> */}
                                                 
                                               {pincode?.length > 0 && (
                                                 <>
                                                   {pincode.map((data: any, index: any) => (
                                                    <MenuItem value={data} key={index}>{data}</MenuItem>
                                                     
                                                   ))}
                                                 </>
                                               )}
                                             </Select>
                                             <div className="error_message">
                                             <ErrorMessage
                                               className="error_message"
                                               name={details?.name}
                                             />
                                           </div>
                                           </div>
                                         )}


                                          {details?.name === "user_type" && (
                                             <div>
                                              <Select
                                                className="form-control rounded-0"
                                                id="user_type"
                                                name="user_type"
                                                value={selectedusertype}
                                                onBlur={handleBlur}
                                                onChange={(e: any) => {
                                                  console.log(
                                                    "selected user type",
                                                    e?.target?.value
                                                  );
                                                  setSelectedUsertype(e?.target?.value);

                                                }}
                                                onClick={handleChange}
                                              >
                                                {user_type?.length > 0 && (
                                                  <>
                                                    {user_type?.map(
                                                      (data: any, index: any) => {
                                                        return (
                                                          <>
                                                            <option
                                                              value={data}
                                                              key={index}
                                                            >
                                                              {data}
                                                            </option>
                                                          </>
                                                        );
                                                      }
                                                    )}
                                                  </>
                                                )}
                                              </Select>

                                              <div className="error_message">
                                             <ErrorMessage
                                               className="error_message"
                                               name={details?.name}
                                             /> 
                                           </div>
                                            </div>
                                          )}
 

                                        {/* </div> */}
                                      </FormControl>
                                  ))}                                  
                                
                             
                                  <button className="btn text-uppercase bold button_border_color" type="submit"> {(selectedMultiLangData?.submit)?selectedMultiLangData?.submit:"Submit"}</button>
                                  
                                  </>
                        </FormikForm>
                      )}
                    </Formik>
                  </div>
                <div className="bg_green_color text-white d-flex align-items-center justify-content-center p-5 col-md-5">
                  <div className="col-lg-12 google_btn">
                    <div className="row">
                      <div className="text-center "><h2 className="display-7 text-white">Hello, Friends!</h2>
                      <h6 className="display-7 text-white fw-normal lh-base">{(selectedMultiLangData?.have_account) ? selectedMultiLangData?.have_account : "You already have an account please login here"} ?</h6>

                        <Link className={`btn btn-outline-light border rounded text-no-transform mt-5`} href="/login">
                          {(selectedMultiLangData?.sign_in)?selectedMultiLangData?.sign_in:"Sign in"}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
           
    </>
  );
};

export default Registration;
