"use client";

import React from 'react';
import LayoutBuilderContainer from '@/components/layout-builder/LayoutBuilderContainer';
import { useSearchParams } from 'next/navigation';

const AddLayoutPage = () => {
    const searchParams = useSearchParams();
    const module = searchParams?.get('module') || 'CRM Territory';

    return (
        <LayoutBuilderContainer module={module} />
    );
};

export default AddLayoutPage;
