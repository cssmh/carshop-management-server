-- Enhanced users table with proper multi-tenant structure
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  tenant_id CHAR(36) NULL, -- NULL for global users
  shop_id CHAR(36) NULL,   -- NULL for global/tenant-only users
  created_by CHAR(36) NULL, -- Who created this user
  
  -- Basic Info
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  employee_id VARCHAR(50),
  
  -- Role & System Access
  role ENUM('global','admin','manager','technician','cashier','staff') DEFAULT 'staff',
  department VARCHAR(64),
  
  -- Personal Details (JSON for flexibility)
  personal_info JSON, -- {dateOfBirth, hireDate, address, emergencyContact}
  work_details JSON,  -- {salary, workSchedule, status}
  additional_info JSON, -- {skills, certifications, languages, notes}
  
  -- System fields
  is_active BOOLEAN DEFAULT TRUE,
  last_login DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  
  INDEX idx_tenant_shop (tenant_id, shop_id),
  INDEX idx_email_active (email, is_active),
  INDEX idx_role (role),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- User module permissions (role-based + user-specific overrides)
CREATE TABLE user_permissions (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  module_name VARCHAR(50) NOT NULL,
  permissions JSON, -- {view: true, create: false, edit: true, delete: false}
  granted_by CHAR(36),
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE KEY unique_user_module (user_id, module_name),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL
);