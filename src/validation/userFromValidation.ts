import * as Yup from 'yup';
export const userFromValidation = Yup.object().shape({
  firstname: Yup.string()
    .required('First name is required.')
    .min(5, 'First name must be atleast 5 characters'),
  lastname: Yup.string()
    .required('Last name is required'),
  useremailid: Yup.string().email().required('Please enter valid email'),
  userphonenumber: Yup.string()
    .typeError("That doesn't look like a phone number")
    .matches(
      /^((\\+[1-9]{1,4}[ \\-]*)|(\\([0-9]{2,3}\\)[ \\-]*)|([0-9]{2,4})[ \\-]*)*?[0-9]{3,4}?[ \\-]*[0-9]{3,4}?$/,
      'Phone number is not valid'
    )
    .min(10)
    .max(10)
    .required('Phone number is required'),
  role: Yup.string().notOneOf(
    [
      "Select role",
    ], "Please select role!").required('Please select valid role'),
  gender: Yup.string().notOneOf(
        [
          "Select gender",
        ], "Please select gender!").required('Please select valid gender'),
  dateofbirth: Yup.date().required('Date of birth is required'),
  dateofjoining: Yup.date().required('Date of joining is required'),
  useraddress: Yup.string().required('Address is required'),
  state: Yup.string().notOneOf(
    [
      "Select state",
    ], "Please select state!").required('Please select valid state'),
  city: Yup.string().notOneOf(
    [
      "Select district",
    ], "Please select district!").required('Please select valid district'),
  userpincode: Yup.string().notOneOf(
    [
      "Select zip/postal code",
    ], "Please select zip/postal code!").required('Please select valid zip/postal code'),
});
