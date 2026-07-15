"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@mui/material/styles";
import { Plus, DotsThreeVertical } from "@phosphor-icons/react";
import { CircularProgress } from "@mui/material";

import { useRelatedListData, resolveCellValue, RelatedListColumn } from "./useRelatedListData";
import { getRelatedListMeta, parentDoctypeForModule } from "./relatedListMeta";

import AddEditDealDrawer from "@/components/Deals/CreateEdit";
import AddEditContactDrawer from "@/components/Contact/Createcontact";
import AddEditCustomerDrawer from "@/components/Customer/Createcustomer";
import AddEditTaskDrawer from "@/components/Tasks/CreateEdit";
import AddEditLeadDrawer from "@/components/Leads/CreateEdit";

/**
 * A single related-list section rendered in the bespoke detail-dashboard visual
 * style (rounded card + HTML table), but with its title, columns, rows, ordering
 * and create action driven entirely by the Settings "Detail View" configuration
 * (`getRelatedList`). No section, column, or label is hardcoded.
 */
export interface DynamicRelatedSectionProps {
  config: any;
  parent_module: string;
  /** Parent record id (the doc whose detail page this section lives on). */
  link_name: string;
  /** Bump to force a data refetch (e.g. after edits elsewhere). */
  refreshTrigger?: number;
  onCountChange?: (id: string, count: number) => void;
}

const formatValue = (raw: any, type: string): string => {
  if (raw === undefined || raw === null || raw === "") return "—";
  const t = (type || "").toLowerCase();
  if (t === "checkbox" || t === "check") return raw === 1 || raw === true ? "Yes" : "No";
  if (t === "date" || t === "datetime") {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      return t === "datetime"
        ? d.toLocaleString("en-US", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
        : d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
    }
  }
  return String(raw);
};

export default function DynamicRelatedSection({
  config,
  parent_module,
  link_name,
  refreshTrigger,
  onCountChange,
}: DynamicRelatedSectionProps) {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [drawerOpen, setDrawerOpen] = useState(false);
  const { columns, rows, loading, ready, refetch } = useRelatedListData(config, parent_module, link_name, refreshTrigger);

  const meta = getRelatedListMeta(config?.main_doctype_name, config?.label);
  const Icon = meta.icon;
  const title = config?.label || config?.main_doctype_name || "Related List";
  const primaryKey = meta.primaryFields[0];

  React.useEffect(() => {
    if (ready && onCountChange) onCountChange(String(config?.id || config?.name || title), rows.length);
  }, [ready, rows.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = () => {
    setDrawerOpen(false);
    refetch();
  };

  const isPrimaryCol = (col: RelatedListColumn) =>
    meta.primaryFields.some((f) => col.key === f) || col.key === primaryKey;

  const colCount = Math.max(columns.length, 1);

  return (
    <div id={`section-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className={`rounded-2xl border shadow-sm overflow-hidden ${isDark ? "bg-[#1C1C1E] border-[#27272A]" : "bg-[#f9fbff] border-[#E3ECFC]"}`}>
        {/* Header */}
        <div className={`flex items-center gap-2.5 px-5 py-3.5 border-b ${isDark ? "border-[#27272A]" : "border-[#EFF6FF]"}`}>
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isDark ? "bg-[#27272A]" : "bg-[#EFF6FF]"}`}>
            <Icon size={13} color={isDark ? "#9CA3AF" : "#1D4ED8"} weight="duotone" />
          </div>
          <p className={`font-heading text-[12px] font-bold uppercase tracking-[0.12em] flex-1 ${isDark ? "text-[#D4D4D8]" : "text-[#1D4ED8]"}`}>{title}</p>
          <button onClick={() => setDrawerOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold bg-[#1D4ED8] text-white hover:bg-[#1E40AF] transition-colors">
            <Plus size={13} weight="bold" />
            New {meta.newLabel}
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-[14px] min-w-[600px]">
              <thead>
                <tr className={`border-b ${isDark ? "border-[#27272A]" : "border-[#E3ECFC]"}`}>
                  {columns.map((col) => (
                    <th key={col.key} className={`text-left py-2 pr-4 text-[11.5px] font-bold uppercase tracking-wider whitespace-nowrap ${isDark ? "text-[#71717A]" : "text-[#0C2472]"}`}>
                      {col.headerName}
                    </th>
                  ))}
                  {columns.length === 0 && (
                    <th className={`text-left py-2 pr-4 text-[11.5px] font-bold uppercase tracking-wider ${isDark ? "text-[#71717A]" : "text-[#0C2472]"}`}> </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {loading && !ready ? (
                  <tr>
                    <td colSpan={colCount} className="py-8 text-center">
                      <CircularProgress size={20} />
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={colCount} className={`py-8 text-center text-[14px] ${isDark ? "text-[#3F3F46]" : "text-slate-300"}`}>No rows</td>
                  </tr>
                ) : (
                  rows.map((row, i) => {
                    const id = row?.name;
                    const clickable = !!id && !!meta.detailHrefBase;
                    return (
                      <tr
                        key={id || i}
                        onClick={() => clickable && router.push(`${meta.detailHrefBase}${encodeURIComponent(id)}`)}
                        className={`border-b transition-colors ${clickable ? "cursor-pointer" : ""} ${isDark ? "border-[#27272A] hover:bg-[#27272A]" : "border-[#EFF6FF] hover:bg-[rgba(29,78,216,0.03)]"}`}
                      >
                        {columns.map((col) => {
                          const val = formatValue(resolveCellValue(row, col), col.type);
                          const primary = isPrimaryCol(col);
                          return (
                            <td
                              key={col.key}
                              className={`py-3 pr-4 ${primary ? `font-medium ${clickable ? "hover:underline " : ""}${isDark ? "text-[#A1A1AA]" : "text-[#1D4ED8]"}` : isDark ? "text-[#A1A1AA]" : "text-slate-600"}`}
                            >
                              {val}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Config-driven create drawer */}
      {drawerOpen && meta.kind === "deal" && (
        <AddEditDealDrawer initialValues={{ [config.link_field_name]: link_name }} open={drawerOpen} onClose={() => setDrawerOpen(false)} operation="New" onSubmit={handleSubmit} />
      )}
      {drawerOpen && meta.kind === "contact" && (
        <AddEditContactDrawer initialValues={{ [config.link_field_name]: link_name }} link_name={link_name} open={drawerOpen} onClose={() => setDrawerOpen(false)} operation="New" onSubmit={handleSubmit} />
      )}
      {drawerOpen && (meta.kind === "account" || meta.kind === "generic") && (
        <AddEditCustomerDrawer initialValues={{ [config.link_field_name]: link_name }} open={drawerOpen} onClose={() => setDrawerOpen(false)} operation="New" onSubmit={handleSubmit} />
      )}
      {drawerOpen && meta.kind === "lead" && (
        <AddEditLeadDrawer initialValues={{ [config.link_field_name]: link_name }} open={drawerOpen} onClose={() => setDrawerOpen(false)} operation="New" onSubmit={handleSubmit} />
      )}
      {drawerOpen && meta.kind === "task" && (
        <AddEditTaskDrawer
          initialValues={[]}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          operation="New"
          reference_doctype={parentDoctypeForModule(parent_module)}
          reference_docname={link_name}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
