import * as Yup from 'yup';
export const RegistrationValidation = Yup.object().shape({
  name: Yup.string()
    .required('Fullname is required')
    .min(5, 'Fullname must be atleast 5 characters'),
  email: Yup.string().email().required('Please enter valid email'),
  contact: Yup.string()
    .typeError("That doesn't look like a phone number")
    .matches(
      /^((\\+[1-9]{1,4}[ \\-]*)|(\\([0-9]{2,3}\\)[ \\-]*)|([0-9]{2,4})[ \\-]*)*?[0-9]{3,4}?[ \\-]*[0-9]{3,4}?$/,
      'Phone number is not valid'
    )
    .min(10)
    .max(10)
    .required('Phone number is required'),
  address_1: Yup.string().required('Please enter address'),
  // address_2: Yup.string().required('Please enter address'),
  // gst_number: Yup.string(),
  state: Yup.string().notOneOf(
    [
      "Select State",
    ], "Please select State!").required('Please select your State'),
  city: Yup.string().notOneOf(
    [
      "Select District",
    ], "Please select valid District!").required('Please select valid District'),
  postal_code: Yup.string().required('Please select Pincode'),
  user_type: Yup.string().notOneOf(
    [
      "Select a usertype",
    ], "Please select User Type").required('Please select User Type'),
  // associated_to: Yup.string().required('Please enter name'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters long')
    .required('Password is required')
    .matches(
      /^.*(?=.{8,})((?=.*[!@#$%^&*()\-_=+{};:,<.>]){1})(?=.*\d)((?=.*[a-z]){1})((?=.*[A-Z]){1}).*$/,
      'Password must contain at least 8 characters, one uppercase, one number and one special case character'
    ),
  confirm_password: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm Password is required'),
});
