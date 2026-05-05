import * as Yup from "yup";

export interface FieldConfig {
  name: string;
  label: string;
  type:
  | "text"
  | "email"
  | "number"
  | "longinteger"
  | "currency"
  | "firstname"
  | "mobile_no"
  | "picklist"
  | "select"
  | "password"
  | "radio"
  | "checkbox"
  | "switch"
  | "date"
  | "datetime"
  | "textarea"
  | "multiline"
  | "autocomplete"
  | "file"
  | "lookup"
  | "contactlead"
  | "address"
  | "custom";
  placeholder?: string;
  options?: { label: string; value: string }[]; // Only for select, radio
  validation?: Yup.AnySchema;
  validate?: boolean | ((values: any) => boolean); // New field to control validation
  section?: string; // Section heading
  showIf?: (values: any) => boolean;
  max_length?: number; // Max character length (text/phone/url fields)
  max_digits?: number; // Max digits allowed (number/longinteger/currency fields)
  decimal_places?: number; // Decimal places (currency fields)
  salutation_options?: string[]; // Selectable salutations (firstname fields)
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
  disable?: boolean | ((values: any) => boolean);
  btnDisable?: boolean | ((values: any) => boolean);
  hideInEdit?: boolean;
  hide?: boolean | ((values: any) => boolean);
  showIf?: (values: any) => boolean;
  value?: string; // value
  switchlabels?: string[];
  fullwidth?: boolean | ((values: any) => boolean);
  doctype?: string;
  referenceDoctype?: string;
  filters?: any;
  searchFields?: string[];
  displayFields?: string[];
  search_fields?: string[];
  display_fields?: string[];
  address_available_fields?: {
    key: string;
    label: string;
    technical_name?: string;
    enabled?: boolean;
    visible?: boolean;
    required?: boolean;
    hide?: boolean;
  }[];
  section_column_count?: 1 | 2;
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
      case "firstname":
        // The text part validated as a plain trimmed string; salutation handled by UI
        fieldValidation = Yup.string().trim();
        break;
      case "text": {
        const maxLen = (field as any).max_length ?? 255;
        fieldValidation = Yup.string()
          .trim()
          .max(maxLen, `Maximum ${maxLen} characters allowed`);
        break;
      }
      case "textarea":
      case "multiline":
        fieldValidation = Yup.string()
          .trim();
        break;
      case "email":
        fieldValidation = Yup.string()
          .transform((value) => (value === "" ? undefined : value))
          .email("Invalid email format");
        break;
      case "number":
      case "longinteger":
      case "currency": {
        const maxDigits = (field as any).max_digits ?? (field.type === 'number' ? 9 : 18);
        const maxVal = Math.pow(10, maxDigits) - 1;
        const decimalPlaces: number | undefined =
          field.type === 'currency' ? ((field as any).decimal_places ?? 2) : undefined;
        let numSchema = Yup.number()
          .typeError("Must be a number")
          .max(maxVal, `Maximum ${maxDigits} digits allowed`);
        if (decimalPlaces !== undefined) {
          numSchema = numSchema.test(
            'decimal-places',
            `Maximum ${decimalPlaces} decimal place${decimalPlaces === 1 ? '' : 's'} allowed`,
            (val) => {
              if (val === undefined || val === null) return true;
              const parts = String(val).split('.');
              return parts.length === 1 || parts[1].length <= decimalPlaces;
            }
          );
        }
        fieldValidation = numSchema;
        break;
      }
      case "mobile_no":
        fieldValidation = Yup.string()
          .transform((value) => (value === "" ? undefined : value))
          .matches(/^\d+$/, "Only numeric values are allowed")
          .matches(/^\d{10,}$/, "Must be at least 10 digits");
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
      case "picklist":
      case "select":
        fieldValidation = Yup.string();
        break;
      case "autocomplete":
        fieldValidation = Yup.string();
        break;
      case "custom":
        console.log("field.name", field.name);

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
              message: "Please select at least one value for each selected attribute",
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
                console.log("contextcontext", context);

                const { has_variants, variants } = context.options.context || {};
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
                console.log("variants", variants);
                const errors: any[] = [];
                for (let i = 0; i < variants.length; i++) {
                  const variant = variants[i];
                  if (!variant.item_code) {
                    return this.createError({
                      path: `variants[${i}].item_code`,
                      message: "Item code is required",
                    });
                  } else if (!variant.item_name) {
                    return this.createError({
                      path: `variants[${i}].item_name`,
                      message: "Item name is required",
                    });
                  } else if (!variant.item_group) {
                    return this.createError({
                      path: `variants[${i}].item_group`,
                      message: "Item group is required",
                    });
                  } else if (!variant.qty) {
                    return this.createError({
                      path: `variants[${i}].qty`,
                      message: "Item Qty is required",
                    });
                  } else if (!variant.standard_buying) {
                    return this.createError({
                      path: `variants[${i}].standard_buying`,
                      message: "Buying price is required",
                    });
                  } else if (!variant.standard_selling) {
                    return this.createError({
                      path: `variants[${i}].standard_selling`,
                      message: "Selling price is required",
                    });
                  }
                  if (variant.standard_selling > 0 && variant.standard_buying > 0) {
                    if (variant.standard_selling < variant.standard_buying) {
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
        } else {
          fieldValidation = Yup.string();
        }

        break;
      case "date":
        fieldValidation = Yup.date();
        break;
      case "address":
        // Address fields store a structured object (country, state, etc.)
        // so allow any shape here instead of enforcing string.
        fieldValidation = Yup.mixed();
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
    console.log("fieldValidation=>", fieldValidation);


    // Apply custom validation if provided
    schema[field.name] = field.validation ? field.validation : fieldValidation;

  });

  //  Conditional validation for address fields
  // schema["address_line1"] = Yup.string().nullable();
  schema["address_title"] = Yup.string().nullable();

  ["address_type", "city", "state", "country", "pincode"].forEach(
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
  console.log("schema", schema);

  return Yup.object().shape(schema);
};
