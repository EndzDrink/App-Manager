import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const { Pool } = pg;
const app = express();
const port = process.env.PORT || 3000;

const JWT_SECRET = process.env.JWT_SECRET || 'enterprise_super_secret_key_2026';

// --- 1. SECURITY & CONFIG ---
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }));
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20, 
  idleTimeoutMillis: 30000
});

pool.on('error', (err) => console.error('⚠️ Database Connection Error:', err.message));

// --- 2. ROBUST DB INITIALIZATION ---
const initializeSystems = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY, 
        email VARCHAR(255) UNIQUE NOT NULL, 
        password_hash TEXT NOT NULL, 
        role VARCHAR(50) DEFAULT 'StandardUser'
      );
    `);
    
    await pool.query(`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS department_id INTEGER`);
    await pool.query(`CREATE TABLE IF NOT EXISTS settings (id SERIAL PRIMARY KEY, monthly_budget DECIMAL DEFAULT 150000.00)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS data_connectors (id SERIAL PRIMARY KEY)`);

    // Ensure usage_logs exists for escalation and telemetry
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usage_logs (
        id SERIAL PRIMARY KEY
      );
    `);

    // The EA/CRM Request Pipeline Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS license_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        system_id INTEGER,
        status VARCHAR(50) DEFAULT 'Pending',
        request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // The PMO Pipeline Table
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

    // SCHEMA GUARD: Repair PMO Projects table if columns are missing
    const pmoColumns = [
      { name: 'project_name', type: 'VARCHAR(255)' },
      { name: 'department', type: 'VARCHAR(100)' },
      { name: 'status', type: "VARCHAR(50) DEFAULT 'Initiative'" },
      { name: 'stage', type: "VARCHAR(100) DEFAULT 'Scoping'" },
      { name: 'budget', type: 'DECIMAL DEFAULT 0.00' },
      { name: 'created_at', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' }
    ];

    for (const col of pmoColumns) {
      await pool.query(`ALTER TABLE pmo_projects ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`);
    }

    // SCHEMA GUARD: Repair Usage Logs table and drop restrictive constraints for global events
    const usageColumns = [
      { name: 'user_id', type: 'INTEGER' },
      { name: 'app_id', type: 'INTEGER' },
      { name: 'action', type: 'TEXT' },
      { name: 'duration_minutes', type: 'INTEGER' },
      { name: 'log_date', type: 'DATE DEFAULT CURRENT_DATE' }
    ];

    for (const col of usageColumns) {
      await pool.query(`ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`);
    }
    
    await pool.query(`ALTER TABLE usage_logs DROP CONSTRAINT IF EXISTS usage_logs_app_id_fkey`);
    await pool.query(`ALTER TABLE usage_logs DROP CONSTRAINT IF EXISTS usage_logs_user_id_fkey`);

    await pool.query(`ALTER TABLE enterprise_systems ADD COLUMN IF NOT EXISTS deployment_type VARCHAR(50) DEFAULT 'External'`);
    await pool.query(`ALTER TABLE enterprise_systems ADD COLUMN IF NOT EXISTS lifecycle_status VARCHAR(50) DEFAULT 'Standard'`);
    
    await pool.query(`
      ALTER TABLE license_requests 
      ADD COLUMN IF NOT EXISTS alignment_score INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS ea_status VARCHAR(50) DEFAULT 'Awaiting EA Vetting',
      ADD COLUMN IF NOT EXISTS ea_comments TEXT
    `);

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

    console.log("✅ Database Schema Verified. EA/PMO/CRM Pipelines Synced.");
  } catch (err) { 
    console.error("❌ DB Initialization failed:", err.message); 
  }
};
initializeSystems();

// --- 3. FORGIVING AUTHENTICATION MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token || token === 'null') {
    req.user = { role: 'StandardUser' }; 
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      req.user = { role: 'StandardUser' };
      return next();
    }
    req.user = user;
    next();
  });
};

// --- 4. AUTHENTICATION ROUTES ---

app.post('/api/auth/setup', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash('Admin2026!', 10);
    await pool.query(
      `INSERT INTO admin_users (email, password_hash, role) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (email) DO NOTHING`, 
      ['admin@organization.com', hashedPassword, 'SuperAdmin']
    );
    res.json({ message: "SuperAdmin created successfully. Email: admin@organization.com / Pass: Admin2026!" });
  } catch (err) {
    res.status(500).json({ error: "Setup failed: " + err.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password, role, department_id } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO admin_users (email, password_hash, role, department_id) VALUES ($1, $2, $3, $4)',
      [email, hashedPassword, role || 'StandardUser', department_id || null]
    );
    res.json({ message: `${role || 'StandardUser'} created successfully: ${email}` });
  } catch (err) {
    res.status(500).json({ error: "Registration failed: " + err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM admin_users WHERE email = $1', [email]);
    if (result.rowCount === 0) return res.status(401).json({ error: "User not found" });
    
    const validPassword = await bcrypt.compare(password, result.rows[0].password_hash);
    if (!validPassword) return res.status(401).json({ error: "Invalid password" });
    
    const token = jwt.sign({ 
      id: result.rows[0].id, 
      role: result.rows[0].role,
      deptId: result.rows[0].department_id 
    }, JWT_SECRET, { expiresIn: '8h' });

    res.json({ 
      token, 
      user: { 
        email: result.rows[0].email, 
        role: result.rows[0].role,
        deptId: result.rows[0].department_id 
      } 
    });
  } catch (err) { res.status(500).json({ error: "Login crash" }); }
});

// --- 5. CORE METRICS (WITH EA RBAC ENFORCEMENT) ---
app.get('/api/metrics/monthly-cost', authenticateToken, async (req, res) => {
  try {
    let query = 'SELECT SUM(monthly_cost) as total FROM active_subscriptions WHERE is_revoked = FALSE';
    let params = [];
    if (req.user.role === 'DepartmentHead' && req.user.deptId) {
      query += ' AND owning_department_id = $1';
      params.push(req.user.deptId);
    }
    const r = await pool.query(query, params);
    res.json({ total: parseFloat(r.rows[0].total || 0) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/metrics/trends', authenticateToken, async (req, res) => {
  try {
    let spendQ = 'SELECT SUM(monthly_cost) as total FROM active_subscriptions WHERE is_revoked = FALSE';
    let budgetQ = 'SELECT SUM(allocated_budget) as total FROM departments';
    let params = [];

    if (req.user.role === 'DepartmentHead' && req.user.deptId) {
      spendQ += ' AND owning_department_id = $1';
      budgetQ += ' WHERE id = $1';
      params.push(req.user.deptId);
    }

    const spendRes = await pool.query(spendQ, params);
    const budgetRes = await pool.query(budgetQ, params);
    
    const currentSpend = parseFloat(spendRes.rows[0].total || 0);
    const totalBudget = parseFloat(budgetRes.rows[0].total || 0);
    const variance = totalBudget > 0 ? ((currentSpend / totalBudget) * 100).toFixed(1) : 0;
    
    res.json({ currentSpend, momChange: variance, totalBudget });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/metrics/departmental-spend', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT d.id, d.name as department, COALESCE(SUM(s.monthly_cost), 0) as total_spend, d.allocated_budget as budget_limit
      FROM departments d LEFT JOIN active_subscriptions s ON d.id = s.owning_department_id AND s.is_revoked = FALSE
    `;
    let params = [];
    if (req.user.role === 'DepartmentHead' && req.user.deptId) {
      query += ' WHERE d.id = $1';
      params.push(req.user.deptId);
    }
    query += ' GROUP BY d.id, d.name, d.allocated_budget ORDER BY total_spend DESC';

    const r = await pool.query(query, params);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- 6. USAGE DATA ---
app.get('/api/metrics/usage/timeline', authenticateToken, async (req, res) => {
  try {
    const r = await pool.query(`
      WITH timeline AS (SELECT generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day')::date AS report_date)
      SELECT TO_CHAR(days.report_date, 'Dy') as period_label, COALESCE(SUM(u.duration_minutes), 0) as total_minutes
      FROM timeline days LEFT JOIN usage_logs u ON days.report_date = u.log_date
      GROUP BY days.report_date ORDER BY days.report_date ASC;
    `);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/metrics/usage/category', authenticateToken, async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT es.functional_category as category, COALESCE(SUM(ul.duration_minutes), 0) as total_minutes
      FROM enterprise_systems es LEFT JOIN usage_logs ul ON es.id = ul.app_id
      GROUP BY es.functional_category ORDER BY total_minutes DESC
    `);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- 7. CATALOG, IDENTITY & SUBSCRIPTIONS (WITH EA RBAC ENFORCEMENT) ---
app.get('/api/systems', authenticateToken, async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT s.id, s.name, s.functional_category as category, s.vendor, s.deployment_architecture as architecture, s.created_at,
      s.deployment_type, s.lifecycle_status,
      (SELECT COUNT(*) FROM active_subscriptions sub WHERE sub.system_id = s.id AND sub.is_revoked = FALSE) as active_seats
      FROM enterprise_systems s ORDER BY s.name ASC
    `);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/systems', authenticateToken, async (req, res) => {
  const { name, vendor, functional_category, deployment_architecture, deployment_type } = req.body;
  if (!name || !functional_category) {
    return res.status(400).json({ error: "System name and category are required." });
  }

  try {
    const result = await pool.query(
      `INSERT INTO enterprise_systems 
       (name, vendor, functional_category, deployment_architecture, deployment_type) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        name, 
        vendor || 'Unknown Vendor', 
        functional_category, 
        deployment_architecture || 'Cloud', 
        deployment_type || 'External SaaS'
      ]
    );
    res.json({ success: true, system: result.rows[0] });
  } catch (err) { 
    console.error("❌ Failed to add system:", err.message);
    res.status(500).json({ error: err.message }); 
  }
});

app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT p.id, p.email, d.name as department, TO_CHAR(p.onboarding_date, 'YYYY-MM-DD') as onboarding_date,
      COALESCE(json_agg(json_build_object('name', es.name, 'price', s.monthly_cost)) FILTER (WHERE es.id IS NOT NULL AND s.is_revoked = FALSE), '[]') as assigned_systems
      FROM personnel p LEFT JOIN departments d ON p.department_id = d.id LEFT JOIN active_subscriptions s ON p.id = s.assigned_user_id
      LEFT JOIN enterprise_systems es ON s.system_id = es.id
    `;
    let params = [];
    if (req.user.role === 'DepartmentHead' && req.user.deptId) {
      query += ' WHERE p.department_id = $1';
      params.push(req.user.deptId);
    }
    query += ' GROUP BY p.id, d.name';

    const r = await pool.query(query, params);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET Subscriptions (Ledger Reading)
app.get('/api/subscriptions', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT s.id, es.name, es.functional_category as category, s.monthly_cost as price, TO_CHAR(s.start_date, 'YYYY-MM-DD') as start_date, s.associated_project as project_name
      FROM active_subscriptions s JOIN enterprise_systems es ON s.system_id = es.id WHERE s.is_revoked = FALSE
    `;
    let params = [];
    if (req.user.role === 'DepartmentHead' && req.user.deptId) {
      query += ' AND s.owning_department_id = $1';
      params.push(req.user.deptId);
    }

    const r = await pool.query(query, params);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST Subscriptions (Financial Procurement / Buy Button)
app.post('/api/subscriptions', authenticateToken, async (req, res) => {
  const { system_id, department_id, assigned_user_id, monthly_cost, associated_project } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO active_subscriptions 
       (system_id, owning_department_id, assigned_user_id, monthly_cost, associated_project, start_date, is_revoked) 
       VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, FALSE) RETURNING *`,
      [
        system_id, 
        department_id || null, 
        assigned_user_id || null, 
        monthly_cost || 0, 
        associated_project || 'Operational (No Project)'
      ]
    );
    res.json({ success: true, subscription: result.rows[0] });
  } catch (err) { 
    console.error("❌ Failed to add subscription:", err.message);
    res.status(500).json({ error: err.message }); 
  }
});

// DELETE Subscriptions (Cancel Procurement / Revoke Button)
app.delete('/api/subscriptions/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  
  try {
    // RBAC Check: Lock department heads to only revoking their own budget items
    let query = 'UPDATE active_subscriptions SET is_revoked = TRUE WHERE id = $1';
    let params = [id];
    
    if (req.user.role === 'DepartmentHead' && req.user.deptId) {
      query += ' AND owning_department_id = $2';
      params.push(req.user.deptId);
    }
    
    const result = await pool.query(query, params);
    
    if (result.rowCount === 0) {
        return res.status(403).json({ error: "Access Denied: You cannot revoke subscriptions outside your departmental budget." });
    }
    
    res.json({ success: true });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

// --- 8. RECOMMENDATIONS ---
app.get('/api/recommendations', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT s.id, es.name, s.monthly_cost 
      FROM active_subscriptions s JOIN enterprise_systems es ON s.system_id = es.id 
      WHERE s.is_revoked = FALSE
    `;
    let params = [];
    if (req.user.role === 'DepartmentHead' && req.user.deptId) {
      query += ' AND s.owning_department_id = $1';
      params.push(req.user.deptId);
    }
    query += ' ORDER BY s.monthly_cost DESC LIMIT 3';

    const r = await pool.query(query, params);
    const recommendations = r.rows.map(row => ({
      id: row.id, title: `Optimize ${row.name}`, description: `Potential monthly saving of ZAR ${row.monthly_cost} identified.`, impact: "High"
    }));
    res.json(recommendations);
  } catch (err) { res.json([]); }
});

app.get('/api/ai/insights', authenticateToken, async (req, res) => {
  try {
    const costRes = await pool.query(`SELECT SUM(monthly_cost) as total FROM active_subscriptions WHERE is_revoked = FALSE`);
    res.json({ insight: `Executive Summary: Current burn rate is ZAR ${parseFloat(costRes.rows[0].total || 0).toLocaleString()}. Redundancies detected in Architecture tools. Recommend consolidating license pools to reclaim ~12% of budget.`, status: "live" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- 9. MISC, AUDIT & CONNECTORS (WITH EA RBAC ENFORCEMENT) ---
app.get('/api/settings', authenticateToken, async (req, res) => {
  try {
    const r = await pool.query('SELECT monthly_budget FROM settings LIMIT 1');
    res.json(r.rows[0] || { monthly_budget: 150000.00 });
  } catch (err) { res.json({ monthly_budget: 150000.00 }); }
});

app.put('/api/settings', authenticateToken, async (req, res) => {
  const { monthly_budget } = req.body;
  try {
    await pool.query('UPDATE settings SET monthly_budget = $1 WHERE id = 1', [monthly_budget]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/audit/duplication', authenticateToken, async (req, res) => {
  if (!['SuperAdmin', 'EA'].includes(req.user.role)) {
    return res.status(403).json({ error: "Access Denied: Global Audit is restricted to Enterprise Architecture." });
  }
  
  try {
    const r = await pool.query(`SELECT functional_category as category, ARRAY_AGG(DISTINCT name) as systems FROM enterprise_systems GROUP BY functional_category HAVING COUNT(*) > 1`);
    res.json(r.rows);
  } catch (err) { res.json([]); }
});

app.get('/api/departments/:id/details', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role === 'DepartmentHead' && req.user.deptId !== parseInt(id)) {
      return res.status(403).json({ error: "Access Denied: Enterprise Architecture Governance prevents cross-departmental data access." });
    }

    const deptRes = await pool.query('SELECT id, name, allocated_budget FROM departments WHERE id = $1', [id]);
    if (deptRes.rowCount === 0) return res.status(404).json({ error: "Dept not found" });

    const [usersRes, appsRes, spendRes] = await Promise.all([
      pool.query(`SELECT email FROM personnel WHERE department_id = $1`, [id]),
      pool.query(`SELECT es.name, s.monthly_cost as price, es.functional_category as category FROM active_subscriptions s JOIN enterprise_systems es ON s.system_id = es.id WHERE s.owning_department_id = $1 AND s.is_revoked = FALSE`, [id]),
      pool.query(`SELECT SUM(monthly_cost) as total FROM active_subscriptions WHERE owning_department_id = $1 AND is_revoked = FALSE`, [id])
    ]);

    res.json({ department: deptRes.rows[0], users: usersRes.rows, apps: appsRes.rows, totalSpend: parseFloat(spendRes.rows[0].total || 0) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/connectors', authenticateToken, async (req, res) => {
  try {
    const r = await pool.query('SELECT id, provider_name, api_endpoint, status, last_sync FROM data_connectors ORDER BY id DESC');
    res.json(r.rows);
  } catch (err) { 
    console.error("❌ GET Connectors Failed:", err.message);
    res.json([]); 
  }
});

app.post('/api/connectors', authenticateToken, async (req, res) => {
  const { provider_name, api_endpoint, api_key } = req.body;
  try {
    if (!provider_name || !api_endpoint) {
      return res.status(400).json({ error: "Missing required connection parameters." });
    }
    await pool.query(
      'INSERT INTO data_connectors (provider_name, api_endpoint, api_key) VALUES ($1, $2, $3)',
      [provider_name, api_endpoint, api_key]
    );
    res.json({ success: true });
  } catch (err) { 
    console.error("❌ POST Connector Failed:", err.message);
    res.status(500).json({ error: err.message }); 
  }
});

// --- 10. EA GOVERNANCE, PMO & CRM PIPELINES ---

app.post('/api/pmo/escalate', authenticateToken, async (req, res) => {
  const { project_id, reason } = req.body;
  const userId = req.user.id || null; 

  try {
    await pool.query(
      `INSERT INTO usage_logs (user_id, app_id, action, duration_minutes, log_date) 
       VALUES ($1, $2, $3, $4, CURRENT_DATE)`,
      [userId, null, `ESCALATION: Project ${project_id} - ${reason || 'Funding Bottleneck'}`, 0]
    );

    console.log(`🚨 CIO ALERT: Project ${project_id} has been escalated for executive review.`);
    res.json({ success: true, message: "Escalated to CIO successfully." });
  } catch (err) {
    res.status(500).json({ error: "Escalation failed: " + err.message });
  }
});

app.post('/api/requests', authenticateToken, async (req, res) => {
  const { system_id } = req.body;
  const userId = req.user.id || 1; 

  try {
    const result = await pool.query(
      'INSERT INTO license_requests (user_id, system_id, status, ea_status, request_date) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING id',
      [userId, system_id, 'Pending', 'Awaiting EA Vetting']
    );
    res.json({ success: true, message: "Request queued for EA vetting." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/requests/me', authenticateToken, async (req, res) => {
  const userId = req.user.id || 1; 
  try {
    const r = await pool.query(`
      SELECT lr.id, es.name as system_name, lr.status, lr.ea_status, lr.alignment_score, lr.ea_comments, lr.request_date
      FROM license_requests lr
      JOIN enterprise_systems es ON lr.system_id = es.id
      WHERE lr.user_id = $1
      ORDER BY lr.request_date DESC
    `, [userId]);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/requests', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT lr.id, es.name as system, au.email as requester, 'Department' as dept, 
             lr.ea_status as status, lr.alignment_score as score, lr.request_date,
             EXTRACT(DAY FROM CURRENT_TIMESTAMP - lr.request_date)::text || ' Days' as timeInStage
      FROM license_requests lr
      JOIN enterprise_systems es ON lr.system_id = es.id
      LEFT JOIN admin_users au ON lr.user_id = au.id
    `;
    let params = [];
    
    if (req.user.role === 'DepartmentHead' && req.user.deptId) {
      query += ' WHERE au.department_id = $1';
      params.push(req.user.deptId);
    }
    
    query += ' ORDER BY lr.request_date DESC';

    const r = await pool.query(query, params);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/requests/:id/vetting', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { alignment_score, ea_status, ea_comments } = req.body;

  if (!['SuperAdmin', 'EA'].includes(req.user.role)) {
    return res.status(403).json({ error: "Only Enterprise Architecture can score alignment." });
  }

  try {
    await pool.query(
      `UPDATE license_requests 
       SET alignment_score = $1, ea_status = $2, ea_comments = $3, status = $4
       WHERE id = $5`,
      [alignment_score, ea_status, ea_comments, ea_status === 'Vetoed' ? 'Rejected' : 'Pending', id]
    );

    // If approved, push to PMO Register automatically
    if (ea_status === 'Approved') {
      const reqDetails = await pool.query(`SELECT es.name, au.department_id FROM license_requests lr JOIN enterprise_systems es ON lr.system_id = es.id LEFT JOIN admin_users au ON lr.user_id = au.id WHERE lr.id = $1`, [id]);
      
      if (reqDetails.rowCount > 0) {
        const pmoId = `PRJ-${new Date().getFullYear()}-${Math.floor(Math.random() * 900) + 100}`;
        await pool.query(
          `INSERT INTO pmo_projects (id, project_name, department, status, stage) VALUES ($1, $2, $3, $4, $5)`,
          [pmoId, reqDetails.rows[0].name, 'Municipal Dept', 'Awaiting Funding', 'Budget Review']
        );
      }
    }

    res.json({ success: true, message: "Strategic Alignment score updated." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/projects/pipeline', authenticateToken, async (req, res) => {
  try {
    const r = await pool.query(`SELECT * FROM pmo_projects ORDER BY created_at DESC`);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => console.log(`🚀 Municipal Engine fully operational on port ${port}`));