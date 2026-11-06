"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import LeadConvertForm from "@/components/Leads/convert/LeadConvertForm";
import { getLayoutList } from "@/services/api/general_apis/layout-api";
import { useCrmSession } from "@/components/CrmSessionContext";

export default function LeadConvertPage() {
    const params = useParams();
    const router = useRouter();
    const raw = params?.slug != null ? String(params.slug) : "";
    const leadName = raw ? decodeURIComponent(raw) : "";

    const session = useCrmSession();

    const [lead, setLead] = useState<Record<string, any> | null>(null);
    const [sourceLayout, setSourceLayout] = useState<string | null>(null);
    const [pageError, setPageError] = useState<string | null>(null);

    useEffect(() => {
        if (!leadName || !session) {
            if (!session) setPageError("Please sign in to convert a lead.");
            return;
        }
        let cancelled = false;
        (async () => {
            setPageError(null);
            try {
                const response = await fetch("/api/detail-data", {
                    method: "POST",
                    credentials: "same-origin",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ doctype: "CRM Lead", docname: leadName }),
                });
                const payload = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(payload?.message || "Failed to load lead.");
                const doc = payload?.record ?? payload;
                if (cancelled) return;
                if (!doc) {
                    setPageError("Lead not found.");
                    setLead(null);
                    setSourceLayout("");
                    return;
                }
                setLead(doc);

                let layoutId = doc.layout_id != null && doc.layout_id !== "" ? String(doc.layout_id).trim() : "";
                if (!layoutId || layoutId === "0") {
                    const layouts = await getLayoutList("Leads", "", "");
                    layoutId = Array.isArray(layouts) && layouts[0]?.value ? String(layouts[0].value) : "";
                }

                if (!layoutId) {
                    setSourceLayout("");
                    return;
                }

                /** `getFormFields` / conversion mapping expect SDL Layout **document name** (`name`), not `layout_name`. */
                setSourceLayout(layoutId);
            } catch (e: any) {
                if (!cancelled) {
                    setPageError(e?.message || "Failed to load lead.");
                    setLead(null);
                    setSourceLayout("");
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [leadName, session]);

    const backToLead = () => {
        router.push(`/leads/detail/${encodeURIComponent(leadName)}`);
    };

    if (!leadName) {
        return (
            <div className="p-6 text-slate-600">
                <p>Invalid lead.</p>
            </div>
        );
    }

    if (pageError && !lead) {
        return (
            <div className="mx-auto max-w-xl p-6">
                <p className="text-red-600">{pageError}</p>
                <button
                    type="button"
                    onClick={backToLead}
                    className="mt-4 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm"
                >
                    Back to lead
                </button>
            </div>
        );
    }

    if (lead === null || sourceLayout === null) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center gap-2 text-slate-600">
                <span
                    className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
                    aria-hidden
                />
                Loading…
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/80 px-4 py-8 text-left">
            <LeadConvertForm
                leadId={leadName}
                lead={lead}
                sourceModule="Leads"
                sourceLayout={sourceLayout}
                onCancel={backToLead}
            />
        </div>
    );
}
