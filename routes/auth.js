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

router.post('/setup', async (req, res, next) => {
  try {
    const hashedPassword = await bcrypt.hash('Admin2026!', 10);
    await pool.query(
      `INSERT INTO admin_users (email, password_hash, role) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (email) DO NOTHING`, 
      ['admin@organization.com', hashedPassword, 'SuperAdmin']
    );
    res.json({ message: "SuperAdmin created successfully." });
  } catch (err) { next(err); }
});

router.post('/register', async (req, res, next) => {
  const { email, password, role, department_id } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO admin_users (email, password_hash, role, department_id) VALUES ($1, $2, $3, $4)',
      [email, hashedPassword, role || 'StandardUser', department_id || null]
    );
    res.json({ message: `${role || 'StandardUser'} created successfully.` });
  } catch (err) { next(err); }
});

router.post('/login', authLimiter, async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM admin_users WHERE email = $1', [email]);
    if (result.rowCount === 0) return res.status(401).json({ error: "Invalid credentials" });
    
    const validPassword = await bcrypt.compare(password, result.rows[0].password_hash);
    if (!validPassword) return res.status(401).json({ error: "Invalid credentials" });
    
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