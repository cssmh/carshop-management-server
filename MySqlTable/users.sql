-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Drop all tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS user_shops;
DROP TABLE IF EXISTS user_tenants;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS shops;
DROP TABLE IF EXISTS tenants;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- 📊 CREATE TABLES WITH ENHANCED STRUCTURE

-- 1) Tenants Table (Multi-tenant shops)
CREATE TABLE tenants (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    domain VARCHAR(150),
    status ENUM('active','suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_status (status),
    INDEX idx_domain (domain)
);

-- 2) Enhanced Users Table
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY,
    role ENUM('global','admin','manager','staff','technician','cashier','vendor','customer') NOT NULL,
    token VARCHAR(500) NULL,
    
    -- Basic Info
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    department VARCHAR(100),
    employee_id VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    
    -- Status & Dates
    status ENUM('active','inactive','on_leave','terminated','suspended') DEFAULT 'active',
    date_of_birth DATE,
    hire_date DATE,
    annual_salary DECIMAL(10,2) DEFAULT 0,
    
    -- Address Information (JSON)
    address_info JSON,
    
    -- Emergency Contact (JSON)
    emergency_contact JSON,
    
    -- Work Schedule (JSON)
    work_schedule JSON,
    
    -- Skills and Qualifications (JSON)
    skills_expertise JSON,
    certificates JSON,
    languages JSON,
    
    -- System fields
    system_permissions JSON,
    notes TEXT,
    last_login_date DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email_active (email, is_active),
    INDEX idx_role (role),
    INDEX idx_employee_id (employee_id),
    INDEX idx_status (status)
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX idx_tenant_status (tenant_id, status),
    INDEX idx_name (name)
);

-- 4) User-Tenant Mapping Table
CREATE TABLE user_tenants (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    tenant_id CHAR(36) NOT NULL,
    assigned_role ENUM('global','admin','manager','staff','technician','cashier') DEFAULT 'staff',
    is_default BOOLEAN DEFAULT FALSE,
    can_access_all_shops BOOLEAN DEFAULT FALSE,
    created_by CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_user_tenant (user_id, tenant_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_user_tenant (user_id, tenant_id),
    INDEX idx_tenant_role (tenant_id, assigned_role)
);

-- 5) User-Shop Mapping Table
CREATE TABLE user_shops (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    shop_id CHAR(36) NOT NULL,
    tenant_id CHAR(36) NOT NULL,
    assigned_role ENUM('admin','manager','staff','technician','cashier') DEFAULT 'staff',
    is_default BOOLEAN DEFAULT FALSE,
    access_level ENUM('full','limited','view_only') DEFAULT 'limited',
    created_by CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_user_shop (user_id, shop_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_user_shop (user_id, shop_id),
    INDEX idx_tenant_access (tenant_id, access_level)
);

-- 6) Roles & Permissions Table
CREATE TABLE roles (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    role_name VARCHAR(100) NOT NULL,
    role_slug VARCHAR(100) NOT NULL,
    role_description TEXT,
    access_level ENUM('basic','advanced','admin','super_admin') DEFAULT 'basic',
    category VARCHAR(50) DEFAULT 'general',
    
    -- Permissions & Restrictions
    system_permissions JSON,
    access_restrictions JSON,
    
    -- Visual & Access Settings
    visual_access_settings JSON,
    
    -- Status & Metadata
    active_status BOOLEAN DEFAULT TRUE,
    default_role BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE KEY unique_tenant_slug (tenant_id, role_slug),
    UNIQUE KEY unique_tenant_default (tenant_id, default_role),
    
    INDEX idx_tenant_active (tenant_id, active_status),
    INDEX idx_access_level (access_level),
    INDEX idx_category (category)
);

-- 🎯 INSERT INITIAL DATA

-- Insert sample tenants
INSERT INTO tenants (id, name, domain, status) VALUES 
('tenant-005', 'MyCarShop Main Branch', 'mycarshop.com', 'active'),
('tenant-002', 'AutoService Pro', 'autoservice.pro', 'active'),
('tenant-003', 'QuickFix Motors', 'quickfixmotors.com', 'active');

-- Insert the global user with complete profile
INSERT INTO users (
    id, role, email, password_hash, first_name, last_name, 
    department, employee_id, phone, status, hire_date, annual_salary,
    address_info, emergency_contact, work_schedule, skills_expertise,
    certificates, languages, system_permissions, notes, is_active
) VALUES (
    'global-user-001',
    'global',
    'global@mycarshop.com',
    '$2b$10$byBtgaCCP3QtKsqcc9SXeuRs/W1s1S0jd.X.whbzKAnKLh5j1vKFy',
    'Global',
    'Administrator',
    'System Administration',
    'GLOBAL001',
    '+1-555-GLOBAL',
    'active',
    '2024-01-01',
    150000.00,
    JSON_OBJECT(
        'street_address', '123 Global Admin Street',
        'city', 'Tech City',
        'state', 'CA',
        'zip_code', '90210',
        'country', 'USA'
    ),
    JSON_OBJECT(
        'contact_name', 'Emergency Contact',
        'relationship', 'Business Partner',
        'contact_phone', '+1-555-EMERGENCY'
    ),
    JSON_OBJECT(
        'schedule_type', 'Full-time',
        'hours_per_week', 40,
        'start_time', '09:00',
        'end_time', '17:00'
    ),
    JSON_ARRAY(
        'System Administration',
        'Multi-tenant Management',
        'Database Management',
        'API Development',
        'Security Management'
    ),
    JSON_ARRAY(
        'Certified System Administrator',
        'Multi-tenant Architecture Specialist',
        'Database Security Expert'
    ),
    JSON_ARRAY('English', 'Spanish', 'French'),
    JSON_ARRAY(
        'all_access',
        'tenant_management', 
        'user_management',
        'shop_management', 
        'system_settings',
        'global_analytics',
        'security_management'
    ),
    'Global system administrator with full access to all tenants and shops. Primary contact for system-wide issues.',
    TRUE
);

-- Insert sample admin users for different tenants
INSERT INTO users (
    id, role, email, password_hash, first_name, last_name,
    department, employee_id, phone, status, hire_date, annual_salary,
    system_permissions, is_active
) VALUES 
(
    'admin-user-001',
    'admin',
    'admin@mycarshop.com',
    '$2b$10$byBtgaCCP3QtKsqcc9SXeuRs/W1s1S0jd.X.whbzKAnKLh5j1vKFy',
    'Shop',
    'Administrator',
    'Management',
    'ADMIN001',
    '+1-555-ADMIN1',
    'active',
    '2024-01-15',
    75000.00,
    JSON_ARRAY('user_management', 'shop_operations', 'reports', 'inventory'),
    TRUE
),
(
    'admin-user-002',
    'admin',
    'admin@autoservice.pro',
    '$2b$10$byBtgaCCP3QtKsqcc9SXeuRs/W1s1S0jd.X.whbzKAnKLh5j1vKFy',
    'Auto',
    'Manager',
    'Operations',
    'ADMIN002',
    '+1-555-ADMIN2',
    'active',
    '2024-02-01',
    70000.00,
    JSON_ARRAY('user_management', 'service_management', 'customer_data'),
    TRUE
);

-- Insert sample shops for each tenant
INSERT INTO shops (id, tenant_id, name, address, phone, status) VALUES 
-- MyCarShop shops
(
    'shop-mycar-001',
    'tenant-005',
    'MyCarShop Main Location',
    JSON_OBJECT(
        'street', '456 Main Street',
        'city', 'Los Angeles',
        'state', 'CA',
        'zipCode', '90001',
        'country', 'USA'
    ),
    '+1-555-MYCAR01',
    'active'
),
(
    'shop-mycar-002',
    'tenant-005',
    'MyCarShop North Branch',
    JSON_OBJECT(
        'street', '789 North Avenue',
        'city', 'Los Angeles',
        'state', 'CA', 
        'zipCode', '90002',
        'country', 'USA'
    ),
    '+1-555-MYCAR02',
    'active'
),

-- AutoService Pro shops
(
    'shop-auto-001',
    'tenant-002',
    'AutoService Central',
    JSON_OBJECT(
        'street', '321 Service Road',
        'city', 'Phoenix',
        'state', 'AZ',
        'zipCode', '85001',
        'country', 'USA'
    ),
    '+1-555-AUTO001',
    'active'
),

-- QuickFix Motors shops
(
    'shop-quick-001',
    'tenant-003',
    'QuickFix Downtown',
    JSON_OBJECT(
        'street', '654 Quick Street',
        'city', 'Miami',
        'state', 'FL',
        'zipCode', '33101',
        'country', 'USA'
    ),
    '+1-555-QUICK01',
    'active'
),
(
    'shop-quick-002',
    'tenant-003',
    'QuickFix Express',
    JSON_OBJECT(
        'street', '987 Express Lane',
        'city', 'Miami',
        'state', 'FL',
        'zipCode', '33102',
        'country', 'USA'
    ),
    '+1-555-QUICK02',
    'active'
);

-- Map global user to all tenants
INSERT INTO user_tenants (id, user_id, tenant_id, assigned_role, is_default, can_access_all_shops, created_by) VALUES 
('ut-global-001', 'global-user-001', 'tenant-005', 'global', TRUE, TRUE, 'global-user-001'),
('ut-global-002', 'global-user-001', 'tenant-002', 'global', FALSE, TRUE, 'global-user-001'),
('ut-global-003', 'global-user-001', 'tenant-003', 'global', FALSE, TRUE, 'global-user-001');

-- Map admin users to their respective tenants
INSERT INTO user_tenants (id, user_id, tenant_id, assigned_role, is_default, can_access_all_shops, created_by) VALUES 
('ut-admin-001', 'admin-user-001', 'tenant-005', 'admin', TRUE, TRUE, 'global-user-001'),
('ut-admin-002', 'admin-user-002', 'tenant-002', 'admin', TRUE, TRUE, 'global-user-001');

-- Map global user to all shops with full access
INSERT INTO user_shops (id, user_id, shop_id, tenant_id, assigned_role, is_default, access_level, created_by) VALUES 
('us-global-001', 'global-user-001', 'shop-mycar-001', 'tenant-005', 'admin', TRUE, 'full', 'global-user-001'),
('us-global-002', 'global-user-001', 'shop-mycar-002', 'tenant-005', 'admin', FALSE, 'full', 'global-user-001'),
('us-global-003', 'global-user-001', 'shop-auto-001', 'tenant-002', 'admin', FALSE, 'full', 'global-user-001'),
('us-global-004', 'global-user-001', 'shop-quick-001', 'tenant-003', 'admin', FALSE, 'full', 'global-user-001'),
('us-global-005', 'global-user-001', 'shop-quick-002', 'tenant-003', 'admin', FALSE, 'full', 'global-user-001');

-- Map admin users to their shops
INSERT INTO user_shops (id, user_id, shop_id, tenant_id, assigned_role, is_default, access_level, created_by) VALUES 
('us-admin-001', 'admin-user-001', 'shop-mycar-001', 'tenant-005', 'admin', TRUE, 'full', 'global-user-001'),
('us-admin-002', 'admin-user-001', 'shop-mycar-002', 'tenant-005', 'admin', FALSE, 'full', 'global-user-001'),
('us-admin-003', 'admin-user-002', 'shop-auto-001', 'tenant-002', 'admin', TRUE, 'full', 'global-user-001');

-- Insert comprehensive role templates for each tenant
INSERT INTO roles (id, tenant_id, role_name, role_slug, role_description, access_level, category, system_permissions, access_restrictions, visual_access_settings, active_status, default_role, notes) VALUES 

-- MyCarShop roles
(
    'role-mycar-admin',
    'tenant-005',
    'Shop Administrator',
    'shop-administrator',
    'Full administrative access to shop operations and user management',
    'admin',
    'management',
    JSON_ARRAY('user_management', 'inventory_management', 'financial_reports', 'system_settings', 'customer_data', 'service_orders'),
    JSON_ARRAY(),
    JSON_OBJECT('maxSessions', 3, 'sessionTimeout', 480),
    TRUE,
    FALSE,
    'Complete shop administration role with user management capabilities'
),
(
    'role-mycar-manager',
    'tenant-005',
    'Shop Manager',
    'shop-manager',
    'Operational management with limited administrative functions',
    'advanced',
    'management',
    JSON_ARRAY('service_orders', 'inventory_view', 'customer_data', 'team_management'),
    JSON_ARRAY('system_settings', 'user_creation'),
    JSON_OBJECT('maxSessions', 2, 'sessionTimeout', 360),
    TRUE,
    FALSE,
    'Day-to-day operations management role'
),
(
    'role-mycar-staff',
    'tenant-005',
    'Shop Staff',
    'shop-staff',
    'Basic operational access for daily tasks',
    'basic',
    'operations',
    JSON_ARRAY('service_orders', 'customer_data', 'inventory_view'),
    JSON_ARRAY('financial_reports', 'user_management', 'system_settings'),
    JSON_OBJECT('maxSessions', 1, 'sessionTimeout', 240),
    TRUE,
    TRUE,
    'Standard staff role for general shop operations'
),

-- AutoService Pro roles
(
    'role-auto-admin',
    'tenant-002',
    'Service Administrator',
    'service-administrator',
    'Complete service center administration',
    'admin',
    'management',
    JSON_ARRAY('user_management', 'service_management', 'customer_data', 'financial_reports', 'inventory_management'),
    JSON_ARRAY(),
    JSON_OBJECT('maxSessions', 3, 'sessionTimeout', 480),
    TRUE,
    FALSE,
    'Full administrative access for service operations'
),
(
    'role-auto-tech',
    'tenant-002',
    'Lead Technician',
    'lead-technician',
    'Technical operations and service management',
    'advanced',
    'technical',
    JSON_ARRAY('service_orders', 'technical_reports', 'inventory_view', 'quality_control'),
    JSON_ARRAY('financial_reports', 'user_management'),
    JSON_OBJECT('maxSessions', 2, 'sessionTimeout', 360),
    TRUE,
    TRUE,
    'Senior technical role with service oversight'
),

-- QuickFix Motors roles
(
    'role-quick-admin',
    'tenant-003',
    'Operations Administrator',
    'operations-administrator',
    'Full operational and administrative control',
    'admin',
    'management',
    JSON_ARRAY('user_management', 'operations_management', 'customer_data', 'financial_reports', 'quality_reports'),
    JSON_ARRAY(),
    JSON_OBJECT('maxSessions', 3, 'sessionTimeout', 480),
    TRUE,
    FALSE,
    'Complete administrative control for quick service operations'
),
(
    'role-quick-cashier',
    'tenant-003',
    'Service Cashier',
    'service-cashier',
    'Payment processing and customer service',
    'basic',
    'customer_service',
    JSON_ARRAY('pos_system', 'customer_data', 'payment_processing'),
    JSON_ARRAY('inventory_management', 'user_management', 'financial_reports'),
    JSON_OBJECT('maxSessions', 1, 'sessionTimeout', 240),
    TRUE,
    TRUE,
    'Front desk and payment processing role'
);

-- 🔍 VERIFICATION QUERIES
SELECT '=== DATABASE SETUP VERIFICATION ===' as info;

SELECT 'TENANTS' as table_name, COUNT(*) as record_count FROM tenants
UNION ALL
SELECT 'USERS' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'SHOPS' as table_name, COUNT(*) as record_count FROM shops
UNION ALL
SELECT 'USER_TENANTS' as table_name, COUNT(*) as record_count FROM user_tenants
UNION ALL
SELECT 'USER_SHOPS' as table_name, COUNT(*) as record_count FROM user_shops
UNION ALL
SELECT 'ROLES' as table_name, COUNT(*) as record_count FROM roles;

-- Show global user details
SELECT '=== GLOBAL USER DETAILS ===' as info;
SELECT 
    id,
    role,
    email,
    CONCAT(first_name, ' ', last_name) as full_name,
    department,
    employee_id,
    status,
    is_active,
    created_at
FROM users 
WHERE role = 'global';

-- Show tenant summary
SELECT '=== TENANT SUMMARY ===' as info;
SELECT 
    t.name as tenant_name,
    t.domain,
    t.status,
    COUNT(DISTINCT s.id) as shop_count,
    COUNT(DISTINCT ut.user_id) as user_count
FROM tenants t
LEFT JOIN shops s ON t.id = s.tenant_id
LEFT JOIN user_tenants ut ON t.id = ut.tenant_id
GROUP BY t.id, t.name, t.domain, t.status
ORDER BY t.name;

-- Show shops summary
SELECT '=== SHOPS SUMMARY ===' as info;
SELECT 
    t.name as tenant_name,
    s.name as shop_name,
    JSON_UNQUOTE(JSON_EXTRACT(s.address, '$.city')) as city,
    JSON_UNQUOTE(JSON_EXTRACT(s.address, '$.state')) as state,
    s.phone,
    s.status,
    COUNT(us.user_id) as assigned_users
FROM shops s
JOIN tenants t ON s.tenant_id = t.id
LEFT JOIN user_shops us ON s.id = us.shop_id
GROUP BY s.id
ORDER BY t.name, s.name;

-- Show user access summary
SELECT '=== USER ACCESS SUMMARY ===' as info;
SELECT 
    CONCAT(u.first_name, ' ', u.last_name) as user_name,
    u.email,
    u.role,
    COUNT(DISTINCT ut.tenant_id) as tenant_access,
    COUNT(DISTINCT us.shop_id) as shop_access,
    CASE 
        WHEN u.role = 'global' THEN 'All Tenants & Shops'
        ELSE GROUP_CONCAT(DISTINCT t.name SEPARATOR ', ')
    END as accessible_tenants
FROM users u
LEFT JOIN user_tenants ut ON u.id = ut.user_id
LEFT JOIN user_shops us ON u.id = us.user_id
LEFT JOIN tenants t ON ut.tenant_id = t.id
GROUP BY u.id
ORDER BY u.role, u.first_name;

SELECT '=== SETUP COMPLETED SUCCESSFULLY ===' as final_status;
SELECT CONCAT('Global user created: global@mycarshop.com | Password: global123') as login_info;
SELECT CONCAT('Total Tenants: 3 | Total Shops: 5 | Total Users: 3') as summary;