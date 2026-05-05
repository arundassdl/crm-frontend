// @menu/vertical-menu-config.ts
export const verticalMenuItems = [
  {
    section: "General",
    items: [
      {
        label: "Dashboard",
        path: "/",
        icon: "ri-home-smile-line",
        roles: ["CRM-Admin", "Super Admin", "CRM-User"]
      },
      {
        label: "Lead",
        path: "/leads",
        icon: "PeopleOutline",
        roles: ["CRM-Admin", "Super Admin", "CRM-User"]
      },
      {
        label: "Deal",
        path: "/deals",
        icon: "ElectricBolt",
        roles: ["CRM-Admin", "Super Admin", "CRM-User"]
      },
      {
        label: "Contact",
        path: "/contacts",
        icon: "Portrait",
        roles: ["CRM-Admin", "Super Admin", "CRM-User"]
      },
      {
        label: "Accounts",
        path: "/accounts",
        icon: "CorporateFare",
        roles: ["CRM-Admin", "Super Admin", "CRM-User"]
      },
      {
        label: "Tasks",
        path: "/tasks",
        icon: "TaskAlt",
        roles: ["CRM-Admin", "Super Admin", "CRM-User"]
      },
      {
        label: "Customer Communications",
        submenu: true,
        icon: "ri-service-line",
        roles: ["Super Admin","CRM-Admin"],
        children: [
          {
            label: "Chatbot",
            path: "#",
            roles: ["Super Admin", "CRM-Admin"]
          }
        ]
      }
    ],
  },
  {
    section: "Management",
    items: [
      {
        label: "Admin Options",
        icon: "ri-admin-line",
        roles: ["Super Adminr", "CRM-Admin"]
      },
      {
        label: "User",
        submenu: true,
        icon: "ri-user-2-fill",
        roles: ["Super Admin", "CRM-Admin"],
        children: [
          {
            label: "Users",
            path: "/user/users",
            roles: ["Super Admin", "CRM-Admin"]
          },
          {
            label: "Roles",
            path: "/user/roles",
            roles: ["Super Admin", "CRM-Admin"]
          }
        ]
      },
      {
        label: "Settings",
        submenu: true,
        icon: "ri-settings-2-line",
        roles: ["Super Admin", "CRM-Admin"],
        children: [
          {
            label: "Organization",
            path: "/my-company",
            roles: ["Super Admin", "CRM-Admin"]
          }
        ]
      }
    ]
  }
];
