-- Customers core table
CREATE TABLE IF NOT EXISTS customers (
  id CHAR(36) PRIMARY KEY,
  tenant_id CHAR(36) NOT NULL,
  shop_id CHAR(36) NULL,
  type ENUM('Individual','Business') NOT NULL DEFAULT 'Individual',
  salutation VARCHAR(16),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  nickname VARCHAR(100),
  business_name VARCHAR(150),
  legal_name VARCHAR(150),
  gender VARCHAR(32),
  date_of_birth DATE,
  tax_id VARCHAR(64),
  state_id VARCHAR(64),
  education_level VARCHAR(64),

  email VARCHAR(191) NOT NULL,
  billing_email VARCHAR(191),
  telephone VARCHAR(32),
  mobile VARCHAR(32),
  whatsapp VARCHAR(32),
  facebook VARCHAR(191),
  instagram VARCHAR(191),
  x_handle VARCHAR(191),

  group_name VARCHAR(128),
  subgroup_name VARCHAR(128),

  tax_exempt TINYINT(1) NOT NULL DEFAULT 0,
  tax_exemption_reason VARCHAR(255),
  price_list VARCHAR(128),
  terms VARCHAR(255),
  lead_source VARCHAR(128),

  status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  profile_picture_path VARCHAR(255),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  CONSTRAINT uq_customer_email_tenant UNIQUE (tenant_id, email),
  INDEX idx_customer_tenant (tenant_id),
  INDEX idx_customer_name (tenant_id, last_name, first_name),
  INDEX idx_customer_business (tenant_id, business_name),
  INDEX idx_customer_status (tenant_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Addresses
CREATE TABLE IF NOT EXISTS customer_addresses (
  id CHAR(36) PRIMARY KEY,
  customer_id CHAR(36) NOT NULL,
  type ENUM('Home','Mailing','Billing','Shipping') NOT NULL DEFAULT 'Home',
  attention_to VARCHAR(150),
  address_line1 VARCHAR(191),
  address_line2 VARCHAR(191),
  complement VARCHAR(100),
  city VARCHAR(100),
  state VARCHAR(100),
  zip VARCHAR(32),
  country VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Generic attributes (maritalInfo, authorizedInfo, referenceInfo, employmentInfo)
CREATE TABLE IF NOT EXISTS customer_attributes (
  id CHAR(36) PRIMARY KEY,
  customer_id CHAR(36) NOT NULL,
  category ENUM('marital','authorized','reference','employment') NOT NULL,
  property_key VARCHAR(150) NOT NULL,
  property_value VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  INDEX idx_attr_category (customer_id, category),
  INDEX idx_attr_key (property_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Vehicles (Assets)
CREATE TABLE IF NOT EXISTS customer_vehicles (
  id CHAR(36) PRIMARY KEY,
  customer_id CHAR(36) NOT NULL,
  vehicle_type ENUM('Passenger','SUV','Utility','Motorcycle','Boat','Trailer','Heavy Truck') NOT NULL DEFAULT 'Passenger',
  plate_number VARCHAR(64),
  vin VARCHAR(100),
  manufacturing_year VARCHAR(10),
  model_year VARCHAR(10),
  color VARCHAR(64),
  make VARCHAR(100),
  model VARCHAR(100),
  style VARCHAR(100),
  engine VARCHAR(100),
  odometer VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  INDEX idx_vehicle_vin (vin),
  INDEX idx_vehicle_type (vehicle_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tags master
CREATE TABLE IF NOT EXISTS tags (
  id CHAR(36) PRIMARY KEY,
  tenant_id CHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  UNIQUE KEY uq_tag_tenant (tenant_id, name),
  INDEX idx_tags_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Customer <-> Tags
CREATE TABLE IF NOT EXISTS customer_tags (
  customer_id CHAR(36) NOT NULL,
  tag_id CHAR(36) NOT NULL,
  PRIMARY KEY (customer_id, tag_id),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sales history (basic)
CREATE TABLE IF NOT EXISTS customer_sales_history (
  id CHAR(36) PRIMARY KEY,
  customer_id CHAR(36) NOT NULL,
  status ENUM('Ongoing','Upcoming','Completed','Cancelled') NOT NULL,
  title VARCHAR(191),
  description TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  INDEX idx_sales_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Threaded remarks
CREATE TABLE IF NOT EXISTS customer_remarks (
  id CHAR(36) PRIMARY KEY,
  customer_id CHAR(36) NOT NULL,
  parent_id CHAR(36) NULL,
  user_id CHAR(36) NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES customer_remarks(id) ON DELETE CASCADE,
  INDEX idx_remark_customer (customer_id),
  INDEX idx_remark_parent (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;