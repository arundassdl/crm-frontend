import { Card, CardContent, Typography, Box } from "@mui/material";

interface DashboardWidgetProps {
  title?: string;
  value?: string | number;
  subValue?: string;
  icon?: React.ReactNode;
  color?: string;
  children?: React.ReactNode;
}

export default function DashboardWidget({
  title,
  value,
  subValue,
  icon,
  color = "#fff",
  children,
}: DashboardWidgetProps) {
  return (
    <Card sx={{ borderRadius: 3, boxShadow: 2,height:100 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="subtitle2" color="textSecondary">
            {title}
          </Typography>
          {icon}
        </Box>
        {value !== undefined && (
          <Typography variant="h5" fontWeight="bold">
            {value}
          </Typography>
        )}
        {subValue && (
          <Typography variant="caption" color="textSecondary">
            {subValue}
          </Typography>
        )}
        {children}
      </CardContent>
    </Card>
  );
}
