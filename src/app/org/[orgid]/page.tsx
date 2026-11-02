'use client';

import React from 'react';
import DashboardAnalytics from '@/app/(dashboard)/page';

export default function OrgDashboardPage({ params }: { params: { orgid: string } }) {
  return <DashboardAnalytics />;
}
