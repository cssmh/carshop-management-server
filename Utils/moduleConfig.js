export const MODULE_PERMISSIONS = {
  global: [
    "dashboard",
    "tenants",
    "users",
    "reports",
    "settings",
    "analytics",
    "system-status",
    "billing",
  ],
  admin: [
    "dashboard",
    "workboard",
    "customers",
    "inventory",
    "vendor",
    "staff",
    "reports",
    "financial",
    "marketing",
    "setup",
    "crm",
  ],
  staff: [
    "dashboard",
    "workboard",
    "customers",
    "inventory",
    "calendar",
    "reports",
  ],
  mechanic: ["dashboard", "workboard", "inventory", "calendar", "work-orders"],
  vendor: ["dashboard", "inventory", "orders", "reports"],
  customer: ["dashboard", "appointments", "vehicles", "invoices", "profile"],
};

export const ROUTE_PERMISSIONS = {
  "/api/dashboard": [
    "global",
    "admin",
    "staff",
    "mechanic",
    "vendor",
    "customer",
  ],
  "/api/tenants": ["global"],
  "/api/users": ["global", "admin"],
  "/api/workboard": ["admin", "staff", "mechanic"],
  "/api/customers": ["admin", "staff"],
  "/api/inventory": ["admin", "staff", "mechanic", "vendor"],
  "/api/vendor": ["admin", "staff"],
  "/api/reports": ["global", "admin", "staff"],
  "/api/financial": ["admin"],
  "/api/marketing": ["admin"],
  "/api/setup": ["global", "admin"],
  "/api/crm": ["admin", "staff"],
  "/api/calendar": ["admin", "staff", "mechanic", "customer"],
  "/api/work-orders": ["admin", "staff", "mechanic"],
  "/api/orders": ["admin", "staff", "vendor"],
  "/api/appointments": ["admin", "staff", "customer"],
  "/api/vehicles": ["admin", "staff", "customer"],
  "/api/invoices": ["admin", "staff", "customer"],
  "/api/profile": [
    "global",
    "admin",
    "staff",
    "mechanic",
    "vendor",
    "customer",
  ],
};

export const getModulesForRole = (role) => {
  return MODULE_PERMISSIONS[role] || [];
};

export const hasPermission = (userRole, module) => {
  const userModules = MODULE_PERMISSIONS[userRole] || [];
  return userModules.includes(module);
};

export const canAccessRoute = (userRole, route) => {
  const allowedRoles = ROUTE_PERMISSIONS[route] || [];
  return allowedRoles.includes(userRole);
};
