"use client";
import { readAccessTokenString } from '@/utils/accessTokenDataStorage'

import React from 'react';
import {
    Box,
    Grid,
    Typography,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Checkbox,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Stack,
    CircularProgress,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { FetchCountryList, FetchStateForCountry } from '@/services/api/general_apis/customer-form-data-api';

const ADDRESS_SUB_FIELDS = [
    'Country / Region',
    'Flat / House No. / Building / Apartment Name',
    'Street Address',
    'City',
    'State / Province',
    'Zip / Postal Code',
];

const ADDRESS_COORD_FIELDS = ['Latitude', 'Longitude'];

const ADDRESS_LABEL_TO_KEY: Record<string, string> = {
    'Country / Region': 'country',
    'Flat / House No. / Building / Apartment Name': 'flat',
    'Street Address': 'address_line1',
    City: 'city',
    'State / Province': 'state',
    'Zip / Postal Code': 'pincode',
    Latitude: 'latitude',
    Longitude: 'longitude',
};

type CountryOption = { label: string; value: string };

interface DynamicFormProps {
    layout: { sections: any[] };
    data: any;
    mode: 'Create' | 'Edit' | 'View';
    onChange: (values: any) => void;
    onSubmit: (values: any) => void;
}

const DynamicForm: React.FC<DynamicFormProps> = ({ layout, data, mode, onChange, onSubmit }) => {

    const [countryOptions, setCountryOptions] = React.useState<CountryOption[]>([]);
    const [stateOptionsByCountry, setStateOptionsByCountry] = React.useState<Record<string, string[]>>({});
    const [loadingCountries, setLoadingCountries] = React.useState(false);
    const [loadingStatesFor, setLoadingStatesFor] = React.useState<string | null>(null);

    // Load all countries once
    React.useEffect(() => {
        let mounted = true;
        const loadCountries = async () => {
            try {
                setLoadingCountries(true);
                const token =
                    readAccessTokenString() ?? '';
                if (!token) {
                    setLoadingCountries(false);
                    return;
                }
                const result = await FetchCountryList(token);
                if (!mounted) return;
                const options: CountryOption[] = Array.isArray(result)
                    ? result
                          .map((item: any) => {
                              const name =
                                  typeof item === 'string'
                                      ? item
                                      : item?.country_name ?? item?.name ?? '';
                              if (!name) return null;
                              return { label: name, value: name };
                          })
                          .filter(Boolean) as CountryOption[]
                    : [];
                setCountryOptions(options);
            } catch (e) {
                console.error('Failed to load countries', e);
            } finally {
                if (mounted) {
                    setLoadingCountries(false);
                }
            }
        };
        loadCountries();
        return () => {
            mounted = false;
        };
    }, []);

    const ensureStatesForCountry = React.useCallback(
        async (countryName: string) => {
            if (!countryName || stateOptionsByCountry[countryName]) return;
            try {
                setLoadingStatesFor(countryName);
                const token =
                    readAccessTokenString() ?? '';
                if (!token) {
                    setLoadingStatesFor(null);
                    return;
                }
                const result = await FetchStateForCountry(countryName, token);
                const states: string[] = Array.isArray(result)
                    ? result
                          .map((item: any) => {
                              const name =
                                  typeof item === 'string'
                                      ? item
                                      : item?.state_name ?? item?.name ?? '';
                              return name || null;
                          })
                          .filter(Boolean) as string[]
                    : [];
                setStateOptionsByCountry(prev => ({
                    ...prev,
                    [countryName]: states,
                }));
            } catch (e) {
                console.error('Failed to load states for country', countryName, e);
            } finally {
                setLoadingStatesFor(null);
            }
        },
        [stateOptionsByCountry]
    );

    const initialValues = React.useMemo(() => {
        const values: any = { ...data };
        layout.sections.forEach(section => {
            section.fields.forEach((field: any) => {
                if (!(field.name in values)) {
                    if (field.type === 'checkbox') {
                        values[field.name] = false;
                    } else if (field.type === 'select' && field.default_value) {
                        values[field.name] = field.default_value;
                    } else if (field.type === 'address') {
                        const addressValue: any = {};
                        ADDRESS_SUB_FIELDS.forEach(label => {
                            const key = ADDRESS_LABEL_TO_KEY[label] || label;
                            addressValue[key] = '';
                        });
                        ADDRESS_COORD_FIELDS.forEach(label => {
                            const key = ADDRESS_LABEL_TO_KEY[label] || label;
                            addressValue[key] = '';
                        });
                        const defaultCountry =
                            (field.address_default_country as string | undefined) || 'India';
                        if (defaultCountry) {
                            addressValue[ADDRESS_LABEL_TO_KEY['Country / Region']] = defaultCountry;
                        }
                        values[field.name] = addressValue;
                    } else {
                        values[field.name] = '';
                    }
                }
            });
        });
        return values;
    }, [layout, data]);

    const validationSchema = React.useMemo(() => {
        const schema: any = {};
        layout.sections.forEach(section => {
            section.fields.forEach((field: any) => {
                if (field.required && field.type !== 'address') {
                    schema[field.name] = Yup.string().required(`${field.label} is required`);
                }
            });
        });
        return Yup.object().shape(schema);
    }, [layout]);

    const renderField = (field: any, values: any, handleChange: any, handleBlur: any, setFieldValue: any) => {
        if (!field.visible && mode !== 'Edit') return null;

        const commonProps = {
            fullWidth: true,
            name: field.name,
            label: field.label,
            placeholder: field.placeholder,
            value: values[field.name],
            onChange: (e: any) => {
                handleChange(e);
                onChange({ ...values, [field.name]: e.target.value });
            },
            onBlur: handleBlur,
            disabled: mode === 'View',
            size: 'small' as const,
        };

        switch (field.type) {
            case 'text':
                return <TextField {...commonProps} />;
            case 'textarea':
            case 'multiline':
                return <TextField {...commonProps} multiline rows={3} />;
            case 'number':
                return <TextField {...commonProps} type="number" />;
            case 'date':
                return <TextField {...commonProps} type="date" InputLabelProps={{ shrink: true }} />;
            case 'checkbox':
                return (
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={values[field.name] || false}
                                onChange={(e) => {
                                    setFieldValue(field.name, e.target.checked);
                                    onChange({ ...values, [field.name]: e.target.checked });
                                }}
                                disabled={mode === 'View'}
                            />
                        }
                        label={field.label}
                    />
                );
            case 'select': {
                const options = Array.isArray(field.options) ? [...field.options] : [];
                if (field.picklist_sort_order === 'alphabetical') {
                    options.sort((a: any, b: any) => (a.label || '').localeCompare(b.label || ''));
                }

                const selectedOption = options.find((opt: any) => opt.value === values[field.name]);

                return (
                    <FormControl fullWidth size="small">
                        <InputLabel>{field.label}</InputLabel>
                        <Select
                            {...commonProps}
                            sx={
                                selectedOption?.color
                                    ? ({
                                          '& .MuiSelect-select': {
                                              bgcolor: selectedOption.color,
                                              color: '#fff',
                                          },
                                      } as any)
                                    : undefined
                            }
                        >
                            {options.map((opt: any) => {
                                const isSelected = values[field.name] === opt.value;
                                const hasColor = !!opt.color;
                                return (
                                    <MenuItem
                                        key={opt.value}
                                        value={opt.value}
                                        sx={
                                            hasColor && isSelected
                                                ? {
                                                      bgcolor: opt.color,
                                                      color: '#fff',
                                                      '&.Mui-selected': {
                                                          bgcolor: opt.color,
                                                      },
                                                      '&.Mui-selected:hover': {
                                                          bgcolor: opt.color,
                                                      },
                                                  }
                                                : undefined
                                        }
                                    >
                                        {opt.label}
                                    </MenuItem>
                                );
                            })}
                        </Select>
                    </FormControl>
                );
            }
            case 'address': {
                const addressValue: any = values[field.name] || {};

                const handleAddressChange = (key: string, value: string) => {
                    const nextAddress = { ...addressValue, [key]: value };

                    // Reset state if country changes
                    if (key === ADDRESS_LABEL_TO_KEY['Country / Region']) {
                        nextAddress[ADDRESS_LABEL_TO_KEY['State / Province']] = '';
                    }

                    setFieldValue(field.name, nextAddress);
                    onChange({ ...values, [field.name]: nextAddress });
                };

                const handleClearAddress = () => {
                    const cleared: any = {};
                    ADDRESS_SUB_FIELDS.forEach(label => {
                        const key = ADDRESS_LABEL_TO_KEY[label] || label;
                        cleared[key] = '';
                    });
                    ADDRESS_COORD_FIELDS.forEach(label => {
                        const key = ADDRESS_LABEL_TO_KEY[label] || label;
                        cleared[key] = '';
                    });
                    setFieldValue(field.name, cleared);
                    onChange({ ...values, [field.name]: cleared });
                };

                const countryKey = ADDRESS_LABEL_TO_KEY['Country / Region'];
                const stateKey = ADDRESS_LABEL_TO_KEY['State / Province'];
                const selectedCountry = addressValue[countryKey] || '';

                React.useEffect(() => {
                    if (selectedCountry) {
                        void ensureStatesForCountry(selectedCountry);
                    }
                }, [selectedCountry, ensureStatesForCountry]);

                const stateOptions = selectedCountry
                    ? stateOptionsByCountry[selectedCountry] || []
                    : [];

                const isSubFieldVisible = (label: string) => {
                    const key = ADDRESS_LABEL_TO_KEY[label] || label;
                    const availableConfig = (field.address_available_fields as any[] | undefined) || [];
                    const entry = availableConfig.find(
                        (cfg) => cfg.key === key || cfg.label === label
                    );
                    if (!entry) return true;
                    return entry.visible !== false && entry.enabled !== false && entry.hide !== true;
                };

                return (
                    <Box
                        sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            p: 2,
                        }}
                    >
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                            <Typography variant="subtitle2" fontWeight={600}>
                                {field.label || 'Address'}
                            </Typography>
                            <Typography
                                variant="caption"
                                color="primary"
                                sx={{ cursor: mode === 'View' ? 'default' : 'pointer' }}
                                onClick={mode === 'View' ? undefined : handleClearAddress}
                            >
                                Clear All
                            </Typography>
                        </Stack>
                        <Stack spacing={1.2}>
                            {ADDRESS_SUB_FIELDS.map((label) => {
                                if (!isSubFieldVisible(label)) return null;
                                const key = ADDRESS_LABEL_TO_KEY[label] || label;
                                const value = addressValue[key] || '';

                                if (label === 'Country / Region') {
                                    return (
                                        <FormControl fullWidth size="small" key={label} disabled={mode === 'View'}>
                                            <InputLabel>{label}</InputLabel>
                                            <Select
                                                label={label}
                                                value={value}
                                                onChange={(e) =>
                                                    handleAddressChange(
                                                        key,
                                                        e.target.value as string
                                                    )
                                                }
                                            >
                                                {countryOptions.map((opt) => (
                                                    <MenuItem key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                            {loadingCountries && (
                                                <Box sx={{ position: 'absolute', top: 8, right: 40 }}>
                                                    <CircularProgress size={16} />
                                                </Box>
                                            )}
                                        </FormControl>
                                    );
                                }

                                if (label === 'State / Province') {
                                    return (
                                        <FormControl
                                            fullWidth
                                            size="small"
                                            key={label}
                                            disabled={mode === 'View' || !selectedCountry}
                                        >
                                            <InputLabel>{label}</InputLabel>
                                            <Select
                                                label={label}
                                                value={value}
                                                onChange={(e) =>
                                                    handleAddressChange(
                                                        key,
                                                        e.target.value as string
                                                    )
                                                }
                                            >
                                                {stateOptions.map((state) => (
                                                    <MenuItem key={state} value={state}>
                                                        {state}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                            {loadingStatesFor === selectedCountry && (
                                                <Box sx={{ position: 'absolute', top: 8, right: 40 }}>
                                                    <CircularProgress size={16} />
                                                </Box>
                                            )}
                                        </FormControl>
                                    );
                                }

                                return (
                                    <TextField
                                        key={label}
                                        fullWidth
                                        size="small"
                                        label={label}
                                        value={value}
                                        onChange={(e) => handleAddressChange(key, e.target.value)}
                                        disabled={mode === 'View'}
                                    />
                                );
                            })}
                            <Grid container spacing={1}>
                                {ADDRESS_COORD_FIELDS.map((label) => {
                                    if (!isSubFieldVisible(label)) return null;
                                    const key = ADDRESS_LABEL_TO_KEY[label] || label;
                                    const value = addressValue[key] || '';
                                    return (
                                        <Grid item xs={6} key={label}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                label={label}
                                                value={value}
                                                onChange={(e) =>
                                                    handleAddressChange(key, e.target.value)
                                                }
                                                disabled={mode === 'View'}
                                            />
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        </Stack>
                    </Box>
                );
            }
            default:
                return <TextField {...commonProps} />;
        }
    };

    return (
        <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={onSubmit}
            enableReinitialize
        >
            {({ values, handleChange, handleBlur, setFieldValue, errors, touched }) => (
                <Form>
                    <Box sx={{ p: 3 }}>
                        {layout.sections.map((section) => (
                            <Accordion key={section.id} defaultExpanded sx={{ mb: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography fontWeight="600">{section.title}</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Grid container spacing={3}>
                                        {section.fields.map((field: any) => (
                                            <Grid item xs={12} sm={6} key={field.id}>
                                                {renderField(field, values, handleChange, handleBlur, setFieldValue)}
                                                {touched[field.name] && errors[field.name] && (
                                                    <Typography variant="caption" color="error">
                                                        {errors[field.name] as string}
                                                    </Typography>
                                                )}
                                            </Grid>
                                        ))}
                                    </Grid>
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </Box>
                </Form>
            )}
        </Formik>
    );
};

export default DynamicForm;
