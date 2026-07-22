"use client";
import { readAccessTokenDataRaw } from '@/utils/accessTokenDataStorage'

import {
  Card,
  CardContent,
  Avatar,
  Typography,
  Grid,
  Button,
  Box,
  List,
  ListItem,
  Divider,
  Chip,
  Stack,
  IconButton,
  CircularProgress,
} from "@mui/material";
import {
  Camera,
  Envelope,
  IdentificationCard,
  MapPin,
  Phone,
  ShieldCheck,
  User as PhosphorUser,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  KVGrid,
  ProfileHero,
  SettingCard,
} from "@/components/Users/Users/Detail/ProfileCards";
import { showToast } from "@/components/ToastNotificationNew";
import CustomAvatar from "@/@core/components/mui/Avatar";
import { CONSTANTS } from "@/services/config/app-config";
import Link from "@/components/Link";
// import EmailFields from "./EmailFields";
import FormatDate from "@/libs/FormatDate";
// import PhoneFields from "./PhoneFields";
import EditableField from "@/components/Common/EditableField";
import EditableAddressField from "@/components/Common/EditableAddressField";
import { updateResource } from "@/services/api/common-erpnext-api/create-edit-api";
import SelectCustomerField from "@/components/Customer/SelectCustomerField";
import SelectCustomer from "@/components/Customer/SelectCustomer";
import { getAddressTypes, getCountries, getIndustry, getNoOfEmployees, getTerritories, getRole } from "@/components/Common/Form/fetchCommonData";
import {
  FetchCitiesForAddressForm,
  FetchPostalCodeByStateCity,
  FetchStateForCountry,
} from "@/services/api/general_apis/customer-form-data-api";
import UserAddressListing from "@/components/Contact/Detail/AddressListing";

import {
  frappeUploadFile,
  submit_adduser,
  submit_edituser,
} from "@/services/api/users/users-api";

/** Address/link doc names often use `…-Billing`; strip for subtitle so it does not repeat after the email line. */
function stripBillingSuffix(value: string): string {
  return value.replace(/-Billing$/i, "").trim();
}

/**
 * SDL Role `role_name` for the locked Super Admin row (same as roles Listing filter).
 * @see `tabSDL Role`.role_name = 'Super Admin'
 */
const SDL_ROLE_NAME_SUPER_ADMIN = "Super Admin";

function normalizeRoleText(s: string): string {
  return s.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

/** True if this string is the Super Admin role (display or doc name variants). */
function textIsSuperAdminRole(s: string): boolean {
  const t = normalizeRoleText(s);
  if (!t) return false;
  if (t.localeCompare(SDL_ROLE_NAME_SUPER_ADMIN, undefined, { sensitivity: "accent" }) === 0)
    return true;
  if (t.toLowerCase() === "super admin") return true;
  return /\bsuper\s+admin\b/i.test(t);
}

/**
 * True if the viewed user’s role is Super Admin — Role field must be read-only
 * (Personal Settings + Users listing detail use the same `UserOverview`).
 */
function userRoleLooksLikeSuperAdmin(
  profile: unknown,
  customerData: Record<string, unknown> | unknown[] | null | undefined,
  roleOptions: unknown[],
  detailFromSlug?: unknown
): boolean {
  const prof =
    profile != null && typeof profile === "object" && !Array.isArray(profile)
      ? (profile as Record<string, unknown>)
      : {};
  const row =
    customerData != null &&
    typeof customerData === "object" &&
    !Array.isArray(customerData)
      ? (customerData as Record<string, unknown>)
      : {};
  const detail =
    detailFromSlug != null &&
    typeof detailFromSlug === "object" &&
    !Array.isArray(detailFromSlug)
      ? (detailFromSlug as Record<string, unknown>)
      : {};

  const pieces = [
    prof["role_name"],
    prof["role_profile_name"],
    row["role_name"],
    row["role_profile_name"],
    detail["role_name"],
    detail["role_profile_name"],
  ];
  for (const p of pieces) {
    if (textIsSuperAdminRole(String(p ?? ""))) return true;
  }

  const currentName = String(
    prof["role_name"] ?? detail["role_name"] ?? row["role_name"] ?? ""
  ).trim();
  const currentProfile = String(
    prof["role_profile_name"] ??
      detail["role_profile_name"] ??
      row["role_profile_name"] ??
      ""
  ).trim();

  if (Array.isArray(roleOptions)) {
    for (const opt of roleOptions) {
      if (opt == null) continue;
      const o =
        typeof opt === "string"
          ? { value: opt, label: opt }
          : (opt as { value?: string; label?: string });
      const val = String(o.value ?? "").trim();
      const lab = String(o.label ?? "").trim();
      const optionIsSuperAdmin =
        textIsSuperAdminRole(lab) || textIsSuperAdminRole(val);
      if (!optionIsSuperAdmin) continue;
      if (currentName && (currentName === val || currentName === lab)) return true;
      if (currentProfile && (currentProfile === val || currentProfile === lab)) return true;
    }
  }

  return false;
}

const UserOverview = (slug) => {
  let [customerData, setCustomerData] = useState<any>([]);
  let [linkData, setLinkData] = useState<any>([]);
  let [addressData, setAddressData] = useState<any>({});
  let [cusTypeOptions, setCusTypeOptions] = useState<any>([
    "Individual",
    "Company",
    "Partnership",
  ]);
  const [refreshKey, setRefreshKey] = useState(0);

  const [userToken, setUserToken] = useState<any>(() => {
    const initialValue = JSON.parse(
      readAccessTokenDataRaw()
    );
    return initialValue || "";
  });
  const [operation, setOperation] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>([]);
  const [profile, setProfile] = useState<any>({});
  const [doctype, setDoctype] = useState<any>("");

  const [addresstypes, setAddressTypes] = useState<any>([]);
  const [countries, setCountries] = useState<any>([]);
  const [territories, setTerritories] = useState<any>([]);
  const [departmentOptions, setDepartmentOptions] = useState<any>([]);
  const [designationOptions, setDesignationOptions] = useState<any>([]);
  const [branchOptions, setBranchOptions] = useState<any>([]);
  const [roleOptions, setRoleOptions] = useState<any>([]);
  const [genderOptions, setGenderOptions] = useState<any>([]);
  const [states, setStates] = useState<any>([]);
  const [cities, setCities] = useState<any>([]);
  const [pincodes, setPincodes] = useState<any>([]);
  const [isEditPermission, setIsEditPermission] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [localAvatarPreview, setLocalAvatarPreview] = useState<string | null>(
    null
  );
  const module_name = "Users";
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


  useEffect(() => {
    const getAddressTypeData = async () => {
      setAddressTypes(await getAddressTypes());
    };
    const getCountryData = async () => {
      setCountries(await getCountries());
    };
    const getTerritoryData = async () => {
      setTerritories(await getTerritories());
    };

    const fetchRole = async () => {
      const data = await getRole("", "SDL Role");
      setRoleOptions(data);
    };

    const fetchGender = async () => {
      const data = await getIndustry("", "Gender");
      setGenderOptions(data);
    };

   const fetchDeparment = async () => {
      const data = await getIndustry("", "SDL CRM Department");
      setDepartmentOptions(data);
    };

    const fetchDesignation = async () => {
      const data = await getIndustry("", "SDL CRM Designation");
      setDesignationOptions(data);
    };

    const fetchBranch = async () => {
      const data = await getIndustry("", "SDL CRM Branch");
      setBranchOptions(data);
    };



    // getCountryData();
    // getTerritoryData();
    getAddressTypeData();
    fetchRole();
    fetchGender();
    fetchDeparment();
    fetchDesignation();
    fetchBranch();

  }, [])


  const fetchStates = async (country: string) => {
    const result = await FetchStateForCountry(country, userToken?.access_token);
    if (result?.length > 0) {
      const data = result.map((item: any) => ({
        value: item.name,
        label: item.name,
      }));
      setStates(data);
    } else {
      setStates([]);
    }
  };

  const fetchCities = async (state: string) => {
    const result = await FetchCitiesForAddressForm(
      state,
      userToken?.access_token
    );
    if (result?.length > 0) {
      const data = result.map((item: any) => ({
        value: item.name,
        label: item.name,
      }));
      setCities(data);
    } else {
      setCities([]);
    }
  };

  const fetchPincodes = async (state: string, city: string) => {
    if (!state || !city) setPincodes([]); // Prevent API call if state/city is empty
    try {
      const result = await FetchPostalCodeByStateCity(
        state,
        city,
        userToken?.access_token
      );
      if (result?.length > 0) {
        const data = result?.map((item: any) => ({
          value: item.label,
          label: item.label,
        }))
        setPincodes(data);
      } else {
        setPincodes([]);
      }
    } catch (error) {
      console.error("Error fetching pincodes:", error);
      setPincodes([]);
    }
  };

  console.log("slug?.record 54", slug?.detail);

  useEffect(() => {
    setCustomerData(slug?.detail);
    
    console.log("slug?.record", slug?.detail);
    console.log("customerData", customerData.first_name);
    fetchStates(slug?.detail?.country)
    fetchCities(slug?.detail?.state)
    fetchPincodes(slug?.detail?.state,slug?.detail?.city)

    setProfile({
      first_name: slug?.detail?.first_name,
      last_name: slug?.detail?.last_name,
      email: slug?.detail?.email,
      mobile_no : slug?.detail?.mobile_no,
      address_line1 :  slug?.detail?.address_line1,
      address_line2 : slug?.detail?.address_line2,
      address_title : slug?.detail?.address_title,
      address_type : slug?.detail?.address_type,
      addressid : slug?.detail?.addressid,
      birth_date : slug?.detail?.birth_date,
      branch : slug?.detail?.branch,
      city : slug?.detail?.city,
      country : slug?.detail?.country,
      creation : slug?.detail?.creation,
      date_of_joining : slug?.detail?.date_of_joining,
      department : slug?.detail?.department,
      designation : slug?.detail?.designation,

      employee_number : slug?.detail?.employee_number,
      employeeid : slug?.detail?.employeeid,
      gender : slug?.detail?.gender,
      modified : slug?.detail?.modified,
      parent :  slug?.detail?.parent,
      pincode : slug?.detail?.pincode,
      role_profile_name : slug?.detail?.role_profile_name,
      role_name:slug?.detail?.role_name,
      state : slug?.detail?.state,
      status : slug?.detail?.status,
      territory : slug?.detail?.territory,

    });

  }, [slug]);

  const CloseDialog = () => {
    setSelectedRow([]);
    setOpen(false);
  };

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'longOffset'
  });

  const handleSave = async (field, value) => {
    // Email is the user's login identifier — validate its format before saving.
    if (field === "email") {
      const trimmed = String(value ?? "").trim();
      const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!trimmed || !EMAIL_RE.test(trimmed)) {
        showToast("Enter a valid email address", "error");
        return;
      }
    }

    // Immutable update so React re-renders the header/derived fields with the new value.
    const nextData = { ...(customerData as Record<string, any>), [field]: value };
    setCustomerData(nextData);

    const formData = new FormData();
    Object.keys(nextData).forEach(function (key) {
      if (key == "birth_date" || key == "date_of_joining") {
        let input = nextData[key]; // MM/DD/YYYY format
        let date = new Date(input + " 00:00:00"); // Local time is used
        formData.append(key, date.toString());
      } else {
        formData.append(key, nextData[key]);
      }
    });

    let customerApiRes: any = await submit_edituser(
      formData,
      userToken?.access_token
    );

    console.log("customerApiRes", customerApiRes);

    if (field == 'role_profile_name') {
      const newRoleName = customerApiRes?.data?.User?.role_name;
      setProfile((prev) => ({ ...prev, [field]: value, role_name: newRoleName ?? prev.role_name }));
      setCustomerData((prev) => ({ ...(prev as Record<string, any>), role_name: newRoleName ?? (prev as Record<string, any>)?.role_name }));
    } else {
      setProfile((prev) => ({ ...prev, [field]: value }));
    }
  };

  /**
   * Same field rules as `handleSave`, plus meta fields from CreateEdit edit flow.
   * After Frappe `upload_file`, pass `user_image` / `image` as the returned path string.
   */
  const buildEditUserFormData = (data: Record<string, unknown>) => {
    const formData = new FormData();
    Object.keys(data).forEach(function (key) {
      const raw = data[key];
      if (raw === undefined || raw === null) return;
      if (key === "birth_date" || key === "date_of_joining") {
        const input = String(raw);
        const date = new Date(input + " 00:00:00");
        formData.append(key, date.toString());
      } else {
        formData.append(key, raw as string | Blob);
      }
    });
    formData.append("username", userToken?.username ?? "");
    formData.append("useremailid", userToken?.email ?? "");
    if (typeof window !== "undefined") {
      formData.append("siteurl", window.location.origin);
    }
    return formData;
  };

  const handleUserImageSelected = async (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const dataObj = customerData as Record<string, unknown>;
    if (
      !dataObj ||
      typeof dataObj !== "object" ||
      Array.isArray(customerData)
    ) {
      showToast("User data is not loaded yet.", "error");
      return;
    }

    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file.", "error");
      return;
    }
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      showToast("Image must be 5MB or smaller.", "error");
      return;
    }

    let previewUrl: string | null = null;
    try {
      previewUrl = URL.createObjectURL(file);
      setLocalAvatarPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return previewUrl;
      });
    } catch {
      showToast("Could not read the image.", "error");
      return;
    }

    const userDocName = String(dataObj.name ?? dataObj.email ?? "").trim();
    if (!userDocName) {
      showToast("Missing user identifier.", "error");
      setLocalAvatarPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }

    setUploadingImage(true);
    try {
      let uploadResult = await frappeUploadFile(
        file,
        userToken?.access_token,
        {
          attachedToDoctype: "User",
          attachedToName: userDocName,
          attachedToField: "user_image",
        }
      );
      if (uploadResult.error) {
        uploadResult = await frappeUploadFile(file, userToken?.access_token);
      }
      if (uploadResult.error) {
        showToast(uploadResult.error, "error");
        setLocalAvatarPreview((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
        return;
      }

      const fileUrl = uploadResult.file_url as string;
      const merged: Record<string, unknown> = {
        ...dataObj,
        user_image: fileUrl,
        image: fileUrl,
      };
      const formData = buildEditUserFormData(merged);
      const customerApiRes: any = await submit_edituser(
        formData,
        userToken?.access_token
      );

      if (customerApiRes?.msg === "success") {
        showToast(
          customerApiRes?.data?.msg ?? "Profile photo updated.",
          "success"
        );
        const path =
          customerApiRes?.data?.User?.user_image ??
          customerApiRes?.data?.user_image ??
          fileUrl;
        if (path && typeof path === "string") {
          setCustomerData((prev) => ({
            ...(prev && typeof prev === "object" && !Array.isArray(prev)
              ? prev
              : {}),
            user_image: path,
            image: path,
          }));
        }
        setLocalAvatarPreview((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
      } else {
        if (customerApiRes?.message) {
          showToast(String(customerApiRes.message), "warning");
        }
        if (customerApiRes?.error) {
          showToast(String(customerApiRes.error), "error");
        }
        if (!customerApiRes?.message && !customerApiRes?.error) {
          showToast("Could not sync profile photo.", "warning");
        }
        setCustomerData((prev) => ({
          ...(prev && typeof prev === "object" && !Array.isArray(prev)
            ? prev
            : {}),
          user_image: fileUrl,
          image: fileUrl,
        }));
        setLocalAvatarPreview((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
      }
    } catch {
      showToast("Could not update profile photo.", "error");
      setLocalAvatarPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    } finally {
      setUploadingImage(false);
    }
  };

  useEffect(() => {
    return () => {
      if (localAvatarPreview) URL.revokeObjectURL(localAvatarPreview);
    };
  }, [localAvatarPreview]);

  const handleSaveAddress = async (field:any, value:any,name:any) => {
    const updatedData = {
      [field]: value,
      name: name,
      // addressid: profile?.addressid, // Assuming you want to keep the address ID
    };
    const updatedContact = await updateResource(
      "Address",
      name,
      updatedData,
      userToken?.access_token
    );

    if (!updatedContact || !updatedContact.success) {
      throw new Error("Failed to update contact details.");
    }
    console.log("saved succesfully");
    setProfile((prev) => ({ ...prev, [field]: value }));
 
  };

  const handleFormSubmit = () => {
    setRefreshKey((prevKey) => prevKey + 1); // Increment refreshKey to force DataGrid reload
  };

  const displayName = useMemo(() => {
    const d = customerData;
    if (!d || typeof d !== "object") return "";
    const full = String((d as Record<string, unknown>).full_name ?? "").trim();
    if (full) return full;
    const first = String((d as Record<string, unknown>).first_name ?? "").trim();
    const last = String((d as Record<string, unknown>).last_name ?? "").trim();
    const joined = [first, last].filter(Boolean).join(" ");
    if (joined) return joined;
    return String((d as Record<string, unknown>).name ?? "").trim();
  }, [customerData]);

  const headerSubtitle = useMemo(() => {
    const des = String(
      profile?.designation ?? (customerData as Record<string, unknown>)?.designation ?? ""
    ).trim();
    const org = stripBillingSuffix(
      String(
        (customerData as Record<string, unknown>)?.company_name ??
          (customerData as Record<string, unknown>)?.company ??
          (customerData as Record<string, unknown>)?.organization ??
          (customerData as Record<string, unknown>)?.parent ??
          ""
      ).trim()
    );
    if (des && org) return `${des} at ${org}`;
    return des || org || "";
  }, [profile?.designation, customerData]);

  const roleLabel = String(
    profile?.role_name ??
      (customerData as Record<string, unknown>)?.role_name ??
      (slug?.detail as Record<string, unknown> | undefined)?.role_name ??
      ""
  ).trim();

  const isSuperAdminRoleUser = useMemo(() => {
    if (textIsSuperAdminRole(roleLabel)) return true;
    return userRoleLooksLikeSuperAdmin(
      profile,
      customerData,
      roleOptions,
      slug?.detail
    );
  }, [roleLabel, profile, customerData, roleOptions, slug?.detail]);

  /** Super Admin role must never be changed from this UI (listing + personal settings). */
  const roleFieldEditable = isEditPermission && !isSuperAdminRoleUser;

  const headerEmail = String(
    profile?.email ?? (customerData as Record<string, unknown>)?.email ?? ""
  ).trim();
  const phoneStr = String(
    profile?.mobile_no ??
      (customerData as Record<string, unknown>)?.mobile_no ??
      (customerData as Record<string, unknown>)?.phone ??
      ""
  ).trim();

  const avatarSrc = useMemo(() => {
    const path =
      (customerData as Record<string, unknown>)?.image ??
      (customerData as Record<string, unknown>)?.user_image;
    if (!path || typeof path !== "string") return undefined;
    return `${CONSTANTS.API_BASE_URL}${path}`;
  }, [customerData]);

  const displayAvatarSrc = localAvatarPreview ?? avatarSrc;

  const initials = useMemo(() => {
    const parts = displayName.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "—";
    return parts
      .slice(0, 2)
      .map(p => p[0]?.toUpperCase() ?? "")
      .join("");
  }, [displayName]);

  return (
    <div className="w-full min-w-0">
      <ProfileHero
        name={displayName}
        role={roleLabel}
        subtitle={headerSubtitle}
        contacts={[
          ...(headerEmail
            ? [{ icon: Envelope, value: headerEmail, link: true }]
            : []),
          ...(phoneStr ? [{ icon: Phone, value: phoneStr }] : []),
        ]}
        avatar={
          <div className="relative">
            <CustomAvatar
              alt={displayName || customerData?.name}
              src={displayAvatarSrc}
              size={64}
              variant="circular"
              sx={{
                border: "3px solid",
                borderColor: theme =>
                  theme.palette.mode === "dark" ? "#1C1C1E" : "#f9fbff",
                boxShadow: 2,
                bgcolor: "#FEF3C7",
                color: "#B45309",
                fontSize: 20,
                fontWeight: 800,
              }}
            >
              {initials}
            </CustomAvatar>
            {isEditPermission ? (
              <>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  id="user-overview-avatar-file"
                  hidden
                  disabled={uploadingImage}
                  onChange={handleUserImageSelected}
                />
                <label htmlFor="user-overview-avatar-file">
                  <IconButton
                    component="span"
                    disabled={uploadingImage}
                    size="small"
                    aria-label="Upload profile photo"
                    sx={{
                      position: "absolute",
                      right: 0,
                      bottom: 0,
                      width: 20,
                      height: 20,
                      border: "1px solid",
                      borderColor: theme =>
                        theme.palette.mode === "dark" ? "#3F3F46" : "#E3ECFC",
                      bgcolor: theme =>
                        theme.palette.mode === "dark" ? "#27272A" : "#fff",
                      boxShadow: 1,
                      "&:hover": {
                        bgcolor: theme =>
                          theme.palette.mode === "dark" ? "#3F3F46" : "#EFF6FF",
                      },
                    }}
                  >
                    {uploadingImage ? (
                      <CircularProgress size={10} thickness={5} />
                    ) : (
                      <Camera size={10} weight="duotone" />
                    )}
                  </IconButton>
                </label>
              </>
            ) : null}
          </div>
        }
      />

      <div className="space-y-4">
        <SettingCard icon={PhosphorUser} title="User Information">
          <KVGrid>
            <EditableField
              kvLayout
              label="First Name"
              field="first_name"
              value={profile?.first_name}
              onSave={handleSave}
              isEditpermission={isEditPermission}
            />
            <EditableField
              kvLayout
              label="Last Name"
              field="last_name"
              value={profile?.last_name}
              onSave={handleSave}
              isEditpermission={isEditPermission}
            />
            <EditableField
              kvLayout
              kvLink
              label="Email"
              field="email"
              type="email"
              value={profile?.email}
              onSave={handleSave}
              isEditpermission={isEditPermission}
            />
            <EditableField
              kvLayout
              label="Mobile No"
              field="mobile_no"
              value={profile?.mobile_no}
              onSave={handleSave}
              isEditpermission={isEditPermission}
            />
          </KVGrid>
        </SettingCard>

        <SettingCard icon={ShieldCheck} title="Role Information" color="#8B5CF6">
          <EditableField
            key={`user-role-${String((customerData as Record<string, unknown>)?.name ?? slug?.detail?.name ?? "")}`}
            kvLayout
            label="Role"
            field="role_profile_name"
            type="select"
            options={roleOptions}
            value={profile?.role_name}
            onSave={handleSave}
            isEditpermission={roleFieldEditable}
          />
        </SettingCard>

        <SettingCard
          icon={IdentificationCard}
          title="More Information"
          color="#F59E0B"
        >
          <KVGrid>
            <EditableField
              kvLayout
              label="Gender"
              field="gender"
              type="select"
              options={genderOptions}
              value={profile?.gender}
              onSave={handleSave}
              isEditpermission={isEditPermission}
            />
            <EditableField
              kvLayout
              label="Date Of Birth"
              field="birth_date"
              type="date"
              value={profile?.birth_date}
              onSave={handleSave}
              isEditpermission={isEditPermission}
            />
            <EditableField
              kvLayout
              label="Date Of Joining"
              field="date_of_joining"
              type="date"
              value={profile?.date_of_joining}
              onSave={handleSave}
              isEditpermission={isEditPermission}
            />
          </KVGrid>
        </SettingCard>

        <SettingCard icon={MapPin} title="Address" color="#10B981">
          <EditableAddressField
            kvLayout
            label="Address"
            field="addressid"
            docName={customerData?.name ?? slug?.detail?.name}
            value={profile?.addressid ?? ""}
            isEditPermission={isEditPermission}
            onSave={handleSave}
          />
        </SettingCard>
      </div>
    </div>
  );
};

export default UserOverview;

