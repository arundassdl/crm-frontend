import axios from 'axios';
import { CONSTANTS } from '../../config/app-config';
import { client } from '../general_apis/cookie-instance-api';
import { get_access_token } from "@/store/slices/auth/token-login-slice";
import { store } from "@/store/store";

interface Permission {
  fullAccess: boolean;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  print: boolean;
  import: boolean;
  export: boolean;
  email: boolean;
  dataSharing: 'Private' | 'Public';
}

interface ModulePermissions {
  [roleName: string]: Permission;
}

interface Modules {
  [moduleName: string]: ModulePermissions;
}

interface PermissionMatrixResponse {
  matrix: Modules;
}

interface PermissionResponse {
  module: string;
  role: string;
  permissions: Permission;
}

interface Role {
  name: string;
  role_name?: string;
}

interface Module {
  name: string;
  module_name?: string;
}

// Get permissions matrix for all modules and roles
export const getPermissionsMatrix = async (token: any) => {
  let response: any;
  const version = CONSTANTS.VERSION;
  const stateMethod = 'get_permissions_matrix';
  const entity = 'permission';
  const appcode = CONSTANTS.APPCODE;
  const stateParams = `?version=${version}&method=${stateMethod}&entity=${entity}&app_code=${appcode}`;
  const config = {
    headers: {
      Authorization: token,
    },
  };
  await axios
    .get(
      `${CONSTANTS.API_BASE_URL}/${CONSTANTS.API_MANDATE_PARAMS}${stateParams}`,
      config
    )
    .then((res: any) => {
      console.log('getPermissionsMatrix response:', res);
      response = res?.data?.message?.data;
    })
    .catch((err: any) => {
      console.log('getPermissionsMatrix error:', err);
    });
  return response;
};


// Get permissions for specific module and role
export const getPermissions = async (token: any) => {
  let response: any;
  const version = CONSTANTS.VERSION;
  const stateMethod = 'get_permissions';
  const entity = 'permission';
  const appcode = CONSTANTS.APPCODE;
  const stateParams = `?version=${version}&method=${stateMethod}&entity=${entity}&app_code=${appcode}`;
  const config = {
    headers: {
      Authorization: token,
    },
  };
  await axios
    .get(
      `${CONSTANTS.API_BASE_URL}/${CONSTANTS.API_MANDATE_PARAMS}${stateParams}`,
      config
    )
    .then((res: any) => {
      console.log('getPermissions response:', res);
      response = res?.data?.message?.data;
    })
    .catch((err: any) => {
      console.log('getPermissions error:', err);
    });
  return response;
};

// Save permissions matrix
export const savePermissionsMatrix = async (token: any, matrix: Modules) => {
  const version = CONSTANTS.VERSION;
  const method = 'save_permissions_matrix';
  const entity = 'permission';
  const appcode = CONSTANTS.APPCODE;
  
  const url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}`;
  
  const config = {
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  };
  
  // Send request body in the same format as the working curl command
  const requestBody = {
    version,
    method,
    entity,
    app_code: appcode,
    matrix
  };
  
  console.log('savePermissionsMatrix URL:', url);
  console.log('savePermissionsMatrix token:', token);
  console.log('savePermissionsMatrix request body:', requestBody);

  try {
    const res = await axios.post(url, requestBody, config);
    console.log('savePermissionsMatrix response:', res);
    
    // Check if the response indicates an error
    if (res.data && res.data.message && res.data.message.msg === 'error') {
      const errorMessage = res.data.message.error || 'Unknown error occurred';
      throw new Error(errorMessage);
    }
    
    return res.data;
  } catch (err: any) {
    console.log('savePermissionsMatrix error:', err);
    console.log('Error details:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data
    });
    
    // If it's an axios error with response data, extract the error message
    if (err.response?.data?.message?.error) {
      throw new Error(err.response.data.message.error);
    }
    
    // If it's an axios error with server messages, extract those
    if (err.response?.data?.message?._server_messages) {
      const serverMessages = err.response.data.message._server_messages;
      const parsedMessages = serverMessages.map((msg: string) => {
        try {
          const parsed = JSON.parse(msg);
          return parsed.message || msg;
        } catch {
          return msg;
        }
      });
      throw new Error(parsedMessages.join('; '));
    }
    
    // Re-throw the original error if no specific error message found
    throw err;
  }
};


export const getAllRoles = async (token: any) => {
    let response: any;
    const version = CONSTANTS.VERSION;
    const stateMethod = 'get_all_roles';
    const entity = 'permission';
    const appcode = CONSTANTS.APPCODE;
    const stateParams = `?version=${version}&method=${stateMethod}&entity=${entity}&app_code=${appcode}`;
    const config = {
      headers: {
        Authorization: token,
      },
    };
    await axios
      .get(
        `${CONSTANTS.API_BASE_URL}/${CONSTANTS.API_MANDATE_PARAMS}${stateParams}`,
        config
      )
      .then((res: any) => {
        console.log('get_rolesname', res);
        response = res?.data?.message?.data;
      })
      .catch((err: any) => {
        console.log('err', err);
      });
    return response;
  };
  



// Get all modules
// export const getAllModules = async (token: any): Promise<Module[]> => {
//   try {
//     const token = get_access_token(store.getState());
//     const version = CONSTANTS.VERSION;
//     const method = 'get_all_modules';
//     const entity = 'permission';
//     const appcode = CONSTANTS.APPCODE;
    
//     const params = `?version=${version}&method=${method}&entity=${entity}&app_code=${appcode}`;
//     const url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}${params}`;
    
//     console.log('getAllModules URL:', url);
//     console.log('getAllModules token:', token?.token);
    
//     const config = {
//       headers: {
//         Authorization: token?.token,
//       },
//     };

//     const response = await client.post(url, {}, config);
//     console.log('getAllModules response:', response.data);
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching modules:', error);
//     console.error('Error response:', (error as any).response?.data);
//     throw error;
//   }
// };

export const getAllModules = async (token: any) => {
    let response: any;
    const version = CONSTANTS.VERSION;
    const stateMethod = 'get_all_modules';
    const entity = 'permission';
    const appcode = CONSTANTS.APPCODE;
    const stateParams = `?version=${version}&method=${stateMethod}&entity=${entity}&app_code=${appcode}`;
    const config = {
      headers: {
        Authorization: token,
      },
    };
    await axios
      .get(
        `${CONSTANTS.API_BASE_URL}/${CONSTANTS.API_MANDATE_PARAMS}${stateParams}`,
        config
      )
      .then((res: any) => {
        console.log('getAllModules response:', res);
        response = res?.data?.message?.data;
      })
      .catch((err: any) => {
        console.log('err', err);
      });
    return response;
  };
