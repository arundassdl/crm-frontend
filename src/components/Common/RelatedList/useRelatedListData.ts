"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useCrmSession } from "@/components/CrmSessionContext";
import { getFormFields } from "@/services/api/general_apis/layout-api";
import { getRelatedListKind } from "./relatedListMeta";
import { buildRelatedFilters } from "@/lib/related-list-request";

/**
 * A single rendered column of a related-list section, derived from the Settings
 * "Detail View" related-list configuration (`config.related_column`) plus the child
 * doctype's form-field metadata (for labels/types). No column is hardcoded.
 */
export interface RelatedListColumn {
  /** Stable key (main field name, or `alias.subfield` for address sub-columns). */
  key: string;
  headerName: string;
  type: string;
  /** Candidate row keys, tried in order, to resolve this column's value. */
  valueKeys: string[];
}

export interface UseRelatedListDataResult {
  columns: RelatedListColumn[];
  rows: any[];
  totalCount: number;
  loading: boolean;
  /** True once field metadata has resolved (so callers can distinguish empty vs. loading). */
  ready: boolean;
  refetch: () => void;
}

const isAddressType = (t: any) => String(t || "").toLowerCase() === "address";

/**
 * Encapsulates the exact config-driven column/data logic used by the standalone
 * DataGrid related-list components (Deal/Contact/Account/Task RelatedList), but
 * exposes plain column descriptors + rows so callers can render any presentation
 * (e.g. the bespoke detail-dashboard HTML tables).
 */
export function useRelatedListData(
  config: any,
  parent_module: string,
  link_name: string,
  refreshTrigger?: number
): UseRelatedListDataResult {
  const session = useCrmSession();

  const [colFields, setColFields] = useState<any[]>([]);
  const [fieldMeta, setFieldMeta] = useState<Record<string, { label: string; type: string; in_list_view: boolean }>>({});
  const [fieldOrder, setFieldOrder] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  const [rows, setRows] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const mainDoctype = config?.main_doctype_name;
  const kind = useMemo(() => getRelatedListKind(mainDoctype, config?.label), [mainDoctype, config?.label]);

  // ── Resolve child-doctype fields (labels/types) + build the fetch column set ──
  useEffect(() => {
    let cancelled = false;
    const fetchFields = async () => {
      setReady(false);
      if (!session || !mainDoctype) {
        setReady(true);
        return;
      }
      try {
        const response: any = await getFormFields(
          config.child_module || mainDoctype,
          "",
          "",
          ""
        );
        const fieldList: any[] = Array.isArray(response?.fields)
          ? response.fields
          : Array.isArray(response)
            ? response
            : [];

        const meta: Record<string, { label: string; type: string; in_list_view: boolean }> = {};
        const order: string[] = [];
        const parsedColFields = fieldList
          .filter((f: any) => !f.hide && !isAddressType(f.type || f.fieldtype))
          .map((f: any) => {
            const fn = f.fieldname || f.name;
            meta[fn] = { label: f.label || fn, type: String(f.type || f.fieldtype || "string"), in_list_view: !!f.in_list_view };
            order.push(fn);
            return { doctype: mainDoctype, field: fn, hidden: f.in_list_view ? "False" : "True" };
          });

        // Dedupe, always fetch `name` for row identity + detail links. Address
        // joins are intentionally excluded: the browser may not supply SQL or
        // join expressions to the BFF.
        const initial = [{ doctype: mainDoctype, field: "name", hidden: "True" }];
        const seen = new Set(initial.map((f) => `${f.doctype}:${f.field}`));
        const combined = parsedColFields.filter((f) => {
          const k = `${f.doctype}:${f.field}`;
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });

        if (cancelled) return;
        setColFields([...initial, ...combined]);
        setFieldMeta(meta);
        setFieldOrder(order);
      } catch (err) {
        console.error("useRelatedListData: failed to load fields", err);
      } finally {
        if (!cancelled) setReady(true);
      }
    };
    fetchFields();
    return () => {
      cancelled = true;
    };
  }, [session, mainDoctype, config?.child_module]);

  // ── Derive the visible/ordered columns purely from the Settings config ──
  const columns = useMemo<RelatedListColumn[]>(() => {
    if (!mainDoctype) return [];
    const relatedCols: any[] = Array.isArray(config?.related_column) ? config.related_column : [];

    const buildCol = (fieldName: string): RelatedListColumn | null => {
      const m = fieldMeta[fieldName];
      const isAddressSub = fieldName.includes(".");
      const valueKeys = isAddressSub
        ? [fieldName.replace(".", "_"), fieldName, `tab${fieldName}`]
        : [fieldName, `${mainDoctype}.${fieldName}`, `tab${mainDoctype}.${fieldName}`];
      return {
        key: fieldName,
        headerName: m?.label || fieldName,
        type: m?.type || "string",
        valueKeys,
      };
    };

    if (relatedCols.length > 0) {
      return relatedCols
        .filter((rc: any) => rc.in_list_view)
        .sort((a: any, b: any) => Number(a.order ?? 1000) - Number(b.order ?? 1000))
        .map((rc: any) => buildCol(rc.field_name))
        .filter((c): c is RelatedListColumn => !!c);
    }

    // No explicit config → fall back to child fields flagged in_list_view (still dynamic).
    return fieldOrder
      .filter((fn) => fieldMeta[fn]?.in_list_view)
      .map(buildCol)
      .filter((c): c is RelatedListColumn => !!c);
  }, [config?.related_column, fieldMeta, fieldOrder, mainDoctype]);

  // ── Fetch rows filtered to the parent record (kind-aware WHERE, mirrors DataGrid variants) ──
  const fetchData = useCallback(async () => {
    if (!config || !session || !link_name || !ready || colFields.length === 0) return;
    setLoading(true);
    try {
      const filters = buildRelatedFilters({
        mainDoctype,
        kind,
        parentModule: parent_module,
        linkName: link_name,
        linkFieldName: config.link_field_name,
      });
      if (filters.length === 0) throw new Error("Related-list link field is unavailable");
      const response = await axios.post("/api/datalist", {
        module: mainDoctype,
        fields: colFields,
        filters,
        limit_start: 0,
        limit_page_length: 100,
        order_by: "modified desc",
      });
      setRows(response.data?.records || []);
      setTotalCount(Number(response.data?.total_count) || 0);
    } catch (err) {
      console.error("useRelatedListData: failed to load rows", err);
      setRows([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [config, session, link_name, ready, colFields, kind, mainDoctype, parent_module]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);

  return { columns, rows, totalCount, loading, ready, refetch: fetchData };
}

/** Resolve a column's display value from a row across its candidate keys. */
export function resolveCellValue(row: any, col: RelatedListColumn): any {
  if (!row) return "";
  for (const k of col.valueKeys) {
    const v = row[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return "";
}
