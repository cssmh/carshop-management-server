# 🚗 Car Shop Management – Enhanced Login System

## Introduction

This project introduces a **comprehensive enhanced login system** for the Car Shop Management application.
It addresses the requirements for **global user support**, **modern authentication flow**, and **role-based access control**, providing a scalable foundation for multi-tenant applications.

The implementation improves upon the previous single-tenant login system by allowing users to access multiple companies with a single account, ensuring flexibility and security.

---

## Features

### 🌐 Global User Support

- Single account access across multiple companies/tenants.
- Automatic detection of accessible companies during login.
- Seamless company switching without re-authentication.

### 🔐 Enhanced Authentication Flow

1. **Initial Login** – User enters credentials.
2. **Company Detection** – System checks for accessible companies.
3. **Company Selection** – If multiple companies exist, user selects one.
4. **Direct Access** – If only one company, user is logged in directly.

### 👥 Role-Based Access Control

- **Admin**: Full access, user management, settings.
- **Staff**: Manage inventory, customers, and reports.
- **Mechanic**: Job and inventory management (view-only).
- **Vendor**: Product and order management.
- **Customer**: Order viewing and shop access.

### 🔄 Company Switching

Global users can switch between companies via:

```http
POST /api/auth/switch-company
{
  "tenantId": "uuid2"
}
```

---

## System Overview

- Fully supports **multi-tenant global users**.
- Provides a **modern and secure login experience**.
- Integrates with **frontend apps** via updated API endpoints.
- Maintains **backward compatibility** with legacy single-tenant flows.

---

## Database Changes

- Removed **unique constraint** on `email` field.
- Added **JWT token field** for secure storage.
- Added unique constraint on `(email, tenant_id)`.

---

## API Endpoints

### New & Enhanced

- `POST /api/auth/login` – Enhanced with global user logic.
- `GET /api/auth/me` – Returns user profile, permissions, and accessible companies.
- `POST /api/auth/switch-company` – Enables tenant switching.

### Sample Response (`/api/auth/me`)

```json
{
  "user": {...},
  "currentCompany": {...},
  "accessibleCompanies": [...],
  "permissions": {
    "canManageUsers": true,
    "canManageInventory": true
  },
  "dashboardAccess": {
    "defaultRoute": "/admin-dashboard",
    "allowedRoutes": [...],
    "modules": [...]
  }
}
```

---

## Security Enhancements

- **JWT-based authentication** with HTTP-only cookies.
- **Role-based middleware** for protecting API routes.
- **Company-specific access validation** for multi-tenant integrity.
- **Automatic token cleanup** on logout.

---

## Testing & Documentation

- Comprehensive **test scripts** covering multiple login scenarios.
- **Seed script** for creating sample global and single-tenant users.
- Example **React components** for frontend integration.
- Full **API documentation** with request/response examples.

---

## Backward Compatibility

- Fully compatible with **legacy single-tenant login flows**.
- New features enhance multi-tenant support without breaking existing behavior.

---

## Usage Example

Frontend integration sample:

```javascript
// Initial login
const response = await fetch("/api/auth/login", {
  method: "POST",
  body: JSON.stringify({ email, password }),
});

const data = await response.json();

if (data.companies) {
  // Multiple companies found – show selection UI
  showCompanySelection(data.companies);
} else {
  // Single company – redirect to dashboard
  redirectToDashboard(data.user.role);
}
```

---

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/swapnilahmedshishir/ServerCarShopManagement.git
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run migrations to update database schema.
4. Start the application:

   ```bash
   npm run dev
   ```

---

## Contributors

- **Swapnil ahmmed shishir & Md Mominul Islam ** – Lead Developer
- **Contributors** – Backend, Frontend, QA teams
