"use client";
import { ReactNode } from "react";
import { CrmSessionProvider, CrmSessionInfo } from "./CrmSessionContext";
import { crmNavigation } from "@/lib/navigation";
import EmbedBridge from "./EmbedBridge";
import {
  installPageOrganizationBinding,
  setPageOrganization,
  setPageCsrf,
} from "@/lib/embed-client";
// Initialize the boundary before child effects issue any requests.
export default function EvoqBoundary({
  session,
  csrf,
  children,
}: {
  session: CrmSessionInfo;
  csrf: string;
  children: ReactNode;
}) {
  if (typeof window !== "undefined") {
    const generation = `${session.userId}:${session.organization}:${csrf.slice(0, 12)}`;
    if (sessionStorage.getItem("evoq-context") !== generation) {
      for (const key of [
        "AccessTokenData",
        "userProfileData",
        "menuListData",
        "userpermission",
        "userCompanyData",
        "role_profile",
      ]) {
        localStorage.removeItem(key);
        document.cookie = `${key}=; Max-Age=0; Path=/; Secure; SameSite=Lax`;
      }
      sessionStorage.setItem("evoq-context", generation);
    }
    localStorage.setItem("menuListData", JSON.stringify(crmNavigation));
    setPageOrganization(session.organization);
    setPageCsrf(csrf);
    installPageOrganizationBinding();
  }
  return (
    <CrmSessionProvider value={session}>
      <EmbedBridge />
      {children}
    </CrmSessionProvider>
  );
}
