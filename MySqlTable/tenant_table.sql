-- 1) Tenant Table (multi-tenant shops)
CREATE TABLE tenants (
    id CHAR(36) PRIMARY KEY,               -- UUIDv7
    name VARCHAR(150) NOT NULL,
    domain VARCHAR(150),                   -- optional custom domain
    status ENUM('active','suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2) Users (Admin, Staff, Mechanic, Vendor, Customer)
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY,               -- UUIDv7
    tenant_id CHAR(36) NOT NULL,
    role ENUM('admin','staff','mechanic','vendor','customer') NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- 3) Customers
CREATE TABLE customers (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    profile_picture VARCHAR(255),
    type ENUM('individual','business'),
    salutation VARCHAR(20),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    nickname VARCHAR(100),
    business_name VARCHAR(150),
    legal_name VARCHAR(150),
    gender ENUM('male','female','other'),
    dob DATE,
    tax_id VARCHAR(50),
    state_id VARCHAR(50),
    email VARCHAR(150),
    billing_email VARCHAR(150),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    whatsapp VARCHAR(50),
    facebook VARCHAR(150),
    instagram VARCHAR(150),
    x_handle VARCHAR(150),
    address JSON,                           -- store multiple addresses (home, billing, shipping)
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- 4) Vendors / Suppliers
CREATE TABLE vendors (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    profile_logo VARCHAR(255),
    type ENUM('individual','company'),
    salutation VARCHAR(20),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    nickname VARCHAR(100),
    business_name VARCHAR(150),
    legal_name VARCHAR(150),
    tax_id VARCHAR(50),
    state_id VARCHAR(50),
    email VARCHAR(150),
    billing_email VARCHAR(150),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    whatsapp VARCHAR(50),
    website VARCHAR(150),
    facebook VARCHAR(150),
    instagram VARCHAR(150),
    x_handle VARCHAR(150),
    address JSON,
    payment_info JSON,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- 5) Inventory Items
CREATE TABLE inventory_items (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    image_url VARCHAR(255),
    type VARCHAR(50),
    name VARCHAR(150) NOT NULL,
    description TEXT,
    sku VARCHAR(100) UNIQUE,
    quick_part_no VARCHAR(100),
    manufacturer_no VARCHAR(100),
    ean VARCHAR(50),
    upc VARCHAR(50),
    brand VARCHAR(100),
    color_group VARCHAR(50),
    quantity_on_hand INT DEFAULT 0,
    quantity_available INT DEFAULT 0,
    min_quantity INT DEFAULT 0,
    max_quantity INT DEFAULT 0,
    allow_negative BOOLEAN DEFAULT FALSE,
    cost_price DECIMAL(10,2) DEFAULT 0,
    sale_price DECIMAL(10,2) DEFAULT 0,
    profit_margin DECIMAL(5,2),
    tax_applicable BOOLEAN DEFAULT TRUE,
    location JSON,                          -- {zone, isle, shelf, bin}
    tags JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- 6) Roles & Permissions (for Admin Panel RBAC)
CREATE TABLE roles (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    name VARCHAR(50) NOT NULL,              -- e.g. Admin, Cashier, Mechanic
    permissions JSON,                       -- store as JSON array
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- 7) Subscriptions (for multi-tenant billing)
CREATE TABLE subscriptions (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    plan_name VARCHAR(50),
    status ENUM('active','expired','suspended') DEFAULT 'active',
    start_date DATE,
    end_date DATE,
    auto_renew BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);


-- Meaualy user add 

-- Tenant Insert
INSERT INTO tenants (id, name, domain, status, created_at)
VALUES (
  '975e971c-dc14-46f9-bfd7-80e0e3738cd0', -- tenantId (UUID, চাইলে change করতে পারো)
  'My Shop Demo',
  'myshop',
  'active',
  NOW()
);

-- Admin User Insert (password = "admin123")
INSERT INTO users (id, tenant_id, role, email, password_hash, first_name, last_name, is_active, created_at)
VALUES (
  '43887ff0-0ba4-4033-add2-22021477a88a', -- adminId (UUID)
  '975e971c-dc14-46f9-bfd7-80e0e3738cd0', -- tenantId (উপরেরটার সাথে match করতে হবে)
  'admin',
  'admin@myshop.com',
  '$2a$10$5P/3uZKORpQFx4F5OtwuEO5Aj9p8T4VqjA08aqprOLR5w6tqQihyq', -- bcrypt hash of "admin123"
  'Admin',
  'MyShop',
  1,
  NOW()
);
