"use client";

// Third-party Imports
import "react-perfect-scrollbar/dist/css/styles.css";
import "@assets/iconify-icons/generated-icons.css";
import '@/app/globals.css'

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
import { Backdrop, CircularProgress } from "@mui/material";

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
          {/* <Backdrop
              open={loading}
              sx={{
                color: "#000", // Set text color to black
                zIndex: 9999,
                backgroundColor: 'var(--mui-palette-secondary-lightOpacity) !important', // Light white overlay
              }}
            >
              <CircularProgress color="inherit" />
            </Backdrop> */}


          <main>
            <Suspense fallback={<CircularProgress sx={{ display: "block", mx: "auto", mt: 5 }} />}>
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
