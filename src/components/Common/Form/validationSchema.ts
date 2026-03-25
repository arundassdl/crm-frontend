import * as Yup from "yup";

export interface FieldConfig {
  name: string;
  label: string;
  type:
    | "text"
    | "email"
    | "number"
    | "mobile_no"
    | "select"
    | "password"
    | "radio"
    | "checkbox"
    | "switch"
    | "date"
    | "datetime"
    | "textarea"
    | "autocomplete"
    | "file"
    | "custom";
  placeholder?: string;
  options?: { label: string; value: string }[]; // Only for select, radio
  validation?: Yup.AnySchema;
  validate?: boolean | ((values: any) => boolean); // New field to control validation
  section?: string; // Section heading
  showIf?: (values: any) => boolean;
}

export interface FieldConfigNew extends FieldConfig {
  section?: string; // Field to define sections like "Contact Details", "Address Details"
  sectiontype?: string | ((values: any) => string | ""); // Accordion  
  dependsOn?: string; // For dynamic dependency (e.g., state depends on country)
  fetchOptions?: (
    parentValue: string
  ) => Promise<{ label: string; value: string }[]>; //  Function to fetch options dynamically
  component?: React.FC<any>;
  componentProps?: Record<string, any>; 
  disable?:boolean | ((values: any) => boolean); 
  btnDisable?:boolean | ((values: any) => boolean); 
  hideInEdit?:boolean;
  hide?:boolean | ((values: any) => boolean);
  showIf?: (values: any) => boolean;
  value?: string; // value
  switchlabels?:string[]
  fullwidth?:boolean | ((values: any) => boolean); 
}
const formatLabel = (str) => {
  return str
    .split("_") // Split by underscore
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize first letter
    .join(" "); // Join back with space
};
export const getValidationSchema = (fields: FieldConfig[]) => {
  const schema: Record<string, Yup.AnySchema> = {};

  fields.forEach((field) => {

    let fieldValidation: Yup.AnySchema = Yup.string();

    switch (field.type) {
      case "text":
      case "textarea":
        fieldValidation = Yup.string()
          .trim();
        break;
      case "email":
        fieldValidation = Yup.string()
          .email("Invalid email format")
          .required("Email is required");
        break;
      case "number":
        fieldValidation = Yup.number()
          .typeError("Must be a number");
        break;
        case "mobile_no":
          fieldValidation = Yup.string()
          .matches(/^\d+$/, "Only numeric values are allowed") // Ensure only numbers
          .matches(/^\d{10,}$/, "Must be at least 10 digits"); // Ensure minimum 10 digits          
          break;
      case "password":
        fieldValidation = Yup.string()
          .min(6, "Password must be at least 6 characters")
          .required("Password is required");
        break;
      // case "checkbox":
      //   fieldValidation = Yup.boolean()
      //     .oneOf([true], "This field must be checked")
      //     .required();
      //   break;
      case "radio":
      case "select":
        fieldValidation = Yup.string();
        break;
      case "autocomplete":
        fieldValidation = Yup.string();
        break;
      case "custom":
        console.log("field.name",field.name);
        
        // if (field.name === "attributes") {
        //   fieldValidation = Yup.object().test({
        //     name: "attributes-validation",
        //     message: "Please select at least one value for each selected attribute",
        //     test: function (value) {
        //       const { has_variants } = this.options.context || {};
        //       if (!has_variants) return true; // Don't validate if has_variants is false        
        //       if (
        //         value &&
        //         typeof value === "object" &&
        //         Object.values(value).some(
        //           (arr) => Array.isArray(arr) && arr.length > 0
        //         )
        //       ) {
        //         return true;
        //       }
        
        //       return this.createError({
        //         path: this.path,
        //         message:
        //           "Please select at least one value for each selected attribute",
        //       });
        //     },
        //   });
        // }else{
        //   fieldValidation = Yup.string();
        // }
        if (field.name === "attributes") {
          fieldValidation = Yup.object()
            .test({
              name: "attributes-validation",
              message: "Please select at least one value for each selected attribute" ,
              test: function (value) {

                const { has_variants } = this.options.context || {};
                if (!has_variants) return true;
        
                const isValid =
                  value &&
                  typeof value === "object" &&
                  Object.values(value).every(
                    (v) => Array.isArray(v) && v.length > 0
                  );
        
                return isValid;
              },
            })
            .test({
              name: "variants-validation",
              message: "Each variant must have item_code and item_name",
              test: function (_, context) {
                console.log("contextcontext",context);
                
                const { has_variants,variants } = context.options.context || {};
                // const variants = [
                //   { item_code: "", item_name: "", image: null,item_group:"",cost_price:"",standard_selling: "",qty:""}
                // ]

                if (!has_variants) return true;
        
                if (!Array.isArray(variants) || variants.length === 0) {
                  return this.createError({
                    path: this.path,
                    message: "Variants are required when attributes are selected",
                  });
                }
                console.log("variants",variants );
                const errors: any[] = [];
                for (let i = 0; i < variants.length; i++) {
                  const variant = variants[i];
                  if (!variant.item_code) {
                    return this.createError({
                      path: `variants[${i}].item_code`,
                      message: "Item code is required",
                    });
                  }else if (!variant.item_name) {
                    return this.createError({
                      path: `variants[${i}].item_name`,
                      message: "Item name is required",
                    });
                  }else if (!variant.item_group) {
                    return this.createError({
                      path: `variants[${i}].item_group`,
                      message: "Item group is required",
                    });
                  }else if (!variant.qty) {
                    return this.createError({
                      path: `variants[${i}].qty`,
                      message: "Item Qty is required",
                    });
                  }else if (!variant.standard_buying) {
                    return this.createError({
                      path: `variants[${i}].standard_buying`,
                      message: "Buying price is required",
                    });
                  }else if (!variant.standard_selling) {
                    return this.createError({
                      path: `variants[${i}].standard_selling`,
                      message: "Selling price is required",
                    });
                  }
                  if (variant.standard_selling>0 && variant.standard_buying>0) {
                    if(variant.standard_selling < variant.standard_buying){
                      return this.createError({
                        path: `variants[${i}].standard_selling`,
                        message: "Selling price must be greater than buying price",
                      });
                    }
                  }
                }
        
                return true;
              },
            });
        }else{
          fieldValidation = Yup.string();
        }
        
        break;
      case "date":
        fieldValidation = Yup.date();
        break;
      default:
        fieldValidation = Yup.string();
    }   
 
    if (typeof field.validate === "function") {
      //   const possibleDeps = ["has_variants", "customer_type"];
      // const dependentKeys = possibleDeps.filter((key) => key !== field.name); // Avoid cyclic

      // fieldValidation = fieldValidation.when(dependentKeys, {
      //   is: (...args: any[]) => {
      //     const valuesObj = dependentKeys.reduce((acc, key, index) => {
      //       acc[key] = args[index];
      //       return acc;
      //     }, {} as Record<string, any>);

      //     return typeof field.validate === "function"
      //     ? field.validate(valuesObj)
      //     : false;
      //   },
      //   then: (schema) => schema.required(`${field.label} is required`),
      //   otherwise: (schema) => schema.notRequired(),
      // });

  // fieldValidation = fieldValidation.when("has_variants", {
  //   is: (hasVariants) => {
  //     // simulate values for validate() check
  //     return typeof field.validate === "function"
  //          ? field.validate!({ has_variants: hasVariants }):false;
  //   },
  //   then: (schema) => schema.required(`${field.label} is required`),
  //   otherwise: (schema) => schema.notRequired(),
  // });

   
      fieldValidation = fieldValidation.when("customer_type", {
        is: (customerType) => field.validate && typeof field.validate === "function" ? field.validate({ customer_type: customerType }) : false, 
        then: (schema) => schema.required(`${field.label} is required`),
        otherwise: (schema) => schema.notRequired(),
      });
    } else if (field.validate === true) {
      fieldValidation = fieldValidation.required(`${field.label} is required`);
    } else {
      fieldValidation = fieldValidation.notRequired();
    }
    console.log("fieldValidation=>",fieldValidation);
    

    // Apply custom validation if provided
    schema[field.name] = field.validation ? field.validation : fieldValidation;
    
  });

  //  Conditional validation for address fields
  // schema["address_line1"] = Yup.string().nullable();
  schema["address_title"] = Yup.string().nullable();

  ["address_type", "city", "state", "country", "pincode", "territory"].forEach(
    (field) => {
      schema[field] = Yup.string().when(["address_line1", "address_title"], {
        is: (
          addressLine1: string | undefined | null,
          addressTitle: string | undefined | null
        ) => Boolean(addressLine1?.trim()) || Boolean(addressTitle?.trim()), // If either is filled
        then: (schema) => schema.required(`${formatLabel(field)} is required`),
        otherwise: (schema) => schema.notRequired(),
      });
    }
  );
console.log("schema",schema);

  return Yup.object().shape(schema);
};
