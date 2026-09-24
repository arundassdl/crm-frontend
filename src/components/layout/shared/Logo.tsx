"use client";
import { readAccessTokenDataRaw } from '@/utils/accessTokenDataStorage'

// React Imports
import { useEffect, useState, type CSSProperties } from "react";

// Third-party Imports
import styled from "@emotion/styled";

// Component Imports
import MaterioLogo from "@core/svg/Logo";

// Config Imports
import themeConfig from "@configs/themeConfig";
import SDLLogo from "@/@core/svg/SDLLogo";
import useVerticalNav from "@/@menu/hooks/useVerticalNav";
// import { companyProfilePage } from "@/services/api/my-company/my-comapny-api";
import { Box } from "@mui/material";
import { getCompanyDataParsed } from "@/utils/companyDataStorage";

type LogoTextProps = {
  color?: CSSProperties["color"];
};

const LogoText = styled.span<LogoTextProps>`
  color: ${({ color }) => color ?? "var(--mui-palette-text-primary)"};
  font-family: inherit;
  font-size: 1.25rem;
  line-height: 1.2;
  font-weight: 600;
  letter-spacing: 0.15px;
  // text-transform: uppercase;
  margin-inline-start: 5px;
`;

/**
 * Theme-aware EVOQ CRM logo. Renders the icon + "EVOQ CRM" text and swaps
 * between the black-text (light) and white-text (dark) variants purely via
 * CSS so it stays legible in light, dark and system colour schemes without
 * any client-side JS/hydration flicker.
 */
const ThemedLogo = styled.img`
  height: 28px;
  width: auto;
  display: block;
  content: url("/logo.png");

  [data-mui-color-scheme="dark"] &,
  html.dark & {
    content: url("/logo-dark.png");
  }
`;

const Logo = ({
  color,
  from,
  compact = false,
}: {
  color?: CSSProperties["color"];
  from?: string;
  compact?: boolean;
}) => {
  const [companyData, setCompanyData] = useState<any>(() =>
    getCompanyDataParsed()
  );
  const { isBreakpointReached, isToggled, toggleVerticalNav } =
    useVerticalNav();
  const [userToken, setUserToken] = useState<any>(() => {
    const initialValue = JSON.parse(
      readAccessTokenDataRaw()
    );
    return initialValue || "";
  });

  useEffect(() => {
    // localStorage.removeItem("companyData");

    // if (typeof window !== 'undefined') {
    // if (localStorage.getItem('companyData') != 'undefined') {
    // alert(localStorage.getItem('userData'))

    // }
    // }

    if (companyData == null || companyData == "") {
      const filterModel = {
        limit: 10,
      };
      // fetchFilteredData(filterModel);
    }

    setCompanyData(companyData);
    console.log("companyDatacompanyData", companyData);
  }, [companyData]);

  // const fetchFilteredData = async (filterModel) => {
  //   try {
  //     const company: any = await companyProfilePage(
  //       filterModel,
  //       userToken?.access_token
  //     );
  //     console.log("company=========>2", JSON.stringify(company?.detail));
  //     setCompanyData(JSON.stringify(company?.detail));
  //     localStorage.setItem("userCompanyData", JSON.stringify(company?.detail));
  //     console.log(
  //       "localStorage.getItem('companyData')11",
  //       localStorage.getItem("userCompanyData")
  //     );
  //   } catch (error) {
  //     console.error("Failed to fetch data:", error);
  //   } finally {
  //   }
  // };

  return (
    <div className="flex items-center min-bs-[24px]">
      {from == "login" ? (
        <ThemedLogo alt="EVOQ CRM" />
      ) : compact ? (
        <Box
          component='img'
          src='/images/logo/crmicon.png'
          alt='EVOQ CRM'
          sx={{ width: 45, height: 45, objectFit: 'contain', display: 'block', flexShrink: 0 }}
        />
      ) : (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            minWidth: 0,
            height: 45
          }}
        >
          <Box
            component='img'
            src='/images/logo/crmicon.png'
            alt=''
            sx={{ width: 45, height: 45, objectFit: 'contain', display: 'block', flexShrink: 0 }}
          />
          {companyData?.company_logo != undefined && companyData?.company_logo != '' ? (
            <Box
              component='img'
              src='/images/logo/logoicon.png'
              alt={companyData?.company_name || 'EVOQ CRM'}
              sx={{ height: 28, width: 'auto', maxWidth: 140, objectFit: 'contain', display: 'block' }}
            />
          ) : (
            <>
              <Box
                component='img'
                src='/images/logo/evoqicon.png'
                alt='EVOQ'
                sx={{
                  height: 35,
                  width: 'auto',
                  objectFit: 'contain',
                  display: 'block',
                  flexShrink: 1,
                  minWidth: 0,
                  '[data-mui-color-scheme="dark"] &': {
                    filter: 'brightness(0) invert(1)'
                  }
                }}
              />
              <Box
                component='span'
                sx={{
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  lineHeight: 1,
                  letterSpacing: '0.02em',
                  color: 'var(--nav-chrome-text-black)',
                  whiteSpace: 'nowrap',
                  pt: '6px'
                }}
              >
                CRM
              </Box>
            </>
          )}
        </Box>
      )}
    </div>
  );
};

export default Logo;
