/** Legacy caller credentials and role hints are never authorization inputs. */
export function resolveRequestAuthorization(_request: Request): string {
  return "";
}
export function readRoleProfileFromRequest(_request: Request): string {
  return "";
}
export function readUsernameFromRequest(_request: Request): string {
  return "";
}
