'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFormik } from 'formik'
import { useSelector } from 'react-redux'
import { RegistrationValidation } from '@/validation/registrationValidation'
import {
  FetchCitiesForAddressForm,
  FetchPostalCodeByStateCity,
  FetchStateForAddressForm,
} from '@/services/api/general_apis/customer-form-data-api'
import { get_access_token } from '@/store/slices/auth/token-login-slice'
import RegistrationApi from '@/services/api/auth/registration_api'
import { showToast } from '@/components/ToastNotificationNew'
import type { Mode } from '@core/types'
import Logo from '@/components/layout/shared/Logo'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import ArrowForward from '@mui/icons-material/ArrowForward'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

const USER_TYPES = ['Distributor', 'Dealer', 'Sub Dealer', 'Customer', 'Surveyor', 'Employee']

const Chevron = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const Register = ({ mode }: { mode: Mode }) => {
  const router = useRouter()
  const TokenFromStore: any = useSelector(get_access_token)

  const [stateArray, setStateArray] = useState<{ value: string; label: string }[]>([])
  const [cityArray, setCityArray] = useState<{ value: string; label: string }[]>([])
  const [pincodeArray, setPincodeArray] = useState<{ value: string; label: string }[]>([])
  const [selectedState, setSelectedState] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [fieldFocus, setFieldFocus] = useState<Record<string, boolean>>({})
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    const load = async () => {
      const data: any = await FetchStateForAddressForm(TokenFromStore?.token)
      if (data?.length > 0) {
        setStateArray(data.map((i: any) => ({ value: i.name, label: i.name })))
      }
    }
    load()
  }, [])

  const handleStateChange = async (val: string) => {
    setSelectedState(val)
    setCityArray([])
    setPincodeArray([])
    formik.setFieldValue('state', val)
    formik.setFieldValue('city', '')
    formik.setFieldValue('postal_code', '')
    const data: any = await FetchCitiesForAddressForm(val, TokenFromStore?.token)
    if (data?.length > 0) {
      setCityArray(data.map((i: any) => ({ value: i.name, label: i.name })))
    }
  }

  const handleCityChange = async (val: string) => {
    formik.setFieldValue('city', val)
    formik.setFieldValue('postal_code', '')
    setPincodeArray([])
    const data: any = await FetchPostalCodeByStateCity(selectedState, val, TokenFromStore?.token)
    if (data?.length > 0) {
      setPincodeArray(data.map((i: any) => ({ value: i.label, label: i.label })))
    }
  }

  const formik = useFormik({
    initialValues: {
      name: '', email: '', contact: '', address_1: '',
      state: '', city: '', postal_code: '', user_type: '',
      password: '', confirm_password: '', associated_to: '',
    },
    validationSchema: RegistrationValidation,
    onSubmit: async (values) => {
      setServerError('')
      setLoading(true)
      const res: any = await RegistrationApi(values)
      if (res?.data?.message?.msg === 'success') {
        showToast('Registered successfully', 'success')
        setSuccess(true)
        setTimeout(() => router.push('/login'), 1500)
      } else {
        const msg = res?.data?.message?.error || 'Registration failed. Please try again.'
        setServerError(msg)
        showToast(msg, 'error')
      }
      setLoading(false)
    },
  })

  const onFocus = (name: string) => setFieldFocus(p => ({ ...p, [name]: true }))
  const onBlur = (name: string, e: React.FocusEvent<any>) => {
    formik.handleBlur(e)
    setFieldFocus(p => ({ ...p, [name]: false }))
  }
  const isFocused = (name: string) => !!fieldFocus[name]
  const hasValue = (name: string) => ((formik.values as any)[name] ?? '').length > 0
  const isActive = (name: string) => isFocused(name) || hasValue(name)

  const labelStyle = (name: string): React.CSSProperties => ({
    position: 'absolute', left: 14, pointerEvents: 'none', fontWeight: 500,
    top: isActive(name) ? 6 : '50%',
    transform: isActive(name) ? 'translateY(0) scale(0.78)' : 'translateY(-50%)',
    transformOrigin: 'left',
    color: isFocused(name) ? '#1D4ED8' : '#94A3B8',
    fontSize: isActive(name) ? '10px' : '13.5px',
    transition: 'all 0.18s ease',
    zIndex: 10,
  })

  const inputStyle = (name: string): React.CSSProperties => ({
    width: '100%', paddingTop: 20, paddingBottom: 6, paddingLeft: 14, paddingRight: 14,
    borderRadius: 12, fontSize: 13.5, fontWeight: 500, color: '#1E293B', outline: 'none',
    background: isFocused(name) ? '#F8FBFF' : '#F8FAFC',
    border: `1.5px solid ${isFocused(name) ? '#1D4ED8' : '#E2E8F0'}`,
    boxShadow: isFocused(name) ? '0 0 0 3px rgba(29,78,216,0.07)' : 'none',
    transition: 'all 0.18s ease',
  })

  const selectBaseStyle = (val: string): React.CSSProperties => ({
    width: '100%', padding: '10px 14px', paddingRight: 32, borderRadius: 12,
    fontSize: 13.5, fontWeight: 500, color: val ? '#1E293B' : '#94A3B8',
    background: '#F8FAFC', border: '1.5px solid #E2E8F0',
    outline: 'none', cursor: 'pointer', transition: 'all 0.18s ease',
    WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' as any,
  })

  const fieldError = (name: string) => {
    const touched = (formik.touched as any)[name]
    const error = (formik.errors as any)[name]
    return touched && error
      ? <p className="text-[10.5px] text-red-500 mt-0.5 font-medium pl-1 leading-tight">{error}</p>
      : null
  }

  const selectFocusOn = (e: React.FocusEvent<HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = '#1D4ED8'
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(29,78,216,0.07)'
  }
  const selectFocusOff = (e: React.FocusEvent<HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = '#E2E8F0'
    e.currentTarget.style.boxShadow = 'none'
  }

  const selectedUserType = formik.values.user_type
  const needsAssociated = ['Dealer', 'Sub Dealer', 'Customer', 'Surveyor'].includes(selectedUserType)
  const associatedLabel = selectedUserType === 'Dealer' ? 'Distributor Name' : 'Dealer Name'

  if (success) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #E3ECFC 50%, #DBEAFE 100%)' }}
      >
        <div className="flex flex-col items-center gap-3 bg-white rounded-3xl px-10 py-8 shadow-xl border border-[#E3ECFC]">
          <CheckCircleIcon sx={{ fontSize: 48, color: '#10B981' }} />
          <p className="text-[17px] font-bold text-slate-800">Account created!</p>
          <p className="text-[13px] text-slate-400 font-medium">Redirecting to sign in…</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 py-6"
      style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #E3ECFC 50%, #DBEAFE 100%)' }}
    >
      {/* Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, #BFDBFE 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #93C5FD 0%, transparent 70%)' }}
        />
      </div>

      {/* Card */}
      <div
        className="relative w-full max-w-[460px] rounded-3xl shadow-2xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.93)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.7)',
          boxShadow: '0 25px 60px rgba(29,78,216,0.12), 0 8px 24px rgba(0,0,0,0.06)',
        }}
      >
        {/* Accent bar */}
        <div
          className="h-1 w-full"
          style={{ background: 'linear-gradient(90deg, #1D4ED8 0%, #3B82F6 50%, #60A5FA 100%)' }}
        />

        <div className="px-8 pt-6 pb-5">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <Logo from="login" />
          </div>

          {/* Heading */}
          <div className="mb-4">
            <h1 className="text-[20px] font-extrabold text-slate-900 tracking-tight">
              Get started your journey
            </h1>
            <p className="text-slate-400 text-[12px] mt-0.5 font-medium">
              Create your EVOQ CRM account
            </p>
          </div>

          {/* Server error */}
          {serverError && (
            <div
              className="mb-3 px-3 py-2.5 rounded-xl text-[12.5px] font-medium text-red-700 flex items-center gap-2"
              style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}
            >
              {serverError}
            </div>
          )}

          <form onSubmit={formik.handleSubmit} className="space-y-2.5">

            {/* Row: Full Name + Email */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <div className="relative">
                  <label style={labelStyle('name')}>Full Name</label>
                  <input
                    name="name"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onFocus={() => onFocus('name')}
                    onBlur={e => onBlur('name', e)}
                    style={inputStyle('name')}
                  />
                </div>
                {fieldError('name')}
              </div>
              <div>
                <div className="relative">
                  <label style={labelStyle('email')}>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onFocus={() => onFocus('email')}
                    onBlur={e => onBlur('email', e)}
                    style={inputStyle('email')}
                  />
                </div>
                {fieldError('email')}
              </div>
            </div>

            {/* Row: Mobile + User Type */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <div className="relative">
                  <label style={labelStyle('contact')}>Mobile Number</label>
                  <input
                    type="tel"
                    name="contact"
                    value={formik.values.contact}
                    onChange={formik.handleChange}
                    onFocus={() => onFocus('contact')}
                    onBlur={e => onBlur('contact', e)}
                    style={inputStyle('contact')}
                  />
                </div>
                {fieldError('contact')}
              </div>
              <div>
                <div className="relative">
                  <select
                    name="user_type"
                    value={formik.values.user_type}
                    onChange={e => formik.setFieldValue('user_type', e.target.value)}
                    onBlur={e => { formik.handleBlur(e); selectFocusOff(e) }}
                    onFocus={selectFocusOn}
                    style={selectBaseStyle(formik.values.user_type)}
                  >
                    <option value="" disabled>User Type</option>
                    {USER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <Chevron />
                  </div>
                </div>
                {fieldError('user_type')}
              </div>
            </div>

            {/* Address */}
            <div>
              <div className="relative">
                <label
                  style={{
                    ...labelStyle('address_1'),
                    top: isActive('address_1') ? 6 : 14,
                    transform: isActive('address_1') ? 'translateY(0) scale(0.78)' : 'none',
                  }}
                >
                  Address
                </label>
                <textarea
                  name="address_1"
                  value={formik.values.address_1}
                  rows={2}
                  onChange={formik.handleChange}
                  onFocus={() => onFocus('address_1')}
                  onBlur={e => onBlur('address_1', e)}
                  style={{ ...inputStyle('address_1'), paddingTop: 22, resize: 'none', lineHeight: 1.5 }}
                />
              </div>
              {fieldError('address_1')}
            </div>

            {/* Row: Password + Confirm Password */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <div className="relative">
                  <label style={labelStyle('password')}>Password</label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    name="password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onFocus={() => onFocus('password')}
                    onBlur={e => onBlur('password', e)}
                    style={{ ...inputStyle('password'), paddingRight: 36 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPass ? <VisibilityOff sx={{ fontSize: 15 }} /> : <Visibility sx={{ fontSize: 15 }} />}
                  </button>
                </div>
                {fieldError('password')}
              </div>
              <div>
                <div className="relative">
                  <label style={labelStyle('confirm_password')}>Confirm Password</label>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    name="confirm_password"
                    value={formik.values.confirm_password}
                    onChange={formik.handleChange}
                    onFocus={() => onFocus('confirm_password')}
                    onBlur={e => onBlur('confirm_password', e)}
                    style={{ ...inputStyle('confirm_password'), paddingRight: 36 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirm ? <VisibilityOff sx={{ fontSize: 15 }} /> : <Visibility sx={{ fontSize: 15 }} />}
                  </button>
                </div>
                {fieldError('confirm_password')}
              </div>
            </div>

            {/* Row: State + District + Zip */}
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <div className="relative">
                  <select
                    name="state"
                    value={formik.values.state}
                    onChange={e => handleStateChange(e.target.value)}
                    onBlur={e => { formik.handleBlur(e); selectFocusOff(e) }}
                    onFocus={selectFocusOn}
                    style={selectBaseStyle(formik.values.state)}
                  >
                    <option value="" disabled>State</option>
                    {stateArray.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <Chevron />
                  </div>
                </div>
                {fieldError('state')}
              </div>
              <div>
                <div className="relative">
                  <select
                    name="city"
                    value={formik.values.city}
                    onChange={e => handleCityChange(e.target.value)}
                    onBlur={e => { formik.handleBlur(e); selectFocusOff(e) }}
                    onFocus={selectFocusOn}
                    disabled={!formik.values.state}
                    style={{ ...selectBaseStyle(formik.values.city), opacity: formik.values.state ? 1 : 0.5 }}
                  >
                    <option value="" disabled>District</option>
                    {cityArray.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <Chevron />
                  </div>
                </div>
                {fieldError('city')}
              </div>
              <div>
                <div className="relative">
                  <select
                    name="postal_code"
                    value={formik.values.postal_code}
                    onChange={e => formik.setFieldValue('postal_code', e.target.value)}
                    onBlur={e => { formik.handleBlur(e); selectFocusOff(e) }}
                    onFocus={selectFocusOn}
                    disabled={!formik.values.city}
                    style={{ ...selectBaseStyle(formik.values.postal_code), opacity: formik.values.city ? 1 : 0.5 }}
                  >
                    <option value="" disabled>Zip Code</option>
                    {pincodeArray.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <Chevron />
                  </div>
                </div>
                {fieldError('postal_code')}
              </div>
            </div>

            {/* Conditional: Associated To */}
            {needsAssociated && (
              <div>
                <div className="relative">
                  <label style={labelStyle('associated_to')}>{associatedLabel}</label>
                  <input
                    name="associated_to"
                    value={formik.values.associated_to}
                    onChange={formik.handleChange}
                    onFocus={() => onFocus('associated_to')}
                    onBlur={e => onBlur('associated_to', e)}
                    style={inputStyle('associated_to')}
                  />
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-[14px] font-bold text-white flex items-center justify-center gap-2 mt-1 transition-all"
              style={{
                background: loading ? '#93C5FD' : 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(29,78,216,0.3)',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'linear-gradient(135deg, #1E40AF 0%, #1D4ED8 100%)' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)' }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Creating account…
                </>
              ) : (
                <>
                  Submit
                  <ArrowForward sx={{ fontSize: 14 }} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[12.5px] text-slate-500 mt-3 font-medium">
            You already have an account?{' '}
            <button
              onClick={() => router.push('/login')}
              className="font-bold transition-colors"
              style={{ color: '#1D4ED8' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#1E40AF')}
              onMouseLeave={e => (e.currentTarget.style.color = '#1D4ED8')}
            >
              Sign in
            </button>
          </p>
        </div>

        {/* Footer */}
        <div
          className="px-8 py-3 border-t text-center"
          style={{ borderColor: '#E3ECFC', background: '#F8FBFF' }}
        >
          <p className="text-[11px] text-slate-400 font-medium">
            © 2026 Social DNA Labs ·{' '}
            <span className="text-[#1D4ED8] cursor-pointer hover:underline">Privacy</span>{' '}·{' '}
            <span className="text-[#1D4ED8] cursor-pointer hover:underline">Terms</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
