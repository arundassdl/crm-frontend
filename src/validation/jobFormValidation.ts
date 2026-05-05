import * as Yup from 'yup';
export const JobFormValidation = Yup.object().shape({
    customername: Yup.string().required('Please select customer name'),
    // customeremailid: Yup.string().email().required('Please enter valid email'),
    // customerphonenumber: Yup.string()
    // .typeError("That doesn't look like a phone number")
    // .matches(
    //   /^((\\+[1-9]{1,4}[ \\-]*)|(\\([0-9]{2,3}\\)[ \\-]*)|([0-9]{2,4})[ \\-]*)*?[0-9]{3,4}?[ \\-]*[0-9]{3,4}?$/,
    //   'Phone number is not valid'
    // )
    // .min(10)
    // .max(10)
    // .required('Please enter valid phone number'),
    // customeraddress: Yup.string().required('Please enter customer address'),
    // state: Yup.string().required('Please select valid state'),
    // city: Yup.string().required('Please select valid district'),
    // customerpincode: Yup.string().required('Please select zip / postal code').min(6).max(6),
    // customerarea: Yup.string().required('Please select valid area'),
    jobtitle: Yup.string().required('Please enter job title'),
    jobtype: Yup.string().required('Please select valid job type'),
    productmodel: Yup.string().required('Please select product model'),
    schedulestartdatetime: Yup.date().required('Please enter schedule start'),
    scheduleenddatetime: Yup.date().required('Please enter schedule end').min(Yup.ref('schedulestartdatetime'), ({ min }) => `Schedule end datetime must be after ${(min)}`),
    // jobstatus: Yup.string().required('Please select status'),
    priority: Yup.string().required('Please select priority'),
    description: Yup.string().required('Please enter valid description'),
    assignedtouser: Yup.string().required('Please select assigned service resource'),
});

