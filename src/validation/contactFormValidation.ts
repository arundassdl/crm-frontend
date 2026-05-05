import * as Yup from 'yup';

export const ContactFormValidation = Yup.object().shape({
    first_name: Yup.string()
        .matches(/^(?!.*\bNEW\b)/i, "First name cannot contain 'NEW'")
        .min(3, 'First Name must be atleast 3 characters.')
        .required("First name is required"),
    // last_name: Yup.string().required(' Last Name is a required field.'),
    email_id: Yup.string().email().required('Please enter valid email.'),
    customer_name: Yup.string().required('Please select customer.'),
    phone: Yup.number()
       .typeError("That doesn't look like a phone number.")
       .positive("phone number can't start with a minus.")
       .integer("phone number can't include a decimal point.")
       .min(9).required('Phone number is required.'),
    // mobile_no: Yup.number()
    //    .typeError("That doesn't look like a phone number.")
    //    .positive("Mobile number can't start with a minus.")
    //    .integer("Mobile number can't include a decimal point.")
    //    .min(10)
    //    .required('Mobile number is required.'),
   
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
