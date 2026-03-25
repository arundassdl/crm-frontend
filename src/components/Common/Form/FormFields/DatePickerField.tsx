'use client';

import * as React from 'react';
import { TextField } from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useField, useFormikContext } from 'formik';

export default function DatePickerField({ name, label }: any) {
  const { setFieldValue } = useFormikContext();
  const [field, meta] = useField(name);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <DatePicker
        label={label}
        value={field.value || null}
        onChange={(val) => {
          setFieldValue(name, val);
        }}
        slots={{
          textField: TextField,
        }}
        slotProps={{
          textField: {
            error: Boolean(meta.touched && meta.error),
            helperText: meta.touched && meta.error,
            fullWidth: true,
          },
        }}
      />
    </LocalizationProvider>
  );
}
