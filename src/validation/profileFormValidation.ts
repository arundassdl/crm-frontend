import * as Yup from 'yup';

export const ProfileValidation = Yup.object().shape({
    first_name: Yup.string()
        .required(' First Name is a required field.')
        .min(3, 'First Name must be atleast 3 characters.'),
    email: Yup.string().email().required('Please enter valid email.'),
    // contact_number: Yup.number()
        // .typeError("That doesn't look like a phone number.")
        // .positive("A phone number can't start with a minus.")
        // .integer("A phone number can't include a decimal point.")
        // .min(10)
        // .required('A phone number is required.'),
});
