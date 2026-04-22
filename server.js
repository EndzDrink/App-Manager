import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pg from 'pg';

const { Pool } = pg;
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false, sslmode: 'require' }
});

console.log("✅ Enterprise Connection Pool Initialized.");

// --- 1. GOVERNANCE & DRILL-DOWN ---
app.delete('/api/subscriptions/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM subscriptions WHERE id = $1', [req.params.id]);
    res.json({ message: "License reclaimed successfully." });
  } catch (err) { res.status(500).json({ error: "Reclamation failed" }); }
});

app.get('/api/departments/:id/details', async (req, res) => {
  const { id } = req.params;
  try {
    const deptRes = await pool.query('SELECT id, name, budget_limit FROM departments WHERE id = $1', [id]);
    if (deptRes.rowCount === 0) return res.status(404).json({ error: "Department not found" });

    const usersRes = await pool.query(`
      SELECT u.id, u.email, TO_CHAR(u.onboarding_date, 'YYYY-MM-DD') as joined,
      (SELECT COUNT(*) FROM subscriptions WHERE user_id = u.id AND status = 'active') as active_licenses
      FROM users u WHERE u.department_id = $1 ORDER BY u.email
    `, [id]);

    const appsRes = await pool.query(`
      SELECT a.name, a.category, SUM(s.price) as total_cost, COUNT(s.id) as active_seats
      FROM apps a JOIN subscriptions s ON a.id = s.app_id JOIN users u ON s.user_id = u.id
      WHERE u.department_id = $1 AND s.status = 'active'
      GROUP BY a.name, a.category ORDER BY total_cost DESC
    `, [id]);

    const totalSpend = appsRes.rows.reduce((sum, app) => sum + parseFloat(app.total_cost), 0);

    res.json({
      department: deptRes.rows[0],
      users: usersRes.rows,
      apps: appsRes.rows,
      totalSpend
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch department details" });
  }
});

// --- 2. TRENDS & FORECASTING ---
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

// --- 3. INGESTION ENGINE ---
app.post('/api/connectors/:id/sync', async (req, res) => {
  const client = await pool.connect();
  try {
    const connectorRes = await client.query('SELECT * FROM data_connectors WHERE id = $1', [id]);
    if (connectorRes.rowCount === 0) return res.status(404).json({ error: "Connector not found" });

    const externalData = [
      { email: "architect@organization.com", dept: "IT & Infrastructure", apps: [{ name: "Jira", category: "Productivity", price: 450.00, usage: 120 }, { name: "Slack", category: "Communication", price: 150.00, usage: 45 }] },
      { email: "marketing.lead@organization.com", dept: "Marketing", apps: [{ name: "Asana", category: "Productivity", price: 380.00, usage: 10 }, { name: "Slack", category: "Communication", price: 150.00, usage: 200 }] }
    ];
    for (const entry of externalData) {
      const d = await client.query('INSERT INTO departments (name, budget_limit) VALUES ($1, 15000.00) ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id', [entry.dept]);
      const u = await client.query('INSERT INTO users (email, department_id) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET department_id=EXCLUDED.department_id RETURNING id', [entry.email, d.rows[0].id]);
      for (const app of entry.apps) {
        const a = await client.query('INSERT INTO apps (name, category) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET category=EXCLUDED.category RETURNING id', [app.name, app.category]);
        await client.query('INSERT INTO subscriptions (user_id, app_id, price, status) VALUES ($1, $2, $3, \'active\') ON CONFLICT DO NOTHING', [u.rows[0].id, a.rows[0].id, app.price]);
        await client.query('INSERT INTO usage_logs (app_id, user_id, duration_minutes, log_date) VALUES ($1, $2, $3, CURRENT_DATE)', [a.rows[0].id, u.rows[0].id, app.usage]);
      }
    }
    await client.query('UPDATE data_connectors SET last_sync = CURRENT_TIMESTAMP, status = \'active\' WHERE id = $1', [id]);
    res.json({ message: "Sync successful" });
  } finally { client.release(); }
});

// --- 4. ANALYTICS & DIRECTORY ---
app.get('/api/users', async (req, res) => {
  const r = await pool.query(`SELECT u.id, u.email, d.name as department, TO_CHAR(u.onboarding_date, 'YYYY-MM-DD') as onboarding_date, (SELECT COUNT(*) FROM subscriptions WHERE user_id = u.id AND status='active') as active_licenses FROM users u LEFT JOIN departments d ON u.department_id = d.id ORDER BY u.email ASC`);
  res.json(r.rows);
});

app.get('/api/audit/duplication', async (req, res) => {
  const r = await pool.query(`SELECT a.category, ARRAY_AGG(DISTINCT a.name) as app_names, SUM(s.price) as total_category_cost FROM apps a JOIN subscriptions s ON a.id = s.app_id WHERE s.status='active' GROUP BY a.category HAVING COUNT(DISTINCT a.id) > 1`);
  res.json(r.rows);
});

app.get('/api/metrics/departmental-spend', async (req, res) => {
  // Added d.id to the SELECT and GROUP BY so the frontend can route to the drill-down
  const r = await pool.query(`SELECT d.id, d.name as department, COALESCE(SUM(s.price), 0) as total_spend, d.budget_limit FROM departments d LEFT JOIN users u ON d.id = u.department_id LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status='active' GROUP BY d.id, d.name, d.budget_limit ORDER BY total_spend DESC`);
  res.json(r.rows);
});

app.get('/api/metrics/usage/weekly', async (req, res) => {
  const r = await pool.query(`SELECT TRIM(TO_CHAR(log_date, 'Day')) as day_name, SUM(duration_minutes) as total_minutes FROM usage_logs WHERE log_date >= CURRENT_DATE - INTERVAL '7 days' GROUP BY log_date ORDER BY log_date ASC`);
  res.json(r.rows);
});

app.get('/api/metrics/usage/category', async (req, res) => {
  const r = await pool.query(`SELECT a.category, SUM(u.duration_minutes) as total_minutes FROM usage_logs u JOIN apps a ON u.app_id = a.id GROUP BY a.category ORDER BY total_minutes DESC`);
  res.json(r.rows);
});

app.get('/api/recommendations', async (req, res) => {
  const r = await pool.query(`SELECT s.id as sub_id, a.name as app_name, s.price FROM subscriptions s JOIN apps a ON s.app_id = a.id LEFT JOIN usage_logs u ON a.id = u.app_id AND u.log_date >= CURRENT_DATE - INTERVAL '7 days' WHERE s.status = 'active' GROUP BY s.id, a.name, s.price HAVING COALESCE(SUM(u.duration_minutes), 0) < 30`);
  res.json(r.rows.map(row => ({ id: row.sub_id, title: `Optimize ${row.app_name}`, description: `Savings: ZAR ${parseFloat(row.price).toFixed(2)}` })));
});

app.get('/api/metrics/monthly-cost', async (req, res) => {
  const r = await pool.query('SELECT SUM(price) as total_cost FROM subscriptions WHERE status = \'active\'');
  res.json({ total: parseFloat(r.rows[0].total_cost || 0) });
});

app.get('/api/settings', async (req, res) => {
  const r = await pool.query('SELECT monthly_budget FROM settings WHERE id = 1');
  res.json(r.rows[0] || { monthly_budget: 2000.00 });
});

app.get('/api/apps', async (req, res) => {
  const r = await pool.query('SELECT * FROM apps ORDER BY created_at DESC');
  res.json(r.rows);
});

app.get('/api/subscriptions', async (req, res) => {
  const r = await pool.query(`SELECT s.id, a.name, a.category, s.price, TO_CHAR(s.created_at, 'YYYY-MM-DD') as billing FROM subscriptions s JOIN apps a ON s.app_id = a.id WHERE s.status='active'`);
  res.json(r.rows);
});

app.get('/api/connectors', async (req, res) => {
  const r = await pool.query('SELECT * FROM data_connectors ORDER BY id DESC');
  res.json(r.rows);
});

app.post('/api/connectors/validate', async (req, res) => {
  const { api_key } = req.body;
  if (api_key?.startsWith('sk_test')) return res.status(200).json({ status: "success" });
  res.status(401).json({ status: "error" });
});

app.post('/api/connectors', async (req, res) => {
  const { provider_name, api_endpoint, api_key, sync_frequency } = req.body;
  const result = await pool.query(
    'INSERT INTO data_connectors (provider_name, api_endpoint, api_key, sync_frequency, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [provider_name, api_endpoint, api_key, sync_frequency, 'inactive']
  );
  res.status(201).json(result.rows[0]);
});

app.listen(port, () => console.log(`🚀 Enterprise API active on http://localhost:${port}`));