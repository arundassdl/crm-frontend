"use client";

import React from "react";

export interface MappingColumn {
    key: string;
    label: string;
}

export interface MappingPreviewRow {
    leadField: string;
    leadLabel: string;
    cells: Record<string, string>;
}

interface MappingPreviewTableProps {
    columns: MappingColumn[];
    rows: MappingPreviewRow[];
    emptyMessage?: string;
}

export function MappingPreviewTable({
    columns,
    rows,
    emptyMessage = "No field mappings configured for this layout.",
}: MappingPreviewTableProps) {
    if (!rows.length) {
        return (
            <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
                {emptyMessage}
            </p>
        );
    }

    return (
        <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50">
                    <tr>
                        <th
                            scope="col"
                            className="whitespace-nowrap px-3 py-2 font-semibold text-slate-700"
                        >
                            Lead field
                        </th>
                        {columns.map((c) => (
                            <th
                                key={c.key}
                                scope="col"
                                className="whitespace-nowrap px-3 py-2 font-semibold text-slate-700"
                            >
                                {c.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                    {rows.map((r) => (
                        <tr key={r.leadField} className="hover:bg-slate-50/80">
                            <td className="whitespace-nowrap px-3 py-2 font-medium text-slate-800">
                                {r.leadLabel}
                            </td>
                            {columns.map((c) => (
                                <td
                                    key={c.key}
                                    className="max-w-[220px] truncate px-3 py-2 text-slate-600"
                                    title={r.cells[c.key] ?? ""}
                                >
                                    {r.cells[c.key] ?? "—"}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
