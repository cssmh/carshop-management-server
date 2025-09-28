CREATE TABLE cars (
  id CHAR(36) PRIMARY KEY, -- UUID
  tenant_id CHAR(36) NOT NULL,
  shop_id CHAR(36) NOT NULL,
  created_by INT NOT NULL,
  color VARCHAR(32) NOT NULL,
  make VARCHAR(32) NOT NULL,
  model VARCHAR(64) NOT NULL,
  style VARCHAR(32) NOT NULL,
  engine VARCHAR(32) NOT NULL,
  year VARCHAR(8),
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted BOOLEAN DEFAULT FALSE,
  INDEX idx_tenant_shop (tenant_id, shop_id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (shop_id) REFERENCES shops(id)
);