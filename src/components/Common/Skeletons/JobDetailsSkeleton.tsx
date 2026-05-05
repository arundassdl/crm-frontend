// components/JobDetailsSkeleton.tsx

import { Box, Grid, Skeleton, Typography, Paper } from '@mui/material';

const JobDetailsSkeleton = () => {
  return (
    <Box p={2}>
      <Typography variant="h6" gutterBottom>
        <Skeleton width={250} />
      </Typography>

      <Grid container spacing={2}>
        {/* Job details */}
        <Grid item xs={24} sm={12}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1">
              <Skeleton width={150} />
            </Typography>
            <Grid container spacing={6}>
              {[...Array(8)].map((_, i) => (
                <Grid item xs={12} md={6} key={i}>
                  <Skeleton height={30} />
                  <Skeleton width="70%" />
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* Product information */}
          <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
            <Typography variant="subtitle1">
              <Skeleton width={150} />
            </Typography>
            <Grid container spacing={6}>
              {[...Array(2)].map((_, i) => (
                <Grid item xs={12} md={6}  key={i}>
                  <Skeleton height={30} />
                  <Skeleton width="70%" />
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* Service appointments */}

          <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
            <Typography variant="subtitle1">
              <Skeleton width={150} />
            </Typography>
            <Grid container spacing={2}>
              {[...Array(4)].map((_, i) => (
                <Grid item xs={6} key={i}>
                  <Skeleton height={30} />
                  <Skeleton width="70%" />
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        
      </Grid>
    </Box>
  );
};

export default JobDetailsSkeleton;
