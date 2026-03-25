import axios from 'axios';
import { CONSTANTS } from '../../config/app-config';
import { client } from '../general_apis/cookie-instance-api';
import { API_CONFIG } from '../../config/api-config';
// import { URLSearchParams } from "url"
import { useSearchParams } from 'next/navigation'

export const getSPartnerListDatagrid = async (request:any, token: any) => {
  let response: any;
  const version = CONSTANTS.VERSION;
  const method = 'web_salespartner_list';
  const entity = 'sales_partner';
  console.log(request, 'body');
  const params = `?version=${version}&method=${method}&entity=${entity}`;
  let url: any
 
  let page_no = 0;
  let limit =  20;
  page_no = request?.page;
  page_no = (page_no!=undefined)?page_no:1;
  limit = request?.limit;

  let q = request?.q;
    
  let searchparams = (q!='' && q!=null)?`&q=${q}`:''

  const filterQuery = request.items
  .map(item => `${item.field}=${item.value}&operator=${item.operator}`)
  .join('&');
  let sortParams =  "";
  if(request?.sortModel){
  const sortQuery = request.sortModel.map(item => `${item.field}=${item.sort}`)
  .join('&');
console.log("filterQuery1",sortQuery);

if(sortQuery!=''){
  sortParams = `&sort=[${sortQuery}]`
}
console.log("filterQuery1",sortQuery);
  }
  
  url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}${params}&page_no=${request?.page}&limit=${request?.rowsPerPage}&${filterQuery}${sortParams}${searchparams}`
 
  const config = {
    headers: {
      Authorization: token,
      // Accept: 'application/json',
      'Content-Type': 'multipart/form-data' 
    },
  };
  //    const val= JSON.stringify(body)

  await axios
    .post(
      url,
      request,
      { ...config, timeout: 5000 }
    )
    .then((res) => {
      console.log(res, 'rrrr');
      response = res?.data?.message;
    })
    .catch((err) => {
      if (err.code === 'ECONNABORTED') {
        response = 'Request timed out';
      } else if (err.code === 'ERR_BAD_REQUEST') {
        response = 'Bad Request';
      } else if (err.code === 'ERR_INVALID_URL') {
        response = 'Invalid URL';
      } else {
        response = err;
      }
    });
  return response;
};


export const getSPartnerListNew = async (request:any, token: any) => {
  let response: any;
  const version = CONSTANTS.VERSION;
  const method = 'salespartner_list';
  const entity = 'sales_partner';
  console.log(request, 'body');
  const params = `?version=${version}&method=${method}&entity=${entity}`;
  let url: any
 
  let page_no = 0;
  let limit =  20;
  page_no = request?.page;
  page_no = (page_no!=undefined)?page_no:1;
  limit = request?.limit;

  let q = request?.q;
    
  let searchparams = (q!='' && q!=null)?`&q=${q}`:''

  url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}${params}&page_no=${request?.page}&limit=${request?.rowsPerPage}${searchparams}`
 
  const config = {
    headers: {
      Authorization: token,
      // Accept: 'application/json',
      'Content-Type': 'multipart/form-data' 
    },
  };
  //    const val= JSON.stringify(body)

  await axios
    .post(
      url,
      request,
      { ...config, timeout: 5000 }
    )
    .then((res) => {
      console.log(res, 'rrrr');
      response = res?.data?.message;
    })
    .catch((err) => {
      if (err.code === 'ECONNABORTED') {
        response = 'Request timed out';
      } else if (err.code === 'ERR_BAD_REQUEST') {
        response = 'Bad Request';
      } else if (err.code === 'ERR_INVALID_URL') {
        response = 'Invalid URL';
      } else {
        response = err;
      }
    });
  return response;
};


export const getSPartnerList = async (request:any, token: any) => {
  let response: any;
  const version = CONSTANTS.VERSION;
  const method = 'salespartner_list';
  const entity = 'sales_partner';
  console.log(request, 'body');
  const params = `?version=${version}&method=${method}&entity=${entity}`;
  let url: any
 
  let page_no = 0;
  let limit =  20;
  page_no = request?.page;
  page_no = (page_no!=undefined)?page_no:1;
  limit = request?.limit;

  let q = request?.q;
    
  let searchparams = (q!='' && q!=null)?`&q=${q}`:''
  let filterparams = (request?.type!='' && request?.type!=null)?`&type=${request?.type}`:''

  url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}${params}&page_no=${page_no}&limit=${limit}${searchparams}${filterparams}`
 
  const config = {
    headers: {
      Authorization: token,
      // Accept: 'application/json',
      'Content-Type': 'multipart/form-data' 
    },
  };
  //    const val= JSON.stringify(body)

  await axios
    .post(
      url,
      request,
      { ...config, timeout: 5000 }
    )
    .then((res) => {
      console.log(res, 'rrrr');
      response = res?.data?.message;
    })
    .catch((err) => {
      if (err.code === 'ECONNABORTED') {
        response = 'Request timed out';
      } else if (err.code === 'ERR_BAD_REQUEST') {
        response = 'Bad Request';
      } else if (err.code === 'ERR_INVALID_URL') {
        response = 'Invalid URL';
      } else {
        response = err;
      }
    });
  return response;
};

export const getSPartnerDetail = async (request:any, token: any) => {
  let response: any;
  const version = CONSTANTS.VERSION;
  const method = 'web_salespartner_list';
  const entity = 'sales_partner';
  console.log(request, 'body');
  const params = `?version=${version}&method=${method}&entity=${entity}`;
  let url: any
 
  let page_no = 0;
  let limit =  20;
  page_no = request?.page;
  page_no = (page_no!=undefined)?page_no:1;
  limit = request?.limit;

  let q = request?.q;
    
  let searchparams = (q!='' && q!=null)?`&q=${q}`:''

  url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}${params}&name=${request?.name}`
 
  const config = {
    headers: {
      Authorization: token,
      // Accept: 'application/json',
      'Content-Type': 'multipart/form-data' 
    },
  };
  //    const val= JSON.stringify(body)

  await axios
    .post(
      url,
      request,
      { ...config, timeout: 5000 }
    )
    .then((res) => {
      console.log(res, 'rrrr');
      response = res?.data?.message;
    })
    .catch((err) => {
      if (err.code === 'ECONNABORTED') {
        response = 'Request timed out';
      } else if (err.code === 'ERR_BAD_REQUEST') {
        response = 'Bad Request';
      } else if (err.code === 'ERR_INVALID_URL') {
        response = 'Invalid URL';
      } else {
        response = err;
      }
    });
  return response;
};

export const EditSalePartnerUpdate = async (request:any, token: any) => {
  let response: any;
  const version = CONSTANTS.VERSION;
  const method = 'update_sp';
  const entity = 'sales_partner';
  console.log(request, 'body');
  const params = `?version=${version}&method=${method}&entity=${entity}`;
  let url: any
  let form_data = request.files;

  url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}${params}`

 
  const config = {
    headers: {
      Authorization: token,
      // Accept: 'application/json',
      'Content-Type': 'multipart/form-data' 
    },
  };
  //    const val= JSON.stringify(body)

  await axios
    .post(
      url,
      request,
      { ...config, timeout: 5000 }
    )
    .then((res) => {
      console.log(res?.data?.message?.data, 'rrrr1');
      if(res?.data?.message?.msg=="success"){
        if(request["sp_name"]!=request["partner_name"]){
        renameDoctype(request,token)
        }
      }
      response = res?.data?.message;
    })
    .catch((err) => {
      if (err.code === 'ECONNABORTED') {
        response = 'Request timed out';
      } else if (err.code === 'ERR_BAD_REQUEST') {
        response = 'Bad Request';
      } else if (err.code === 'ERR_INVALID_URL') {
        response = 'Invalid URL';
      } else {
        response = err;
      }
    });
  return response;
};


export const ActivateDeactivateSalePartner = async (request:any, token: any) => {
  let response: any;
  const version = CONSTANTS.VERSION;
  const method = 'activate_user';
  const entity = 'sales_partner';
  console.log(request, 'body');
  const params = `?version=${version}&method=${method}&entity=${entity}`;
  let url: any
  let form_data = request.files;

  url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}${params}`

 
  const config = {
    headers: {
      Authorization: token,
      // Accept: 'application/json',
      'Content-Type': 'multipart/form-data' 
    },
  };
  //    const val= JSON.stringify(body)

  await axios
    .post(
      url,
      request,
      { ...config, timeout: 5000 }
    )
    .then((res) => {
      console.log(res, 'rrrr');
     
      response = res?.data?.message;
    })
    .catch((err) => {
      if (err.code === 'ECONNABORTED') {
        response = 'Request timed out';
      } else if (err.code === 'ERR_BAD_REQUEST') {
        response = 'Bad Request';
      } else if (err.code === 'ERR_INVALID_URL') {
        response = 'Invalid URL';
      } else {
        response = err;
      }
    });
  return response;
};


// http://127.0.0.1:8005/api/method/frappe.desk.form.save.savedocs


export const updateDoctype= async (data:any, token: any) => {
  let response: any;
  const version = CONSTANTS.VERSION;
  const method = 'frappe.desk.form.save.savedocs';
 
  const config = {
    headers: {
      Authorization: token,
    }, 
  };
  const request = {}
  request["doc"] = JSON.stringify(data)
  // request["doc"]["doctype"] = "Sales Partner"
  // request["doc"]["__unsaved"] = 1
  request["action"] = "Save"
  const url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_FRAPPE_PARAMS}/${method}`;
  console.log("update request",request);
  
  await axios
    .post(`${url}`, request, { ...config, timeout: 5000 })
    .then((res) => {
      console.log('filters check in  list api res successful', res);
      response = res?.data?.message;
    })
    .catch((err) => {
      if (err.code === 'ECONNABORTED') {
        response = 'Request timed out';
      } else if (err.code === 'ERR_BAD_REQUEST') {
        response = 'Bad Request';
      } else if (err.code === 'ERR_INVALID_URL') {
        response = 'Invalid URL';
      } else {
        response = err;
      }
    });
  return response;
}


// http://127.0.0.1:8005/api/method/frappe.model.rename_doc.update_document_title

export const renameDoctype= async (data:any, token: any) => {
  let response: any;
  const version = CONSTANTS.VERSION;
  const method = 'frappe.model.rename_doc.update_document_title';
 
  const config = {
    headers: {
      Authorization: token,
    }, 
  };
  const request = {}  
  request["doctype"] = "Sales Partner"
  request["docname"] = data["sp_name"]
  request["name"] = data["partner_name"]
  request["enqueue"] =  true
  request["freeze"] = true
  request["freeze_message"] = "Updating+related+fields..."
  
  const url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_FRAPPE_PARAMS}/${method}`;
  console.log("rename request",request);
  
  await axios
    .post(`${url}`, request, { ...config, timeout: 5000 })
    .then((res) => {
      console.log('filters check in  list api res successful', res);
      response = res?.data?.message;
    })
    .catch((err) => {
      if (err.code === 'ECONNABORTED') {
        response = 'Request timed out';
      } else if (err.code === 'ERR_BAD_REQUEST') {
        response = 'Bad Request';
      } else if (err.code === 'ERR_INVALID_URL') {
        response = 'Invalid URL';
      } else {
        response = err;
      }
    });
  return response;
}


export const fetchDoctypeCount= async (data:any, token: any) => {
  let response: any;
  const version = CONSTANTS.VERSION;
  const method = 'frappe.desk.reportview.get_count';
  const entity = 'Sales Partner';
  let page_no: any;
  let limit: any;
  
//   const searchParams = useSearchParams() 
// console.log(searchParams, 'searchParams$$$$$$$$$');

  const config = {
    headers: {
      Authorization: token,
    }, 
  };
  const request = {}
 

  if(data.doctype){request["doctype"]=data.doctype}
  if(!data.fields){request["fields"]=["*"]}
   if(!data.filters){request["filters"]=[]}
   if(!data.distinct){request["distinct"]="false"}
   
   
   
  const url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_FRAPPE_PARAMS}/${method}`;
  

  console.log('search url', url);
  // const res = await axios.post(url, request, {
  //   ...config,
  // });

  await axios
    .post(`${url}`, request, { ...config, timeout: 5000 })
    .then((res) => {
      console.log('filters check in  list api res successful', res);
      response = res?.data?.message;
    })
    .catch((err) => {
      if (err.code === 'ECONNABORTED') {
        response = 'Request timed out';
      } else if (err.code === 'ERR_BAD_REQUEST') {
        response = 'Bad Request';
      } else if (err.code === 'ERR_INVALID_URL') {
        response = 'Invalid URL';
      } else {
        response = err;
      }
    });
  return response;
}

export const fetchSalesPartnerList = async (data:any, token: any,query: any) => {
    let response: any;
    const version = CONSTANTS.VERSION;
    const method = 'frappe.desk.reportview.get';
    const entity = 'Sales Partner';
    let page_no: any;
    let limit: any;
    page_no = query?.page;
    page_no = (page_no!=undefined)?page_no:1;
    limit = query?.limit
    
    const serial_no = query?.serial_no 
    const serialno = (serial_no!=undefined)?serial_no:"";
    console.log("query22222222222222222222",query);
    let q = query?.q;
    let searchparams = (q!='' && q!=null)?`&q=${q}`:''
 
  //   const searchParams = useSearchParams() 
  // console.log(searchParams, 'searchParams$$$$$$$$$');

    const config = {
      headers: {
        Authorization: token,
      }, 
    };
    const request = {}
    // request.doctype = data.doctype;
    // request.fields=["*"]
    // request.filters=[]
    // request.start ="0"
    // request.page_length ="0"
    // request.view="List"
    // request.group_by="`tabSales Partner`.`name`"

    const order_by ="`tab"+data.doctype+"`.`modified` desc"
    const group_by ="`tab"+data.doctype+"`.`name`"

    if(data.doctype){request["doctype"]=data.doctype}
    if(!data.fields){request["fields"]=["*"]}else{request["fields"]=data.fields}
     if(!data.or_filters){request["or_filters"]=[]}else{request["or_filters"]=data.or_filters}
     if(!data.order_by){request["order_by"]=order_by}else{request["order_by"]=data.order_by}
     if(!data.start){request["start"]="0"}else{request["start"]=data.start}
     if(!data.page_length){request["page_length"]="20"}else{request["page_length"]=data.page_length}
     if(!data.view){request["view"]="List"}else{request["view"]=data.view}
     if(!data.group_by){request["group_by"]=group_by}else{request["group_by"]=data.group_by}
     
    const url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_FRAPPE_PARAMS}/${method}`;
    

    console.log('search url', url);
    // const res = await axios.post(url, request, {
    //   ...config,
    // });

    await axios
      .post(`${url}`, request, { ...config, timeout: 5000 })
      .then((res) => {
        console.log('filters check in   list api res successful', res);
        response = res?.data?.message;
      })
      .catch((err) => {
        if (err.code === 'ECONNABORTED') {
          response = 'Request timed out';
        } else if (err.code === 'ERR_BAD_REQUEST') {
          response = 'Bad Request';
        } else if (err.code === 'ERR_INVALID_URL') {
          response = 'Invalid URL';
        } else {
          response = err;
        }
      });
    return response;
  };

  

  // http://127.0.0.1:8005/api/method/frappe.desk.form.load.getdoc?doctype=Sales%20Partner&name=yousuff&_=1719902514895


  export const fetchSalesPartnerDetail = async (request:any,token: any) => {
    let response: any;
    const version = CONSTANTS.VERSION;
    const method = 'frappe.desk.form.load.getdoc';

    const config = {
      headers: {
        Authorization: token,
      },
    };
   
    const url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_FRAPPE_PARAMS}/${method}?doctype=${request.doctype}&name=${request.name}&version=${version}`;
  
    console.log('search url', url);
    await axios
      .get(`${url}`, { ...config, timeout: 5000 })
      .then((res) => {
        console.log('filters check in detail api res successful', res);
        response = res?.data;
      })
      .catch((err) => {
        if (err.code === 'ECONNABORTED') {
          response = 'Request timed out';
        } else if (err.code === 'ERR_BAD_REQUEST') {
          response = 'Bad Request';
        } else if (err.code === 'ERR_INVALID_URL') {
          response = 'Invalid URL';
        } else {
          response = err;
        }
      });
    return response;
  };

  // http://127.0.0.1:8005/api/method/frappe.desk.form.load.getdoc?doctype=User&name=distributor1%40mailnator.com&_=1719984848786

  export const fetchUserDetail = async (request:any,token: any) => {
    let response: any;
    const version = CONSTANTS.VERSION;
    const method = 'frappe.desk.form.load.getdoc';

    const config = {
      headers: {
        Authorization: token,
      },
    };
   
    const url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_FRAPPE_PARAMS}/${method}?doctype=${request.doctype}&name=${request.email}&version=${version}`;
  
    console.log('search url', url);
    await axios
      .get(`${url}`, { ...config, timeout: 5000 })
      .then((res) => {
        console.log('filters check in detail api res successful', res);
        response = res?.data;
      })
      .catch((err) => {
        if (err.code === 'ECONNABORTED') {
          response = 'Request timed out';
        } else if (err.code === 'ERR_BAD_REQUEST') {
          response = 'Bad Request';
        } else if (err.code === 'ERR_INVALID_URL') {
          response = 'Invalid URL';
        } else {
          response = err;
        }
      });
    return response;
  };
