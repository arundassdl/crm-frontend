import * as Yup from 'yup';

export const CompanyValidation = Yup.object().shape({
    company_name: Yup.string()
        .required(' Customer Name is a required field.')
        .min(3, 'Customer Name must be atleast 3 characters.'),
    email: Yup.string().email().required('Please enter valid email.'),
    phone_no: Yup.number()
        .typeError("That doesn't look like a phone number.")
        .positive("A phone number can't start with a minus.")
        .integer("A phone number can't include a decimal point.")
        .min(10)
        .required('A phone number is required.'),
});
