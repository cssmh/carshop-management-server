-- Drop all tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS user_shops;
DROP TABLE IF EXISTS user_tenants;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS inventory_items;
DROP TABLE IF EXISTS vendors;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS shops;
DROP TABLE IF EXISTS tenants;

-- Now recreate all tables with correct structure
-- 1) Tenant Table (multi-tenant shops)
CREATE TABLE tenants (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    domain VARCHAR(150),
    status ENUM('active','suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2) Users Table (Fixed)
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY,
    role ENUM('global','admin','staff','mechanic','vendor','customer') NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3) Shops Table
CREATE TABLE shops (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    name VARCHAR(150) NOT NULL,
    address JSON,
    phone VARCHAR(50),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- 4) User-Tenant Mapping Table
CREATE TABLE user_tenants (
    user_id CHAR(36) NOT NULL,
    tenant_id CHAR(36) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, tenant_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- 5) User-Shop Mapping Table
CREATE TABLE user_shops (
    user_id CHAR(36) NOT NULL,
    shop_id CHAR(36) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, shop_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
);

-- 6) Other tables...
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
    address JSON,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);


-- 7) Vendors / Suppliers
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

-- 8) Inventory Items
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

-- 9) Roles & Permissions (for Admin Panel RBAC)
CREATE TABLE roles (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    name VARCHAR(50) NOT NULL,              -- e.g. Admin, Cashier, Mechanic
    permissions JSON,                       -- store as JSON array
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- 10) Subscriptions (for multi-tenant billing)
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
-- Insert sample tenant
INSERT INTO tenants (id, name, domain, status)
VALUES ('975e971c-dc14-46f9-bfd7-80e0e3738cd0', 'My Car Shop', 'mycarshop', 'active');

-- Insert sample shops
INSERT INTO shops (id, tenant_id, name, address, phone, status)
VALUES 
    ('shop-0001', '975e971c-dc14-46f9-bfd7-80e0e3738cd0', 'Main Branch', '{"city": "New York", "street": "123 Main St"}', '123-456-7890', 'active'),
    ('shop-0002', '975e971c-dc14-46f9-bfd7-80e0e3738cd0', 'Downtown Branch', '{"city": "New York", "street": "456 Broadway"}', '123-456-7891', 'active');

-- Insert global admin user
INSERT INTO users (id, role, email, password_hash, first_name, last_name, is_active)
VALUES ('user-0001', 'global', 'global@mycarshop.com', '$2b$10$byBtgaCCP3QtKsqcc9SXeuRs/W1s1S0jd.X.whbzKAnKLh5j1vKFy', 'Global', 'Admin', 1);

-- Map user to tenant
INSERT INTO user_tenants (user_id, tenant_id, is_default)
VALUES ('user-0001', '975e971c-dc14-46f9-bfd7-80e0e3738cd0', TRUE);

-- Map user to shops
INSERT INTO user_shops (user_id, shop_id, is_default)
VALUES 
    ('user-0001', 'shop-0001', TRUE),
    ('user-0001', 'shop-0002', FALSE);