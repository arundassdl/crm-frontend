import * as Yup from 'yup';

export const ContactEmailFormValidation = Yup.object().shape({
   
    email_id: Yup.string()
        .email('Please Enter a Valid Emailid')
        .required('Please enter a valid emailid.'),
    is_primary: Yup.string()
        .required('Please Set Whether Email Is Primary Or Not'),
       
});