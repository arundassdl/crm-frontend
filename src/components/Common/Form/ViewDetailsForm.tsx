"use client";
import { readAccessTokenDataParsed } from '@/utils/accessTokenDataStorage'

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Card, CardContent, Divider, Grid, Typography, Chip, Tabs, Tab } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import StyledContainer from "@/@core/theme/overrides/container";
import Timeline from "@mui/lab/Timeline";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineDot from "@mui/lab/TimelineDot";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineOppositeContent from "@mui/lab/TimelineOppositeContent";

import DealSkeleton from "@/components/Common/Skeletons/DealSkeleton";
import CommonForm from "@/components/Common/Form/CommonForm";

import { getFormFields, getLayoutList, getRelatedList } from "@/services/api/general_apis/layout-api";
import { getLayout } from "@/services/api/crm/crm-api";
import { getDocument, updateFieldCustomDocument } from "@/services/api/common-erpnext-api/create-edit-api";
import { FieldConfigNew } from "@/components/Common/Form/validationSchema";
import { fetchNotesWithOwner, fetchTimelineComments } from "@/services/api/common-erpnext-api/create-update-custom-api";
import { fetchRawDataGridListing } from "@/services/api/common-erpnext-api/listing-api-get";
export interface ViewDetailsFormProps {
  moduleName: string;
  layout_id?: string;
  record_name: string;
  recordDisplayName?: string;
  doctype?: string;
  isEditPermission?: boolean;
}

function moduleNameToDoctype(moduleName: string): string {
  const trimmed = (moduleName || "").trim();
  if (!trimmed) return "CRM";
  if (trimmed.toLowerCase().startsWith("crm ")) return trimmed;

  let singular = trimmed;
  if (/ies$/i.test(singular)) singular = singular.replace(/ies$/i, "y");
  else if (/s$/i.test(singular)) singular = singular.replace(/s$/i, "");

  return `CRM ${singular}`.trim();
}

/** Mirrors TaskRelatedList.tsx `whereconditon` so tab counts match the related grid. */
function buildRelatedListWhereCondition(
  parentModuleName: string,
  mainDoctypeName: string,
  linkFieldName: string,
  recordName: string
): string {
  const id = String(recordName).replace(/'/g, "\\'");
  if (mainDoctypeName === "CRM Task") {
    if (parentModuleName === "Contacts") {
      return ` AND \`tab${mainDoctypeName}\`.\`contact_name\` = '${id}'`;
    }
    let refDoctype = "";
    if (parentModuleName === "Accounts") refDoctype = "CRM Organization";
    else if (parentModuleName === "Leads") refDoctype = "CRM Leads";
    else if (parentModuleName === "Deals") refDoctype = "CRM Deals";

    if (refDoctype) {
      return ` AND \`tab${mainDoctypeName}\`.\`reference_docname\` = '${id}' AND \`tab${mainDoctypeName}\`.\`reference_doctype\` = '${refDoctype}'`;
    }
    return ` AND \`tab${mainDoctypeName}\`.\`${linkFieldName}\` = '${id}'`;
  }
  return ` AND \`tab${mainDoctypeName}\`.\`${linkFieldName}\` = '${id}'`;
}

const ViewDetailsForm: React.FC<ViewDetailsFormProps> = ({
  moduleName,
  layout_id,
  record_name,
  recordDisplayName,
  doctype: doctypeProp,
  isEditPermission = true,
}) => {
  const router = useRouter();
  const [userToken] = useState<any>(() => {
    try {
      return readAccessTokenDataParsed() || {};
    } catch {
      return {};
    }
  });

  const [activeTab, setActiveTab] = useState(0);
  const [selectedLayoutId, setSelectedLayoutId] = useState<string>(layout_id || "");

  const [loading, setLoading] = useState<boolean>(true);
  const [isFieldsFetched, setIsFieldsFetched] = useState(false);
  const [recordData, setRecordData] = useState<any>({});
  const [formFields, setFormFields] = useState<FieldConfigNew[]>([]);
  const [layoutContent, setLayoutContent] = useState<any>(null);
  const [notesCount, setNotesCount] = useState<number | null>(null);
  const [attachmentsCount, setAttachmentsCount] = useState<number | null>(null);
  const [stageHistoryCount, setStageHistoryCount] = useState<number | null>(null);
  const [relatedListCounts, setRelatedListCounts] = useState<Record<string, number>>({});
  const [relatedLists, setRelatedLists] = useState<any[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  interface TimelineCommentEntry {
    name: string;
    creation: string;
    owner?: string;
    owner_name?: string;
    content?: string;
    subject?: string;
    comment_type?: string;
  }

  const [timelineComments, setTimelineComments] = useState<TimelineCommentEntry[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  const doctype = useMemo(
    () => doctypeProp || moduleNameToDoctype(moduleName),
    [doctypeProp, moduleName]
  );

  const hasStageHistoryRelatedList = useMemo(
    () => relatedLists.some((rl: any) => rl.link_field_name === "stage_history"),
    [relatedLists]
  );

  const buildContactChildTableUpdate = (field: string, value: any): Record<string, any> => {
    const fieldConfig = formFields.find((f: any) => f.name === field) as any;
    const fieldType = fieldConfig?.type || "";

    if (fieldType === "phone" || fieldType === "mobile_no") {
      const existing: any[] = Array.isArray(recordData?.phone_nos) ? recordData.phone_nos : [];
      const isPrimPhone = fieldType === "phone";
      const idx = existing.findIndex((p: any) => isPrimPhone ? p.is_primary_phone : p.is_primary_mobile_no);
      const updated = existing.map((p: any, i: number) => i === idx ? { ...p, phone: value } : p);
      if (idx < 0) {
        updated.push({
          doctype: "Contact Phone",
          parentfield: "phone_nos",
          phone: value,
          is_primary_phone: isPrimPhone ? 1 : 0,
          is_primary_mobile_no: isPrimPhone ? 0 : 1,
        });
      }
      return { phone_nos: updated };
    }

    if (fieldType === "email") {
      const existing: any[] = Array.isArray(recordData?.email_ids) ? recordData.email_ids : [];
      const idx = existing.findIndex((e: any) => e.is_primary);
      const updated = existing.map((e: any, i: number) => i === idx ? { ...e, email_id: value } : e);
      if (idx < 0) {
        updated.push({
          doctype: "Contact Email",
          parentfield: "contact_emails",
          email_id: value,
          is_primary: 1,
        });
      }
      return { email_ids: updated };
    }

    return { [field]: value };
  };

  const handleSave = async (field: string, value: any) => {
    if (!userToken?.access_token || !record_name || !doctype) return;

    const updatedData = (doctype === "Contact" || moduleName === "Contacts")
      ? buildContactChildTableUpdate(field, value)
      : { [field]: value };

    setLoading(true);

    try {
      const response = await updateFieldCustomDocument(
        doctype,
        record_name,
        updatedData,
        userToken?.access_token
      );

      if (!response || !response.success) {
        throw new Error(response?.message || "Failed to update details.");
      }

      setRecordData((prev: any) => ({ ...prev, [field]: value }));
      const refreshed: any = await getDocument(doctype, record_name, userToken.access_token);
      if (refreshed) {
        setRecordData(refreshed);
      }
      // Refresh history and counts after save
      setRefreshTrigger(prev => prev + 1);
      loadCounts();
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBatch = async (updates: Record<string, any>) => {
    if (!userToken?.access_token || !record_name || !doctype) return;

    let merged: Record<string, any> = {};
    for (const [field, value] of Object.entries(updates)) {
      const part =
        doctype === "Contact" || moduleName === "Contacts"
          ? buildContactChildTableUpdate(field, value)
          : { [field]: value };
      merged = { ...merged, ...part };
    }

    setLoading(true);
    try {
      const response = await updateFieldCustomDocument(
        doctype,
        record_name,
        merged,
        userToken?.access_token
      );

      if (!response || !response.success) {
        throw new Error(response?.message || "Failed to update details.");
      }

      setRecordData((prev: any) => ({ ...prev, ...updates }));
      const refreshed: any = await getDocument(doctype, record_name, userToken.access_token);
      if (refreshed) {
        setRecordData(refreshed);
      }
      // Refresh history and counts after save
      setRefreshTrigger(prev => prev + 1);
      loadCounts();
    } finally {
      setLoading(false);
    }
  };

  const scrollToSection = (sectionId: string) => {
    setActiveTab(0); // Ensure Overview tab is active
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  useEffect(() => {
    if (layout_id) setSelectedLayoutId(layout_id);
  }, [layout_id]);

  // When LayoutSelection is hidden (showLayoutSelection false), ensure selectedLayoutId is valid;
  // if record layout_id is 0 or not in the module's layout list, set to module default so form fields load.
  useEffect(() => {
    const resolveDefaultLayout = async () => {
      if (!userToken?.access_token || !moduleName) return;
      const current = selectedLayoutId;
      const isEmptyOrZero = current == null || current === "" || String(current).trim() === "" || String(current) === "0";
      if (isEmptyOrZero) {
        const roleProfile = userToken?.role_profile || "";
        const layouts: any[] = await getLayoutList(moduleName, userToken.access_token, roleProfile);
        const list = Array.isArray(layouts) ? layouts : [];
        const defaultId = list[0]?.value ?? "";
        if (defaultId) setSelectedLayoutId(defaultId);
        return;
      }
      const roleProfile = userToken?.role_profile || "";
      const layouts: any[] = await getLayoutList(moduleName, userToken.access_token, roleProfile);
      const list = Array.isArray(layouts) ? layouts : [];
      const inList = list.some((l: any) => (l?.value ?? l) === current);
      if (!inList && list.length > 0) {
        setSelectedLayoutId(list[0]?.value ?? "");
      }
    };
    resolveDefaultLayout();
  }, [moduleName, selectedLayoutId, userToken?.access_token, userToken?.role_profile]);

  useEffect(() => {
    const fetchRecord = async () => {
      if (!userToken?.access_token || !record_name) return;
      setLoading(true);
      try {
        const details: any = await getDocument(doctype, record_name, userToken.access_token);
        setRecordData(details || {});
        if (details?.layout_id != null && details.layout_id !== "" && String(details.layout_id).trim() !== "" && details.layout_id !== 0) {
          setSelectedLayoutId(String(details.layout_id));
        } else {
          setSelectedLayoutId("");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchRecord();
  }, [doctype, record_name, userToken?.access_token]);

  const loadCounts = React.useCallback(async () => {
    if (!userToken?.access_token || !record_name || !doctype) return;

    try {
      const notesRes: any = await fetchNotesWithOwner(doctype, record_name, userToken.access_token);
      const notesArray = Array.isArray(notesRes) ? notesRes : notesRes?.data || [];
      setNotesCount(notesArray.length);
    } catch (e) {
      setNotesCount(null);
    }

    try {
      const res = await fetch("/api/list-files", {
        method: "POST",
        body: JSON.stringify({ doctype, name: record_name }),
        headers: {
          "Content-Type": "application/json",
          Authorization: `${userToken?.access_token}`,
        },
      });
      const json = await res.json();
      const files = Array.isArray(json?.data) ? json.data : [];
      setAttachmentsCount(files.length);
    } catch (e) {
      setAttachmentsCount(null);
    }

    try {
      setTimelineLoading(true);
      const res: any = await fetchTimelineComments(doctype, record_name, userToken.access_token);
      const commentsArray = Array.isArray(res) ? res : res?.data || [];
      setTimelineComments(commentsArray);
    } catch (e) {
      setTimelineComments([]);
    } finally {
      setTimelineLoading(false);
    }
  }, [doctype, record_name, userToken?.access_token]);

  useEffect(() => {
    if (!hasStageHistoryRelatedList) {
      setStageHistoryCount(null);
      return;
    }
    if (!userToken?.access_token || !record_name) return;

    let cancelled = false;
    (async () => {
      try {
        const id = String(record_name).replace(/'/g, "\\'");
        const stageHistoryRes = await fetchRawDataGridListing(
          { page: 0, pageSize: 1 },
          userToken.access_token,
          [{ doctype: "Stage Probability History", field: "name", hidden: "True" }],
          "Stage Probability History",
          [],
          "",
          "",
          [],
          "",
          ` AND parent = '${id}'`,
          "",
          "",
          "",
          "True"
        );
        if (!cancelled) {
          setStageHistoryCount(stageHistoryRes.totalCount || 0);
        }
      } catch (e) {
        if (!cancelled) setStageHistoryCount(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hasStageHistoryRelatedList, record_name, userToken?.access_token, refreshTrigger]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  useEffect(() => {
    const fetchFields = async () => {
      if (!userToken?.access_token || !selectedLayoutId || !moduleName) {
        setIsFieldsFetched(false);
        return;
      }
      setIsFieldsFetched(false);
      const roleProfile = userToken?.role_profile || "";
      const [res, layoutData]: any[] = await Promise.all([
        getFormFields(moduleName, userToken.access_token, roleProfile, selectedLayoutId),
        getLayout(moduleName, selectedLayoutId, userToken.access_token),
      ]);

      let fieldsData: any[] = [];
      if (Array.isArray(res?.fields)) fieldsData = res.fields;
      else if (Array.isArray(res)) fieldsData = res;
      else if (res?.data && Array.isArray(res.data)) fieldsData = res.data;

      // Build section→column_count map from the full layout JSON (getLayout)
      const sectionColMap: Record<string, 1 | 2> = {};
      try {
        const doc = layoutData?.doc ?? layoutData?.message ?? layoutData;
        const rawJson = doc?.layout_json ?? doc?.layout ?? doc?.layout_content;

        let layoutContentData: any = null;
        if (typeof rawJson === "string") {
          try {
            layoutContentData = JSON.parse(rawJson);
          } catch (e) {
            console.error("Failed to parse layout_json string:", e);
            // If it looks like JSON but parsing failed, try to use as is if it's already an object
            if (typeof doc === "object") layoutContentData = doc;
          }
        } else {
          layoutContentData = rawJson || doc;
        }

        // If layoutContentData is still not an object with required fields, 
        // try to find them in doc or layoutData
        if (!layoutContentData?.business_card_fields && (doc?.business_card_fields || layoutData?.business_card_fields)) {
          layoutContentData = {
            ...layoutContentData,
            business_card_enabled: layoutData?.business_card_enabled ?? doc?.business_card_enabled ?? layoutContentData?.business_card_enabled,
            business_card_fields: layoutData?.business_card_fields ?? doc?.business_card_fields ?? layoutContentData?.business_card_fields
          };
        }

        console.log("Setting layoutContent:", layoutContentData);
        setLayoutContent(layoutContentData);

        const sections: any[] = layoutContentData?.sections ?? (Array.isArray(layoutContentData) ? layoutContentData : []);
        sections.forEach((sec: any) => {
          if (sec?.title != null && sec?.column_count != null) {
            sectionColMap[sec.title] = Number(sec.column_count) === 1 ? 1 : 2;
          }
        });
      } catch (err) {
        console.error("Error processing layout data:", err);
      }
      const stampedFields = fieldsData.map((f: any) => ({
        ...f,
        section_column_count: sectionColMap[f.section] ?? 2,
      }));

      setFormFields(stampedFields as FieldConfigNew[]);
      setIsFieldsFetched(true);
    };
    fetchFields();
  }, [moduleName, selectedLayoutId, userToken?.access_token, userToken?.role_profile]);

  useEffect(() => {
    const fetchRelatedLists = async () => {
      if (!userToken?.access_token || !moduleName || !selectedLayoutId) return;
      try {
        const res = await getRelatedList(moduleName, selectedLayoutId, userToken.access_token);
        setRelatedLists(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("Error fetching related lists:", err);
      }
    };
    fetchRelatedLists();
  }, [moduleName, selectedLayoutId, userToken?.access_token]);

  useEffect(() => {
    const fetchRelatedListCounts = async () => {
      if (!userToken?.access_token || !record_name || relatedLists.length === 0) return;

      const counts: Record<string, number> = {};
      await Promise.all(
        relatedLists.map(async (rl) => {
          try {
            const whereconditon = buildRelatedListWhereCondition(
              moduleName,
              rl.main_doctype_name,
              rl.link_field_name,
              record_name
            );
            const res = await fetchRawDataGridListing(
              { page: 0, pageSize: 1 },
              userToken.access_token,
              [{ doctype: rl.main_doctype_name, field: "name", hidden: "True" }],
              rl.main_doctype_name,
              [],
              "",
              "",
              [],
              "",
              whereconditon,
              "",
              "",
              "",
              "True"
            );
            counts[rl.id || rl.name] = res.totalCount || 0;
          } catch (e) {
            console.error(`Error fetching count for related list ${rl.name}:`, e);
          }
        })
      );
      setRelatedListCounts(counts);
    };

    fetchRelatedListCounts();
  }, [relatedLists, record_name, userToken?.access_token, refreshTrigger, moduleName]);

  // Keep "reason_for_loss" hidden unless "Record Category" is "Closed Lost".
  // Detail view uses CommonForm which relies on `field.hide` (boolean) rather than showIf/hide functions.
  useEffect(() => {
    if (!Array.isArray(formFields) || formFields.length === 0) return;
    if (!recordData || typeof recordData !== "object") return;

    const isReasonForLossField = (f: any) => {
      const nameLower = String(f?.name ?? "").toLowerCase();
      const labelLower = String(f?.label ?? "").toLowerCase();
      return (
        nameLower === "reason_for_loss" ||
        nameLower.includes("reason_for_loss") ||
        labelLower.includes("reason for loss")
      );
    };

    const isRecordCategoryField = (f: any) => {
      const nameLower = String(f?.name ?? "").toLowerCase();
      const labelLower = String(f?.label ?? "").toLowerCase();
      return (
        nameLower === "record_category" ||
        nameLower.includes("record_category") ||
        labelLower.includes("record category")
      );
    };

    const reasonField = formFields.find(isReasonForLossField);
    if (!reasonField) return;

    const recordCategoryField = formFields.find(isRecordCategoryField) ?? null;

    const recordCategoryFieldName = recordCategoryField?.name ?? "record_category";

    const directValue =
      recordData?.[recordCategoryFieldName] ??
      recordData?.record_category ??
      "";

    // Fallback: attempt to find a record_category-like key in recordData.
    const keyFallback =
      Object.entries(recordData).find(([k]) => {
        const kl = String(k).toLowerCase();
        return kl.includes("record_category") || kl.includes("record category");
      })?.[1] ?? "";

    const recordCategoryValue = String(directValue || keyFallback).trim();
    const shouldShowReasonForLoss =
      recordCategoryValue.toLowerCase() === "closed lost";

    const nextHide = !shouldShowReasonForLoss;

    // Only update if needed to avoid render loops.
    if ((reasonField as any)?.hide === nextHide) return;

    setFormFields((prev) =>
      prev.map((f: any) => (isReasonForLossField(f) ? { ...f, hide: nextHide } : f))
    );
  }, [recordData, formFields]);

  const EXCLUDED_TIMELINE_COMMENT_TYPES = new Set(
    ["Links", "Status change log", "Stage History"].map((t) => t.toLowerCase())
  );

  const isTimelineCommentExcluded = (entry: TimelineCommentEntry) => {
    const ct = String(entry.comment_type ?? "")
      .trim()
      .toLowerCase();
    return ct.length > 0 && EXCLUDED_TIMELINE_COMMENT_TYPES.has(ct);
  };

  const stripContentLinks = (html: string): string => {
    if (!html) return html;
    // Remove <a href="...">text</a> tags, keeping inner text
    let result = html.replace(/<a[^>]*>([\s\S]*?)<\/a>/gi, "$1");
    // Remove <b>Links</b>, <b>Contact Numbers</b>, <b>Email IDs</b> blocks
    result = result.replace(/<b>Links<\/b>\s*:[\s\S]*?(<br\s*\/?>|$)/gi, "");
    result = result.replace(/<b>Status change log<\/b>\s*:[\s\S]*?(<br\s*\/?>|$)/gi, "");
    result = result.replace(/<b>Contact Numbers<\/b>\s*:[\s\S]*?(<br\s*\/?>|$)/gi, "");
    result = result.replace(/<b>Email IDs<\/b>\s*:[\s\S]*?(<br\s*\/?>|$)/gi, "");
    result = result.replace(/<b>Stage History<\/b>\s*:[\s\S]*?(<br\s*\/?>|$)/gi, "");
    return result;
  };

  const groupedTimeline = useMemo(() => {
    const groups: Record<string, TimelineCommentEntry[]> = {};

    timelineComments.forEach(entry => {
      if (!entry?.creation) return;
      if (isTimelineCommentExcluded(entry)) return;
      const dateOnly = new Date(entry.creation).toISOString().slice(0, 10);
      if (!groups[dateOnly]) groups[dateOnly] = [];
      groups[dateOnly].push(entry);
    });

    // Sort groups by date desc
    return Object.entries(groups)
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([date, items]) => ({
        date,
        items: items.sort(
          (a, b) => new Date(b.creation).getTime() - new Date(a.creation).getTime()
        ),
      }));
  }, [timelineComments]);

  const formatDisplayDate = (isoDate: string) => {
    const d = new Date(isoDate);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  const tabsData = useMemo(
    () => [
      {
        label: "Overview",
        Component: (
          <>
            {((loading && !Object.keys(recordData || {}).length) || !isFieldsFetched) ? (
              <DealSkeleton />
            ) : (
              <CommonForm
                fields={formFields}
                data={recordData}
                onSave={handleSave}
                onSaveBatch={handleSaveBatch}
                isEditPermission={isEditPermission ?? true}
                loading={loading}
                moduleName={moduleName}
                layoutId={selectedLayoutId}
                showLayoutSelection={false}
                layoutSelectionReadOnly={true}
                onLayoutChange={(id) => setSelectedLayoutId(id)}
                docTypeForRelated={doctype}
                recordNameForRelated={record_name}
                layoutContent={layoutContent}
                relatedLists={relatedLists}
                onRefresh={loadCounts}
                refreshTrigger={refreshTrigger}
              />
            )}
          </>
        ),
      },
      {
        label: "Timeline",
        Component: (
          <Box sx={{ pt: 7, px: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              History
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {timelineLoading ? (
              <DealSkeleton />
            ) : groupedTimeline.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No activity yet.
              </Typography>
            ) : (
              <Box>
                {groupedTimeline.map(group => (
                  <Box key={group.date} sx={{ mb: 3 }}>
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        px: 1.5,
                        py: 0.5,
                        mb: 1.5,
                        borderRadius: 1,
                        bgcolor: "var(--mui-palette-action-hover)",
                        fontSize: 12,
                        color: "text.secondary",
                      }}
                    >
                      {formatDisplayDate(group.date)}
                    </Box>
                    <Timeline
                      sx={{
                        mt: 0,
                        pl: 0,
                        "& .MuiTimelineItem-root:before": {
                          flex: 0,
                          padding: 0,
                        },
                      }}
                    >
                      {group.items.map(entry => (
                        <TimelineItem key={entry.name} sx={{ minHeight: "auto" }}>
                          <TimelineOppositeContent
                            sx={{
                              flex: 0,
                              pr: 2,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "flex-end",
                              minWidth: 100,
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontWeight: 400 }}
                            >
                              {new Date(entry.creation).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </Typography>
                          </TimelineOppositeContent>
                          <TimelineSeparator>
                            <TimelineDot
                              color="primary"
                              variant="filled"
                              sx={{
                                border: "2px solid var(--mui-palette-grey-100)",
                                bgcolor: "var(--mui-palette-grey-100)",
                                color: "var(--mui-palette-text-primary)",
                              }}
                            >
                              {entry.comment_type === "Edit" && (
                                <EditIcon fontSize="small" />
                              )}
                              {entry.comment_type === "Attachment" && (
                                <AttachFileIcon fontSize="small" />
                              )}
                            </TimelineDot>
                            <TimelineConnector
                              sx={{
                                bgcolor: "rgba(0,0,0,0.18)",
                                width: 1.5,
                              }}
                            />
                          </TimelineSeparator>
                          <TimelineContent sx={{ pb: 2 }}>
                            <Box
                              sx={{ mt: 0.5 }}
                              component="div"
                              dangerouslySetInnerHTML={{
                                __html: stripContentLinks(
                                  entry.content ||
                                  entry.subject ||
                                  entry.name ||
                                  ""
                                ),
                              }}
                            />
                            {(entry.owner_name || entry.owner) && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: "block", mt: 0.5 }}
                              >
                                by {entry.owner_name || entry.owner}
                              </Typography>
                            )}
                          </TimelineContent>
                        </TimelineItem>
                      ))}
                    </Timeline>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        ),
      },
    ],
    [
      formFields,
      isFieldsFetched,
      layout_id,
      loading,
      moduleName,
      recordData,
      selectedLayoutId,
      layoutContent,
      relatedLists,
      loadCounts,
      refreshTrigger,
      timelineLoading,
      groupedTimeline,
    ]
  );

  return (
    <Grid container spacing={4} sx={{ px: 2, alignItems: "stretch" }}>
      <Grid item xs={12} md={2.5} lg={2}>
        <Card sx={{ boxShadow: "none", minWidth: 180, height: "100%" }} className="border">
          <CardContent sx={{ height: "100%" }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Related List
            </Typography>
            <Divider sx={{ borderBottomWidth: "2px", mb: 2 }} />

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {relatedLists.map((rl) => {
                const label = rl.label || rl.name || "Related List";
                const isNotes = label.toLowerCase().includes("notes");
                const isAttachments = label.toLowerCase().includes("attachments");

                let sectionId = `related-${(rl.name || label).toLowerCase().replace(/\s+/g, "-")}`;
                if (isNotes) {
                  sectionId = "related-notes";
                } else if (isAttachments) {
                  sectionId = "related-attachments";
                } else if (label.toLowerCase().includes("deal")) {
                  sectionId = "related-deals";
                } else if (label.toLowerCase().includes("contact")) {
                  sectionId = "related-contacts";
                } else if (label.toLowerCase().includes("account")) {
                  sectionId = "related-accounts";
                } else if (rl.link_field_name === "stage_history") {
                  sectionId = "related-stage-history";
                }

                return (
                  <Box
                    key={rl.id || rl.name}
                    sx={{ display: "flex", alignItems: "center", cursor: "pointer" }}
                    onClick={() => scrollToSection(sectionId)}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                      {label}
                      {isNotes && notesCount && notesCount > 0 ? ` ${notesCount}` : ""}
                      {isAttachments && attachmentsCount && attachmentsCount > 0 ? ` ${attachmentsCount}` : ""}
                      {rl.link_field_name === "stage_history" && stageHistoryCount != null && stageHistoryCount > 0 ? ` ${stageHistoryCount}` : ""}
                      {!isNotes && !isAttachments && relatedListCounts[rl.id || rl.name] > 0 ? ` ${relatedListCounts[rl.id || rl.name]}` : ""}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={9.5} lg={10}>
        <StyledContainer
          maxWidth={false}
          sx={{
            backgroundColor: "var(--mui-palette-background-paper)",
            display: "flex",
            flexDirection: "column",
            maxHeight: "calc(100vh - 160px)",
            p: 0,
          }}
        >
          <Box
            sx={{
              position: "sticky",
              top: 0,
              zIndex: 1200,
              width: "100%",
              bgcolor: "var(--mui-palette-background-paper)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.5,
                mb: 0.5,
                pr: 8,
              }}
            >
            <Box
              sx={{
                borderColor: "divider",
                width: "fit-content",
                alignItems: "center",
                border: "2px solid var(--mui-palette-grey-100)",
                borderRadius: 5,
              }}
            >
              <Tabs
                value={activeTab}
                onChange={(_event, newValue) => setActiveTab(newValue)}
                aria-label="view-details-tabs"
                sx={{
                  minHeight: 40,
                  "& .MuiTabs-flexContainer": { gap: 1 },
                  "& .MuiTabs-indicator": { display: "none" },
                  "& .MuiTab-root": {
                    textTransform: "none",
                    minHeight: 40,
                    minWidth: 150,
                    px: 2.5,
                    py: 1.25,
                    borderRadius: 5,
                    backgroundColor: "background.paper",
                    color: "#666666",
                    fontWeight: 400,
                    fontSize: 13,
                  },
                  "& .MuiTab-root.Mui-selected": {
                    backgroundColor: "#E8E4F4",
                    borderColor: "#C4BCE0",
                    color: "#333333",
                    fontWeight: 600,
                  },
                  "& .MuiTab-root:hover": {
                    backgroundColor: "action.hover",
                    borderRadius: 5,
                  },
                  "& .MuiTab-root.Mui-selected:hover": {
                    backgroundColor: "#E8E4F4",
                    borderRadius: 5,
                  },
                }}
              >
                {tabsData.map((tab, index) => (
                  <Tab key={index} label={tab.label} />
                ))}
              </Tabs>
            </Box>
            {moduleName === "Leads" && record_name ? (
              <Button
                variant="contained"
                size="medium"
                onClick={() =>
                  router.push(`/leads/convert/${encodeURIComponent(record_name)}`)
                }
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: "10px",
                  px: 2.5,
                  boxShadow: "none",
                }}
              >
                Convert
              </Button>
            ) : null}
            </Box>
          </Box>
          <Box
            sx={{
              pt: 3,
              pr: 3,
              pb: 3,
              pl: 0,
              flex: 1,
              overflowY: "auto",
            }}
          >
            {recordDisplayName && (
              <Typography variant="h6" sx={{ mb: 2, pb: 2 }}>
                {recordDisplayName}
              </Typography>
            )}
            {tabsData[activeTab]?.Component}
          </Box>
        </StyledContainer>
      </Grid>
    </Grid>
  );
};

export default ViewDetailsForm;

