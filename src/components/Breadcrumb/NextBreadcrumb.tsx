"use client";
// React Imports
import React, { ReactNode } from "react";
import { usePathname } from "next/navigation";

// MUI Imports
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@/components/Link";
import Typography from "@mui/material/Typography";

// Add an Icon as Separator (Example: Chevron)
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

type TBreadCrumbProps = {
  homeElement: ReactNode;
  container?: string;
  listClasses?: string;
  activeClasses?: string;
  capitalizeLinks?: boolean;
  separatorIcon?: ReactNode; // Added separator prop
};

const NextBreadcrumb = ({
  homeElement,
  listClasses,
  activeClasses,
  capitalizeLinks,
  container,
  separatorIcon = <ChevronRightIcon />,
}: TBreadCrumbProps) => {
  const paths = usePathname();
  const pathNames = paths.split("/").filter((path) => path);
  const pathNames2 = paths.split("/").filter((path) => path);
  const indicesToRemove = ["detail", "details", "edit"];

  // Remove specific segments from breadcrumb
  if (pathNames?.length > 1) {
    indicesToRemove.forEach((item) => {
      const index = pathNames.indexOf(item);
      if (index > -1) delete pathNames[index];
    });   
  }
  function capitalizeItemLink(itemLink: string) {
    const decoded = decodeURIComponent(itemLink).replace(/%20|-/g, " ");
    return decoded
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  return (
    <Breadcrumbs
      aria-label="breadcrumb"
      className={container}
      separator={separatorIcon}
      sx={{
        paddingLeft:
          pathNames?.length > 1
            ? pathNames.includes("details")
              ? "0 !important"
              : "0"
            : "0",
      }}
    >      
      <Typography
        color="primary"
        className="font-bold"
        component={Link}
        href="/"
      >
        <i className="ri-home-4-line"></i>
        {/* {homeElement} */}
      </Typography>
      {pathNames.map((link, index) => {
        const sub_url = pathNames2.includes("/users") ? "/user" : "";
        let href =
          `${sub_url}/${pathNames.slice(0, index + 1).join("/")}`.replace(
            /\/\//g,
            "/"
          );
          if (pathNames2.includes('user')) {
            console.log("user here",pathNames2);
            console.log("href here", href);
            if(href=="/user"){
              href = href.replace('/user', '#');
            }
          }
      
        const itemClasses =
          paths === href ? `${listClasses} ${activeClasses}` : listClasses;
        const itemLink = capitalizeLinks
          ? link[0].toUpperCase() + link.slice(1)
          : link;
        const isLast = index === pathNames.length - 1;

        return isLast ? (
          <Typography key={index} color="primary">
            {/* {itemLink.charAt(0).toUpperCase() + decodeURIComponent(itemLink).slice(1).replace("-", " ").replace("%20", " ")} */}
            {capitalizeItemLink(itemLink)}
          </Typography>
        ) : (
          <Link
            key={index}
            href={href}
            className={`font-bold ${itemClasses}`}
            color="inherit"
          >
            {/* {itemLink.charAt(0).toUpperCase() + decodeURIComponent(itemLink).slice(1).replace("-", " ").replace("%20", " ")} */}
            {capitalizeItemLink(itemLink)}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
};

export default NextBreadcrumb;
