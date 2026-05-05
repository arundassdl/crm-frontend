import * as Yup from 'yup';

export const ContactPhoneFormValidation = Yup.object().shape({
   
    phone: Yup.number()
            .min(10000)
            .required('Please enter a valid Phone/Mobile No.'),
   
       
});