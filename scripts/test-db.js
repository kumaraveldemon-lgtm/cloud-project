// scripts/test-db.js - Validate database connectivity
require('dotenv').config();
const { pool } = require('../db');

async function testConnection() {
  console.log('Testing PostgreSQL connection...');
  if (!process.env.DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL is not defined in .env');
    process.exit(1);
  }

  try {
    const client = await pool.connect();
    const res = await client.query('SELECT NOW() as now, version() as version;');
    console.log('✅ Connection successful!');
    console.log(`Server time: ${res.rows[0].now}`);
    console.log(`PostgreSQL version: ${res.rows[0].version.split(' ')[0]} ${res.rows[0].version.split(' ')[1]}`);
    client.release();
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    if (err.message.includes('password authentication failed')) {
      console.error('Please verify your database password in .env');
    } else if (err.message.includes('ENOTFOUND')) {
      console.error('Please verify the host in your DATABASE_URL');
    }
    await pool.end();
    process.exit(1);
  }
}

testConnection();
