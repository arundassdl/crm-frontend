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
import Image from "next/image";
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
}: {
  color?: CSSProperties["color"];
  from?: string;
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
      ) : (
        <>
          {companyData?.company_logo != undefined &&
          companyData?.company_logo != "" ? (
            <div style={{ maxWidth: "185px", maxHeight: "40px", overflow: "hidden" }}>
              <img
                src={companyData?.company_logo}
                alt={companyData?.company_name}
                style={{ width: "100%", height: "40px", objectFit: "contain" }}
              />
            </div>
          ) : (
            <ThemedLogo alt="EVOQ CRM" />
          )}
        </>
      )}
    </div>
  );
};

export default Logo;
