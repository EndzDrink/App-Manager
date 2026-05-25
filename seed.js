import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  console.log("🌱 Starting Seed Pipeline...");
  
  try {
    // 1. Seed Departments
    const depts = [
      ['Information Management Unit (IMU)', 500000],
      ['Water & Sanitation Unit', 1200000],
      ['Metro Police Unit', 800000],
      ['Parks & Recreation Unit', 300000]
    ];
    for (const [name, budget] of depts) {
      await pool.query('INSERT INTO departments (name, allocated_budget) VALUES ($1, $2) ON CONFLICT DO NOTHING', [name, budget]);
    }

    // 2. Seed Enterprise Systems (The Catalog)
    const systems = [
      ['SAP ERP', 'SAP', 'Resource Planning', 'Cloud', 'External SaaS', 500, 85],
      ['ESRI ArcGIS', 'ESRI', 'Geospatial', 'Cloud', 'External SaaS', 120, 92],
      ['Microsoft 365', 'Microsoft', 'Productivity', 'Cloud', 'External SaaS', 4500, 95],
      ['Bentley OpenRoads', 'Bentley', 'Engineering', 'Cloud', 'External SaaS', 45, 88],
      ['GitHub Enterprise', 'GitHub', 'Applications/Dev', 'Cloud', 'External SaaS', 200, 90]
    ];
    for (const [name, vendor, cat, arch, type, users, score] of systems) {
      await pool.query(
        `INSERT INTO enterprise_systems (name, vendor, functional_category, deployment_architecture, deployment_type, active_users, satisfaction_score) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING`, 
        [name, vendor, cat, arch, type, users, score]
      );
    }

    // 3. Seed License Requests (The CRM Triage Queue)
    // We insert requests to populate the CRM Dashboard and EA Strategy Tab
    const requests = [
      [1, 1, 'pending', 'Awaiting EA Vetting', 'Resource Planning', 5, 250000, 'Need ERP for water billing.'],
      [1, 2, 'pending', 'Awaiting EA Vetting', 'Geospatial', 10, 150000, 'Need GIS mapping for new park layouts.']
    ];
    for (const [uid, sysid, crm, ea, cat, users, cost, just] of requests) {
      await pool.query(
        `INSERT INTO license_requests (user_id, system_id, crm_status, ea_status, category, estimated_users, estimated_cost_annual, justification) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [uid, sysid, crm, ea, cat, users, cost, just]
      );
    }

    console.log("✅ Database successfully seeded with demo data.");
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
  } finally {
    await pool.end();
  }
}

seed();