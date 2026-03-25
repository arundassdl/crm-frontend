import * as Yup from 'yup';

export const CustomerContacFormValidation = Yup.object().shape({
   
    contact_name: Yup.string() 
        .required('Please enter contact name'),
    email_id: Yup.string()
        .matches(/^((?!\.)[\w-_.]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])$/,'Please enter a valid mailid')
        .required('Please enter an emailid.'),
    mobile_no: Yup.number()
        .required('Please enter a mobile no')
        .typeError("That doesn't look like a phone number")
        .integer("Phone number only accept digits")
        .min(1000000000,'To be at least positive 10 digits no'),
    phone: Yup.number()
        .required('Please enter a phone no')
        .typeError("That doesn't look like a phone number")
        .integer("Phone number only accept digits")
        .min(10000,'To be at least 5 digits'),
       
});