// components/WidgetCard.tsx
import { Card, CardContent, Typography, Box } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

interface WidgetCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  chart?: React.ReactNode;
}

export default function WidgetCard({ title, value, icon, chart }: WidgetCardProps) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1}>
          <Box>{icon}</Box>
          <Typography variant="subtitle2">{title}</Typography>
        </Box>
        <Typography variant="h5" fontWeight={700} mt={1}>
          {value}
        </Typography>
        {chart && <Box mt={1}>{chart}</Box>}
      </CardContent>
    </Card>
  );
}
