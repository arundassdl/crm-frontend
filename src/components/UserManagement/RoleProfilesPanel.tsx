"use client";
// R63 (doc 67): the two CRM role profiles and what they include (read-only).
import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { UmError, profileLabel, umFetch } from "./api";

type Profile = { role_profile: string; roles: string[]; available: boolean };

export default function RoleProfilesPanel() {
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [error, setError] = useState<UmError | null>(null);
  useEffect(() => {
    umFetch<Profile[]>("/api/user-management/role-profiles")
      .then(setProfiles)
      .catch((e) => setError(e));
  }, []);
  if (error)
    return (
      <Alert
        severity={error.status === 503 ? "info" : "warning"}
        data-testid="roles-unavailable"
      >
        {error.message}
      </Alert>
    );
  return (
    <Card data-testid="roles-panel">
      <CardContent className="flex flex-col gap-4">
        <Typography variant="h5">Roles</Typography>
        <Typography variant="body2" color="text.secondary">
          Every person in your organization has one of these roles. CRM managers
          change roles on the Users page.
        </Typography>
        {(profiles || []).map((p) => (
          <div
            key={p.role_profile}
            className="flex flex-wrap items-center gap-2"
            data-testid="roles-row"
          >
            <Typography variant="subtitle1" className="min-is-[120px]">
              {profileLabel(p.role_profile)}
            </Typography>
            {p.roles.map((r) => (
              <Chip key={r} size="small" label={r} />
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
