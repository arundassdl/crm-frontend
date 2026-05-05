"use client";

import React from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { useDispatch, useSelector } from 'react-redux';
import { layoutSelector, removeFromUnusedField, setQuickCreateFields, setSections, reorderRelatedLists, setBusinessCardFields, insertRelatedList, addToUnusedField, removeRelatedList } from '@/store/slices/general_slices/layout-slice';

const newSectionPlaceholder = () => ({
    id: `section-${Date.now()}`,
    title: 'New Section',
    fields: [],
    isExpanded: true,
});

interface DragDropProviderProps {
    children: React.ReactNode;
}

const DragDropProvider: React.FC<DragDropProviderProps> = ({ children }) => {
    const dispatch = useDispatch();
    const { activeLayout, unusedFields, unusedRelatedLists } = useSelector(layoutSelector);

    const onDragEnd = (result: DropResult) => {
        const { source, destination, type, draggableId } = result;

        if (!destination) return;

        if (
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        ) {
            return;
        }

        if (!activeLayout || !activeLayout.sections) return;

        const sections = Array.from(activeLayout.sections);

        if (type === 'SECTION') {
            if (source.droppableId === 'palette-sections' && destination.droppableId === 'canvas') {
                const newSection = newSectionPlaceholder();
                const updated = [...sections];
                updated.splice(destination.index, 0, newSection);
                dispatch(setSections(updated));
                return;
            }
            if (source.droppableId === 'canvas' && destination.droppableId === 'canvas') {
                const [reorderedSection] = sections.splice(source.index, 1);
                sections.splice(destination.index, 0, reorderedSection);
                dispatch(setSections(sections));
            }
            return;
        }

        if (type === 'FIELD') {
            // Handle drop from Unused pool: add to section and remove from unused (no duplicates)
            if (source.droppableId === 'palette-unused') {
                const fieldId = draggableId.startsWith('unused-') ? draggableId.slice('unused-'.length) : null;
                const field = fieldId ? unusedFields.find(f => f.id === fieldId) : null;
                if (!field) return;

                const alreadyInLayout = sections.some(s =>
                    s.fields?.some((f: any) => f.id === field.id || f.name === field.name)
                );
                if (alreadyInLayout) return;

                const destSectionIndex = sections.findIndex((s: any) => s.id === destination.droppableId);
                if (destSectionIndex === -1) return;

                const updatedSections = [...sections];
                const prevSection: any = updatedSections[destSectionIndex];
                if (!prevSection) return;
                const destFields = prevSection.fields ? [...prevSection.fields] : [];
                destFields.splice(destination.index, 0, { ...field, column: field.column ?? 0 });
                updatedSections[destSectionIndex] = {
                    ...(prevSection as any),
                    fields: destFields,
                };

                dispatch(setSections(updatedSections));
                dispatch(removeFromUnusedField(field.id));
                return;
            }

            // Handle new field drop from palette
            if (source.droppableId === 'palette') {
                const fieldType = draggableId.split('-')[1];
                const destSectionIndex = sections.findIndex((s: any) => s.id === destination.droppableId);
                if (destSectionIndex === -1) return;

                const newField: any = {
                    id: `field-${Date.now()}`,
                    type: fieldType,
                    name: fieldType === 'firstname' ? 'first_name' : `field_${Date.now()}`,
                    label: fieldType === 'address' ? 'Address' : fieldType === 'firstname' ? 'First Name' : `New ${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)} Field`,
                    required: false,
                    visible: true,
                    column: 0
                };

                if (fieldType === 'firstname') {
                    newField.salutation_options = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.'];
                }

                if (fieldType === 'lookup') {
                    newField.doctype = '';
                    newField.display_fields = '';
                    newField.search_fields = '';
                }

                if (fieldType === 'select') {
                    newField.options = [
                        { label: 'Option 1', value: 'Option 1' },
                        { label: 'Option 2', value: 'Option 2' },
                    ];
                    newField.default_value = '';
                    newField.picklist_sort_order = 'entered';
                    newField.enable_history_tracking = false;
                    newField.enable_color_for_options = false;
                }

                const updatedSections = [...sections];
                const prevSection: any = updatedSections[destSectionIndex];
                if (!prevSection) return;
                const destFields = prevSection.fields ? [...prevSection.fields] : [];
                destFields.splice(destination.index, 0, newField);
                updatedSections[destSectionIndex] = {
                    ...(prevSection as any),
                    fields: destFields,
                };

                dispatch(setSections(updatedSections));
                return;
            }

            // Handle field removal via drag to unused palette
            if (destination.droppableId === 'palette-unused') {
                const sourceSectionIndex = sections.findIndex((s: any) => s.id === source.droppableId);
                if (sourceSectionIndex === -1) return;

                const updatedSections = [...sections];
                const section = { ...updatedSections[sourceSectionIndex] };
                const fields = [...(section.fields || [])];
                const [removedField] = fields.splice(source.index, 1);

                if (removedField) {
                    updatedSections[sourceSectionIndex] = { ...section, fields };
                    dispatch(setSections(updatedSections));
                    dispatch(removeFromUnusedField(removedField.id)); // Ensure not duplicated
                    dispatch(addToUnusedField(removedField));
                }
                return;
            }

            // Handle field reordering/moving
            const sourceSectionIndex = sections.findIndex((s: any) => s.id === source.droppableId);
            const destSectionIndex = sections.findIndex((s: any) => s.id === destination.droppableId);

            if (sourceSectionIndex === -1 || destSectionIndex === -1) return;

            const sourceSection: any = sections[sourceSectionIndex];
            const destSection: any = sections[destSectionIndex];

            if (!sourceSection.fields) sourceSection.fields = [];
            if (!destSection.fields) destSection.fields = [];

            const sourceFields = Array.from(sourceSection.fields);
            const destFields = source.droppableId === destination.droppableId
                ? sourceFields
                : Array.from(destSection.fields);

            const [movedField] = sourceFields.splice(source.index, 1);

            // Update column if moved between positions that might change column (optional logic)
            // movedField.column = destination.index % 2; 

            destFields.splice(destination.index, 0, movedField);

            const updatedSections = [...sections];
            updatedSections[sourceSectionIndex] = {
                ...(sourceSection as any),
                fields: sourceFields,
            };

            if (source.droppableId !== destination.droppableId) {
                updatedSections[destSectionIndex] = {
                    ...(destSection as any),
                    fields: destFields,
                };
            }

            dispatch(setSections(updatedSections));
        }

        if (type === 'QUICK_CREATE') {
            if (!activeLayout) return;

            const getFieldname = (f: any) => f?.name ?? f?.fieldname;
            const allFields = (activeLayout.sections ?? []).flatMap((s: any) => s.fields ?? []);
            const existingFieldNames = new Set(allFields.map(getFieldname).filter(Boolean));
            const requiredFieldNames = allFields.filter((f: any) => !!f?.required).map(getFieldname).filter(Boolean);

            const qc = (activeLayout as any)?.quick_create;
            const currentQuickFields: string[] = Array.isArray(qc?.fields) ? qc.fields : requiredFieldNames;

            const quickFields = Array.from(new Set(currentQuickFields)).filter((fn: string) => existingFieldNames.has(fn));
            const rawDragId = String(draggableId ?? '');
            const fieldname = rawDragId.startsWith('qc-available-')
                ? rawDragId.slice('qc-available-'.length)
                : rawDragId.startsWith('qc-selected-')
                    ? rawDragId.slice('qc-selected-'.length)
                    : rawDragId;

            const MAX_FIELDS = 10;

            // Add: LEFT (available) -> RIGHT (selected)
            if (source.droppableId === 'quick-create-available' && destination.droppableId === 'quick-create-selected') {
                if (!existingFieldNames.has(fieldname)) return;
                if (quickFields.includes(fieldname)) return;
                if (quickFields.length >= MAX_FIELDS) return;

                const next = [...quickFields];
                next.splice(destination.index, 0, fieldname);
                dispatch(setQuickCreateFields(next));
                return;
            }

            // Reorder inside RIGHT panel
            if (source.droppableId === 'quick-create-selected' && destination.droppableId === 'quick-create-selected') {
                if (!quickFields.length) return;
                const next = Array.from(quickFields);
                const [moved] = next.splice(source.index, 1);
                if (!moved) return;
                next.splice(destination.index, 0, moved);
                dispatch(setQuickCreateFields(next));
                return;
            }

            // Intentionally ignore: moving from RIGHT -> LEFT or dropping elsewhere
            return;
        }

        if (type === 'RELATED_LIST') {
            const relatedLists = Array.from(activeLayout.related_lists || []);

            if (source.droppableId === 'related-list-palette' && destination.droppableId === 'related-list-canvas') {
                const rlId = draggableId.startsWith('palette-') ? draggableId.slice('palette-'.length) : draggableId;
                const originalRL = unusedRelatedLists.find(rl => rl.id === rlId);
                if (originalRL) {
                    dispatch(insertRelatedList({ relatedList: originalRL, index: destination.index }));
                }
                return;
            }

            if (source.droppableId === 'related-list-canvas' && destination.droppableId === 'related-list-palette') {
                const [removed] = relatedLists.splice(source.index, 1);
                if (removed) {
                    dispatch(reorderRelatedLists(relatedLists));
                    dispatch(removeRelatedList(removed.id));
                }
                return;
            }

            if (source.droppableId === 'related-list-canvas' && destination.droppableId === 'related-list-canvas') {
                const [moved] = relatedLists.splice(source.index, 1);
                relatedLists.splice(destination.index, 0, moved);
                dispatch(reorderRelatedLists(relatedLists));
                return;
            }
        }

        if (type === 'BC_FIELD') {
            const bcFields = Array.from(activeLayout.business_card_fields || []);
            if (source.droppableId === 'business-card-canvas' && destination.droppableId === 'business-card-canvas') {
                const [moved] = bcFields.splice(source.index, 1);
                bcFields.splice(destination.index, 0, moved);
                dispatch(setBusinessCardFields(bcFields));
                return;
            }
        }
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            {children}
        </DragDropContext>
    );
};

export default DragDropProvider;
