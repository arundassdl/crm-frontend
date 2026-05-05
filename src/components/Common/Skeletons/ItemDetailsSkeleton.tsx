// components/ItemDetailsSkeleton.tsx

import { Box, Grid, Skeleton, Typography, Paper } from '@mui/material';

const ItemDetailsSkeleton = () => {
  return (
    <Box p={2}>
      <Typography variant="h6" gutterBottom>
        <Skeleton width={250} />
      </Typography>

      <Grid container spacing={2}>
        {/* Primary Details */}
        <Grid item xs={12} md={8}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1">
              <Skeleton width={150} />
            </Typography>
            <Grid container spacing={2}>
              {[...Array(6)].map((_, i) => (
                <Grid item xs={6} md={4} key={i}>
                  <Skeleton height={30} />
                  <Skeleton width="80%" />
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* Purchase Information */}
          <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
            <Typography variant="subtitle1">
              <Skeleton width={150} />
            </Typography>
            <Grid container spacing={2}>
              {[...Array(2)].map((_, i) => (
                <Grid item xs={6} key={i}>
                  <Skeleton height={30} />
                  <Skeleton width="70%" />
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* Sales Information */}
          <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
            <Typography variant="subtitle1">
              <Skeleton width={150} />
            </Typography>
            <Grid container spacing={2}>
              {[...Array(2)].map((_, i) => (
                <Grid item xs={6} key={i}>
                  <Skeleton height={30} />
                  <Skeleton width="70%" />
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Image + Stock Info */}
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 2, mb: 2, textAlign: 'center' }}>
            <Skeleton variant="rectangular" width={150} height={150} sx={{ mx: 'auto', mb: 2 }} />
            <Skeleton width="60%" />
            <Skeleton width="80%" />
          </Paper>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1">
              <Skeleton width={150} />
            </Typography>
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} width="80%" height={25} />
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ItemDetailsSkeleton;
