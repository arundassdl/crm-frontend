import type { Metadata } from "next";
import themeConfig from "@configs/themeConfig";
import RootLayout from "./RootLayout"; // Import client layout

export const metadata: Metadata = {
  title: themeConfig.templateName,
  description: themeConfig.templateDesc,
};

export const dynamic = "force-dynamic";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { parseSession, SESSION_COOKIE_NAME } from "@/lib/session";
import { csrfToken } from "@/lib/security";
import { resolveTenant } from "@/lib/tenant-resolver";
import { getOneSigninUrl } from "@/lib/one";
import EvoqBoundary from "@/components/EvoqBoundary";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const raw = cookies().get(SESSION_COOKIE_NAME)?.value;
  const session = parseSession(raw);
  if (!session) redirect(getOneSigninUrl(headers().get("x-evoq-path")));
  const path = headers().get("x-evoq-path") || "/";
  const org = path.match(/^\/org\/([^/]+)/)?.[1];
  if (org && org !== session.organization) redirect("/api/auth/session-ended");
  try {
    await resolveTenant(
      session.userId,
      session.organization,
      "crm",
      session.createdAt,
    );
  } catch {
    redirect("/api/auth/session-ended");
  }
  return (
    <RootLayout>
      <EvoqBoundary
        session={{ userId: session.userId, organization: session.organization }}
        csrf={csrfToken(raw!)}
      >
        {children}
      </EvoqBoundary>
    </RootLayout>
  );
}
