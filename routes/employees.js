// routes/employees.js
const express = require('express');
const router = express.Router();
const { query } = require('../db');

// GET all employees
router.get('/', async (req, res, next) => {
  try {
    const { q, dept } = req.query;
    let sql = 'SELECT id, name, dept, designation, shift, doj, phone, status FROM employees WHERE 1=1';
    const params = [];

    if (dept) {
      params.push(dept);
      sql += ` AND dept = $${params.length}`;
    }

    if (q) {
      params.push(`%${q.toLowerCase()}%`);
      sql += ` AND (LOWER(name) LIKE $${params.length} OR LOWER(dept) LIKE $${params.length} OR LOWER(designation) LIKE $${params.length} OR LOWER(id) LIKE $${params.length})`;
    }

    sql += ' ORDER BY id ASC;';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// POST create employee
router.post('/', async (req, res, next) => {
  try {
    const { id, name, dept, designation, shift, doj, phone, status } = req.body;
    if (!name || !dept || !designation) {
      return res.status(400).json({ error: 'Name, department, and designation are required.' });
    }

    const empId = id || 'EMP' + Date.now().toString(36).toUpperCase();
    const result = await query(`
      INSERT INTO employees (id, name, dept, designation, shift, doj, phone, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, name, dept, designation, shift, doj, phone, status;
    `, [empId, name.trim(), dept, designation.trim(), shift || 'General', doj || new Date(), phone || '', status || 'Active']);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'An employee with this ID already exists.' });
    }
    next(err);
  }
});

// PUT update employee
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, dept, designation, shift, doj, phone, status } = req.body;

    if (!name || !dept || !designation) {
      return res.status(400).json({ error: 'Name, department, and designation are required.' });
    }

    const result = await query(`
      UPDATE employees
      SET name = $1, dept = $2, designation = $3, shift = $4, doj = $5, phone = $6, status = $7, updated_at = NOW()
      WHERE id = $8
      RETURNING id, name, dept, designation, shift, doj, phone, status;
    `, [name.trim(), dept, designation.trim(), shift, doj, phone, status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE employee
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM employees WHERE id = $1 RETURNING id;', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found.' });
    }
    res.json({ message: 'Employee deleted successfully', id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
