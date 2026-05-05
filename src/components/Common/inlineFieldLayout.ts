/**
 * Shared label column width for inline label:value rows (CommonForm, Editable* fields).
 * Keeps value columns vertically aligned when mixing EditableField with custom editors.
 */
export const INLINE_EDIT_LABEL_WIDTH = 220;

export const inlineEditLabelColumnSx = {
  flex: { xs: "0 0 auto" as const, sm: `0 0 ${INLINE_EDIT_LABEL_WIDTH}px` },
  width: { xs: "100%" as const, sm: INLINE_EDIT_LABEL_WIDTH },
  maxWidth: { xs: "100%" as const, sm: INLINE_EDIT_LABEL_WIDTH },
  flexShrink: 0,
  pr: { xs: 0, sm: 2 },
  pb: { xs: 0.25, sm: 0 },
  textAlign: "left" as const,
  alignSelf: "flex-start" as const,
  boxSizing: "border-box" as const,
};

export const inlineEditValueColumnSx = {
  flex: 1,
  minWidth: 0,
  textAlign: "left" as const,
};

/** Outer row container: match EditableField root. */
export const inlineEditRowRootSx = {
  flex: 1,
  minWidth: 0,
  width: "100%",
  textAlign: "left" as const,
};
