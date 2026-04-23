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
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// --- 1. ENTERPRISE SECURITY & CORS CONFIGURATION ---
// PRODUCTION NOTE: For the demo, we allow all origins. In prod, uncomment the origin restriction.
app.use(cors({
  // origin: ['https://dashboard.ethekwini.gov.za', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// --- 2. DATABASE CONNECTION POOL ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false, sslmode: 'require' },
  max: 20, // Scalability: Allows up to 20 concurrent connections for high traffic
  idleTimeoutMillis: 30000
});

console.log("✅ Municipal Connection Pool Initialized.");

// --- 3. AUTHENTICATION MIDDLEWARE (The "Bouncer") ---
// PRODUCTION NOTE: Applied to protect routes in production. Currently bypassed for seamless demo testing.
const authenticateToken = (req, res, next) => {
  // DEMO BYPASS: Remove the next two lines in production
  req.user = { role: 'SuperAdmin' }; 
  return next(); 

  /* PRODUCTION LOGIC:
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Access Denied. No token provided." });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token." });
    req.user = user;
    next();
  });
  */
};

// --- 4. AUTHENTICATION ROUTES ---
app.post('/api/auth/setup', async (req, res) => {
  try {
    const checkAdmin = await pool.query("SELECT * FROM admin_users WHERE email = 'admin@organization.com'");
    if (checkAdmin.rowCount > 0) return res.status(400).json({ error: "Admin already exists." });
    const hashedPassword = await bcrypt.hash('Admin2026!', 10);
    await pool.query('INSERT INTO admin_users (email, password_hash, role) VALUES ($1, $2, $3)', ['admin@organization.com', hashedPassword, 'SuperAdmin']);
    res.json({ message: "SuperAdmin created successfully." });
  } catch (err) { res.status(500).json({ error: "Setup failed" }); }
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password, role } = req.body;
  try {
    const checkUser = await pool.query("SELECT * FROM admin_users WHERE email = $1", [email]);
    if (checkUser.rowCount > 0) return res.status(400).json({ error: "User already exists." });
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO admin_users (email, password_hash, role) VALUES ($1, $2, $3)', [email, hashedPassword, role]);
    res.json({ message: `${role} created successfully: ${email}` });
  } catch (err) { res.status(500).json({ error: "Registration failed" }); }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM admin_users WHERE email = $1', [email]);
    if (result.rowCount === 0) return res.status(401).json({ error: "Invalid credentials" });
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(401).json({ error: "Invalid credentials" });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: { email: user.email, role: user.role } });
  } catch (err) { res.status(500).json({ error: "Login failed" }); }
});

// --- 5. DATA CONNECTOR & ETL ROUTES (With SQL Transactions) ---
app.post('/api/pmo/sync', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN'); // Start Transaction
    const municipalProjects = [
      { project_name: "eThekwini Smart Meter Rollout", pmo_ref: "ETH-2026-UTIL", status: "Active" },
      { project_name: "Pinetown Infrastructure Upgrade", pmo_ref: "ETH-2025-CIVIL", status: "Closed" },
      { project_name: "Durban CBD Fiber Expansion", pmo_ref: "ETH-2026-ICT", status: "Active" },
      { project_name: "Public Transport Billing System", pmo_ref: "ETH-2024-TRANS", status: "Closed" }
    ];
    for (const row of municipalProjects) {
      await client.query('INSERT INTO pmo_projects (project_name, pmo_reference_code, status) VALUES ($1, $2, $3) ON CONFLICT (project_name) DO UPDATE SET status = EXCLUDED.status', [row.project_name, row.pmo_ref, row.status]);
    }
    await client.query('COMMIT'); // Save Changes
    res.json({ message: "Municipal PMO Sync Successful", records_processed: municipalProjects.length });
  } catch (err) { 
    await client.query('ROLLBACK'); // Revert changes on error
    res.status(500).json({ error: "PMO Sync failed", details: err.message }); 
  } finally { 
    client.release(); 
  }
});

app.post('/api/connectors/:id/sync', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    const connectorRes = await client.query('SELECT * FROM data_connectors WHERE id = $1', [id]);
    if (connectorRes.rowCount === 0) return res.status(404).json({ error: "Connector not found" });
    
    await client.query('BEGIN'); // Strict Transactional Integrity
    
    const municipalData = [
      { email: "dir.water@durban.gov.za", dept: "Water & Sanitation", apps: [{ name: "ArcGIS", category: "Mapping", price: 1250.00, usage: 300 }, { name: "Slack", category: "Communication", price: 150.00, usage: 20 }] },
      { email: "ops.police@durban.gov.za", dept: "Metro Police", apps: [{ name: "Jira", category: "Operations", price: 450.00, usage: 450 }, { name: "Slack", category: "Communication", price: 150.00, usage: 10 }] },
      { email: "head.parks@durban.gov.za", dept: "Parks & Recreation", apps: [{ name: "Asana", category: "Projects", price: 380.00, usage: 5 }] },
      { email: "cio.office@durban.gov.za", dept: "IT & Infrastructure", apps: [{ name: "Jira", category: "Operations", price: 450.00, usage: 800 }, { name: "Zoom", category: "Communication", price: 280.00, usage: 1200 }] }
    ];

    for (const entry of municipalData) {
      const d = await client.query('INSERT INTO departments (name, budget_limit) VALUES ($1, 50000.00) ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id', [entry.dept]);
      const u = await client.query('INSERT INTO users (email, department_id) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET department_id=EXCLUDED.department_id RETURNING id', [entry.email, d.rows[0].id]);
      for (const app of entry.apps) {
        const a = await client.query('INSERT INTO enterprise_systems (name, category) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET category=EXCLUDED.category RETURNING id', [app.name, app.category]);
        await client.query('INSERT INTO subscriptions (user_id, app_id, price, status) VALUES ($1, $2, $3, \'active\') ON CONFLICT DO NOTHING', [u.rows[0].id, a.rows[0].id, app.price]);
        await client.query('INSERT INTO usage_logs (app_id, user_id, duration_minutes, log_date) VALUES ($1, $2, $3, CURRENT_DATE)', [a.rows[0].id, u.rows[0].id, app.usage]);
      }
    }
    await client.query('UPDATE data_connectors SET last_sync = CURRENT_TIMESTAMP, status = \'active\' WHERE id = $1', [id]);
    
    await client.query('COMMIT');
    res.json({ message: "Durban Gov Sync Successful" });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: "Sync failed", details: err.message });
  } finally { 
    client.release(); 
  }
});

app.post('/api/users/sync', async (req, res) => { setTimeout(() => { res.json({ message: "Identity Provider Sync Complete" }); }, 1000); });

// --- 6. AI ADVISOR ENGINE ---
app.get('/api/ai/insights', async (req, res) => {
  try {
    const costRes = await pool.query(`SELECT SUM(price) as total FROM subscriptions WHERE status = 'active'`);
    const dupRes = await pool.query(`SELECT category, ARRAY_AGG(DISTINCT name) as names, SUM(price) as waste FROM enterprise_systems a JOIN subscriptions s ON a.id = s.app_id WHERE s.status='active' GROUP BY category HAVING COUNT(DISTINCT a.id) > 1`);
    const expiredRes = await pool.query(`SELECT p.project_name, s.price, a.name FROM subscriptions s JOIN pmo_projects p ON s.project_id = p.id JOIN enterprise_systems a ON s.app_id = a.id WHERE p.status = 'Closed' AND s.status = 'active'`);

    const context = {
      totalMonthlyBurn: parseFloat(costRes.rows[0].total || 0),
      duplications: dupRes.rows.map(r => ({ category: r.category, systems: r.names, cost: parseFloat(r.waste) })),
      zombieLicenses: expiredRes.rows.map(r => ({ project: r.project_name, system: r.name, cost: parseFloat(r.price) }))
    };

    if (!GEMINI_API_KEY || GEMINI_API_KEY.startsWith('#')) {
      const dupCost = context.duplications.reduce((sum, d) => sum + d.cost, 0);
      const zombieCost = context.zombieLicenses.reduce((sum, z) => sum + z.cost, 0);
      
      let insight = `Executive Summary: The current municipal SaaS burn rate is ZAR ${context.totalMonthlyBurn.toLocaleString()}. `;
      if (context.duplications.length > 0) insight += `Critical waste of ZAR ${dupCost.toLocaleString()} identified in ${context.duplications.map(d => d.category).join('/')} tools across departments. `;
      if (context.zombieLicenses.length > 0) insight += `Furthermore, ZAR ${zombieCost.toLocaleString()} is being bled by licenses tied to the COMPLETED '${context.zombieLicenses[0]?.project || 'Infrastructure'}' project. `;
      insight += `Recommendation: Immediate decommissioning of redundant accounts to protect public funds.`;
      
      return res.json({ insight, status: "simulated" });
    }

    const prompt = `You are a strict Municipal Data Architect in Durban, South Africa. Review this JSON data: ${JSON.stringify(context)}. Write a professional, punchy 3-sentence executive summary for the Council advising exactly where they are wasting money. Use South African Rands (ZAR).`;
    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const aiData = await aiResponse.json();
    if (!aiResponse.ok) throw new Error(aiData.error?.message || "Gemini API rejected the request.");
    res.json({ insight: aiData.candidates[0].content.parts[0].text, status: "live" });
  } catch (err) {
    res.status(500).json({ error: "AI Insight generation failed", details: err.message });
  }
});

// --- 7. CORE BUSINESS LOGIC (Metrics, Systems, Subscriptions) ---

app.get('/api/metrics/trends', async (req, res) => {
  try {
    const currentRes = await pool.query(`SELECT SUM(price) as total FROM subscriptions WHERE status = 'active'`);
    const current = parseFloat(currentRes.rows[0].total || 0);
    const historyRes = await pool.query(`SELECT total_monthly_cost FROM spend_snapshots ORDER BY snapshot_date DESC LIMIT 1`);
    const previous = historyRes.rows.length > 0 ? parseFloat(historyRes.rows[0].total_monthly_cost) : current;
    const momChange = previous > 0 ? ((current - previous) / previous) * 100 : 0;
    res.json({ currentSpend: current, momChange: momChange.toFixed(1) });
  } catch (err) { res.status(500).json({ error: "Forecasting failed" }); }
});

app.get('/api/metrics/departmental-spend', async (req, res) => {
  const r = await pool.query(`SELECT d.id, d.name as department, COALESCE(SUM(s.price), 0) as total_spend, d.budget_limit FROM departments d LEFT JOIN users u ON d.id = u.department_id LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status='active' GROUP BY d.id, d.name, d.budget_limit ORDER BY total_spend DESC`);
  res.json(r.rows);
});

app.get('/api/metrics/monthly-cost', async (req, res) => {
  const r = await pool.query('SELECT SUM(price) as total_cost FROM subscriptions WHERE status = \'active\'');
  res.json({ total: parseFloat(r.rows[0].total_cost || 0) });
});

app.get('/api/metrics/usage/timeline', async (req, res) => {
  const { system = 'All', dept = 'All', timeframe = 'weekly' } = req.query;
  try {
    let seriesConfig = `generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day')::date`;
    let labelFormat = `TRIM(TO_CHAR(days.report_date, 'Dy'))`; 
    let joinCondition = `days.report_date = filtered.log_date`;

    if (timeframe === 'monthly') {
      seriesConfig = `generate_series(CURRENT_DATE - INTERVAL '3 weeks', CURRENT_DATE, '1 week')::date`;
      labelFormat = `'Wk of ' || TO_CHAR(days.report_date, 'Mon DD')`;
      joinCondition = `date_trunc('week', days.report_date) = date_trunc('week', filtered.log_date)`;
    } else if (timeframe === 'quarterly') {
      seriesConfig = `generate_series(date_trunc('month', CURRENT_DATE - INTERVAL '2 months'), date_trunc('month', CURRENT_DATE), '1 month')::date`;
      labelFormat = `TRIM(TO_CHAR(days.report_date, 'Mon'))`;
      joinCondition = `date_trunc('month', days.report_date) = date_trunc('month', filtered.log_date)`;
    } else if (timeframe === 'half_yearly') {
      seriesConfig = `generate_series(date_trunc('month', CURRENT_DATE - INTERVAL '5 months'), date_trunc('month', CURRENT_DATE), '1 month')::date`;
      labelFormat = `TRIM(TO_CHAR(days.report_date, 'Mon'))`;
      joinCondition = `date_trunc('month', days.report_date) = date_trunc('month', filtered.log_date)`;
    } else if (timeframe === 'yearly') {
      seriesConfig = `generate_series(date_trunc('month', CURRENT_DATE - INTERVAL '11 months'), date_trunc('month', CURRENT_DATE), '1 month')::date`;
      labelFormat = `TRIM(TO_CHAR(days.report_date, 'Mon'))`;
      joinCondition = `date_trunc('month', days.report_date) = date_trunc('month', filtered.log_date)`;
    }

    const r = await pool.query(`
      WITH timeline AS (SELECT ${seriesConfig} AS report_date)
      SELECT ${labelFormat} as period_label, COALESCE(SUM(filtered.duration_minutes), 0) as total_minutes
      FROM timeline days
      LEFT JOIN (
        SELECT u.log_date, u.duration_minutes
        FROM usage_logs u
        JOIN enterprise_systems a ON u.app_id = a.id
        JOIN users usr ON u.user_id = usr.id
        LEFT JOIN departments d ON usr.department_id = d.id
        WHERE ($1 = 'All' OR a.name = $1)
        AND ($2 = 'All' OR COALESCE(d.name, 'Unassigned') = $2)
      ) filtered ON ${joinCondition}
      GROUP BY days.report_date
      ORDER BY days.report_date ASC;
    `, [system, dept]);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/metrics/usage/category', async (req, res) => {
  const { system = 'All', dept = 'All' } = req.query;
  try {
    const r = await pool.query(`
      SELECT a.category, SUM(u.duration_minutes) as total_minutes
      FROM usage_logs u
      JOIN enterprise_systems a ON u.app_id = a.id
      JOIN users usr ON u.user_id = usr.id
      LEFT JOIN departments d ON usr.department_id = d.id
      WHERE ($1 = 'All' OR a.name = $1)
      AND ($2 = 'All' OR COALESCE(d.name, 'Unassigned') = $2)
      GROUP BY a.category ORDER BY total_minutes DESC
    `, [system, dept]);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/systems', async (req, res) => {
  const r = await pool.query(`SELECT a.id, a.name, a.category, TO_CHAR(a.created_at, 'YYYY-MM-DD') as created_at, COALESCE(array_agg(DISTINCT d.name) FILTER (WHERE d.name IS NOT NULL), '{}') as departments FROM enterprise_systems a LEFT JOIN subscriptions s ON a.id = s.app_id AND s.status = 'active' LEFT JOIN users u ON s.user_id = u.id LEFT JOIN departments d ON u.department_id = d.id GROUP BY a.id ORDER BY a.created_at DESC`);
  res.json(r.rows);
});

app.post('/api/systems', async (req, res) => {
  const { name, category } = req.body;
  try {
    const check = await pool.query('SELECT * FROM enterprise_systems WHERE name ILIKE $1', [name]);
    if (check.rowCount > 0) {
      return res.status(409).json({ error: "Duplicate System", message: `Compliance Warning: '${name}' already exists in the eThekwini IT Catalog. Procurement denied.` });
    }
    const r = await pool.query('INSERT INTO enterprise_systems (name, category) VALUES ($1, $2) RETURNING *', [name, category]);
    res.status(201).json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to add system" });
  }
});

app.get('/api/subscriptions', async (req, res) => {
  const r = await pool.query(`SELECT s.id, a.name, a.category, s.price, TO_CHAR(s.start_date, 'YYYY-MM-DD') as start_date, TO_CHAR(s.end_date, 'YYYY-MM-DD') as end_date, p.project_name FROM subscriptions s JOIN enterprise_systems a ON s.app_id = a.id LEFT JOIN pmo_projects p ON s.project_id = p.id WHERE s.status='active'`);
  res.json(r.rows);
});

app.post('/api/subscriptions', async (req, res) => {
  const { user_id, app_id, price } = req.body;
  try {
    const check = await pool.query("SELECT * FROM subscriptions WHERE user_id = $1 AND app_id = $2 AND status = 'active'", [user_id, app_id]);
    if (check.rowCount > 0) {
      return res.status(409).json({ error: "Duplicate License", message: "Compliance Warning: This employee already holds an active license for this system." });
    }
    const r = await pool.query("INSERT INTO subscriptions (user_id, app_id, price, start_date, status) VALUES ($1, $2, $3, CURRENT_DATE, 'active') RETURNING *", [user_id, app_id, price]);
    res.status(201).json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to procure license", details: err.message });
  }
});

app.delete('/api/subscriptions/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM subscriptions WHERE id = $1', [req.params.id]);
    res.json({ message: "License reclaimed successfully." });
  } catch (err) { res.status(500).json({ error: "Reclamation failed" }); }
});

app.get('/api/users', async (req, res) => {
  const r = await pool.query(`SELECT u.id, u.email, COALESCE(d.name, 'Unassigned') as department, TO_CHAR(u.onboarding_date, 'YYYY-MM-DD') as onboarding_date, COALESCE(json_agg(json_build_object('id', s.id, 'name', es.name, 'category', es.category, 'price', s.price)) FILTER (WHERE s.id IS NOT NULL), '[]') as assigned_systems FROM users u LEFT JOIN departments d ON u.department_id = d.id LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status='active' LEFT JOIN enterprise_systems es ON s.app_id = es.id GROUP BY u.id, d.name ORDER BY department ASC, u.email ASC`);
  res.json(r.rows);
});

app.get('/api/departments/:id/details', async (req, res) => {
  const { id } = req.params;
  try {
    const deptRes = await pool.query('SELECT id, name, budget_limit FROM departments WHERE id = $1', [id]);
    if (deptRes.rowCount === 0) return res.status(404).json({ error: "Department not found" });
    const usersRes = await pool.query(`SELECT u.id, u.email, TO_CHAR(u.onboarding_date, 'YYYY-MM-DD') as joined, (SELECT COUNT(*) FROM subscriptions WHERE user_id = u.id AND status = 'active') as active_licenses FROM users u WHERE u.department_id = $1 ORDER BY u.email`, [id]);
    const appsRes = await pool.query(`SELECT a.name, a.category, SUM(s.price) as total_cost, COUNT(s.id) as active_seats FROM enterprise_systems a JOIN subscriptions s ON a.id = s.app_id JOIN users u ON s.user_id = u.id WHERE u.department_id = $1 AND s.status = 'active' GROUP BY a.name, a.category ORDER BY total_cost DESC`, [id]);
    const totalSpend = appsRes.rows.reduce((sum, app) => sum + parseFloat(app.total_cost), 0);
    res.json({ department: deptRes.rows[0], users: usersRes.rows, apps: appsRes.rows, totalSpend });
  } catch (err) { res.status(500).json({ error: "Failed to fetch department details" }); }
});

app.get('/api/audit/duplication', async (req, res) => {
  const r = await pool.query(`SELECT a.category, ARRAY_AGG(DISTINCT a.name) as app_names, SUM(s.price) as total_category_cost FROM enterprise_systems a JOIN subscriptions s ON a.id = s.app_id WHERE s.status='active' GROUP BY a.category HAVING COUNT(DISTINCT a.id) > 1`);
  res.json(r.rows);
});

app.get('/api/recommendations', async (req, res) => {
  const r = await pool.query(`SELECT s.id as sub_id, a.name as app_name, s.price FROM subscriptions s JOIN enterprise_systems a ON s.app_id = a.id LEFT JOIN usage_logs u ON a.id = u.app_id AND u.log_date >= CURRENT_DATE - INTERVAL '7 days' WHERE s.status = 'active' GROUP BY s.id, a.name, s.price HAVING COALESCE(SUM(u.duration_minutes), 0) < 30`);
  res.json(r.rows.map(row => ({ id: row.sub_id, title: `Optimize ${row.app_name}`, description: `Low usage detected. Savings: ZAR ${parseFloat(row.price).toFixed(2)}` })));
});

app.get('/api/settings', async (req, res) => {
  const r = await pool.query('SELECT monthly_budget FROM settings WHERE id = 1');
  res.json(r.rows[0] || { monthly_budget: 2000.00 });
});

app.get('/api/connectors', async (req, res) => {
  const r = await pool.query('SELECT * FROM data_connectors ORDER BY id DESC');
  res.json(r.rows);
});

app.post('/api/connectors', async (req, res) => {
  const { provider_name, api_endpoint, api_key, sync_frequency } = req.body;
  const result = await pool.query('INSERT INTO data_connectors (provider_name, api_endpoint, api_key, sync_frequency, status) VALUES ($1, $2, $3, $4, $5) RETURNING *', [provider_name, api_endpoint, api_key, sync_frequency, 'inactive']);
  res.status(201).json(result.rows[0]);
});

app.listen(port, () => console.log(`🚀 Municipal Analytics Engine active on port ${port}`));