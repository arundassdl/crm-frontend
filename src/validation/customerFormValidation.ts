import * as Yup from 'yup';

export const CustomerFormValidation = Yup.object().shape({
  customer_name: Yup.string()
    .required('Name is a required field.')
    .min(3, 'Name must be atleast 3 characters.'),   
  //   address_2: Yup.string().required("The Street Address field is required."),
  customer_type: Yup.string().notOneOf(
    [
      "Customer Type",
    ], "Please select customer type").required('Please select customer type.'),

    email_id: Yup.string().email('Please enter valid email.'),
    mobile_no: Yup.number()
    .typeError("That doesn't look like a phone number.")
    .positive("Mobile number can't start with a minus.")
    .integer("Mobile number can't include a decimal point.")
    .min(10),
    // .required('Mobile number is required.'),

    address_line1: Yup.string(),
    city: Yup.string().when("address_line1", {
      is: (val: string | undefined) => val && val.trim() !== "",
      then: (schema) => schema.required("City is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
  
    state: Yup.string().when("address_line1", {
      is: (val: string | undefined) => val && val.trim() !== "",
      then: (schema) => schema.required("State is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
  
    country: Yup.string().when("address_line1", {
      is: (val: string | undefined) => val && val.trim() !== "",
      then: (schema) => schema.required("Country is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
  
    pincode: Yup.string().when("address_line1", {
      is: (val: string | undefined) => val && val.trim() !== "",
      then: (schema) => schema.required("Pincode is required"),
      otherwise: (schema) => schema.notRequired(),
    }),

    territory: Yup.string().when("address_line1", {
      is: (val: string | undefined) => val && val.trim() !== "",
      then: (schema) => schema.required("Territory is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
   
});
