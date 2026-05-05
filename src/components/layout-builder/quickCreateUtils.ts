export const getFieldName = (field: any): string => {
    if (!field) return '';
    return String(field.fieldname ?? field.name ?? '');
};

// Mandatory helper: flatten sections -> fields
export const getAllFields = (layout: any) => {
    return (layout?.sections ?? []).flatMap((section: any) => section?.fields ?? []);
};

// Mandatory helper: find a field object by fieldname string
export const findField = (layout: any, fieldname: string) => {
    for (const section of layout?.sections ?? []) {
        const fields = section?.fields ?? [];
        const field = fields.find((f: any) => getFieldName(f) === fieldname);
        if (field) return field;
    }
    return null;
};

export const findFieldWithSectionMeta = (layout: any, fieldname: string) => {
    for (const section of layout?.sections ?? []) {
        const fields = section?.fields ?? [];
        const field = fields.find((f: any) => getFieldName(f) === fieldname);
        if (!field) continue;

        const column_count = Number(section?.column_count) === 1 ? 1 : 2;
        return {
            field,
            sectionTitle: section?.title ?? '',
            section_column_count: column_count,
        };
    }
    return null;
};

export const getRequiredFields = (layout: any): string[] => {
    const allFields = getAllFields(layout);
    return allFields
        .filter((f: any) => !!f?.required)
        .map((f: any) => getFieldName(f))
        .filter(Boolean);
};

export const validateQuickCreateConfig = (layout: any): string | null => {
    const qc = layout?.quick_create;
    if (!qc) return null;

    const fields: unknown = (qc as any)?.fields;
    const normalizedFields = Array.isArray(fields) ? fields : null;
    if (!normalizedFields) return 'Quick Create fields must be an array of strings.';

    const stringFields = normalizedFields.map((f) => String(f));

    const dedupedSize = new Set(stringFields).size;
    if (dedupedSize !== stringFields.length) {
        return 'Duplicate Quick Create fields are not allowed.';
    }

    const allFieldNames = new Set(
        getAllFields(layout)
            .map((f: any) => getFieldName(f))
            .filter(Boolean)
    );
    for (const fn of stringFields) {
        if (!allFieldNames.has(fn)) {
            return `Quick Create field "${fn}" does not exist in the layout sections.`;
        }
    }

    return null;
};

