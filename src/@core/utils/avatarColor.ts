/**
 * Theme-aligned avatar background palette.
 *
 * Generated user/record avatars (initials bubbles) previously used a rainbow of
 * hues (purple / green / amber / pink) duplicated across several components,
 * which clashed with the application's blue theme. This single source keeps them
 * on-brand and consistent across every screen. Values are shades of the app's
 * primary blue so avatars still vary per name while staying on-theme.
 */
export const AVATAR_PALETTE = ["#1D4ED8", "#2563EB", "#3B82F6", "#1E40AF", "#0C2472"];

/** Deterministically map a name/string to a theme-aligned avatar background color. */
export const getAvatarColor = (name?: string | null): string => {
  const key = String(name ?? "").trim();
  if (!key) return AVATAR_PALETTE[0];
  const sum = key.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_PALETTE[sum % AVATAR_PALETTE.length];
};

/**
 * Vibrant multi-color palette for *entity/record* avatars (e.g. account/company
 * initial tiles) where the reference design intentionally uses varied hues rather
 * than the theme blue. Keep this separate from {@link getAvatarColor} (used for
 * user/owner avatars, which stay on-brand blue).
 */
export const VIBRANT_AVATAR_PALETTE = ["#7C3AED", "#10B981", "#F59E0B", "#DB2777"];

/** Deterministically map a name/string to a vibrant entity-avatar color. */
export const getVibrantAvatarColor = (name?: string | null): string => {
  const key = String(name ?? "").trim();
  if (!key) return VIBRANT_AVATAR_PALETTE[0];
  const sum = key.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return VIBRANT_AVATAR_PALETTE[sum % VIBRANT_AVATAR_PALETTE.length];
};

export default getAvatarColor;
