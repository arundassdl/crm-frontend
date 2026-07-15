import type { SxProps, Theme } from "@mui/material/styles";

/**
 * Canonical styling for form Select / Autocomplete / TextField inputs.
 *
 * Shared so every form field — the inline fields in CustomForm and the reusable
 * field components (PickListField, LookupField, StageProbabilityField,
 * RelatedToField, ContactLeadField, …) — renders with the same light-blue,
 * rounded, subtly-bordered appearance instead of drifting apart. Pass the
 * current theme mode so it adapts for dark mode.
 */
export const getFormFieldSx = (isDark: boolean): SxProps<Theme> => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    ...(isDark ? {} : { backgroundColor: "#EFF6FF" }),
    fontSize: "0.82rem",
    "& fieldset": { borderColor: isDark ? "#3F3F46" : "#E3ECFC", borderWidth: 1.5 },
    "&:hover fieldset": { borderColor: isDark ? "#52525B" : "#E3ECFC" },
    "&.Mui-focused fieldset": { borderColor: isDark ? "#71717A" : "#D0DEFA", borderWidth: 1.5 },
    "&.Mui-focused": { boxShadow: "none" },
    "& input": { padding: "10px 14px" },
  },
  "& .MuiInputLabel-root": { fontSize: "0.79rem", ...(isDark ? {} : { color: "#94A3B8" }) },
  "& .MuiInputLabel-root.Mui-focused": { color: isDark ? "#A1A1AA" : "#64748B" },
});

export default getFormFieldSx;
