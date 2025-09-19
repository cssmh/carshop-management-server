-- Create permissions table for dynamic permissions
CREATE TABLE module_permissions (
    id CHAR(36) PRIMARY KEY,
    role ENUM('global','admin','staff','mechanic','vendor','customer') NOT NULL,
    module_name VARCHAR(50) NOT NULL,
    can_view BOOLEAN DEFAULT TRUE,
    can_create BOOLEAN DEFAULT FALSE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_role_module (role, module_name)
);

-- Insert default permissions
INSERT INTO module_permissions (id, role, module_name, can_view, can_create, can_edit, can_delete) VALUES
-- Global permissions
(UUID(), 'global', 'dashboard', TRUE, TRUE, TRUE, TRUE),
(UUID(), 'global', 'tenants', TRUE, TRUE, TRUE, TRUE),
(UUID(), 'global', 'users', TRUE, TRUE, TRUE, TRUE),
-- Admin permissions
(UUID(), 'admin', 'dashboard', TRUE, TRUE, TRUE, TRUE),
(UUID(), 'admin', 'workboard', TRUE, TRUE, TRUE, TRUE),
(UUID(), 'admin', 'customers', TRUE, TRUE, TRUE, TRUE),
-- Staff permissions
(UUID(), 'staff', 'dashboard', TRUE, FALSE, FALSE, FALSE),
(UUID(), 'staff', 'workboard', TRUE, TRUE, TRUE, FALSE),
(UUID(), 'staff', 'customers', TRUE, TRUE, TRUE, FALSE);

/* prompt 
I have a question if global user or admin give a permison  in the user wise how it is possiblem . as like demo@staff.com this user permisson the admin this user show admin dashbord data how it is possible ? 
[under database ] [permissionController controlers] []
*/

-- Create user-specific permissions table
CREATE TABLE user_module_permissions (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    module_name VARCHAR(50) NOT NULL,
    can_view BOOLEAN DEFAULT FALSE,
    can_create BOOLEAN DEFAULT FALSE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    granted_by CHAR(36) NOT NULL, -- Who granted this permission
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL, -- Optional expiration
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT, -- Optional notes about why permission was granted
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id),
    UNIQUE KEY unique_user_module (user_id, module_name),
    INDEX idx_user_permissions (user_id, is_active),
    INDEX idx_module_permissions (module_name, is_active)
);

-- Create permission audit log
CREATE TABLE permission_audit_log (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    module_name VARCHAR(50) NOT NULL,
    action ENUM('GRANTED', 'REVOKED', 'MODIFIED') NOT NULL,
    old_permissions JSON,
    new_permissions JSON,
    granted_by CHAR(36) NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (granted_by) REFERENCES users(id)
);