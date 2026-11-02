// components/WidgetCard.tsx
import { Card, CardContent, Typography, Box, Skeleton } from "@mui/material";

interface WidgetCardProps {
  title: string;
  value?: string | number;
  icon: React.ReactNode;
  chart?: React.ReactNode;
  /** Show a placeholder bar instead of a value (R57: never a sample number). */
  loading?: boolean;
  /** Short line under the value, e.g. "1 won deal". */
  caption?: React.ReactNode;
  /** Message shown when the figure could not be loaded. */
  error?: string;
  testId?: string;
}

export default function WidgetCard({ title, value, icon, chart, loading, caption, error, testId }: WidgetCardProps) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3, height: "100%" }} data-testid={testId}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1}>
          <Box>{icon}</Box>
          <Typography variant="subtitle2">{title}</Typography>
        </Box>
        {loading ? (
          <Skeleton variant="text" width="60%" sx={{ fontSize: "1.5rem", mt: 1 }} data-testid={testId ? `${testId}-loading` : undefined} />
        ) : error ? (
          <>
            <Typography variant="h5" fontWeight={700} mt={1} color="text.disabled" data-testid={testId ? `${testId}-value` : undefined}>
              —
            </Typography>
            <Typography variant="caption" color="error" data-testid={testId ? `${testId}-error` : undefined}>
              {error}
            </Typography>
          </>
        ) : (
          <>
            <Typography variant="h5" fontWeight={700} mt={1} data-testid={testId ? `${testId}-value` : undefined}>
              {value}
            </Typography>
            {caption && (
              <Typography variant="caption" color="text.secondary" component="div">
                {caption}
              </Typography>
            )}
          </>
        )}
        {chart && <Box mt={1}>{chart}</Box>}
      </CardContent>
    </Card>
  );
}
