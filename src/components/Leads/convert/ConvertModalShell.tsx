"use client";

import React from "react";

interface ConvertModalShellProps {
    open: boolean;
    title: string;
    /** e.g. lead context: `(Contact Name - Company)` */
    subtitle?: React.ReactNode;
    onClose: () => void;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

/**
 * Accessible modal shell: backdrop, panel, focus trap–friendly structure.
 */
export function ConvertModalShell({
    open,
    title,
    subtitle,
    onClose,
    children,
    footer,
}: ConvertModalShellProps) {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lead-convert-modal-title"
        >
            <button
                type="button"
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]"
                aria-label="Close dialog"
                onClick={onClose}
            />
            <div className="relative flex max-h-[100dvh] w-full max-w-lg flex-col rounded-t-2xl bg-white shadow-2xl sm:max-h-[90vh] sm:max-w-xl sm:rounded-2xl">
                <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-6">
                    <div className="min-w-0">
                    <h2
                        id="lead-convert-modal-title"
                        className="text-lg font-semibold text-slate-900"
                    >
                        {title}
                    </h2>
                    {subtitle ? (
                        <p className="mt-1 text-sm leading-snug text-slate-500">
                            {subtitle}
                        </p>
                    ) : null}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                    >
                        <span className="sr-only">Close</span>
                        <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
                    {children}
                </div>
                {footer ? (
                    <div className="shrink-0 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
                        {footer}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
