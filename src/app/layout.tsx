import type { Metadata } from "next";
import themeConfig from "@configs/themeConfig";
import RootLayout from "./RootLayout"; // Import client layout

export const metadata: Metadata = {
  title: themeConfig.templateName,
  description: themeConfig.templateDesc,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <RootLayout>{children}</RootLayout>;
}
