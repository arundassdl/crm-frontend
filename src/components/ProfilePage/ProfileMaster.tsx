'use client'
import React, { useState, useEffect } from "react";
import Link from "next/link";
import useProfilePage from "@/hooks/GeneralHooks/ProfileHooks/ProfileHooks";
import { useRouter } from "next/navigation";
import { GetEnquiryHistoryPdf } from "@/services/api/general_apis/ProfilePageApi/enquiry-history-pdf-api";
import EditAddressForm from "../ProfilePage/AddressForms/EditAddressForm";
import {
  FetchCitiesForAddressForm,
  FetchStateForAddressForm,
} from "@/services/api/general_apis/customer-form-data-api";
import { SelectedFilterLangDataFromStore } from "@/store/slices/general_slices/selected-multilanguage-slice";
import { useSelector } from "react-redux";
import { get_access_token } from "@/store/slices/auth/token-login-slice";
import { CONSTANTS } from '@/services/config/app-config';
import { showToast } from "@/components/ToastNotificationNew";
import ProfileImageUploadApi from "@/services/api/general_apis/ProfilePageApi/image-upload-api";
import ProfileImageRemoveApi from "@/services/api/general_apis/ProfilePageApi/image-remove-api";
import EditProfileForm from "./EditProfileForm";
import Button from '@mui/material/Button'
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, Typography } from "@mui/material";
import MultipleImageUploadSlider from "../UI/MultipleImageUploadSlider";


const ProfileMaster = () => {
  const {
    profileList,
    ageingReport,
    loading,
    setLoading,
    enquiryHistoryPro,
  }: any = useProfilePage();

  const router = useRouter();
  const searchParams = useSearchParams();

  console.log("tsx profile master", profileList);
  console.log("###quot in api tsx file", enquiryHistoryPro);
  const [showEditModal, setshowEditModal] = useState<boolean>(false);
  const [showShipEditModal, setshowShipEditModal] = useState<boolean>(false);
  const [showEditProfileModal, setshowEditProfileModal] = useState<boolean>(false);

  const [detailData, setdetailData] = useState<any>();
  const [shippingDetailData, setShippingDetailData] = useState<any>();
  const [addType, setAddType] = useState<any>("");
  let [selectedCity, setSelectedCity] = useState<any>("");
  let [state, setState] = useState<any>([]);
  let [city, setCity] = useState<any>([]);
  const [err, setErr] = useState<boolean>(false);
  let [selectedStates, setSelectedStates] = useState<any>("");
  const TokenFromStore: any = useSelector(get_access_token);

  const SelectedLangDataFromStore: any = useSelector(
    SelectedFilterLangDataFromStore
  );
  const [selectedMultiLangData, setSelectedMultiLangData] = useState<any>();
  let [profile_list, setProfileImgList] = useState<any>([]);

  useEffect(() => {
    if (
      Object.keys(SelectedLangDataFromStore?.selectedLanguageData)?.length > 0
    ) {
      setSelectedMultiLangData(SelectedLangDataFromStore?.selectedLanguageData);
    }
  }, [SelectedLangDataFromStore]);

  useEffect(() => {
    const getStateData: any = async () => {
      const stateData: any = await FetchStateForAddressForm(
        TokenFromStore?.token
      );
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

  // const documentQueued: any = searchParams.get("data")
  //   ? JSON.parse(searchParams.get("data") as string)
  //   : "";
  // console.log("paytab", documentQueued.setTrue);
  
  const handleEditModal: any = (billingData: any, add_type: any) => {
    console.log("profile billing edit data", billingData);
    setshowEditModal(!showEditModal);
    // setdetailData(profileBillingData);
    // console.log("billing detail",profileList.billing_address)
    let billingAddress = {}; 
    console.log("profileList?.detailData11", profileList?.billing_address)
    if(profileList?.billing_address?.name==undefined){
      Object.assign({"email":profileList?.profile_details?.email}, profileList?.billing_address);

      let billingAddress = Object.assign({}, {});
      // billingAddress.email = profileList?.profile_details?.email


      // profileList.billing_address = {"email":profileList?.profile_details?.email}
      console.log("profileList?.detailData1", billingAddress)
      setdetailData(billingAddress);
    }else{
      billingAddress =  profileList?.billing_address
      setdetailData(billingAddress);
    }
   
   
    setAddType(add_type);
  };

  const handleEditProfileModal: any = (profileData: any, add_type: any) => {
    console.log("profile  data", profileData);
    setshowEditProfileModal(!showEditProfileModal);
    // setdetailData(profileBillingData);
    // console.log("billing detail",profileList.billing_address)
    setdetailData(profileList?.profile_details);
    setAddType(add_type);
  };

  const handleShippingEditModal: any = (shippingData: any, add_type: any) => {
    console.log("shipping data", shippingData);
    setshowShipEditModal(!showShipEditModal);
    setAddType(add_type);
    setShippingDetailData(profileList?.shipping_address);
  };

  console.log("address_type pr", addType);

  const personalDetails: any = () => {
    console.log('profileList', profileList);

    return (
      <Card>
         <CardHeader title={<Typography variant="h5">{(selectedMultiLangData?.profile) ? selectedMultiLangData?.profile : "My Profile"}</Typography>}  >
         </CardHeader> 
        {/* <CardHeader className="fw-bolder pt-2">{selectedMultiLangData?.profile} <div className="float-end"><button
          type="button"
          onClick={() => {
            console.log("clicked");
            handleEditProfileModal(profileList, "Billing");
          }}
          className="showmodal_button"
        >
          <i className="fa fa-edit text-dark fs-5 my-0"></i>
        </button></div></CardHeader> */}
        <CardContent>
          <div className="ms-2 color-black">
            
             

            <div className="d-flex align-items-center mb-2">
              <div className="col-sm-5">
                <p className="">{selectedMultiLangData?.name} :</p>
              </div>
              <div className="col-sm-7 fw-bolder ps-3">
                {profileList && profileList?.profile_details?.customer_name}
              </div>
            </div>
            <div className="d-flex align-items-center mb-2">
              <div className="col-sm-5">
                <p className="">{selectedMultiLangData?.company_name} :</p>
              </div>
              <div className="col-sm-7 fw-bolder ps-3">
                {profileList && profileList?.profile_details?.company_name}
              </div>
            </div>
            <div className="d-flex align-items-center mb-2">
              <div className="col-sm-5">
                <p className="">{selectedMultiLangData?.mobile_number} :</p>
              </div>
              <div className="col-sm-7 fw-bolder ps-3">
                {profileList && profileList?.profile_details?.contact_no}
              </div>
            </div>
            <div className="d-flex align-items-center mb-2">
              <div className="col-sm-5">
                <p className="">{selectedMultiLangData?.email} :</p>
              </div>
              <div className="col-sm-7 fw-bolder ps-3">
                {profileList && profileList?.profile_details?.email}
              </div>
            </div>
            <div className="d-flex align-items-center mb-2">
              <div className="col-sm-5">
                <p className="">{selectedMultiLangData?.user_type} :</p>
              </div>
              <div className="col-sm-7 fw-bolder ps-3">
                {profileList && profileList?.profile_details?.userType}
              </div>
            </div>
            {profileList?.profile_details?.userType=="Dealer" || profileList?.profile_details?.userType=="Sub Dealer" || profileList?.profile_details?.userType=="Customer" || profileList?.profile_details?.userType=="Surveyor" ?
                          (
            <div className="d-flex align-items-center mb-2">
              <div className="col-sm-5">
                <p className="">{profileList?.profile_details?.userType=="Dealer" && ("Distributor name ")}
                {profileList?.profile_details?.userType=="Sub Dealer" || profileList?.profile_details?.userType=="Customer" || profileList?.profile_details?.userType=="Surveyor" ? ("Dealer name "):("")} :</p>
              </div>
              <div className="col-sm-7 fw-bolder ps-3">
                {profileList && profileList?.profile_details?.associated_to}
              </div>
            </div>):("")}
            <hr></hr>


          </div>
        </CardContent>
      </Card>
    );
  };


  

  const showBillingAddresses: any = () => {
    return (
      <>
        <Card style={{ marginTop: '0px', border: '3px solid  #e5e5e5' }}>
          <CardHeader className="fw-bolder pt-2">{selectedMultiLangData?.address} <div className="float-end"><button
            type="button"
            onClick={() => {
              console.log("clicked");
              handleEditModal(profileList, "Billing");
            }}
            className="showmodal_button"
          >
            {profileList?.billing_address?.name!=undefined ?
            <i className="fa fa-edit text-dark fs-5 my-0" title="Edit"></i>:<i className="fa fa-plus text-dark fs-5 my-0" title="Add"></i>
          }
            
          </button></div></CardHeader>
          <CardContent>
          {profileList?.billing_address?.name!=undefined ?
          <div>
            <div className="d-flex align-items-center mb-2">
              <div className="col-sm-5">
                <p className="">{selectedMultiLangData?.address} :</p>
              </div>
              <div className="col-sm-7 w-lg-25 w-sm-75 ps-3 mt-3">
                <div className="fw-bolder">
                  {profileList && profileList?.billing_address?.address_line1}
                </div>
                {/* <div className="fw-bolder">
                  {profileList && profileList?.billing_address?.address_line2}
                </div> */}
              </div>
            </div>
           
            <div className="d-flex align-items-center mb-2">
              <div className="col-sm-5">
                <p className="">{selectedMultiLangData?.state} :</p>
              </div>
              <div className="col-sm-7 fw-bolder ps-3">
                {profileList && profileList?.billing_address?.state}
              </div>
            </div>
            <div className="d-flex align-items-center mb-2">
              <div className="col-sm-5">
                <p className="">{selectedMultiLangData?.city} :</p>
              </div>
              <div className="col-sm-7 fw-bolder ps-3">
                {profileList && profileList?.billing_address?.city}
              </div>
            </div>
            <div className="d-flex align-items-center mb-2">
              <div className="col-sm-5">
                <p className="">{selectedMultiLangData?.postal_code}:</p>
              </div>
              <div className="col-sm-7 fw-bolder ps-3">
                {profileList && profileList?.billing_address?.pincode}
              </div>
            </div>  
            <div className="d-flex align-items-center mb-2">
              <div className="col-sm-5">
                <p className="">{selectedMultiLangData?.country}:</p>
              </div>
              <div className="col-sm-7 fw-bolder ps-3">
                {profileList && profileList?.billing_address?.country}
              </div>
            </div>
            </div>          
                :
              <div className="d-flex align-items-center mb-2">No Address found</div>
                }
          </CardContent>
        </Card>

      </>
    );
  };


  // const showShippigAddresses: any = () => {
  //   return (
  //     <>
  //       <div className="shadow-sm card px-2 color-black">
  //         <div className="card-body">
  //           <div className="row align-items-center">
  //             <div className="col-lg-8">
  //               <h5 className="fw-bolder pt-1 color-black">
  //                 {" "}
  //                 {selectedMultiLangData?.shipping_addresses}
  //               </h5>
  //             </div>
  //             <div className="col-lg-4 text-end">
  //               <button
  //                 type="button"
  //                 onClick={() => {
  //                   handleShippingEditModal(profileList, "Shipping");
  //                 }}
  //                 className="showmodal_button"
  //               >
  //                 <i className="fa fa-edit text-primary fs-2 my-0"></i>
  //               </button>
  //             </div>
  //           </div>
  //           {/* <hr /> */}

  //           <div className="d-flex align-items-center mb-2">
  //             <div className="col-sm-5">
  //               <p className="">{selectedMultiLangData?.name} :</p>
  //             </div>
  //             <div className="col-sm-7 ps-3 fw-bolder">
  //               {profileList && profileList?.shipping_address?.name}
  //             </div>
  //           </div>
  //           <div className="d-flex align-items-center mb-2">
  //             <div className="col-sm-5">
  //               <p className="">{selectedMultiLangData?.email} :</p>
  //             </div>
  //             <div className="col-sm-7 fw-bolder ps-3">
  //               {profileList && profileList?.shipping_address?.email}
  //             </div>
  //           </div>
  //           <div className="d-flex align-items-center mb-2">
  //             <div className="col-sm-5">
  //               <p className="">{selectedMultiLangData?.mobile_number}:</p>
  //             </div>
  //             <div className="col-sm-7 fw-bolder ps-3">
  //               {profileList && profileList?.shipping_address?.contact}
  //             </div>
  //           </div>
  //           <div className="d-flex align-items-center mb-2">
  //             <div className="col-sm-5">
  //               <p className="">{selectedMultiLangData?.address} :</p>
  //             </div>
  //             <div className="col-sm-7 w-lg-25 w-sm-75 ps-3 mt-3">
  //               <div className="fw-bolder">
  //                 {profileList && profileList?.shipping_address?.address_1}
  //               </div>
  //               <div className="fw-bolder ">
  //                 {profileList && profileList?.shipping_address?.address_2}
  //               </div>
  //             </div>
  //           </div>

  //           <div className="d-flex align-items-center mb-2">
  //             <div className="col-sm-5">
  //               <p className="">{selectedMultiLangData?.postal_code}:</p>
  //             </div>
  //             <div className="col-sm-7 fw-bolder ps-3">
  //               {profileList && profileList?.shipping_address?.postal_code}
  //             </div>
  //           </div>
  //           <div className="d-flex align-items-center mb-2">
  //             <div className="col-sm-5">
  //               <p className="">{selectedMultiLangData?.state} :</p>
  //             </div>
  //             <div className="col-sm-7 fw-bolder ps-3">
  //               {profileList && profileList?.shipping_address?.state}
  //             </div>
  //           </div>
  //           <div className="d-flex align-items-center mb-2">
  //             <div className="col-sm-5">
  //               <p className="">{selectedMultiLangData?.city} :</p>
  //             </div>
  //             <div className="col-sm-7 fw-bolder ps-3">
  //               {profileList && profileList?.shipping_address?.city}
  //             </div>
  //           </div>
  //           <div className="d-flex align-items-center mb-2">
  //             <div className="col-sm-5">
  //               <p className="">{selectedMultiLangData?.country}:</p>
  //             </div>
  //             <div className="col-sm-7 fw-bolder ps-3">
  //               {profileList && profileList?.shipping_address?.country}
  //             </div>
  //           </div>
  //         </div>
  //       </div>
  //     </>
  //   );
  // };

  const handlePdf: any = async (pdf_link: any) => {
    const pdfRes = await GetEnquiryHistoryPdf(pdf_link);
    console.log("pdf res in jsx", pdfRes);
    // window.open (`${pdfRes}` , '_blank')
  };

 
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imgsSrc, setImgsSrc] = useState([] as any);
  const [profileImage, setProfileImage] = useState([profileList?.profile_details?.user_image]);

  const [inputFile, setInputFile] = useState<HTMLInputElement | null>(null);

  useEffect(() => {
    setInputFile(document.getElementById("input-file") as HTMLInputElement);
  }, []);


  const handleUpload = (e) => {
    e.preventDefault();
    inputFile?.click();
  };

  const handleFileRemove = async (e) => {
    const values = {}

    const formData = new FormData();
    const remove_image = (profile_list && profile_list?.profile_details?.user_image != undefined) ? profile_list?.profile_details?.user_image : profileList?.profile_details?.user_image

    formData.append('file', remove_image);
    values['files'] = formData;
    values['customer_id'] = profileList && profileList?.profile_details?.email;
    console.log("values=>", profileList?.profile_details);

    let ProfileImageRemove: any = await ProfileImageRemoveApi(values, TokenFromStore?.token);
    console.log('here', ProfileImageRemove);
    if (ProfileImageRemove?.msg === "success") {
      showToast(ProfileImageRemove?.data.msg, "success");
      // router.push("/survey");
      let profile_details = Object.assign({}, profileList.profile_details);
      profile_details.user_image = ""
      let profile_list = Object.assign({}, profileList);
      profile_list.profile_details = profile_details
      setProfileImgList(profile_list)
      setImgsSrc([])
      // setProfileImage(uploaded_file)
    } else {
      showToast(ProfileImageRemove?.error, "error");
    }
  }

  const handleChildData = (data:  File[]) => {
    console.log("data22222@@@",data);
    
  };
  const handleFileChange = async (e) => {
    const values = {}
    setImgsSrc([])

    const formData = new FormData();
    
    for (const file of e.target.files) {
      if (!file.name.match(/\.(jpg|jpeg|png|gif|JPG|JPEG|PNG|GIF)$/)) {
        showToast("Please select valid image", "error");
        return false;
      }
      formData.append('images[]', file);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      console.log("reader.result",reader.result);

      
      reader.onload = () => {
        setImgsSrc([(imgs:any) => [...imgs, reader.result]]);
      };
      reader.onerror = () => {
        console.log(reader.error);
      };

    }
    console.log("reader.formData",formData);
 
    values['files'] = formData;
    values['customer_id'] = profileList && profileList?.profile_details?.email;
    console.log("values=>", values);

    let profileImageUpload: any = await ProfileImageUploadApi(values, TokenFromStore?.token);
    console.log('here', profileImageUpload);
    if (profileImageUpload?.msg === "success") {

      showToast(profileImageUpload?.data.msg, "success");
      // router.push("/survey");

      const uploaded_file = CONSTANTS.API_BASE_URL + profileImageUpload?.data.file
      let profile_details = Object.assign({}, profileList.profile_details);
      profile_details.user_image = profileImageUpload?.data.file

      let profile_list = Object.assign({}, profileList);
      profile_list.profile_details = profile_details
      
      localStorage.setItem('userProfileData', JSON.stringify(profile_list?.profile_details));
      setProfileImgList(profile_list)
    } else {
      showToast(profileImageUpload?.error, "error");
    }

    console.log('selectedFiles11', selectedFiles);
  };

  return (
    <>
      <div className="container mt-5 mb-5" >
        <section className=" pb-0 mb-0">
          <Card>
            <CardHeader className="align-items-center pt-3" style={{
              backgroundColor: 'white',
            }}>

              <div>
                <div style={{

                }} className="page-heading col-md-9" >
                  <h4 className="" >
                    {selectedMultiLangData?.my_account}
                  </h4>
                </div>
                <div style={{
                  backgroundColor: 'white',
                }} className="page-heading col-md-3 text-end">

                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="pt-5 pb-10">
                <div className="col-md-4">
                  <Card style={{ marginTop: '0px', border: '2px solid rgb(63, 146, 28)' }}>

                    <CardContent>
                      <div className="m-3 text-center">
                        {/* <label className="mx-3">Choose file: </label> */}
                        <div>
                          {imgsSrc.length > 0 ? (
                            <div>
                              {imgsSrc.map((link, index) => (
                                <div key={index}>
                                  <img src={link} width={350} />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div>
                              {(profile_list?.profile_details?.user_image != "" && profile_list?.profile_details?.user_image != undefined) || (profileList?.profile_details?.user_image!='' && profileList?.profile_details?.user_image!=undefined)  ? (
                                <div className="col-md-12" >
                                  <img src={ profileList?.profile_details?.user_image} id="profile-img" style={{ height: '170px' }} />

                                </div>
                              ) : (
                                <div className="col-md-12" >
                                  <img src="/assets/images/no_image.png" style={{ height: '170px' }} />
                                </div>
                              )}
                            </div>

                          )}

                          <div className="col-md-12 pt-5">
                          <MultipleImageUploadSlider onSendData={handleChildData}/>
                          {/* <input id="input-file" className="d-none" type="file" name="file" onChange={handleFileChange} /> */}

                           {/* <TakePhoto /> */}
                            
                            {(profile_list?.profile_details?.user_image === "" || profile_list?.profile_details?.user_image === undefined) && imgsSrc.length == 0 ? (
                              <button onClick={handleUpload} className="btn btn-outline-primary submit-btn text-center">
                                Upload
                              </button>
                            ) : (

                              <button onClick={handleFileRemove} className="btn btn-outline-primary submit-btn text-center">
                                Remove
                              </button>
                            )}

                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                </div>
                <div className="col-md-8">
                  <div className="col-lg-12 pb-5"> {personalDetails()}</div>
                  {/* <h4>{selectedMultiLangData?.address}</h4> */}
                  <div className="col-lg-12 col-md-12 col-xs-12">{showBillingAddresses()}</div>
                </div>
              </div>
              <div>
                <div>


                </div>
              </div>

            </CardContent>
          </Card>


        </section>
      </div>

      {showShipEditModal ? (
        <EditAddressForm
          show={showShipEditModal}
          toHide={handleShippingEditModal}
          detailData={shippingDetailData}
          handleSelectedState={handleSelectedState}
          selectedStates={selectedStates}
          state={state}
          setSelectedStates={setSelectedStates}
          setSelectedCity={setSelectedCity}
          city={city}
          selectedCity={selectedCity}
          address_type={addType}
          selectedMultiLangData={selectedMultiLangData}
        />
      ) : null}

      {showEditModal ? (
        <EditAddressForm
          show={showEditModal}
          toHide={handleEditModal}
          detailData={detailData}
          handleSelectedState={handleSelectedState}
          selectedStates={selectedStates}
          state={state}
          setSelectedStates={setSelectedStates}
          setSelectedCity={setSelectedCity}
          city={city}
          selectedCity={selectedCity}
          address_type={addType}
          selectedMultiLangData={selectedMultiLangData}
        />
      ) : null}

{showEditProfileModal ? (
        <EditProfileForm
          show={showEditProfileModal}
          toHide={handleEditProfileModal}
          detailData={detailData}
          handleSelectedState={handleSelectedState}
          selectedStates={selectedStates}
          state={state}
          setSelectedStates={setSelectedStates}
          setSelectedCity={setSelectedCity}
          city={city}
          selectedCity={selectedCity}
          address_type={addType}
          selectedMultiLangData={selectedMultiLangData}
        />
      ) : null}
    </>
  );
};

export default ProfileMaster;
