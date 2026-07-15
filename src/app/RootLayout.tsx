"use client";

// Third-party Imports
import "react-perfect-scrollbar/dist/css/styles.css";
import "@assets/iconify-icons/generated-icons.css";
import '@/app/globals.css'
import '@configs/inter-fonts'

// Type Imports
import type { ChildrenType } from "@core/types";

// Provider Imports
import StoreProvider from "@/app/StoreProvider";
import ToastProvider from "@/libs/ToastProvider";
import { ClickProvider } from "./GlobalProvider";

// Next.js & React Imports
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

// UI Imports
import { Backdrop, Box, CircularProgress } from "@mui/material";

// Full-page loading indicator that uses the themed page background
const PageLoader = () => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minBlockSize: "100vh",
      inlineSize: "100%",
      backgroundColor: "var(--bg-page)",
    }}
  >
    <CircularProgress />
  </Box>
);

// TimeAgo Imports
import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";
import ru from "javascript-time-ago/locale/ru";

TimeAgo.addDefaultLocale(en);
TimeAgo.addLocale(ru);

const RootLayout = ({ children }: ChildrenType) => {
  const direction = "ltr";
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 500); // Simulate loading delay

    return () => clearTimeout(timer); // Cleanup timeout on unmount
  }, [pathname]);

  return (
    <html id="__next" dir={direction}>
      <StoreProvider>
        <body className="flex is-full min-bs-full flex-auto flex-col">
          {/* Global Page Loader */}
          <Backdrop
            open={loading}
            sx={{
              zIndex: 9999,
              backgroundColor: "var(--bg-page)",
            }}
          >
            <CircularProgress />
          </Backdrop>


          <main>
            <Suspense fallback={<PageLoader />}>
              <ToastProvider>
                <ClickProvider>{children}</ClickProvider>
              </ToastProvider>
            </Suspense>
          </main>
        </body>
      </StoreProvider>
    </html>
  );
};

export default RootLayout;
