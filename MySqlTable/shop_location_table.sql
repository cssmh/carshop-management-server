-- shops table for shop location management (NEW DESIGN, NOT BASED ON PREVIOUS FORM)

CREATE TABLE shops (
    id CHAR(36) PRIMARY KEY,                      -- Shop unique id (UUID)
    tenant_id CHAR(36) NOT NULL,                  -- Tenant/Company reference
    name VARCHAR(150) NOT NULL,                   -- Shop name
    address JSON NOT NULL,                        -- Address as JSON: { "city": ..., "street": ... }
    phone VARCHAR(50),                            -- Shop phone number
    type VARCHAR(100) NOT NULL,                   -- Shop type (Workshop/Showroom/Warehouse/Custom)
    status ENUM('active', 'inactive') DEFAULT 'active', -- Shop status
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Example address column value:
--  { "city": "Dhaka", "street": "123 Main St" }