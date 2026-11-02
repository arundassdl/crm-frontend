import { Suspense } from 'react'

// Component Imports
import Login from '@views/Login'

// Server Action Imports
import { getServerMode } from '@core/utils/serverHelpers'

function LoginFallback() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f4f5fa',
        color: '#2e263d',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        style={{
          width: 'min(100%, 450px)',
          margin: '1.5rem',
          padding: '2rem',
          borderRadius: '12px',
          background: '#fff',
          boxShadow: '0 4px 18px rgba(46, 38, 61, 0.08)',
          textAlign: 'center',
        }}
      >
        <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>Loading sign-in…</p>
        <p style={{ margin: '0.75rem 0 0', fontSize: '0.875rem', opacity: 0.7 }}>
          Preparing the CRM login form.
        </p>
      </div>
    </div>
  )
}

const LoginPage = () => {
  // Vars
  const mode = getServerMode()

  return (
    <Suspense fallback={<LoginFallback />}>
      <Login mode={mode} />
    </Suspense>
  )
}

export default LoginPage
