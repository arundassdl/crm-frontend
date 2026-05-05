import * as Yup from 'yup';

export const CustomerAddressFormValidation = Yup.object().shape({

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
    phone:Yup.number()    
        .required('Please enter a mobile no')
        .typeError("That doesn't look like a phone number")
        .integer("Phone number only accept digits")
        .min(10000,'To be at least positive 5 digits no'),
    email_id:Yup.string()
        .matches(/^((?!\.)[\w-_.]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])$/,'Please enter a valid mailid')
        .required('Please enter an emailid.'),

    })
