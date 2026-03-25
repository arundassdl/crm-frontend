import * as Yup from 'yup';
export const roleFormValidation = Yup.object().shape({
  role_name: Yup.string().required('Please enter role name'),
});

