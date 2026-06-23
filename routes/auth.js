import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { pool } from '../config/db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'enterprise_super_secret_key_2026';

// Strict Auth Rate Limiter: Prevent brute-force password attacks (Max 10 attempts)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Security Lockout: Too many authentication attempts." }
});

// 1. SETUP ROUTE: Forcefully resets the SuperAdmin login
router.post('/setup', async (req, res, next) => {
  try {
    const hashedPassword = await bcrypt.hash('Admin2026!', 10);
    await pool.query(
      `INSERT INTO admin_users (email, password_hash, role) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`, 
      ['admin@organization.com', hashedPassword, 'SuperAdmin']
    );
    res.json({ message: "SuperAdmin identity secured. Password forcefully reset to: Admin2026!" });
  } catch (err) { next(err); }
});

// 2. PUBLIC REGISTRATION ROUTE: Handles the Zero-Trust Biometric Payload
router.post('/register', async (req, res, next) => {
  // The frontend biometric form doesn't send a password, so we extract the new fields
  const { email, password, role, department_id, service_number } = req.body;
  
  try {
    // Generate a temporary compliance password if one isn't provided by the UI
    const actualPassword = password || 'PendingAuth2026!';
    const hashedPassword = await bcrypt.hash(actualPassword, 10);
    
    // Assign 'PendingUser' role to prevent immediate login access
    const actualRole = role || 'PendingUser';
    const actualDept = department_id || 1; // Default to an unassigned holding department

    await pool.query(
      `INSERT INTO admin_users (email, password_hash, role, department_id) VALUES ($1, $2, $3, $4)`,
      [email, hashedPassword, actualRole, actualDept]
    );
    
    // Write the SA ID transmission straight to the compliance ledger for non-repudiation
    if (sa_id) {
        await pool.query(
          `INSERT INTO usage_logs (user_id, action, duration_minutes) VALUES ((SELECT id FROM admin_users WHERE email = $1), $2, 0)`,
          [email, `ONBOARDING: Biometric & service_number (${service_number}) received for zero-trust verification.`]
        );
    }

    res.json({ message: `(${service_number}) submitted successfully. Account is pending clearance.` });
  } catch (err) { next(err); }
});

// 3. LOGIN ROUTE
router.post('/login', authLimiter, async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM admin_users WHERE email = $1', [email]);
    if (result.rowCount === 0) return res.status(401).json({ error: "Invalid credentials" });
    
    const validPassword = await bcrypt.compare(password, result.rows[0].password_hash);
    if (!validPassword) return res.status(401).json({ error: "Invalid credentials" });
    
    // NEW SECURITY GATE: Prevent "Pending" users from logging in until EA approves them
    if (result.rows[0].role === 'PendingUser') {
        return res.status(403).json({ error: "Account Pending: Your biometric clearance is under review." });
    }
    
    const token = jwt.sign({ 
      id: result.rows[0].id, 
      role: result.rows[0].role,
      deptId: result.rows[0].department_id 
    }, JWT_SECRET, { expiresIn: '8h' });

    res.json({ 
      token, 
      user: { 
        id: result.rows[0].id,
        email: result.rows[0].email, 
        role: result.rows[0].role,
        deptId: result.rows[0].department_id 
      } 
    });
  } catch (err) { next(err); }
});

export default router;