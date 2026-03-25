import * as Yup from 'yup';

export const addressValidation = Yup.object().shape({
  address_title: Yup.string()
    .required('Title is a required field.')
    .min(3, 'Title must be atleast 3 characters.'),
    address_type: Yup.string().required("Address Type field is required."),
    address_line1: Yup.string().required('Address field is required.'),
    
  country: Yup.string().required('The Country field is required.'),
  state: Yup.string().notOneOf(
    [
      "Select State",
    ], "Please select your State").required('Please select your State'),
  city: Yup.string().notOneOf(
    [
      "Select District",
    ], "Please select valid District!").required('Please select valid District'),
  pincode: Yup.number()
    .min(6, 'The Postal Code field must be at least 6 characters in length.')
    .typeError('The Postal Code field must contain only numbers.')
    .required('The Postal Code field is required.'),
    territory: Yup.string().required("Territory field is required."),
  // email: Yup.string().email().required('Please enter valid email.'),
//   contact: Yup.number()
//     .typeError("That doesn't look like a phone number.")
//     .positive("A phone number can't start with a minus.")
//     .integer("A phone number can't include a decimal point.")
//     .min(10)
//     .required('A phone number is required.'),
});
