/** Display links only; server/tenant permissions authorize every operation. */
export const crmNavigation = [
  {
    section: "CRM",
    items: [
      {
        label: "Dashboard",
        path: "/",
        icon: "ri-dashboard-line",
      },
      {
        label: "Leads",
        path: "/leads",
        icon: "ri-user-search-line",
      },
      {
        label: "Contacts",
        path: "/contacts",
        icon: "ri-contacts-line",
      },
      {
        label: "Accounts",
        path: "/accounts",
        icon: "ri-building-line",
      },
      {
        label: "Deals",
        path: "/deals",
        icon: "ri-hand-coin-line",
      },
      {
        label: "Tasks",
        path: "/tasks",
        icon: "ri-task-line",
      },
      {
        label: "Reports",
        path: "/reports",
        icon: "ri-bar-chart-line",
      },
    ],
  },
  {
    section: "Management",
    items: [
      {
        label: "Users",
        path: "/user/users",
        icon: "ri-team-line",
      },
      {
        label: "Roles",
        path: "/user/roles",
        icon: "ri-shield-user-line",
      },
      {
        label: "Settings",
        path: "/settings",
        icon: "ri-settings-2-line",
      },
    ],
  },
];
