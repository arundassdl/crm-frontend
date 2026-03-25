"use client";

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

const Logo = ({
  color,
  from,
}: {
  color?: CSSProperties["color"];
  from?: string;
}) => {
  const [companyData, setCompanyData] = useState<any>(
    localStorage.getItem("companyData") &&
      localStorage.getItem("companyData") != "undefined"
      ? JSON.parse(localStorage.getItem("companyData") || "[]")
      : []
  );
  const { isBreakpointReached, isToggled, toggleVerticalNav } =
    useVerticalNav();
  const [userToken, setUserToken] = useState<any>(() => {
    const initialValue = JSON.parse(
      localStorage.getItem("AccessTokenData") || "{}"
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
        <Box display="flex" alignItems="center" gap={1} minHeight={24}>
        <SDLLogo
          width={isBreakpointReached ? 65 : 68}
          height={isBreakpointReached ? 65 : 68}
        />
        <LogoText
          color={color}
          style={{
            fontFamily: themeConfig.fontFamily,
            fontSize: isBreakpointReached ? 20 : 22,
            marginInlineStart: "5px !important",
            letterSpacing: "0.005px",
          }}
        >
          {themeConfig.templateName}
        </LogoText>
      </Box>
      ) : (
        <>
          {companyData?.company_logo != undefined &&
          companyData?.company_logo != "" ? (
            // <Image src={companyData?.company_logo} alt="logo" layout="intrinsic" width={200} height={50}/>
            <div
              style={{
                maxWidth: "185px",
                maxHeight: "40px",
                overflow: "hidden",
              }}
            >
              <img
                src={companyData?.company_logo}
                alt={companyData?.company_name}
                style={{
                  width: "100%",
                  height: "40px",
                  objectFit: "contain", // Ensures the aspect ratio is maintained
                }}
              />
            </div>
          ) : (
            //   <Image
            //   src={companyData?.company_logo}
            //   alt={companyData?.company_name}
            //   width={185} // Restrict width to 185px
            //   height={40} // Restrict height to 40px
            //   style={{ objectFit: 'contain' }} // Ensures the aspect ratio is preserved
            // />
            // <Image src="/assets/images/logo.png" alt="logo" width={200} height={-1}/>
            <Box display="flex" alignItems="center" gap={1} minHeight={24}>
              <SDLLogo
                width={isBreakpointReached ? 65 : 68}
                height={isBreakpointReached ? 65 : 68}
              />
              <LogoText
                color={color}
                style={{
                  fontFamily: themeConfig.fontFamily,
                  fontSize: isBreakpointReached ? 20 : 22,
                  marginInlineStart: "5px !important",
                  letterSpacing: "0.005px",
                }}
              >
                {themeConfig.templateName}
              </LogoText>
            </Box>
          )}
        </>
      )}

      {/* <MaterioLogo className='text-[22px] text-primary'/>                
      <LogoText color={color}>{themeConfig.templateName}</LogoText> */}
    </div>
  );
};

export default Logo;
