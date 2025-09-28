-- Drop existing table if needed
DROP TABLE IF EXISTS roles;

-- Enhanced roles table with all required fields
CREATE TABLE roles (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    role_name VARCHAR(100) NOT NULL,
    role_slug VARCHAR(100) NOT NULL, -- Auto-generated lowercase slug
    access_level ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    category ENUM('administrative', 'management', 'operational', 'customer_service', 'technical', 'financial', 'temporary') DEFAULT 'operational',
    role_description TEXT,
    
    -- Visual Access Settings (JSON)
    visual_access_settings JSON, -- {role_color, access_level_type, max_sessions, session_timeout}
    
    -- System Permissions (JSON)
    system_permissions JSON, -- Array of permission strings
    
    -- Access Restrictions (JSON)
    access_restrictions JSON, -- Array of restriction strings
    
    notes TEXT,
    active_status BOOLEAN DEFAULT TRUE,
    default_role BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_tenant_role_name (tenant_id, role_name),
    UNIQUE KEY unique_tenant_role_slug (tenant_id, role_slug),
    INDEX idx_tenant_active (tenant_id, active_status),
    INDEX idx_category (category),
    INDEX idx_access_level (access_level),
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Insert sample global admin role with enhanced structure
INSERT INTO roles (
    id, 
    tenant_id, 
    role_name, 
    role_slug,
    access_level,
    category,
    role_description,
    visual_access_settings,
    system_permissions,
    access_restrictions,
    notes,
    active_status,
    default_role
) VALUES (
    'role-global-admin-001',
    '975e971c-dc14-46f9-bfd7-80e0e3738cd0', -- Your existing tenant ID
    'Global Administrator',
    'global-administrator',
    'critical',
    'administrative',
    'Complete system access with all administrative privileges and global oversight capabilities',
    JSON_OBJECT(
        'role_color', '#dc2626',
        'access_level_type', 'Full Access',
        'max_sessions', 5,
        'session_timeout', 480
    ),
    JSON_ARRAY(
        'user_management', 'role_management', 'system_settings', 'financial_reports',
        'service_orders', 'inventory_management', 'customer_data', 'pos_system',
        'sales_reports', 'quality_reports', 'vendor_data', 'purchasing',
        'backup_restore', 'audit_logs', 'security_settings', 'tenant_management'
    ),
    JSON_ARRAY(),
    'Primary administrative role with unrestricted access to all system functions',
    TRUE,
    FALSE
);

-- Insert additional sample roles
INSERT INTO roles (
    id, tenant_id, role_name, role_slug, access_level, category, role_description,
    visual_access_settings, system_permissions, access_restrictions, notes, active_status, default_role
) VALUES 
(
    'role-shop-admin-001',
    '975e971c-dc14-46f9-bfd7-80e0e3738cd0',
    'Shop Administrator',
    'shop-administrator',
    'high',
    'administrative',
    'Shop-level administrative access with user and operational management',
    JSON_OBJECT('role_color', '#ea580c', 'access_level_type', 'Extended Access', 'max_sessions', 4, 'session_timeout', 360),
    JSON_ARRAY('user_management', 'financial_reports', 'service_orders', 'inventory_management', 'customer_data', 'sales_reports'),
    JSON_ARRAY('no_system_settings', 'no_tenant_management', 'limited_user_creation'),
    'Administrative role for shop-level management',
    TRUE,
    FALSE
),
(
    'role-staff-default-001',
    '975e971c-dc14-46f9-bfd7-80e0e3738cd0',
    'Staff Member',
    'staff-member',
    'medium',
    'operational',
    'Standard staff access for daily operational tasks',
    JSON_OBJECT('role_color', '#059669', 'access_level_type', 'Limited Access', 'max_sessions', 2, 'session_timeout', 240),
    JSON_ARRAY('service_orders', 'customer_data', 'inventory_view', 'basic_reports'),
    JSON_ARRAY('no_financial_access', 'no_user_management', 'view_only_reports'),
    'Default role for new staff members',
    TRUE,
    TRUE
);