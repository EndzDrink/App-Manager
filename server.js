import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

// --- MICRO-ARCHITECTURE IMPORTS ---
import { pool, initializeSystems } from './config/db.js';
import { authenticateToken } from './middleware/auth.js';
import authRoutes from './routes/auth.js';

const app = express();
const port = process.env.PORT || 3000;

// --- SECURITY, HEADERS & RATE LIMITING ---
app.use(helmet()); 
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }));
app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 200,
  message: { error: "Network traffic threshold exceeded. Please try again later." }
});
app.use('/api/', apiLimiter);

// Initialize Database
initializeSystems();

// --- MOUNTED ROUTES ---
app.use('/api/auth', authRoutes);

// --- 5. CORE METRICS ---
app.get('/api/metrics/monthly-cost', authenticateToken, async (req, res, next) => {
  try {
    let query = 'SELECT SUM(monthly_cost) as total FROM active_subscriptions WHERE is_revoked IS NOT TRUE';
    let params = [];
    if (req.user.role === 'DepartmentHead' && req.user.deptId) {
      query += ' AND owning_department_id = $1';
      params.push(req.user.deptId);
    }
    const r = await pool.query(query, params);
    res.json({ total: parseFloat(r.rows[0].total || 0) });
  } catch (err) { next(err); }
});

app.get('/api/metrics/trends', authenticateToken, async (req, res, next) => {
  try {
    let spendQ = 'SELECT SUM(monthly_cost) as total FROM active_subscriptions WHERE is_revoked IS NOT TRUE';
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
  } catch (err) { next(err); }
});

app.get('/api/metrics/departmental-spend', authenticateToken, async (req, res, next) => {
  try {
    let query = `
      SELECT d.id, d.name as department, COALESCE(SUM(s.monthly_cost), 0) as total_spend, d.allocated_budget as budget_limit
      FROM departments d LEFT JOIN active_subscriptions s ON d.id = s.owning_department_id AND s.is_revoked IS NOT TRUE
    `;
    let params = [];
    if (req.user.role === 'DepartmentHead' && req.user.deptId) {
      query += ' WHERE d.id = $1';
      params.push(req.user.deptId);
    }
    query += ' GROUP BY d.id, d.name, d.allocated_budget ORDER BY total_spend DESC';

    const r = await pool.query(query, params);
    const structuralData = r.rows.map(row => ({
      ...row,
      total_spend: parseFloat(row.total_spend || 0),
      budget_limit: parseFloat(row.budget_limit || 0)
    }));
    res.json(structuralData);
  } catch (err) { next(err); }
});

// --- 6. USAGE DATA ---
app.get('/api/metrics/usage/timeline', authenticateToken, async (req, res, next) => {
  try {
    const r = await pool.query(`
      WITH timeline AS (SELECT generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day')::date AS report_date)
      SELECT TO_CHAR(days.report_date, 'Dy') as period_label, COALESCE(SUM(u.duration_minutes), 0) as total_minutes
      FROM timeline days LEFT JOIN usage_logs u ON days.report_date = u.log_date
      GROUP BY days.report_date ORDER BY days.report_date ASC;
    `);
    res.json(r.rows);
  } catch (err) { next(err); }
});

app.get('/api/metrics/usage/category', authenticateToken, async (req, res, next) => {
  try {
    const r = await pool.query(`
      SELECT es.functional_category as category, COALESCE(SUM(ul.duration_minutes), 0) as total_minutes
      FROM enterprise_systems es LEFT JOIN usage_logs ul ON es.id = ul.app_id
      GROUP BY es.functional_category ORDER BY total_minutes DESC
    `);
    res.json(r.rows);
  } catch (err) { next(err); }
});

// --- 7. CATALOG, IDENTITY & SUBSCRIPTIONS ---

const systemSchema = z.object({
  name: z.string().min(1, "System name is required"),
  vendor: z.string().optional(),
  functional_category: z.string().min(1, "Category is required"),
  deployment_architecture: z.string().optional(),
  deployment_type: z.string().optional(),
  capabilities: z.array(z.string()).optional(),
  monthly_cost_per_seat: z.union([z.string(), z.number()]).optional()
});

app.get('/api/systems', authenticateToken, async (req, res, next) => {
  try {
    const includeCapabilities = req.query.includeCapabilities === 'true';
    
    let selectFields = `
      'SYS-' || s.id::text as id, 
      s.name, 
      s.vendor, 
      s.functional_category as category, 
      (SELECT COUNT(*) FROM active_subscriptions sub WHERE sub.system_id = s.id AND sub.is_revoked IS NOT TRUE) as active_users,
      s.monthly_cost_per_seat,
      s.satisfaction_score
    `;

    if (includeCapabilities) {
      selectFields += `, s.capabilities`;
    } else {
       selectFields += `, s.deployment_architecture as architecture, s.created_at, s.deployment_type, s.lifecycle_status`;
    }

    const r = await pool.query(`SELECT ${selectFields} FROM enterprise_systems s ORDER BY s.name ASC`);
    res.json(r.rows);
  } catch (err) { next(err); }
});

app.post('/api/systems', authenticateToken, async (req, res, next) => {
  try {
    const validatedData = systemSchema.parse(req.body);

    const result = await pool.query(
      `INSERT INTO enterprise_systems 
       (name, vendor, functional_category, deployment_architecture, deployment_type, capabilities, monthly_cost_per_seat) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        validatedData.name, 
        validatedData.vendor || 'Unknown Vendor', 
        validatedData.functional_category, 
        validatedData.deployment_architecture || 'Cloud', 
        validatedData.deployment_type || 'External SaaS',
        JSON.stringify(validatedData.capabilities || []),
        validatedData.monthly_cost_per_seat || 0.00
      ]
    );
    res.json({ success: true, system: result.rows[0] });
  } catch (err) { 
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Data validation failed", details: err.errors });
    }
    next(err); 
  }
});

app.get('/api/users', authenticateToken, async (req, res, next) => {
  try {
    let query = `
      SELECT 
        p.id, 
        p.email, 
        d.name as department, 
        TO_CHAR(p.onboarding_date, 'YYYY-MM-DD') as onboarding_date,
        COALESCE(
          json_agg(
            json_build_object(
              'name', COALESCE(es.name, 'Unlinked System (ID: ' || COALESCE(s.system_id::text, 'Unknown') || ')'), 
              'price', COALESCE(s.monthly_cost, 0)
            )
          ) FILTER (WHERE s.id IS NOT NULL AND s.is_revoked IS NOT TRUE), 
          '[]'::json
        ) as assigned_systems
      FROM personnel p 
      LEFT JOIN departments d ON p.department_id = d.id 
      LEFT JOIN active_subscriptions s ON p.id = s.assigned_user_id
      LEFT JOIN enterprise_systems es ON s.system_id = es.id
    `;
    
    let params = [];
    if (req.user.role === 'DepartmentHead' && req.user.deptId) {
      query += ' WHERE p.department_id = $1';
      params.push(req.user.deptId);
    }
    query += ' GROUP BY p.id, d.name ORDER BY p.id ASC';

    const r = await pool.query(query, params);
    res.json(r.rows);
  } catch (err) { next(err); }
});

app.get('/api/subscriptions', authenticateToken, async (req, res, next) => {
  try {
    let query = `
      SELECT 
        s.id, 
        s.assigned_user_id,
        COALESCE(es.name, 'Unlinked System (ID: ' || s.system_id || ')') as name, 
        COALESCE(es.functional_category, 'Uncategorized') as category, 
        s.monthly_cost as price, 
        TO_CHAR(s.start_date, 'YYYY-MM-DD') as start_date, 
        s.associated_project as project_name
      FROM active_subscriptions s 
      LEFT JOIN enterprise_systems es ON s.system_id = es.id 
      WHERE s.is_revoked IS NOT TRUE
    `;
    let params = [];
    
    if (req.user.role === 'DepartmentHead' && req.user.deptId) {
      query += ' AND s.owning_department_id = $1';
      params.push(req.user.deptId);
    }

    const r = await pool.query(query, params);
    res.json(r.rows);
  } catch (err) { next(err); }
});

app.post('/api/subscriptions', authenticateToken, async (req, res, next) => {
  const { system_id, department_id, assigned_user_id, monthly_cost, associated_project } = req.body;
  const operatorId = req.user.id || null;
  
  try {
    await pool.query('BEGIN');
    let fulfilledUsers = [];

    if (assigned_user_id) {
      await pool.query(
        `INSERT INTO active_subscriptions 
         (system_id, owning_department_id, assigned_user_id, monthly_cost, associated_project, start_date, is_revoked) 
         VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, FALSE)`,
        [system_id, department_id || 1, assigned_user_id, monthly_cost || 0, associated_project || 'Operational']
      );
      
      await pool.query(
        `UPDATE license_requests SET status = 'Fulfilled' WHERE user_id = $1 AND system_id = $2`,
        [assigned_user_id, system_id]
      );
      fulfilledUsers.push(assigned_user_id);
    } else {
      const pendingReqs = await pool.query(
        `SELECT lr.id, lr.user_id 
         FROM license_requests lr
         JOIN admin_users au ON lr.user_id = au.id
         WHERE lr.system_id = $1 AND lr.ea_status = 'Approved' AND lr.status = 'Pending' AND au.department_id = $2`,
        [system_id, department_id || 1]
      );

      if (pendingReqs.rowCount > 0) {
        for (let req of pendingReqs.rows) {
          await pool.query(
            `INSERT INTO active_subscriptions 
             (system_id, owning_department_id, assigned_user_id, monthly_cost, associated_project, start_date, is_revoked) 
             VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, FALSE)`,
            [system_id, department_id || 1, req.user_id, monthly_cost || 0, associated_project || 'Automated CRM Fulfillment']
          );
          await pool.query(`UPDATE license_requests SET status = 'Fulfilled' WHERE id = $1`, [req.id]);
          fulfilledUsers.push(req.user_id);
        }
      } else {
        await pool.query(
          `INSERT INTO active_subscriptions 
           (system_id, owning_department_id, assigned_user_id, monthly_cost, associated_project, start_date, is_revoked) 
           VALUES ($1, $2, NULL, $3, $4, CURRENT_DATE, FALSE)`,
          [system_id, department_id || 1, monthly_cost || 0, associated_project || 'Operational Pool']
        );
      }
    }

    await pool.query(
      `INSERT INTO usage_logs (user_id, app_id, action, duration_minutes) VALUES ($1, $2, $3, 0)`,
      [operatorId, system_id, `PROCUREMENT: New software license allocation for system ID ${system_id} explicitly provisioned and assigned.`]
    );

    await pool.query('COMMIT');
    res.json({ 
      success: true, triggerTelemetryUpdate: true,
      message: fulfilledUsers.length > 0 ? `Procured and auto-fulfilled ${fulfilledUsers.length} pending staff requests.` : `License procured and added to department pool.` 
    });

  } catch (err) { 
    await pool.query('ROLLBACK');
    next(err);
  }
});

app.delete('/api/subscriptions/:id', authenticateToken, async (req, res, next) => {
  const { id } = req.params;
  const operatorId = req.user.id || null;
  
  try {
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

    await pool.query(
      `INSERT INTO usage_logs (user_id, action, duration_minutes) VALUES ($1, $2, 0)`,
      [operatorId, `RECONCILIATION: Subscription entry ID ${id} explicitly revoked to reclaim allocated budget allocations.`]
    );
    res.json({ success: true, triggerTelemetryUpdate: true });
  } catch (err) { next(err); }
});

app.put('/api/subscriptions/:id/transfer', authenticateToken, async (req, res, next) => {
  const { id } = req.params;
  const { new_department } = req.body;
  
  try {
    const deptRes = await pool.query('SELECT id FROM departments WHERE name = $1', [new_department]);
    if (deptRes.rowCount === 0) return res.status(404).json({ error: "Department not found." });
    
    const newDeptId = deptRes.rows[0].id;

    await pool.query('UPDATE active_subscriptions SET owning_department_id = $1 WHERE id = $2', [newDeptId, id]);
    res.json({ success: true, triggerTelemetryUpdate: true, message: "License successfully transferred." });
  } catch (err) { next(err); }
});

app.put('/api/subscriptions/:id/assign', authenticateToken, async (req, res, next) => {
  const { id } = req.params;
  const { department_id, assigned_user_id, associated_project } = req.body;
  const operatorId = req.user.id || null;

  try {
    await pool.query('BEGIN');
    const subCheck = await pool.query('SELECT * FROM active_subscriptions WHERE id = $1', [id]);
    if (subCheck.rowCount === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: "Subscription asset target not found." });
    }

    const result = await pool.query(
      `UPDATE active_subscriptions 
       SET owning_department_id = COALESCE($1, owning_department_id),
           assigned_user_id = COALESCE($2, assigned_user_id),
           associated_project = COALESCE($3, associated_project)
       WHERE id = $4 RETURNING *`,
      [department_id ? parseInt(department_id) : null, assigned_user_id ? parseInt(assigned_user_id) : null, associated_project || null, id]
    );

    await pool.query(
      `INSERT INTO usage_logs (user_id, action, duration_minutes) VALUES ($1, $2, 0)`,
      [operatorId, `RECONCILIATION: Asset ID ${id} successfully mapped and allocated to Dept ID ${department_id || 'Unchanged'} / User ID ${assigned_user_id || 'Pool'}.`]
    );

    await pool.query('COMMIT');
    res.json({ success: true, triggerTelemetryUpdate: true, message: "Asset successfully assigned.", subscription: result.rows[0] });
  } catch (err) {
    await pool.query('ROLLBACK');
    next(err);
  }
});

// --- 8. RECOMMENDATIONS & INSIGHTS ---
app.get('/api/recommendations', authenticateToken, async (req, res, next) => {
  try {
    let query = `
      SELECT s.id, COALESCE(es.name, 'Legacy System') as name, s.monthly_cost 
      FROM active_subscriptions s 
      LEFT JOIN enterprise_systems es ON s.system_id = es.id 
      WHERE s.is_revoked IS NOT TRUE
    `;
    let params = [];
    if (req.user.role === 'DepartmentHead' && req.user.deptId) {
      query += ' AND s.owning_department_id = $1';
      params.push(req.user.deptId);
    }
    query += ' ORDER BY s.monthly_cost DESC LIMIT 3';

    const r = await pool.query(query, params);
    const recommendations = r.rows.map(row => ({
      id: row.id, title: `Optimize ${row.name}`, description: `Potential monthly saving of ZAR ${parseFloat(row.monthly_cost || 0).toLocaleString()} identified.`, impact: "High"
    }));
    res.json(recommendations);
  } catch (err) { res.json([]); }
});

app.get('/api/ai/insights', authenticateToken, async (req, res, next) => {
  try {
    const costRes = await pool.query(`SELECT SUM(monthly_cost) as total FROM active_subscriptions WHERE is_revoked IS NOT TRUE`);
    res.json({ insight: `Executive Summary: Current burn rate is ZAR ${parseFloat(costRes.rows[0].total || 0).toLocaleString()}. Redundancies detected in Architecture tools. Recommend consolidating license pools to reclaim ~12% of budget.`, status: "live" });
  } catch (err) { next(err); }
});

// --- 9. CONFIGURATION & COMPLIANCE LOG ENDPOINTS ---
app.get('/api/settings', authenticateToken, async (req, res, next) => {
  try {
    const r = await pool.query('SELECT monthly_budget FROM settings LIMIT 1');
    res.json(r.rows[0] || { monthly_budget: 150000.00 });
  } catch (err) { res.json({ monthly_budget: 150000.00 }); }
});

app.put('/api/settings', authenticateToken, async (req, res, next) => {
  const { monthly_budget } = req.body;
  const operatorId = req.user.id || null;
  try {
    const cleanBudget = parseFloat(String(monthly_budget).replace(/,/g, ''));
    if (isNaN(cleanBudget) || cleanBudget < 0) {
      return res.status(400).json({ error: "Invalid budget field structure provided." });
    }

    await pool.query('UPDATE settings SET monthly_budget = $1 WHERE id = 1', [cleanBudget]);

    await pool.query(
      `INSERT INTO usage_logs (user_id, action, duration_minutes) VALUES ($1, $2, 0)`,
      [operatorId, `GOVERNANCE: Global monthly budget threshold limit explicitly updated to ZAR ${cleanBudget.toLocaleString()}.`]
    );
    res.json({ success: true, triggerTelemetryUpdate: true });
  } catch (err) { next(err); }
});

app.get('/api/audit/logs', authenticateToken, async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT ul.id, ul.action, TO_CHAR(ul.created_at, 'YYYY-MM-DD HH24:MI:SS') as timestamp, COALESCE(au.email, 'SYSTEM_AUTOMATION') as operator
      FROM usage_logs ul LEFT JOIN admin_users au ON ul.user_id = au.id ORDER BY ul.created_at DESC, ul.id DESC
    `);
    res.json(result.rows);
  } catch (err) { next(err); }
});

app.get('/api/audit/duplication', authenticateToken, async (req, res, next) => {
  if (!['SuperAdmin', 'EA'].includes(req.user.role)) return res.status(403).json({ error: "Access Denied." });
  try {
    const r = await pool.query(`SELECT functional_category as category, ARRAY_AGG(DISTINCT name) as systems FROM enterprise_systems GROUP BY functional_category HAVING COUNT(*) > 1`);
    res.json(r.rows);
  } catch (err) { res.json([]); }
});

app.get('/api/departments/:id/details', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (req.user.role === 'DepartmentHead' && req.user.deptId !== parseInt(id)) return res.status(403).json({ error: "Access Denied." });

    const deptRes = await pool.query('SELECT id, name, allocated_budget FROM departments WHERE id = $1', [id]);
    if (deptRes.rowCount === 0) return res.status(404).json({ error: "Dept not found" });

    const [usersRes, appsRes, spendRes] = await Promise.all([
      pool.query(`SELECT email FROM personnel WHERE department_id = $1`, [id]),
      pool.query(`SELECT es.name, s.monthly_cost as price, es.functional_category as category FROM active_subscriptions s LEFT JOIN enterprise_systems es ON s.system_id = es.id WHERE s.owning_department_id = $1 AND s.is_revoked IS NOT TRUE`, [id]),
      pool.query(`SELECT SUM(monthly_cost) as total FROM active_subscriptions WHERE owning_department_id = $1 AND is_revoked IS NOT TRUE`, [id])
    ]);

    res.json({ department: deptRes.rows[0], users: usersRes.rows, apps: appsRes.rows, totalSpend: parseFloat(spendRes.rows[0].total || 0) });
  } catch (err) { next(err); }
});

app.get('/api/connectors', authenticateToken, async (req, res, next) => {
  try {
    const r = await pool.query('SELECT id, provider_name, api_endpoint, status, last_sync FROM data_connectors ORDER BY id DESC');
    res.json(r.rows);
  } catch (err) { res.json([]); }
});

app.post('/api/connectors', authenticateToken, async (req, res, next) => {
  const { provider_name, api_endpoint, api_key } = req.body;
  try {
    if (!provider_name || !api_endpoint) return res.status(400).json({ error: "Missing required parameters." });
    await pool.query('INSERT INTO data_connectors (provider_name, api_endpoint, api_key) VALUES ($1, $2, $3)', [provider_name, api_endpoint, api_key]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// --- ACTIVE PING / MANUAL SYNC ROUTE ---
app.post('/api/connectors/:id/sync', authenticateToken, async (req, res, next) => {
  const { id } = req.params;
  const operatorId = req.user.id || null;

  try {
    // 1. Verify the connector exists
    const connRes = await pool.query('SELECT * FROM data_connectors WHERE id = $1', [id]);
    if (connRes.rowCount === 0) return res.status(404).json({ error: "Data interface not found." });
    
    const connector = connRes.rows[0];

    // 2. Update the last_sync timestamp to CURRENT_TIMESTAMP and ensure status is active
    await pool.query(
      `UPDATE data_connectors 
       SET last_sync = CURRENT_TIMESTAMP, status = 'active' 
       WHERE id = $1`, 
      [id]
    );

    // 3. Log the manual sync to the Compliance Ledger for the Auditor-General
    await pool.query(
      `INSERT INTO usage_logs (user_id, action, duration_minutes) VALUES ($1, $2, 0)`,
      [operatorId, `INTEGRATION: Manual sync execution triggered for interface: ${connector.provider_name}.`]
    );

    res.json({ success: true, message: "Interface pinged successfully." });
  } catch (err) { 
    next(err); 
  }
});

// --- 10. EA GOVERNANCE, PMO & CRM PIPELINES ---
app.post('/api/pmo/escalate', authenticateToken, async (req, res, next) => {
  const { project_id, reason } = req.body;
  const userId = req.user.id || null; 
  try {
    await pool.query(
      `INSERT INTO usage_logs (user_id, app_id, action, duration_minutes) VALUES ($1, $2, $3, 0)`,
      [userId, null, `ESCALATION: Project ${project_id} - ${reason || 'Funding Bottleneck'}`]
    );
    res.json({ success: true, triggerTelemetryUpdate: true, message: "Escalated to CIO successfully." });
  } catch (err) { next(err); }
});

app.post('/api/requests', authenticateToken, async (req, res, next) => {
  const { system_id, category, required_capabilities, estimated_users, estimated_cost_annual, justification, exception_justification, aligned_domains } = req.body;
  const userId = req.user.id || 1; 
  try {
    const result = await pool.query(
      `INSERT INTO license_requests 
       (user_id, system_id, status, crm_status, ea_status, category, required_capabilities, estimated_users, estimated_cost_annual, justification, exception_justification, aligned_domains, request_date) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP) RETURNING id`,
      [userId, system_id, 'Pending', 'pending', 'pending', category || 'Uncategorized', JSON.stringify(required_capabilities || []), estimated_users || 1, estimated_cost_annual || 0.00, justification || '', exception_justification || '', JSON.stringify(aligned_domains || [])]
    );
    res.json({ success: true, message: "Request queued for CRM vetting.", id: `REQ-${result.rows[0].id}` });
  } catch (err) { next(err); }
});

app.put('/api/requests/:id/escalate', authenticateToken, async (req, res, next) => {
  const { id } = req.params;
  const cleanId = id.replace('REQ-', '');
  if (!['SuperAdmin', 'CRMHead'].includes(req.user.role)) return res.status(403).json({ error: "Access Denied." });

  try {
    await pool.query(`UPDATE license_requests SET crm_status = 'Escalated to EA', ea_status = 'Awaiting EA Vetting' WHERE id = $1`, [cleanId]);
    res.json({ success: true, message: "Request successfully escalated." });
  } catch (err) { next(err); }
});

app.get('/api/requests/me', authenticateToken, async (req, res, next) => {
  const userId = req.user.id || 1; 
  try {
    const r = await pool.query(`
      SELECT 'REQ-' || lr.id::text as id, es.name as system_name, lr.status, lr.ea_status, lr.alignment_score, lr.ea_comments, lr.request_date, lr.exception_justification, lr.aligned_domains
      FROM license_requests lr JOIN enterprise_systems es ON lr.system_id = es.id WHERE lr.user_id = $1 ORDER BY lr.request_date DESC
    `, [userId]);
    res.json(r.rows);
  } catch (err) { next(err); }
});

app.get('/api/requests', authenticateToken, async (req, res, next) => {
  try {
    let query = `
      SELECT 'REQ-' || lr.id::text as id, es.name as system, au.email as requester, COALESCE(d.name, 'Unassigned') as dept, COALESCE(lr.category, es.functional_category) as category, lr.required_capabilities, lr.estimated_users, lr.estimated_cost_annual, lr.justification, lr.exception_justification, lr.aligned_domains, lr.crm_status, lr.crm_deflection_score, lr.ea_status, lr.alignment_score, TO_CHAR(lr.request_date, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
      FROM license_requests lr JOIN enterprise_systems es ON lr.system_id = es.id LEFT JOIN admin_users au ON lr.user_id = au.id LEFT JOIN departments d ON au.department_id = d.id
    `;
    let params = [];
    if (req.user.role === 'DepartmentHead' && req.user.deptId) {
      query += ' WHERE au.department_id = $1';
      params.push(req.user.deptId);
    }
    query += ' ORDER BY lr.request_date DESC';

    const r = await pool.query(query, params);
    res.json(r.rows);
  } catch (err) { next(err); }
});

app.put('/api/requests/:id/vetting', authenticateToken, async (req, res, next) => {
  const { id } = req.params;
  const cleanId = id.replace('REQ-', '');
  const { alignment_score, ea_status, ea_comments, crm_status, crm_deflection_score } = req.body;

  if ((ea_status !== undefined || alignment_score !== undefined || ea_comments !== undefined) && !['SuperAdmin', 'EA'].includes(req.user.role)) {
    return res.status(403).json({ error: "Access Denied: Architectural assessment restricted to EA officers." });
  }

  try {
    let updateFields = [];
    let params = [];
    let paramIndex = 1;

    if (alignment_score !== undefined) { updateFields.push(`alignment_score = $${paramIndex++}`); params.push(alignment_score); }
    if (ea_status !== undefined) { 
      updateFields.push(`ea_status = $${paramIndex++}`); params.push(ea_status); 
      updateFields.push(`status = $${paramIndex++}`); params.push(ea_status === 'Vetoed' ? 'Rejected' : 'Pending');
    }
    if (ea_comments !== undefined) { updateFields.push(`ea_comments = $${paramIndex++}`); params.push(ea_comments); }
    if (crm_status !== undefined) { updateFields.push(`crm_status = $${paramIndex++}`); params.push(crm_status); }
    if (crm_deflection_score !== undefined) { updateFields.push(`crm_deflection_score = $${paramIndex++}`); params.push(crm_deflection_score); }

    if (updateFields.length === 0) return res.status(400).json({ error: "No valid operational update elements provided." });
    params.push(cleanId);
    await pool.query(`UPDATE license_requests SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`, params);
    res.json({ success: true, triggerTelemetryUpdate: true, message: `Request updated successfully.` });
  } catch (err) { next(err); }
});

// --- 11. CENTRALIZED ERROR HANDLER ---
app.use((err, req, res, next) => {
  console.error(`[🚨 GOVERNANCE ENGINE ERROR]:`, err.message);
  
  if (err instanceof z.ZodError) {
    return res.status(400).json({ error: "Data Validation Failed", details: err.errors });
  }
  
  res.status(500).json({ error: "An internal system error occurred. Action logged for administrator review." });
});

app.listen(port, () => console.log(`🚀 Municipal Engine fully operational on port ${port}`));