'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { layoutSelector, setQuickCreateFields } from '@/store/slices/general_slices/layout-slice';
import AvailableFieldList, { type AvailableFieldBySection } from './AvailableFieldList';
import { getAllFields, getFieldName, getRequiredFields } from './quickCreateUtils';

type QuickCreateAvailableFieldsPanelProps = {
    layout: any;
};

const MAX_FIELDS = 10;

const QuickCreateAvailableFieldsPanel: React.FC<QuickCreateAvailableFieldsPanelProps> = ({ layout }) => {
    const dispatch = useDispatch();
    const storeLayout = useSelector(layoutSelector) as any;
    const [searchQuery, setSearchQuery] = useState('');

    const existingFieldNames = useMemo(() => {
        const all = getAllFields(layout);
        return new Set(all.map((f: any) => getFieldName(f)).filter(Boolean));
    }, [layout]);

    const requiredFieldNames = useMemo(() => getRequiredFields(layout), [layout]);
    const qcFieldsFromLayout: string[] = (layout?.quick_create?.fields ?? storeLayout?.activeLayout?.quick_create?.fields ?? []) as string[];

    const quickFields = useMemo(() => {
        const seen = new Set<string>();
        const sanitized: string[] = [];
        for (const fn of qcFieldsFromLayout ?? []) {
            if (!fn || typeof fn !== 'string') continue;
            if (!existingFieldNames.has(fn)) continue;
            if (seen.has(fn)) continue;
            seen.add(fn);
            sanitized.push(fn);
            if (sanitized.length >= MAX_FIELDS) break;
        }
        return sanitized;
    }, [qcFieldsFromLayout, existingFieldNames]);

    // Enforce required fields are always included in quick_create
    const enforcedQuickFields = useMemo(() => {
        const next = [...quickFields];
        const seen = new Set(next);
        for (const requiredField of requiredFieldNames) {
            if (!requiredField || seen.has(requiredField)) continue;
            if (!existingFieldNames.has(requiredField)) continue;
            if (next.length >= MAX_FIELDS) break;
            seen.add(requiredField);
            next.push(requiredField);
        }
        return next;
    }, [quickFields, requiredFieldNames, existingFieldNames]);

    const quickFieldsSet = useMemo(() => new Set(enforcedQuickFields), [enforcedQuickFields]);

    // Keep quick_create clean if sections change.
    useEffect(() => {
        const current = (layout?.quick_create?.fields ?? storeLayout?.activeLayout?.quick_create?.fields ?? []) as string[];
        if (JSON.stringify(current) !== JSON.stringify(enforcedQuickFields)) {
            dispatch(setQuickCreateFields(enforcedQuickFields));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch, layout, JSON.stringify(enforcedQuickFields)]);

    // Default behavior when config missing.
    useEffect(() => {
        const qc = layout?.quick_create;
        if (!qc || !Array.isArray(qc.fields)) {
            dispatch(setQuickCreateFields(requiredFieldNames));
        }
    }, [dispatch, layout, requiredFieldNames]);

    const availableBySection: AvailableFieldBySection[] = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        const result: AvailableFieldBySection[] = [];

        for (const section of layout?.sections ?? []) {
            const sectionTitle = section?.title ?? 'Untitled Section';
            const mapped = (section.fields ?? [])
                .map((f: any) => {
                    const fn = getFieldName(f);
                    if (!fn || quickFieldsSet.has(fn)) return null;
                    const label = f.label ?? fn;
                    const fieldType = f.type ?? f.fieldtype ?? '—';
                    const required = !!f.required;
                    return { fieldname: fn, label, fieldType, required };
                })
                .filter(Boolean) as AvailableFieldBySection['fields'];

            const filtered = !q
                ? mapped
                : mapped.filter(
                      (f) =>
                          f.label.toLowerCase().includes(q) || String(f.fieldType).toLowerCase().includes(q)
                  );

            if (filtered.length) {
                result.push({ sectionTitle, fields: filtered });
            }
        }

        return result;
    }, [layout, quickFieldsSet, searchQuery]);

    const addField = (fieldname: string) => {
        if (!fieldname || enforcedQuickFields.includes(fieldname)) return;
        if (enforcedQuickFields.length >= MAX_FIELDS) return;
        if (!existingFieldNames.has(fieldname)) return;
        dispatch(setQuickCreateFields([...enforcedQuickFields, fieldname]));
    };

    return (
        <AvailableFieldList
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            availableBySection={availableBySection}
            onAddField={addField}
        />
    );
};

export default QuickCreateAvailableFieldsPanel;

