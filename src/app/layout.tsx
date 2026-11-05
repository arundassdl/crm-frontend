import type { Metadata, Viewport } from "next";
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

// newdocs/80 §12.12: on Android the on-screen keyboard resizes the page, so forms keep Submit and
// Cancel above it (iOS overlays the keyboard regardless). Next's defaults are kept.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <RootLayout>{children}</RootLayout>;
}
