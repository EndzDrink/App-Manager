import 'dotenv/config';
import pg from 'pg';
import bcrypt from 'bcrypt';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20, 
  idleTimeoutMillis: 30000
});

pool.on('error', (err) => console.error('⚠️ Database Connection Error:', err.message));

export const initializeSystems = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY, 
        email VARCHAR(255) UNIQUE NOT NULL, 
        password_hash TEXT NOT NULL, 
        role VARCHAR(50) DEFAULT 'StandardUser',
        department_id INTEGER
      );
    `);
    
    await pool.query(`CREATE TABLE IF NOT EXISTS settings (id SERIAL PRIMARY KEY, monthly_budget DECIMAL DEFAULT 150000.00)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS data_connectors (id SERIAL PRIMARY KEY)`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS enterprise_systems (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        vendor VARCHAR(255) DEFAULT 'Unknown Vendor',
        functional_category VARCHAR(100),
        deployment_architecture VARCHAR(50) DEFAULT 'Cloud',
        deployment_type VARCHAR(50) DEFAULT 'External SaaS',
        lifecycle_status VARCHAR(50) DEFAULT 'Standard',
        capabilities JSONB DEFAULT '[]',
        monthly_cost_per_seat DECIMAL DEFAULT 0.00,
        satisfaction_score INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const systemColumns = [
      { name: 'capabilities', type: "JSONB DEFAULT '[]'" },
      { name: 'monthly_cost_per_seat', type: 'DECIMAL DEFAULT 0.00' },
      { name: 'satisfaction_score', type: 'INTEGER DEFAULT 0' }
    ];
    for (const col of systemColumns) {
      await pool.query(`ALTER TABLE enterprise_systems ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`);
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        allocated_budget DECIMAL DEFAULT 0.00
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS personnel (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
        onboarding_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`ALTER TABLE personnel ADD COLUMN IF NOT EXISTS onboarding_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS active_subscriptions (
        id SERIAL PRIMARY KEY,
        system_id INTEGER REFERENCES enterprise_systems(id) ON DELETE CASCADE,
        owning_department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,
        assigned_user_id INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
        monthly_cost DECIMAL DEFAULT 0.00,
        associated_project VARCHAR(255),
        start_date DATE DEFAULT CURRENT_DATE,
        is_revoked BOOLEAN DEFAULT FALSE
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS license_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES admin_users(id) ON DELETE CASCADE,
        system_id INTEGER REFERENCES enterprise_systems(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'Pending',
        crm_status VARCHAR(50) DEFAULT 'pending',
        ea_status VARCHAR(50) DEFAULT 'pending',
        crm_deflection_score INTEGER DEFAULT NULL,
        alignment_score INTEGER DEFAULT 0,
        ea_comments TEXT,
        category VARCHAR(100),
        required_capabilities JSONB DEFAULT '[]',
        estimated_users INTEGER DEFAULT 1,
        estimated_cost_annual DECIMAL DEFAULT 0.00,
        justification TEXT,
        exception_justification TEXT,
        aligned_domains JSONB DEFAULT '[]',
        request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const reqColumns = [
      { name: 'crm_status', type: "VARCHAR(50) DEFAULT 'pending'" },
      { name: 'crm_deflection_score', type: 'INTEGER DEFAULT NULL' },
      { name: 'category', type: 'VARCHAR(100)' },
      { name: 'required_capabilities', type: "JSONB DEFAULT '[]'" },
      { name: 'estimated_users', type: 'INTEGER DEFAULT 1' },
      { name: 'estimated_cost_annual', type: 'DECIMAL DEFAULT 0.00' },
      { name: 'justification', type: 'TEXT' },
      { name: 'exception_justification', type: 'TEXT' },
      { name: 'aligned_domains', type: "JSONB DEFAULT '[]'" }
    ];
    for (const col of reqColumns) {
      await pool.query(`ALTER TABLE license_requests ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`);
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS pmo_projects (
        id VARCHAR(50) PRIMARY KEY,
        project_name VARCHAR(255) NOT NULL,
        department VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Initiative',
        stage VARCHAR(100) DEFAULT 'Scoping',
        budget DECIMAL DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS usage_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES admin_users(id) ON DELETE CASCADE,
        app_id INTEGER REFERENCES enterprise_systems(id) ON DELETE CASCADE,
        action TEXT,
        duration_minutes INTEGER DEFAULT 0,
        log_date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);

    const columnsToEnsure = [
      { name: 'provider_name', type: 'VARCHAR(255)' },
      { name: 'api_endpoint', type: 'VARCHAR(255)' },
      { name: 'api_key', type: 'VARCHAR(255)' },
      { name: 'status', type: "VARCHAR(50) DEFAULT 'active'" },
      { name: 'last_sync', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' }
    ];

    for (const col of columnsToEnsure) {
      await pool.query(`ALTER TABLE data_connectors ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`);
    }

    const hashedPassword = await bcrypt.hash('Admin2026!', 10);
    await pool.query(`INSERT INTO admin_users (email, password_hash, role) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING`, ['admin@organization.com', hashedPassword, 'SuperAdmin']);
    await pool.query(`INSERT INTO settings (id, monthly_budget) VALUES (1, 150000.00) ON CONFLICT (id) DO NOTHING`);

    console.log("✅ Database Schema Verified & Hardened with SEAM Constraints.");
  } catch (err) { 
    console.error("❌ DB Initialization failed:", err.message); 
  }
};