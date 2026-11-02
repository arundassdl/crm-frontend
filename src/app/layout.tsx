import type { Metadata } from "next";
import themeConfig from "@configs/themeConfig";
import RootLayout from "./RootLayout"; // Import client layout

export const metadata: Metadata = {
  title: themeConfig.templateName,
  description: themeConfig.templateDesc,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/images/logo/evoq-mark.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/images/logo/evoq-apple-touch.png",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <RootLayout>{children}</RootLayout>;
}
