// app/dashboard/page.tsx
"use client";

import { Grid } from "@mui/material";
import WidgetCard from "@/components/Dashboard/Widgets/WidgetCard";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import HandshakeIcon from "@mui/icons-material/Handshake";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PortraitIcon from '@mui/icons-material/Portrait';


export default function DashboardPage() {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={3}>
        <WidgetCard
          title="Contacts"
          value="15,432"
          icon={<PortraitIcon color="primary" />}
        />
      </Grid>
      <Grid item xs={12} md={3}>
        <WidgetCard
          title="Leads"
          value="12,983"
          icon={<PeopleAltIcon color="success" />}
        />
      </Grid>
      <Grid item xs={12} md={3}>
        <WidgetCard
          title="Deals"
          value="1,283"
          icon={<HandshakeIcon color="info" />}
        />
      </Grid>
      <Grid item xs={12} md={3}>
        <WidgetCard
          title="Booked Revenue"
          value=" ₹234.8k"
          icon={<AttachMoneyIcon color="secondary" />}
        />
      </Grid>
    </Grid>
  );
}
