/** EVOQ credentials never enter browser state. Compatibility exports carry no token. */
export const ACCESS_TOKEN_DATA_KEY = "AccessTokenData";
export function readAccessTokenDataJsonString(): string | null {
  return null;
}
export function readAccessTokenDataRaw(): string {
  return "{}";
}
export function readAccessTokenDataParsed<T = Record<string, unknown>>(): T {
  return {} as T;
}
export function readAccessTokenString(): undefined {
  return undefined;
}
export function readRoleProfileFromStorage(): string {
  return "";
}
export function persistAccessTokenData(_data: unknown): never {
  throw new Error("Browser credential persistence is disabled; use EVOQ SSO.");
}
export function clearAccessTokenDataStorage(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_DATA_KEY);
  document.cookie = `${ACCESS_TOKEN_DATA_KEY}=; Max-Age=0; Path=/; Secure; SameSite=Lax`;
}
