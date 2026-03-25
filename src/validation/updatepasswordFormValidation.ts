import * as Yup from 'yup';
export const UpdatepasswordValidation = Yup.object().shape({
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters long')
    .required('Password is required')
    .matches(
      /^.*(?=.{8,})((?=.*[!@#$%^&*()\-_=+{};:,<.>]){1})(?=.*\d)((?=.*[a-z]){1})((?=.*[A-Z]){1}).*$/,
      'Password must contain at least 8 characters, one uppercase, one number and one special case character'
    ),
  confirm_password: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm Password is required'),
});
