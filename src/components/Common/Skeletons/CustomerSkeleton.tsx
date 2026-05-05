import React from "react";
import {
  Card,
  CardContent,
  Grid,
  Typography,
  Skeleton,
  Avatar,
  Box,
} from "@mui/material";

const CustomerSkeleton = () => {
  return (
    <Box sx={{}}>
      <Card sx={{ boxShadow: "none", p: 8 }} >
        <Grid
          container
          spacing={5}
          className="px-5"
          style={{ paddingLeft: "0px" }}
        >
          {/* Left Section (Avatar + Details) */}
          <Grid item xs={12} sm={3} md={3}>
            <Card sx={{
                textAlign: "center",
                padding: "20px 10px",
                border: "2px solid var(--mui-palette-primary-main)",
                width:"100%"
              }}>
              <CardContent className="text-center" sx={{ height: 200 }}>
                <Skeleton
                  variant="circular"
                  width={120}
                  height={120}
                  sx={{ display: "flex", justifyContent: "center", mx: "auto" }}
                />
              </CardContent>
            </Card>
            <Typography variant="h6" className="mt-3">
              <Skeleton width="60%" />
            </Typography>

            {/* Details Section */}
            <Typography variant="body2" color="textSecondary">
              <Skeleton width="80%" />
            </Typography>
            <Typography variant="body2">
              <Skeleton width="70%" />
            </Typography>
            <Typography variant="body2" color="success">
              <Skeleton width="40%" />
            </Typography>
          </Grid>

          {/* Right Section (Basic Info + Overview) */}
          <Grid item xs={12} sm={9} >
          <Grid container spacing={2} direction="row" rowSpacing={2} sx={{ borderLeft: '1px solid #e5e5e5',borderRadius: 0,  height: '100%',paddingLeft:10 }}>

              {/* Basic Info */}
              <Grid item xs={12}>
                <Skeleton animation="wave" />
                <Skeleton animation="wave" />
                <Skeleton animation="wave" />
                <Skeleton animation="wave" />
                <Skeleton animation="wave" />
                <Skeleton animation="wave" />
                <Skeleton animation="wave" />
              </Grid>

              {/* Contact Overview */}
              <Grid item xs={12}>
                <Skeleton
                  variant="rectangular"
                  animation="wave"
                  width="100%"
                  height={5}
                />
                <Skeleton
                  variant="rectangular"
                  animation="wave"
                  width="100%"
                  height={5}
                />
                <Skeleton
                  variant="rectangular"
                  animation="wave"
                  width="100%"
                  height={5}
                />
                <Skeleton
                  variant="rectangular"
                  animation="wave"
                  width="100%"
                  height={5}
                />
              </Grid>
              <Grid item xs={12}>
                <Skeleton
                  variant="rectangular"
                  animation="wave"
                  width="100%"
                  height={5}
                />
                <Skeleton
                  variant="rectangular"
                  animation="wave"
                  width="100%"
                  height={5}
                />
                <Skeleton
                  variant="rectangular"
                  animation="wave"
                  width="100%"
                  height={5}
                />
                <Skeleton
                  variant="rectangular"
                  animation="wave"
                  width="100%"
                  height={5}
                />
              </Grid>
              <Grid item xs={12}>
                <Skeleton
                  variant="rectangular"
                  animation="wave"
                  width="100%"
                  height={5}
                />
                <Skeleton
                  variant="rectangular"
                  animation="wave"
                  width="100%"
                  height={5}
                />
                <Skeleton
                  variant="rectangular"
                  animation="wave"
                  width="100%"
                  height={5}
                />
                <Skeleton
                  variant="rectangular"
                  animation="wave"
                  width="100%"
                  height={5}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Card>
    </Box>
  );
};

export default CustomerSkeleton;
