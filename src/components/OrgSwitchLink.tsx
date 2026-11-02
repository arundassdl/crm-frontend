import React from 'react';

// Clears the CRM session and sends the user to CTRL to re-launch with a different organization.
export default function OrgSwitchLink({ className }: { className?: string }) {
  return (
    <a
      href='/api/auth/switch-org'
      className={className ?? 'text-xs text-blue-600 hover:underline'}
    >
      Switch organization
    </a>
  );
}
