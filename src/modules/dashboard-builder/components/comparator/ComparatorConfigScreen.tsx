'use client'

import { memo } from 'react'
import { Autocomplete, Box, Button, Chip, FormControl, FormHelperText, MenuItem, Select, TextField, Typography } from '@mui/material'

import { useComparatorConfigForm } from '../../hooks/useComparatorConfigForm'
import type { ComparatorStyle } from '../../utils/addComponentCatalog'
import { TimePeriodPicker } from '../kpi/kpiFormShared'
import { ComparatorPreviewPanel } from './ComparatorPreviewPanel'
import { ParameterCard } from './ParameterCard'
import { ParameterForm } from './ParameterForm'
import { PicklistValuesConfig } from './PicklistValuesConfig'

export type ComparatorConfigScreenProps = {
  comparatorStyle: ComparatorStyle
  form: ReturnType<typeof useComparatorConfigForm>
  onCancel: () => void
  onDone: () => void
}

function ComparatorConfigScreenInner({ comparatorStyle, form, onCancel, onDone }: ComparatorConfigScreenProps) {
  const {
    name,
    setName,
    parametersForm,
    compareAmongType,
    setCompareAmongType,
    compareAmongLabel,
    userType,
    setUserType,
    usersOptions,
    usersLoading,
    usersError,
    selectedUserIds,
    setSelectedUserIds,
    selectedUserOptions,
    rolesOptions,
    rolesLoading,
    rolesError,
    selectedRoleIds,
    setSelectedRoleIds,
    selectedRoleOptions,
    periodPickerState,
    patchPeriod,
    moduleOptionsList,
    modulesLoading,
    picklistModuleValue,
    setPicklistModuleValue,
    picklistFieldOptions,
    picklistFieldsLoading,
    picklistField,
    setPicklistField,
    picklistMode,
    setPicklistMode,
    selectedPicklistValues,
    setSelectedPicklistValues,
    picklistCategories,
    setPicklistCategories,
    picklistValueOptions,
    picklistValuesLoading,
    errors,
    isDoneDisabled,
    saving,
    saveError,
  } = form

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', lg: 'row' },
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          overflowY: 'auto',
          px: 3,
          py: 2.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
        }}
      >
        <Box>
          <Typography variant="body2" sx={{ mb: 0.75, fontWeight: 500 }}>
            Component Name
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter component name"
            error={Boolean(errors.name)}
            helperText={errors.name}
          />
        </Box>

        <Box>
          <Typography variant="body2" sx={{ mb: 0.75, fontWeight: 500 }}>
            Compare Among
          </Typography>
          <FormControl
            fullWidth
            size="small"
            error={Boolean(errors.compareAmong) && compareAmongType !== 'picklist_values'}
          >
            <Select
              value={compareAmongType}
              onChange={e => setCompareAmongType(e.target.value as typeof compareAmongType)}
              displayEmpty
            >
              <MenuItem value="" disabled>
                Select an option
              </MenuItem>
              <MenuItem value="users">Users</MenuItem>
              <MenuItem value="time_period">Time Period</MenuItem>
              <MenuItem value="picklist_values">Picklist Values</MenuItem>
            </Select>
            {errors.compareAmong && compareAmongType !== 'picklist_values' && (
              <FormHelperText>{errors.compareAmong}</FormHelperText>
            )}
          </FormControl>
        </Box>

        {compareAmongType === 'users' && (
          <Box>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
            <FormControl fullWidth size="small" sx={{ flex: 1 }} error={Boolean(errors.users)}>
              <Select
                value={userType}
                onChange={e => setUserType(e.target.value as typeof userType)}
                displayEmpty
              >
                <MenuItem value="" disabled>
                  Select type
                </MenuItem>
                <MenuItem value="custom_users">Custom Users</MenuItem>
                <MenuItem value="roles">Roles</MenuItem>
              </Select>
            </FormControl>

            {userType === 'custom_users' && (
              <Autocomplete
                multiple
                size="small"
                fullWidth
                sx={{ flex: 2 }}
                options={usersOptions}
                getOptionLabel={o => o.label}
                value={selectedUserOptions}
                isOptionEqualToValue={(o, v) => o.value === v.value}
                onChange={(_, value) => setSelectedUserIds(value.map(v => v.value))}
                loading={usersLoading}
                loadingText="Loading…"
                noOptionsText={usersError ? 'Failed to load users.' : 'No users found.'}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip label={option.label} size="small" {...getTagProps({ index })} />
                  ))
                }
                renderInput={params => (
                  <TextField
                    {...params}
                    placeholder={selectedUserIds.length === 0 ? 'Select users' : undefined}
                  />
                )}
              />
            )}

            {userType === 'roles' && (
              <Autocomplete
                multiple
                size="small"
                fullWidth
                sx={{ flex: 2 }}
                options={rolesOptions}
                getOptionLabel={o => o.label}
                value={selectedRoleOptions}
                isOptionEqualToValue={(o, v) => o.value === v.value}
                onChange={(_, value) => setSelectedRoleIds(value.map(v => v.value))}
                loading={rolesLoading}
                loadingText="Loading…"
                noOptionsText={rolesError ? 'Failed to load roles.' : 'No roles found.'}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip label={option.label} size="small" {...getTagProps({ index })} />
                  ))
                }
                renderInput={params => (
                  <TextField
                    {...params}
                    placeholder={selectedRoleIds.length === 0 ? 'Select roles' : undefined}
                  />
                )}
              />
            )}
          </Box>
          {errors.users && (
            <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
              {errors.users}
            </Typography>
          )}
          </Box>
        )}

        {compareAmongType === 'time_period' && (
          <Box>
            <Typography variant="body2" sx={{ mb: 0.75, fontWeight: 500 }}>
              Time Period
            </Typography>
            <TimePeriodPicker state={periodPickerState} patch={patchPeriod} />
          </Box>
        )}

        {compareAmongType === 'picklist_values' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
              <FormControl fullWidth size="small" sx={{ flex: 1 }} error={Boolean(errors.compareAmong)}>
                <Select
                  value={picklistModuleValue}
                  onChange={e => setPicklistModuleValue(e.target.value)}
                  displayEmpty
                  disabled={modulesLoading}
                >
                  <MenuItem value="" disabled>
                    {modulesLoading ? 'Loading modules…' : 'Select module'}
                  </MenuItem>
                  {moduleOptionsList.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.compareAmong && <FormHelperText>{errors.compareAmong}</FormHelperText>}
              </FormControl>

              <FormControl fullWidth size="small" sx={{ flex: 1 }}>
                <Select
                  value={picklistField}
                  onChange={e => setPicklistField(e.target.value)}
                  displayEmpty
                  disabled={!picklistModuleValue || picklistFieldsLoading}
                >
                  <MenuItem value="" disabled>
                    {picklistFieldsLoading ? 'Loading fields…' : 'Select field'}
                  </MenuItem>
                  {picklistFieldOptions.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {picklistField && (
              <PicklistValuesConfig
                mode={picklistMode}
                onModeChange={setPicklistMode}
                picklistValueOptions={picklistValueOptions}
                picklistValuesLoading={picklistValuesLoading}
                selectedPicklistValues={selectedPicklistValues}
                onSelectedChange={setSelectedPicklistValues}
                categories={picklistCategories}
                onCategoriesChange={setPicklistCategories}
                error={errors.picklistValues}
              />
            )}
          </Box>
        )}

        <Box>
          <Typography variant="body2" sx={{ mb: 0.75, fontWeight: 500 }}>
            Comparison Parameter(s)
          </Typography>
          {errors.parameters && (
            <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1 }}>
              {errors.parameters}
            </Typography>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {parametersForm.parameters.map(parameter =>
              parametersForm.editingId === parameter.id && parametersForm.draft ? (
                <ParameterForm
                  key={parameter.id}
                  draft={parametersForm.draft}
                  errors={parametersForm.errors}
                  moduleOptionsList={moduleOptionsList}
                  modulesLoading={modulesLoading}
                  relatedModuleOptions={parametersForm.relatedModuleOptions}
                  relatedModulesLoading={parametersForm.relatedModulesLoading}
                  measureOptions={parametersForm.measureOptions}
                  measuresLoading={parametersForm.measuresLoading}
                  fieldCatalog={parametersForm.fieldCatalog}
                  dateFieldOptions={parametersForm.dateFieldOptions}
                  comparisonBasedOnOptions={parametersForm.comparisonBasedOnOptions}
                  compareAmongType={compareAmongType}
                  onChange={parametersForm.updateDraft}
                  onSave={parametersForm.save}
                  onCancel={parametersForm.cancel}
                />
              ) : (
                <ParameterCard
                  key={parameter.id}
                  parameter={parameter}
                  onEdit={() => parametersForm.startEdit(parameter.id)}
                  onDelete={() => parametersForm.remove(parameter.id)}
                />
              )
            )}

            {parametersForm.editingId === 'new' && parametersForm.draft && (
              <ParameterForm
                draft={parametersForm.draft}
                errors={parametersForm.errors}
                moduleOptionsList={moduleOptionsList}
                modulesLoading={modulesLoading}
                relatedModuleOptions={parametersForm.relatedModuleOptions}
                relatedModulesLoading={parametersForm.relatedModulesLoading}
                measureOptions={parametersForm.measureOptions}
                measuresLoading={parametersForm.measuresLoading}
                fieldCatalog={parametersForm.fieldCatalog}
                dateFieldOptions={parametersForm.dateFieldOptions}
                comparisonBasedOnOptions={parametersForm.comparisonBasedOnOptions}
                compareAmongType={compareAmongType}
                onChange={parametersForm.updateDraft}
                onSave={parametersForm.save}
                onCancel={parametersForm.cancel}
              />
            )}

            {parametersForm.editingId === null && (
              <Button size="small" variant="text" onClick={parametersForm.startAdd} sx={{ alignSelf: 'flex-start' }}>
                {parametersForm.parameters.length === 0 ? '+ Add your first parameter' : '+ Add Parameter'}
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      <ComparatorPreviewPanel
        comparatorStyle={comparatorStyle}
        compareAmongType={compareAmongType || undefined}
        compareAmongLabel={compareAmongLabel}
        parameterLabels={parametersForm.parameters.map(p => p.parameter_name)}
        selectedUsers={selectedUserOptions.map(o => o.label)}
        componentName={name}
        onCancel={onCancel}
        onDone={onDone}
        isDoneDisabled={isDoneDisabled}
        saving={saving}
        saveError={saveError}
      />
    </Box>
  )
}

export const ComparatorConfigScreen = memo(ComparatorConfigScreenInner)
