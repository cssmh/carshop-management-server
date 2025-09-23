CREATE TABLE vehicle_location (
    id CHAR(36) PRIMARY KEY,
    type VARCHAR(50) NOT NULL,          -- Garage, Parking Lot, etc.
    property VARCHAR(100) NOT NULL,     -- Owner or property name
    value DECIMAL(12,2) NOT NULL,       -- Asset value
    is_active BOOLEAN DEFAULT TRUE,     -- Active/inactive
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);