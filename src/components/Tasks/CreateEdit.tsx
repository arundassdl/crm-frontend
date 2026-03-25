import React, { useEffect, useState } from "react";
import { showToast } from "@/components/ToastNotificationNew";
import {
  editCustomerAndAddress,
} from "@/services/api/customer-api/create-customer";
import { useRouter } from "next/navigation";
import { FieldConfigNew } from "@/components/Common/Form/validationSchema";
import DrawerComponent from "@/components/Common/Form/Drawer/DrawerComponent";
import CustomForm from "@/components/Common/Form/Drawer/CustomForm";
import { getAddressTypes, getCountries, getIndustry, getNoOfEmployees, getTerritories } from "@/components/Common/Form/fetchCommonData";

import { ProfileDataFetch } from "@/services/api/general_apis/ProfilePageApi/profile-page-api";
import SelectCustomerField from "../Customer/SelectCustomerField";
import CustomerSearch from "../Customer/SearchCustomer";
import CommonSearchField from "../Common/CommonSearchField";
import { CreateDealWithDetails } from "@/services/api/customer-api/create-deal";
import { convertDate, formatCalDate } from "@/services/api/common-erpnext-api/libs/utils";
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import DonutLargeIcon from '@mui/icons-material/DonutLarge'; //Backlog
import { HourglassBottom, CheckCircle, Cancel } from '@mui/icons-material';
import CircleIcon from '@mui/icons-material/Circle';
import { createCustomDocument, createCustomMultipleDocuments, postNote, updateResource } from "@/services/api/common-erpnext-api/create-edit-api";
import { Task } from "@/services/api/common-erpnext-api/create-update-custom-api";

interface AddEditTaskDrawerProps {
  initialValues: [];
  open: boolean;
  onClose: () => void;
  operation: string;
  onSubmit?: () => void;
  reference_doctype?: string;
  reference_docname?: string;
}

export default function AddEditTaskDrawer({
  initialValues,
  open,
  onClose,
  operation,
  onSubmit,
  reference_doctype="",
  reference_docname=""
}: AddEditTaskDrawerProps) {
  const [addresstypes, setAddressTypes] = useState<any>([]);
  const [countries, setCountries] = useState<any>([]);
  const [territories, setTerritories] = useState<any>([]);
  const [userToken, setUserToken] = useState<any>(() => {
    const initialValue = JSON.parse(
      localStorage.getItem("AccessTokenData") || "{}"
    );
    return initialValue || "";
  });
  const [userData, setUserData] = useState<any>(() => {
    const userValue = JSON.parse(
      localStorage.getItem("userProfileData") || "{}"
    );
    return userValue || "";
  });
  const [selectedData, setSelectedData] = useState<any>([]);

  console.log('localStorage.getItem("userProfileData")', userData);

  const router = useRouter();

  const priorityOptions = [
    { value: 'Low', label: 'Low', icon: <CircleIcon fontSize="small" sx={{ color: 'gray' }} /> },
    { value: 'Medium', label: 'Medium', icon: <CircleIcon fontSize="small" sx={{ color: 'orange' }} /> },
    { value: 'High', label: 'High', icon: <CircleIcon fontSize="small" sx={{ color: 'red' }} /> },
  ];
  const taskStatusOptions = [
    { value: 'Backlog', label: 'Backlog', index: 0, icon: <DonutLargeIcon fontSize="small" /> },
    { value: 'Todo', label: 'Todo', index: 1, icon: <RadioButtonUncheckedIcon fontSize="small" sx={{ color: 'orange' }} /> },
    { value: 'In Progress', label: 'In Progress', index: 2, icon: <HourglassBottom fontSize="small" sx={{ color: '#f6c4bc' }} /> },
    { value: 'Done', label: 'Done', index: 3, icon: <CheckCircle fontSize="small" sx={{ color: 'green' }} /> },
    { value: 'Canceled', label: 'Canceled', index: 4, icon: <Cancel fontSize="small" sx={{ color: 'red' }} /> },
  ];
 
  const handlesubmit: any = async (values, action) => {
    const formData = new FormData();
    Object.keys(values).forEach(function (key) {
      console.log(key, "============", values[key]);
      // if (key === "due_date" && values["due_date"] != "") {
      //   values[key] = formatCalDate(values[key])
      // }
      formData.append(key, values[key]);
    });
    console.log("values===>", values);
    // return false;
    // return false;
    if (operation == "New") {
      createForm(values);
    } else if (operation == "Edit") {
      editForm(values);
    }
    // action.resetForm();
    onClose();
    action.setSubmitting(false);
  };
  const createForm = async (values) => {
    const safePriority = values.priority as 'Low' | 'Medium' | 'High';

    const newTask: Task = {
      ...values,
      priority: safePriority,
      completed: values.status === 'Done',
    };
    console.log("values", values);;
    // return false

    // const dataupdate = new FormData();
    // dataupdate.append("doctype", "CRM Task");
    // dataupdate.append("reference_doctype", reference_doctype || "CRM Lead");
    // dataupdate.append("reference_docname", reference_docname || "");
    // dataupdate.append("title", values.get("title"));
    // dataupdate.append("description", values.get("description"));
    // dataupdate.append("priority", values.get("priority"));
    // dataupdate.append("status", values.get("status"));
    // dataupdate.append("owner", userData?.full_name);
    // dataupdate.append("assigned_to", userData?.email);
    // dataupdate.append("modified_by", userData?.full_name);
    // dataupdate.append("due_date", values.get("due_date"));
 

  const documents = [ 
    {
      "doctype": "CRM Task",
      "data": {
        ...values,
        "reference_doctype": reference_doctype || "CRM Lead",
        "reference_docname": reference_docname || "",
        "modified_by": userData?.full_name,
        // "assigned_to": userData?.email,
        "owner": userData?.full_name,
      }
    }
  ]
 let postData: any = await createCustomMultipleDocuments(documents,userToken?.access_token)
    console.log("postData1",postData);

if (postData?.success) {
      showToast(postData?.message, "success");
      onSubmit
        ? onSubmit()
        : location.reload();
    } else showToast(postData?.message, "warning");
    if (postData?.error) showToast(postData?.error, "error");

    // let postData: any = await postNote(dataupdate, userToken?.access_token);
    // if (postData?.message) {
    //   showToast("Task created successfully", "success");
    //   onSubmit ? onSubmit() : ""
    // }
    // console.log("postData", postData);

  };

  const editForm = async (formData) => {
    console.log("formData",formData);     
    
    // const updateName = formData.get("name");
    // let updatedata = await updateResource("CRM Task", updateName, formData, userToken?.access_token);
//  console.log("updatedata",updatedata);
    
//   if (updatedata?.success) {
//       showToast("Task udpated successfully", "success");
//       onSubmit ? onSubmit() : ""
//     }

     const documents = [ 
      {
        "doctype": "CRM Task",
        "data": {
          ...formData,
          "reference_doctype": reference_doctype || "CRM Lead",
          "reference_docname": reference_docname || "",
          "modified_by": userData?.full_name,
        }
      }
    ]
    let postData: any = await createCustomMultipleDocuments(documents,userToken?.access_token)
    console.log("postData1",postData);
    if (postData?.success) {
      showToast(postData?.message, "success");
      onSubmit
        ? onSubmit()
        : location.reload();
    } else showToast(postData?.message, "warning");
    if (postData?.error) showToast(postData?.error, "error");

  };

  const handleSubmit = (values, action) => {
    // Call API or handle form submission
    handlesubmit(values, action);
  };

  const formFields: FieldConfigNew[] = [

    { name: "title", label: "Title", type: "text", placeholder: "Enter Title", section: "" },
    { name: "description", label: "Description", type: "textarea", placeholder: "Enter Description", section: "" },
    { name: "status", label: "Status", type: "select", options: taskStatusOptions, placeholder: "Select", validate: true, section: " " },
    { name: "priority", label: "Priority", type: "select", options: priorityOptions, placeholder: "Select", validate: true, section: " " },
    {
      name: "assigned_to",
      label: "Assigned To",
      type: "custom",
      component: CommonSearchField,
      componentProps: {
        onUserSelect: (data: any) => {
          console.log("Selected Customer qqqq11:", data)
          if (data != undefined) {
            setSelectedData(data)
            return true
          }
        },
        doctype: "User",
        label: "Assigned To"
      },
      placeholder: "Select User"
      , validate: false,
      section: "",
      value: selectedData?.name || userData?.email
    },
    { name: "due_date", label: "Due Date", type: "datetime", placeholder: "Select Date", section: "" },
    { name: "owner", label: "Owner", type: "text", placeholder: "Owner", validate: false, section: "", value: userData?.email, hide: true },

  ];
  console.log("formFields=>", formFields);

  type FormValueType = {
    [K in (typeof formFields)[number]["name"]]: string;
  };
  const formInitialValues: FormValueType = formFields.reduce((acc, field) => {
    acc[field.name] = ""; // Set default value as empty string
    return acc;
  }, {} as FormValueType);


  return (
    <DrawerComponent
      open={open}
      onClose={onClose}
      title={`${operation} Task`}
    >
      <CustomForm
        fields={formFields}
        initialValues={formInitialValues}
        onSubmit={handleSubmit}
        onClose={onClose}
        editValues={initialValues}
      // onFieldChange={onFieldChange}
      />
    </DrawerComponent>
  );
}
