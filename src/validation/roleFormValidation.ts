import * as Yup from 'yup';
export const roleFormValidation = Yup.object().shape({
  role_name: Yup.string().required('Please enter role name'),
  reports_to: Yup.string().when('is_admin', {
    is: false,
    then: (schema) => schema.required('Please select reports to'),
    otherwise: (schema) => schema.notRequired(),
  }),
});

