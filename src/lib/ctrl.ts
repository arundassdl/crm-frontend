export const DEFAULT_CTRL_URL = "https://ctrl.evoq.app";
export function getCtrlUrl(): string {
  const url = new URL(process.env.NEXT_PUBLIC_CTRL_URL || DEFAULT_CTRL_URL);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error("Invalid CTRL public origin");
  return url.origin + "/";
}
