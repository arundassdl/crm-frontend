import * as Yup from 'yup';
export const InstallationFormValidation = Yup.object().shape({
  Productmodel: Yup.string().required('Please select product model'),
  product: Yup.string().required('Please select product'),
  capacity: Yup.string().required('Please select product capacity'),
  tankserialno: Yup.string().required('Invalid serial number e.g.:-17E00001, starts from year 17').min(8)
  .max(15),
  dealer: Yup.string().required('Please select dealer name'),
  Billingdate: Yup.date().required('Please enter billing date'),
  installationdate: Yup.date().required('Please enter installation date'),
  customeremailid: Yup.string().email().required('Please enter valid email'),
  customerphonenumber: Yup.string()
    .typeError("That doesn't look like a phone number")
    .matches(
      /^((\\+[1-9]{1,4}[ \\-]*)|(\\([0-9]{2,3}\\)[ \\-]*)|([0-9]{2,4})[ \\-]*)*?[0-9]{3,4}?[ \\-]*[0-9]{3,4}?$/,
      'Phone number is not valid'
    )
    .min(10)
    .max(10)
    .required('A phone number is required'),
  customername: Yup.string().required('Please enter customer name'),
  customeraddress: Yup.string().required('Please enter customer address'),
  state: Yup.string().required('Please enter your State'),
  city: Yup.string().required('Please select valid City'),
  customerpincode: Yup.string().required('Please enter customer pincode').min(6)
  .max(6),
});

