// scripts/migrate.js - Migration runner
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { pool } = require('../db');

async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log('🔄 Checking database migrations...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    const migrationsDir = path.join(__dirname, '../migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('No migrations directory found.');
      return;
    }

    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    const appliedRes = await client.query('SELECT version FROM schema_migrations;');
    const applied = new Set(appliedRes.rows.map(r => r.version));

    for (const file of files) {
      if (!applied.has(file)) {
        console.log(`Applying migration: ${file}...`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (version) VALUES ($1);', [file]);
        await client.query('COMMIT');
        console.log(`✅ Applied ${file}`);
      } else {
        console.log(`⏩ Skipping already applied migration: ${file}`);
      }
    }
    console.log('🎉 All migrations up to date.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => pool.end())
    .catch(() => {
      pool.end();
      process.exit(1);
    });
}

module.exports = { runMigrations };
