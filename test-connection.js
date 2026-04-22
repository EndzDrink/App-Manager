// server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pg from 'pg';

const { Client } = pg;
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

client.connect().then(() => console.log("Database connected to API."));

// Endpoint: Get Total Monthly Cost
app.get('/api/metrics/monthly-cost', async (req, res) => {
  try {
    const result = await client.query(`
      SELECT SUM(price) as total_cost 
      FROM subscriptions 
      WHERE status = 'active' AND billing_cycle = 'monthly'
    `);
    
    // Fallback to 0 if the table is empty
    const total = result.rows[0].total_cost || 0; 
    
    res.json({ total: parseFloat(total) });
  } catch (err) {
    console.error("Database error:", err.message);
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
});

// Start the Server
app.listen(port, () => {
  console.log(`🚀 API Server running on http://localhost:${port}`);
});