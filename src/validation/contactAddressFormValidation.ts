import * as Yup from 'yup';

export const ContactAddressFormValidation = Yup.object().shape({
   
    address_title: Yup.string()
        .min(3,"Minimum 3 Charecters Required")
        .required('Please enter a valid address Title.'), 
    address_type: Yup.string()
        .required('Please select a address Type.'),
    address_line1: Yup.string()
        .min(10,"Minimum 10 Charecters Required")
        .required('Please enter Address.'),
    country: Yup.string()
        .required('Please select a Country'),
    state: Yup.string()
        .required('Please select a State'),
    city: Yup.string()
        .required('Please select a City'),    
    pincode: Yup.string()
        .required('Please select a Pincode'),
       
       
});