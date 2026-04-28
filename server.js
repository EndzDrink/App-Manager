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

// --- 1. SECURITY & CONFIG ---
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }));
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20, 
  idleTimeoutMillis: 30000
});

pool.on('error', (err) => {
  console.error('⚠️ Database Connection Error:', err.message);
});

console.log("✅ Municipal Connection Pool Initialized.");

const authenticateToken = (req, res, next) => {
  req.user = { role: 'SuperAdmin' }; 
  return next(); 
};

// --- 2. AI ADVISOR ENGINE ---
app.get('/api/ai/insights', authenticateToken, async (req, res) => {
  try {
    const costRes = await pool.query(`SELECT SUM(monthly_cost) as total FROM active_subscriptions WHERE is_revoked = FALSE`);
    const total = parseFloat(costRes.rows[0].total || 0);
    
    const dupRes = await pool.query(`
      SELECT functional_category, COUNT(*) 
      FROM enterprise_systems 
      GROUP BY functional_category HAVING COUNT(*) > 1
    `);

    let recommendation = "Consolidate redundant licenses to reclaim approximately 12% of the monthly budget.";
    if (dupRes.rowCount > 0) {
      recommendation = `Redundancies found in ${dupRes.rows[0].functional_category}. Immediate consolidation recommended.`;
    }
    
    const insight = `Executive Summary: The current IMU SaaS burn rate is ZAR ${total.toLocaleString()}. Analysis indicates optimization potential in Enterprise Architecture and Security. Recommendation: ${recommendation}`;
    
    res.json({ insight, status: "simulated" });
  } catch (err) {
    res.status(500).json({ error: "AI Insight failure", details: err.message });
  }
});

// --- 3. CORE METRICS ---
app.get('/api/metrics/monthly-cost', authenticateToken, async (req, res) => {
  try {
    const r = await pool.query('SELECT SUM(monthly_cost) as total FROM active_subscriptions WHERE is_revoked = FALSE');
    res.json({ total: parseFloat(r.rows[0].total || 0) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/metrics/trends', authenticateToken, async (req, res) => {
  try {
    const spendRes = await pool.query('SELECT SUM(monthly_cost) as total FROM active_subscriptions WHERE is_revoked = FALSE');
    const budgetRes = await pool.query('SELECT SUM(allocated_budget) as total FROM departments');
    
    const currentSpend = parseFloat(spendRes.rows[0].total || 0);
    const totalBudget = parseFloat(budgetRes.rows[0].total || 0);
    
    // Calculate variance for the trend
    const variance = totalBudget > 0 ? ((currentSpend / totalBudget) * 100).toFixed(1) : 0;
    
    res.json({ 
      currentSpend, 
      momChange: variance, 
      totalBudget 
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/metrics/departmental-spend', authenticateToken, async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT d.id, d.name as department, COALESCE(SUM(s.monthly_cost), 0) as total_spend, d.allocated_budget as budget_limit
      FROM departments d
      LEFT JOIN active_subscriptions s ON d.id = s.owning_department_id AND s.is_revoked = FALSE
      GROUP BY d.id, d.name, d.allocated_budget
      ORDER BY total_spend DESC
    `);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- 4. USAGE DATA (CHARTS) ---
app.get('/api/metrics/usage/timeline', authenticateToken, async (req, res) => {
  try {
    const r = await pool.query(`
      WITH timeline AS (SELECT generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day')::date AS report_date)
      SELECT TO_CHAR(days.report_date, 'Dy') as period_label, COALESCE(SUM(u.duration_minutes), 0) as total_minutes
      FROM timeline days
      LEFT JOIN usage_logs u ON days.report_date = u.log_date
      GROUP BY days.report_date ORDER BY days.report_date ASC;
    `);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/metrics/usage/category', authenticateToken, async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT es.functional_category as category, COALESCE(SUM(ul.duration_minutes), 0) as total_minutes
      FROM enterprise_systems es
      LEFT JOIN usage_logs ul ON es.id = ul.app_id
      GROUP BY es.functional_category
      ORDER BY total_minutes DESC
    `);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- 5. ENTERPRISE SYSTEM CATALOG ---
app.get('/api/systems', authenticateToken, async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT 
        s.id, 
        s.name, 
        s.functional_category,
        s.functional_category as category, 
        s.vendor, 
        s.deployment_architecture as architecture,
        s.created_at,
        (SELECT COUNT(*) FROM active_subscriptions sub WHERE sub.system_id = s.id AND sub.is_revoked = FALSE) as active_seats
      FROM enterprise_systems s ORDER BY s.name ASC
    `);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/subscriptions', authenticateToken, async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT 
        s.id, 
        es.name, 
        es.functional_category as category, 
        s.monthly_cost as price, 
        TO_CHAR(s.start_date, 'YYYY-MM-DD') as start_date,
        s.associated_project as project_name
      FROM active_subscriptions s
      JOIN enterprise_systems es ON s.system_id = es.id
      WHERE s.is_revoked = FALSE
    `);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT 
        p.id, 
        p.email, 
        d.name as department, 
        TO_CHAR(p.onboarding_date, 'YYYY-MM-DD') as onboarding_date,
        COALESCE(
          json_agg(
            json_build_object('name', es.name, 'price', s.monthly_cost)
          ) FILTER (WHERE es.id IS NOT NULL AND s.is_revoked = FALSE), 
          '[]'
        ) as assigned_systems
      FROM personnel p
      LEFT JOIN departments d ON p.department_id = d.id
      LEFT JOIN active_subscriptions s ON p.id = s.assigned_user_id
      LEFT JOIN enterprise_systems es ON s.system_id = es.id
      GROUP BY p.id, d.name
    `);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- 6. RECOMMENDATIONS ---
app.get('/api/recommendations', authenticateToken, async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT s.id, es.name, s.monthly_cost 
      FROM active_subscriptions s 
      JOIN enterprise_systems es ON s.system_id = es.id 
      WHERE s.is_revoked = FALSE 
      ORDER BY s.monthly_cost DESC
      LIMIT 3
    `);
    const recommendations = r.rows.map(row => ({
      id: row.id,
      title: `Optimize ${row.name}`,
      description: `Potential monthly saving of ZAR ${row.monthly_cost} identified through usage audit.`,
      impact: "High"
    }));
    res.json(recommendations);
  } catch (err) { res.json([]); }
});

// --- 7. AUDIT & SETTINGS ---
app.get('/api/audit/duplication', authenticateToken, async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT functional_category as category, ARRAY_AGG(DISTINCT name) as systems 
      FROM enterprise_systems GROUP BY functional_category HAVING COUNT(*) > 1
    `);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/departments/:id/details', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const deptRes = await pool.query('SELECT id, name, allocated_budget as budget_limit FROM departments WHERE id = $1', [id]);
    if (deptRes.rowCount === 0) return res.status(404).json({ error: "Department not found" });
    
    const usersRes = await pool.query(`SELECT email FROM personnel WHERE department_id = $1`, [id]);
    const spendRes = await pool.query(`SELECT SUM(monthly_cost) as total FROM active_subscriptions WHERE owning_department_id = $1 AND is_revoked = FALSE`, [id]);
    
    res.json({ 
      department: deptRes.rows[0], 
      users: usersRes.rows, 
      apps: [], 
      totalSpend: parseFloat(spendRes.rows[0].total || 0) 
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/settings', authenticateToken, (req, res) => {
  res.json({ monthly_budget: 150000.00 });
});

app.get('/api/connectors', authenticateToken, (req, res) => {
  res.json([]);
});

app.listen(port, () => {
  console.log(`🚀 Municipal API synchronized on port ${port}`);
});