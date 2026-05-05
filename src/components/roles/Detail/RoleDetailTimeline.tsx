"use client";
import { readAccessTokenDataParsed } from '@/utils/accessTokenDataStorage'

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Card, CardContent, Divider, Typography } from "@mui/material";
import Timeline from "@mui/lab/Timeline";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineDot from "@mui/lab/TimelineDot";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineOppositeContent from "@mui/lab/TimelineOppositeContent";
import EditIcon from "@mui/icons-material/Edit";
import AttachFileIcon from "@mui/icons-material/AttachFile";

import DealSkeleton from "@/components/Common/Skeletons/DealSkeleton";
import { fetchTimelineComments } from "@/services/api/common-erpnext-api/create-update-custom-api";

const SDL_ROLE_DOCTYPE = "SDL Role";

interface TimelineCommentEntry {
  name: string;
  creation: string;
  owner?: string;
  owner_name?: string;
  content?: string;
  subject?: string;
  comment_type?: string;
}

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
  let result = html.replace(/<a[^>]*>([\s\S]*?)<\/a>/gi, "$1");
  result = result.replace(/<b>Links<\/b>\s*:[\s\S]*?(<br\s*\/?>|$)/gi, "");
  result = result.replace(
    /<b>Status change log<\/b>\s*:[\s\S]*?(<br\s*\/?>|$)/gi,
    ""
  );
  result = result.replace(
    /<b>Contact Numbers<\/b>\s*:[\s\S]*?(<br\s*\/?>|$)/gi,
    ""
  );
  result = result.replace(
    /<b>Email IDs<\/b>\s*:[\s\S]*?(<br\s*\/?>|$)/gi,
    ""
  );
  result = result.replace(
    /<b>Stage History<\/b>\s*:[\s\S]*?(<br\s*\/?>|$)/gi,
    ""
  );
  return result;
};

export type RoleDetailTimelineProps = {
  /** Frappe document name for SDL Role (Comment.reference_name) */
  recordName?: string;
  /** Load comments only when the Timeline tab is visible */
  active: boolean;
};

const RoleDetailTimeline: React.FC<RoleDetailTimelineProps> = ({
  recordName,
  active,
}) => {
  const [userToken] = useState<any>(() => {
    try {
      return readAccessTokenDataParsed() || {};
    } catch {
      return {};
    }
  });

  const [timelineComments, setTimelineComments] = useState<
    TimelineCommentEntry[]
  >([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  const loadTimeline = useCallback(async () => {
    if (!recordName || !userToken?.access_token) {
      setTimelineComments([]);
      return;
    }
    try {
      setTimelineLoading(true);
      const res: any = await fetchTimelineComments(
        SDL_ROLE_DOCTYPE,
        recordName,
        userToken.access_token
      );
      const commentsArray = Array.isArray(res) ? res : res?.data || [];
      setTimelineComments(commentsArray);
    } catch {
      setTimelineComments([]);
    } finally {
      setTimelineLoading(false);
    }
  }, [recordName, userToken?.access_token]);

  useEffect(() => {
    if (!active || !recordName) return;
    loadTimeline();
  }, [active, recordName, loadTimeline]);

  const groupedTimeline = useMemo(() => {
    const groups: Record<string, TimelineCommentEntry[]> = {};

    timelineComments.forEach((entry) => {
      if (!entry?.creation) return;
      if (isTimelineCommentExcluded(entry)) return;
      const dateOnly = new Date(entry.creation).toISOString().slice(0, 10);
      if (!groups[dateOnly]) groups[dateOnly] = [];
      groups[dateOnly].push(entry);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([date, items]) => ({
        date,
        items: items.sort(
          (a, b) =>
            new Date(b.creation).getTime() - new Date(a.creation).getTime()
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

  if (!recordName) {
    return (
      <Box sx={{ pt: 3, px: 2 }}>
        <Card
          sx={{ mb: 4, boxShadow: "0px 0px 10px 0px rgba(0, 0, 0, 0.1)" }}
          className="border"
        >
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              History
            </Typography>
            <Divider sx={{ borderBottomWidth: "2px", mb: 3 }} />
            <Typography variant="body2" color="text.secondary">
              Save the role or open a valid role to view history.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ pt: 3, px: 2 }}>
      <Card
        sx={{ mb: 4, boxShadow: "0px 0px 10px 0px rgba(0, 0, 0, 0.1)" }}
        className="border"
      >
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            History
          </Typography>
          <Divider sx={{ borderBottomWidth: "2px", mb: 3 }} />

          {timelineLoading ? (
        <DealSkeleton />
      ) : groupedTimeline.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No activity yet.
        </Typography>
      ) : (
        <Box>
          {groupedTimeline.map((group) => (
            <Box key={group.date} sx={{ mb: 2 }}>
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  px: 1.25,
                  py: 0.25,
                  mb: 1,
                  borderRadius: 0.75,
                  bgcolor: (theme) =>
                    theme.palette.mode === "light"
                      ? "grey.100"
                      : "rgba(255,255,255,0.06)",
                  fontSize: 12,
                  lineHeight: 1.8,
                  color: "text.secondary",
                }}
              >
                {formatDisplayDate(group.date)}
              </Box>
              <Timeline
                sx={{
                  m: 0,
                  p: 0,
                  "& .MuiTimelineItem-root:before": {
                    flex: 0,
                    padding: 0,
                  },
                }}
              >
                {group.items.map((entry) => (
                  <TimelineItem key={entry.name} sx={{ minHeight: "auto" }}>
                    <TimelineOppositeContent
                      sx={{
                        flex: 0,
                        pr: 2,
                        pt: 0.75,
                        minWidth: 96,
                        textAlign: "right",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          fontSize: 12,
                          fontWeight: 400,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {new Date(entry.creation).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Typography>
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      <TimelineDot
                        sx={{
                          width: 28,
                          height: 28,
                          m: 0,
                          p: 0,
                          border: "1px solid",
                          borderColor: "divider",
                          bgcolor: "background.paper",
                          color: "text.primary",
                          boxShadow: "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          "& svg": { fontSize: 16 },
                        }}
                      >
                        {entry.comment_type === "Attachment" ? (
                          <AttachFileIcon fontSize="inherit" />
                        ) : (
                          <EditIcon fontSize="inherit" />
                        )}
                      </TimelineDot>
                      <TimelineConnector
                        sx={{
                          bgcolor: "divider",
                          width: "1px",
                          my: 0.25,
                        }}
                      />
                    </TimelineSeparator>
                    <TimelineContent sx={{ pt: 0.5, pb: 2 }}>
                      <Box
                        component="div"
                        sx={{
                          typography: "body2",
                          color: "text.primary",
                          lineHeight: 1.6,
                          "& b, & strong": { fontWeight: 600 },
                          "& p": { m: 0 },
                        }}
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
                          sx={{
                            display: "block",
                            mt: 0.75,
                            color: "text.secondary",
                            fontSize: 12,
                          }}
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
        </CardContent>
      </Card>
    </Box>
  );
};

export default RoleDetailTimeline;
