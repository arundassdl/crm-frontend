import { convertDate } from "./libs/utils";
import { CONSTANTS } from "@/services/config/app-config"; // Adjust the import based on your project structure
import axios from "axios";

export const getitemdetails = async (
    token: string, 
    itemname: string
  ) => {
    try {
      
        const customerParams = {
            item_code           :   itemname,
            barcode             :   null,
            quotation_to        :   "Customer",
            currency            :   "INR",
            update_stock        :   0,
            conversion_rate     :   1,
            price_list          :   "Standard Selling",
            price_list_currency :   "INR",
            plc_conversion_rate :   1,
            company             :   "Field Service Management (Demo)",
            order_type          :   "Sales",
            is_pos              :   0,
            is_return           :   0,
            ignore_pricing_rule :   0,
            doctype             :   "Quotation",
            name                :   "new-quotation-ecpsvwswoe",
            qty                 :   1,
            net_rate            :   0,
            base_net_rate       :   0,
            stock_qty           :   0,
            conversion_factor   :   0,
            weight_per_unit     :   0,
            weight_uom          :   "",
            stock_uom           :   "Nos",
            pos_profile         :   "",
            child_doctype       :   "Quotation Item",
            child_docname       :   "new-quotation-item-lwsadypwfd"
        };


        const response = await axios.post(
            `${CONSTANTS.API_BASE_URL}/api/method/erpnext.stock.get_item_details.get_item_details`,
            {
              args: customerParams,
            },
            {
              headers: {
                Authorization: `${token}`,
                "Content-Type": "application/json",
              },
            }
          );
        console.log(response, 'response');
    //   const response = await fetch(
    //     `${CONSTANTS.API_BASE_URL}/api/method/erpnext.stock.get_item_details.get_item_details`,
    //     {
    //       method: "POST",
    //       headers: {
    //         Authorization: token,
    //         "Content-Type": "application/json",
    //       },
    //       body: JSON.stringify(customerParams),
    //     }
    //   );
  
    //   if (response.statusText != "OK") {
    //     throw new Error(`Failed to fetch from ERPNext: ${response.statusText}`);
    //   }
  
    //   const data = await response.data;
        console.log("response count:", response?.data?.message);

        
  
      return response?.data?.message;
    } catch (error) {
        console.error('Error uploading images:', error);
        // if (error.code === 'ECONNABORTED') {
        //   response = 'Request timed out';
        // } else if (error.code === 'ERR_BAD_REQUEST') {
        //   response = 'Bad Request';
        // } else if (error.code === 'ERR_INVALID_URL') {
        //   response = 'Invalid URL';
        // } else {
        //   response = error;
        // }
        return error;
    }
  };


  export const get_itemdetails = async (request: any, token: any)=> {
    let response: any;
    const version = CONSTANTS.VERSION;
    const method = 'get_itemdetails';
    const entity = 'product';
    console.log(request, 'body');
    const params = `?version=${version}&method=${method}&entity=${entity}`;
    let url: any
  
    url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}${params}`
  
    const config = {
      headers: {
        Authorization: token,
        Accept: 'application/json',
      },
    };
    try {
        const res = await axios.post(url, request, {
          ...config,
        });
        
        response = res?.data?.message;
        console.log('Submit Add Jobs:', response);
      } catch (error:any) {
        console.error('Error uploading images:', error);
        if (error.code === 'ECONNABORTED') {
          response = 'Request timed out';
        } else if (error.code === 'ERR_BAD_REQUEST') {
          response = 'Bad Request';
        } else if (error.code === 'ERR_INVALID_URL') {
          response = 'Invalid URL';
        } else {
          response = error;
        }
      }
      return response;
  };
  //