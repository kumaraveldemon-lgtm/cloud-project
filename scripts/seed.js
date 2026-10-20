// scripts/seed.js - Idempotent demo data seeder
require('dotenv').config();
const { pool } = require('../db');

async function seed(force = false) {
  const client = await pool.connect();
  try {
    console.log('🌱 Checking if database needs demo seed data...');
    const checkEmp = await client.query('SELECT COUNT(*) FROM employees;');
    const count = parseInt(checkEmp.rows[0].count, 10);

    if (count > 0 && !force) {
      console.log(`⏩ Database already has ${count} employees. Skipping demo seed (use --force to reseed).`);
      return;
    }

    if (force) {
      console.log('⚠️ Force mode: Cleaning existing data before re-seeding...');
      await client.query('BEGIN');
      await client.query('DELETE FROM price_history;');
      await client.query('DELETE FROM production_plans;');
      await client.query('DELETE FROM orders;');
      await client.query('DELETE FROM reorder_levels;');
      await client.query('DELETE FROM reel_stock;');
      await client.query('DELETE FROM attendance;');
      await client.query('DELETE FROM employees;');
      await client.query('DELETE FROM customers;');
      await client.query('DELETE FROM app_settings;');
      await client.query('COMMIT');
    }

    await client.query('BEGIN');

    // 1. App Settings
    await client.query(`
      INSERT INTO app_settings (company_name, ageing_days, shift_hours)
      VALUES ($1, $2, $3)
      ON CONFLICT DO NOTHING;
    `, ['BoxCraft Industries Pvt. Ltd.', 30, 9.0]);

    // 2. Employees
    const employees = [
      { id:'EMP001', name:'Ramesh Kumar',    dept:'Corrugation', designation:'Operator',    shift:'General', doj:'2022-03-15', phone:'9876543210', status:'Active' },
      { id:'EMP002', name:'Suresh Pillai',   dept:'Printing',    designation:'Supervisor',  shift:'Shift A', doj:'2021-07-01', phone:'9876543211', status:'Active' },
      { id:'EMP003', name:'Anand Sharma',    dept:'Die-cutting', designation:'Operator',    shift:'Shift B', doj:'2023-01-10', phone:'9876543212', status:'Active' },
      { id:'EMP004', name:'Priya Devi',      dept:'Admin',       designation:'Accountant',  shift:'General', doj:'2020-11-20', phone:'9876543213', status:'Active' },
      { id:'EMP005', name:'Vijay Nair',      dept:'Stitching',   designation:'Helper',      shift:'Shift C', doj:'2024-02-05', phone:'9876543214', status:'Active' },
      { id:'EMP006', name:'Lakshmi Bai',     dept:'Dispatch',    designation:'Loader',      shift:'General', doj:'2022-08-12', phone:'9876543215', status:'Active' },
      { id:'EMP007', name:'Karthik Rajan',   dept:'Corrugation', designation:'Technician',  shift:'Shift A', doj:'2021-04-18', phone:'9876543216', status:'Active' },
      { id:'EMP008', name:'Meena Sundaram',  dept:'Quality',     designation:'Inspector',   shift:'General', doj:'2023-06-30', phone:'9876543217', status:'Active' },
    ];

    for (const e of employees) {
      await client.query(`
        INSERT INTO employees (id, name, dept, designation, shift, doj, phone, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          name=EXCLUDED.name, dept=EXCLUDED.dept, designation=EXCLUDED.designation,
          shift=EXCLUDED.shift, doj=EXCLUDED.doj, phone=EXCLUDED.phone, status=EXCLUDED.status;
      `, [e.id, e.name, e.dept, e.designation, e.shift, e.doj, e.phone, e.status]);
    }

    // 3. Attendance for today
    const today = new Date().toISOString().split('T')[0];
    for (const e of employees) {
      const attId = 'ATT-' + e.id + '-' + today;
      await client.query(`
        INSERT INTO attendance (id, employee_id, attendance_date, status, checkin, checkout, working_hours, overtime, remarks)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (employee_id, attendance_date) DO NOTHING;
      `, [attId, e.id, today, 'present', '08:30', '17:30', 9.0, 1.0, 'Regular shift']);
    }

    // 4. Customers
    const customers = [
      { id:'CUST001', name:'Bharat Packaging Ltd',    contact:'Ravi Mehta',    phone:'9845001001', gstin:'29AABCB1234M1Z5', city:'Bangalore', category:'Regular',    creditLimit:500000 },
      { id:'CUST002', name:'Krishna Industries',       contact:'Sunil Kumar',   phone:'9845001002', gstin:'27AABCK5678N2Z3', city:'Mumbai',     category:'Regular',    creditLimit:300000 },
      { id:'CUST003', name:'Annapurna Foods Pvt Ltd', contact:'Asha Patel',    phone:'9845001003', gstin:'24AABCA9012P3Z1', city:'Ahmedabad',  category:'Occasional', creditLimit:150000 },
      { id:'CUST004', name:'Venkateswara Textiles',   contact:'Murugan S',     phone:'9845001004', gstin:'33AABCV3456Q4Z9', city:'Chennai',    category:'Regular',    creditLimit:400000 },
      { id:'CUST005', name:'Sunrise Pharma',           contact:'Dr. Nair',      phone:'9845001005', gstin:'32AABCS7890R5Z7', city:'Kochi',      category:'Occasional', creditLimit:200000 },
    ];

    for (const c of customers) {
      await client.query(`
        INSERT INTO customers (id, name, contact, phone, gstin, city, category, credit_limit)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          name=EXCLUDED.name, contact=EXCLUDED.contact, phone=EXCLUDED.phone,
          gstin=EXCLUDED.gstin, city=EXCLUDED.city, category=EXCLUDED.category, credit_limit=EXCLUDED.credit_limit;
      `, [c.id, c.name, c.contact, c.phone, c.gstin, c.city, c.category, c.creditLimit]);
    }

    // 5. Reel Stock (Complete register as in app.js)
    const reelStock = [
      // TABLE 1 — Standard Kraft
      { id:'RL-T1-001', size:16,    gsm:100, bf:12, reels:3,  weightKg:240,  colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack A1', supplier:'Standard Supplier',  poRef:'PO-2026-T1-001', qtyReceived:3,  ratePkg:42, currentQty:240  },
      { id:'RL-T1-002', size:20,    gsm:100, bf:12, reels:6,  weightKg:480,  colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack A1', supplier:'Standard Supplier',  poRef:'PO-2026-T1-002', qtyReceived:6,  ratePkg:42, currentQty:480  },
      { id:'RL-T1-003', size:24,    gsm:120, bf:14, reels:6,  weightKg:576,  colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack A2', supplier:'Standard Supplier',  poRef:'PO-2026-T1-003', qtyReceived:6,  ratePkg:44, currentQty:576  },
      { id:'RL-T1-004', size:24,    gsm:120, bf:12, reels:3,  weightKg:288,  colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack A2', supplier:'Standard Supplier',  poRef:'PO-2026-T1-004', qtyReceived:3,  ratePkg:44, currentQty:288  },
      { id:'RL-T1-005', size:25,    gsm:120, bf:14, reels:9,  weightKg:864,  colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack A2', supplier:'Standard Supplier',  poRef:'PO-2026-T1-005', qtyReceived:9,  ratePkg:44, currentQty:864  },
      { id:'RL-T1-006', size:26,    gsm:100, bf:14, reels:4,  weightKg:320,  colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack A3', supplier:'Standard Supplier',  poRef:'PO-2026-T1-006', qtyReceived:4,  ratePkg:42, currentQty:320  },
      { id:'RL-T1-007', size:26,    gsm:120, bf:14, reels:8,  weightKg:640,  colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack A3', supplier:'Standard Supplier',  poRef:'PO-2026-T1-007', qtyReceived:8,  ratePkg:44, currentQty:640  },
      { id:'RL-T1-008', size:26.5,  gsm:120, bf:12, reels:1,  weightKg:80,   colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack A3', supplier:'Standard Supplier',  poRef:'PO-2026-T1-008', qtyReceived:1,  ratePkg:44, currentQty:80   },
      { id:'RL-T1-009', size:27,    gsm:120, bf:18, reels:2,  weightKg:216,  colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack B1', supplier:'Standard Supplier',  poRef:'PO-2026-T1-009', qtyReceived:2,  ratePkg:44, currentQty:216  },
      { id:'RL-T1-010', size:27.5,  gsm:120, bf:18, reels:2,  weightKg:216,  colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack B1', supplier:'Standard Supplier',  poRef:'PO-2026-T1-010', qtyReceived:2,  ratePkg:44, currentQty:216  },
      { id:'RL-T1-011', size:27.5,  gsm:120, bf:14, reels:11, weightKg:924,  colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack B1', supplier:'Standard Supplier',  poRef:'PO-2026-T1-011', qtyReceived:11, ratePkg:44, currentQty:924  },
      { id:'RL-T1-012', size:28,    gsm:120, bf:14, reels:7,  weightKg:588,  colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack B1', supplier:'Standard Supplier',  poRef:'PO-2026-T1-012', qtyReceived:7,  ratePkg:44, currentQty:588  },
      { id:'RL-T1-013', size:31,    gsm:150, bf:18, reels:1,  weightKg:108,  colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack B2', supplier:'Standard Supplier',  poRef:'PO-2026-T1-013', qtyReceived:1,  ratePkg:46, currentQty:108  },
      { id:'RL-T1-014', size:32,    gsm:180, bf:18, reels:16, weightKg:1728, colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack B2', supplier:'Standard Supplier',  poRef:'PO-2026-T1-014', qtyReceived:16, ratePkg:50, currentQty:1728 },
      { id:'RL-T1-015', size:32,    gsm:150, bf:18, reels:11, weightKg:990,  colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack B2', supplier:'Standard Supplier',  poRef:'PO-2026-T1-015', qtyReceived:11, ratePkg:46, currentQty:990  },
      { id:'RL-T1-016', size:32.5,  gsm:180, bf:18, reels:3,  weightKg:324,  colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack B3', supplier:'Standard Supplier',  poRef:'PO-2026-T1-016', qtyReceived:3,  ratePkg:50, currentQty:324  },
      { id:'RL-T1-017', size:32.5,  gsm:150, bf:18, reels:3,  weightKg:270,  colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack B3', supplier:'Standard Supplier',  poRef:'PO-2026-T1-017', qtyReceived:3,  ratePkg:46, currentQty:270  },
      { id:'RL-T1-018', size:33,    gsm:150, bf:18, reels:13, weightKg:1170, colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack B3', supplier:'Standard Supplier',  poRef:'PO-2026-T1-018', qtyReceived:13, ratePkg:46, currentQty:1170 },
      { id:'RL-T1-019', size:33,    gsm:180, bf:18, reels:40, weightKg:4320, colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack B3', supplier:'Standard Supplier',  poRef:'PO-2026-T1-019', qtyReceived:40, ratePkg:50, currentQty:4320 },
      { id:'RL-T1-020', size:35,    gsm:180, bf:18, reels:2,  weightKg:216,  colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack C1', supplier:'Standard Supplier',  poRef:'PO-2026-T1-020', qtyReceived:2,  ratePkg:50, currentQty:216  },
      { id:'RL-T1-021', size:35,    gsm:150, bf:18, reels:3,  weightKg:270,  colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack C1', supplier:'Standard Supplier',  poRef:'PO-2026-T1-021', qtyReceived:3,  ratePkg:46, currentQty:270  },
      { id:'RL-T1-022', size:39,    gsm:150, bf:18, reels:3,  weightKg:270,  colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack C1', supplier:'Standard Supplier',  poRef:'PO-2026-T1-022', qtyReceived:3,  ratePkg:46, currentQty:270  },
      { id:'RL-T1-023', size:39,    gsm:180, bf:18, reels:1,  weightKg:108,  colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack C1', supplier:'Standard Supplier',  poRef:'PO-2026-T1-023', qtyReceived:1,  ratePkg:50, currentQty:108  },
      { id:'RL-T1-024', size:40,    gsm:180, bf:18, reels:1,  weightKg:108,  colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack C2', supplier:'Standard Supplier',  poRef:'PO-2026-T1-024', qtyReceived:1,  ratePkg:50, currentQty:108  },
      { id:'RL-T1-025', size:40,    gsm:150, bf:18, reels:2,  weightKg:180,  colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack C2', supplier:'Standard Supplier',  poRef:'PO-2026-T1-025', qtyReceived:2,  ratePkg:46, currentQty:180  },
      { id:'RL-T1-026', size:40,    gsm:100, bf:14, reels:8,  weightKg:480,  colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack C2', supplier:'Standard Supplier',  poRef:'PO-2026-T1-026', qtyReceived:8,  ratePkg:42, currentQty:480  },
      { id:'RL-T1-027', size:42,    gsm:180, bf:18, reels:5,  weightKg:540,  colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack C2', supplier:'Standard Supplier',  poRef:'PO-2026-T1-027', qtyReceived:5,  ratePkg:50, currentQty:540  },
      { id:'RL-T1-028', size:42,    gsm:150, bf:18, reels:5,  weightKg:450,  colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack C2', supplier:'Standard Supplier',  poRef:'PO-2026-T1-028', qtyReceived:5,  ratePkg:46, currentQty:450  },
      { id:'RL-T1-029', size:44,    gsm:100, bf:14, reels:5,  weightKg:300,  colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack C3', supplier:'Standard Supplier',  poRef:'PO-2026-T1-029', qtyReceived:5,  ratePkg:42, currentQty:300  },
      { id:'RL-T1-030', size:46,    gsm:120, bf:18, reels:4,  weightKg:384,  colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack C3', supplier:'Standard Supplier',  poRef:'PO-2026-T1-030', qtyReceived:4,  ratePkg:44, currentQty:384  },
      { id:'RL-T1-031', size:46,    gsm:180, bf:18, reels:7,  weightKg:756,  colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack C3', supplier:'Standard Supplier',  poRef:'PO-2026-T1-031', qtyReceived:7,  ratePkg:50, currentQty:756  },
      { id:'RL-T1-032', size:48,    gsm:180, bf:18, reels:24, weightKg:2592, colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack D1', supplier:'Standard Supplier',  poRef:'PO-2026-T1-032', qtyReceived:24, ratePkg:50, currentQty:2592 },
      { id:'RL-T1-033', size:48,    gsm:150, bf:18, reels:8,  weightKg:720,  colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack D1', supplier:'Standard Supplier',  poRef:'PO-2026-T1-033', qtyReceived:8,  ratePkg:46, currentQty:720  },
      { id:'RL-T1-034', size:48,    gsm:100, bf:14, reels:2,  weightKg:120,  colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack D1', supplier:'Standard Supplier',  poRef:'PO-2026-T1-034', qtyReceived:2,  ratePkg:42, currentQty:120  },
      { id:'RL-T1-035', size:49,    gsm:150, bf:16, reels:2,  weightKg:192,  colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack D1', supplier:'Standard Supplier',  poRef:'PO-2026-T1-035', qtyReceived:2,  ratePkg:46, currentQty:192  },
      { id:'RL-T1-036', size:49,    gsm:180, bf:18, reels:5,  weightKg:540,  colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack D1', supplier:'Standard Supplier',  poRef:'PO-2026-T1-036', qtyReceived:5,  ratePkg:50, currentQty:540  },
      { id:'RL-T1-037', size:49,    gsm:120, bf:16, reels:3,  weightKg:288,  colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack D2', supplier:'Standard Supplier',  poRef:'PO-2026-T1-037', qtyReceived:3,  ratePkg:44, currentQty:288  },
      { id:'RL-T1-038', size:49,    gsm:150, bf:18, reels:3,  weightKg:270,  colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack D2', supplier:'Standard Supplier',  poRef:'PO-2026-T1-038', qtyReceived:3,  ratePkg:46, currentQty:270  },
      { id:'RL-T1-039', size:54,    gsm:100, bf:14, reels:4,  weightKg:240,  colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack D2', supplier:'Standard Supplier',  poRef:'PO-2026-T1-039', qtyReceived:4,  ratePkg:42, currentQty:240  },
      { id:'RL-T1-040', size:57,    gsm:120, bf:14, reels:2,  weightKg:192,  colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack D2', supplier:'Standard Supplier',  poRef:'PO-2026-T1-040', qtyReceived:2,  ratePkg:44, currentQty:192  },
      { id:'RL-T1-041', size:58.25, gsm:100, bf:14, reels:2,  weightKg:120,  colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack D2', supplier:'Standard Supplier',  poRef:'PO-2026-T1-041', qtyReceived:2,  ratePkg:42, currentQty:120  },
      { id:'RL-T1-042', size:58.5,  gsm:120, bf:14, reels:10, weightKg:960,  colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack D3', supplier:'Standard Supplier',  poRef:'PO-2026-T1-042', qtyReceived:10, ratePkg:44, currentQty:960  },
      { id:'RL-T1-043', size:58.5,  gsm:120, bf:12, reels:5,  weightKg:480,  colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack D3', supplier:'Standard Supplier',  poRef:'PO-2026-T1-043', qtyReceived:5,  ratePkg:44, currentQty:480  },
      // TABLE 2 — Extended Sizes
      { id:'RL-T2-001', size:59,    gsm:150, bf:18, reels:13, weightKg:1170, colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack E1', supplier:'Standard Supplier',  poRef:'PO-2026-T2-001', qtyReceived:13, ratePkg:46, currentQty:1170 },
      { id:'RL-T2-002', size:59,    gsm:100, bf:14, reels:9,  weightKg:540,  colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack E1', supplier:'Standard Supplier',  poRef:'PO-2026-T2-002', qtyReceived:9,  ratePkg:42, currentQty:540  },
      { id:'RL-T2-003', size:61,    gsm:120, bf:16, reels:1,  weightKg:96,   colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack E1', supplier:'Standard Supplier',  poRef:'PO-2026-T2-003', qtyReceived:1,  ratePkg:44, currentQty:96   },
      { id:'RL-T2-004', size:61,    gsm:120, bf:14, reels:2,  weightKg:192,  colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack E1', supplier:'Standard Supplier',  poRef:'PO-2026-T2-004', qtyReceived:2,  ratePkg:44, currentQty:192  },
      { id:'RL-T2-005', size:62,    gsm:180, bf:18, reels:2,  weightKg:216,  colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack E2', supplier:'Standard Supplier',  poRef:'PO-2026-T2-005', qtyReceived:2,  ratePkg:50, currentQty:216  },
      { id:'RL-T2-006', size:62,    gsm:140, bf:18, reels:6,  weightKg:504,  colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack E2', supplier:'Standard Supplier',  poRef:'PO-2026-T2-006', qtyReceived:6,  ratePkg:47, currentQty:504  },
      { id:'RL-T2-007', size:64,    gsm:180, bf:16, reels:2,  weightKg:216,  colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack E2', supplier:'Standard Supplier',  poRef:'PO-2026-T2-007', qtyReceived:2,  ratePkg:50, currentQty:216  },
      { id:'RL-T2-008', size:64,    gsm:120, bf:14, reels:3,  weightKg:288,  colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack E2', supplier:'Standard Supplier',  poRef:'PO-2026-T2-008', qtyReceived:3,  ratePkg:44, currentQty:288  },
      { id:'RL-T2-009', size:66,    gsm:150, bf:16, reels:1,  weightKg:96,   colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack E3', supplier:'Standard Supplier',  poRef:'PO-2026-T2-009', qtyReceived:1,  ratePkg:46, currentQty:96   },
      { id:'RL-T2-010', size:72,    gsm:100, bf:14, reels:4,  weightKg:240,  colour:'Kraft',         dateBought:'2026-09-01', status:'In Stock', location:'Rack E3', supplier:'Standard Supplier',  poRef:'PO-2026-T2-010', qtyReceived:4,  ratePkg:42, currentQty:240  },
      // TABLE 2 — Golden Yellow Type
      { id:'RL-GY-001', size:24,    gsm:150, bf:16, reels:4,  weightKg:384,  colour:'Golden Yellow', dateBought:'2026-09-01', status:'In Stock', location:'Rack F1', supplier:'Golden Paper Mills', poRef:'PO-2026-GY-001', qtyReceived:4,  ratePkg:55, currentQty:384  },
      { id:'RL-GY-002', size:28,    gsm:150, bf:16, reels:2,  weightKg:192,  colour:'Golden Yellow', dateBought:'2026-09-01', status:'In Stock', location:'Rack F1', supplier:'Golden Paper Mills', poRef:'PO-2026-GY-002', qtyReceived:2,  ratePkg:55, currentQty:192  },
      { id:'RL-GY-003', size:40,    gsm:200, bf:16, reels:1,  weightKg:128,  colour:'Golden Yellow', dateBought:'2026-09-01', status:'In Stock', location:'Rack F1', supplier:'Golden Paper Mills', poRef:'PO-2026-GY-003', qtyReceived:1,  ratePkg:60, currentQty:128  },
      { id:'RL-GY-004', size:42,    gsm:200, bf:16, reels:2,  weightKg:256,  colour:'Golden Yellow', dateBought:'2026-09-01', status:'In Stock', location:'Rack F2', supplier:'Golden Paper Mills', poRef:'PO-2026-GY-004', qtyReceived:2,  ratePkg:60, currentQty:256  },
      { id:'RL-GY-005', size:44,    gsm:200, bf:16, reels:2,  weightKg:256,  colour:'Golden Yellow', dateBought:'2026-09-01', status:'In Stock', location:'Rack F2', supplier:'Golden Paper Mills', poRef:'PO-2026-GY-005', qtyReceived:2,  ratePkg:60, currentQty:256  },
      { id:'RL-GY-006', size:48,    gsm:150, bf:16, reels:2,  weightKg:192,  colour:'Golden Yellow', dateBought:'2026-09-01', status:'In Stock', location:'Rack F2', supplier:'Golden Paper Mills', poRef:'PO-2026-GY-006', qtyReceived:2,  ratePkg:55, currentQty:192  },
      { id:'RL-GY-007', size:58.5,  gsm:150, bf:16, reels:1,  weightKg:96,   colour:'Golden Yellow', dateBought:'2026-09-01', status:'In Stock', location:'Rack F2', supplier:'Golden Paper Mills', poRef:'PO-2026-GY-007', qtyReceived:1,  ratePkg:55, currentQty:96   },
      { id:'RL-GY-008', size:59,    gsm:200, bf:20, reels:4,  weightKg:512,  colour:'Golden Yellow', dateBought:'2026-09-01', status:'In Stock', location:'Rack F3', supplier:'Golden Paper Mills', poRef:'PO-2026-GY-008', qtyReceived:4,  ratePkg:60, currentQty:512  },
      // TABLE 2 — White Type
      { id:'RL-WH-001', size:54,    gsm:180, bf:18, reels:1,  weightKg:108,  colour:'White',         dateBought:'2026-09-01', status:'In Stock', location:'Rack G1', supplier:'JK Paper Mills',    poRef:'PO-2026-WH-001', qtyReceived:1,  ratePkg:58, currentQty:108  },
      { id:'RL-WH-002', size:56,    gsm:180, bf:18, reels:1,  weightKg:108,  colour:'White',         dateBought:'2026-09-01', status:'In Stock', location:'Rack G1', supplier:'JK Paper Mills',    poRef:'PO-2026-WH-002', qtyReceived:1,  ratePkg:58, currentQty:108  },
    ];

    for (const r of reelStock) {
      await client.query(`
        INSERT INTO reel_stock (id, size, reel_size, gsm, bf, reels, weight_kg, colour, date_bought, status, location, supplier, po_ref, qty_received, rate_pkg, current_qty)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (id) DO NOTHING;
      `, [r.id, r.size, `${r.size}"`, r.gsm, r.bf, r.reels, r.weightKg, r.colour, r.dateBought, r.status, r.location, r.supplier, r.poRef, r.qtyReceived, r.ratePkg, r.currentQty]);

      // Reorder level: default 2 reels
      await client.query(`
        INSERT INTO reorder_levels (reel_id, min_reels)
        VALUES ($1, $2)
        ON CONFLICT (reel_id) DO NOTHING;
      `, [r.id, 2]);
    }

    // 6. Orders
    const orders = [
      { id:'ORD-2026-001', custId:'CUST001', boxSpec:'30x25x20cm 5-ply', ply:'5-ply', gsm:'150 BF20', qty:10000, orderDate:'2026-08-01', quotedPrice:8.5,  orderValue:85000,  deliveryDate:'2026-08-20', status:'Dispatched', dispatchQty:10000, dispatchDate:'2026-08-19', stage:'Dispatch Ready' },
      { id:'ORD-2026-002', custId:'CUST002', boxSpec:'40x30x25cm 3-ply', ply:'3-ply', gsm:'120 BF16', qty:5000,  orderDate:'2026-08-10', quotedPrice:6.2,  orderValue:31000,  deliveryDate:'2026-08-28', status:'In Production', dispatchQty:0,   dispatchDate:null,         stage:'Printing' },
      { id:'ORD-2026-003', custId:'CUST003', boxSpec:'25x20x15cm 3-ply', ply:'3-ply', gsm:'100 BF14', qty:8000,  orderDate:'2026-08-12', quotedPrice:4.8,  orderValue:38400,  deliveryDate:'2026-08-30', status:'In Production', dispatchQty:0,   dispatchDate:null,         stage:'Corrugation' },
      { id:'ORD-2026-004', custId:'CUST004', boxSpec:'50x40x30cm 7-ply', ply:'7-ply', gsm:'180 BF24', qty:2000,  orderDate:'2026-08-18', quotedPrice:22.5, orderValue:45000,  deliveryDate:'2026-09-05', status:'Confirmed',    dispatchQty:0,   dispatchDate:null,         stage:'' },
      { id:'ORD-2026-005', custId:'CUST001', boxSpec:'30x25x20cm 5-ply', ply:'5-ply', gsm:'150 BF20', qty:15000, orderDate:'2026-08-22', quotedPrice:8.2,  orderValue:123000, deliveryDate:'2026-09-10', status:'Received',     dispatchQty:0,   dispatchDate:null,         stage:'' },
      { id:'ORD-2026-006', custId:'CUST005', boxSpec:'20x15x12cm 3-ply', ply:'3-ply', gsm:'120 BF16', qty:20000, orderDate:'2026-08-25', quotedPrice:3.8,  orderValue:76000,  deliveryDate:'2026-09-15', status:'Received',     dispatchQty:0,   dispatchDate:null,         stage:'' },
    ];

    for (const o of orders) {
      await client.query(`
        INSERT INTO orders (id, cust_id, box_spec, ply, gsm, qty, order_date, quoted_price, order_value, delivery_date, status, dispatch_qty, dispatch_date, stage)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (id) DO NOTHING;
      `, [o.id, o.custId, o.boxSpec, o.ply, o.gsm, o.qty, o.orderDate, o.quotedPrice, o.orderValue, o.deliveryDate, o.status, o.dispatchQty, o.dispatchDate, o.stage]);

      // Seed initial price history
      await client.query(`
        INSERT INTO price_history (cust_id, box_spec, gsm, price, recorded_date)
        VALUES ($1, $2, $3, $4, $5);
      `, [o.custId, o.boxSpec, o.gsm, o.quotedPrice, o.orderDate]);
    }

    // 7. Production Plans
    const plans = [
      { id:'PP-001', linkedOrder:'ORD-2026-002', machine:'Corrugator', plannedDate:'2026-08-26', sequence:1, reelUsed:'RL-T1-001', reelQtyUsed:400, currentStage:'Printing',    qtyPlanned:5000, qtyProduced:5000, wastage:120, status:'In Progress', expectedCompletion:'2026-08-29' },
      { id:'PP-002', linkedOrder:'ORD-2026-003', machine:'Corrugator', plannedDate:'2026-08-27', sequence:2, reelUsed:'RL-T1-004', reelQtyUsed:350, currentStage:'Corrugation', qtyPlanned:8000, qtyProduced:2000, wastage:80,  status:'In Progress', expectedCompletion:'2026-08-31' },
      { id:'PP-003', linkedOrder:'ORD-2026-004', machine:'Corrugator', plannedDate:'2026-08-29', sequence:1, reelUsed:'RL-T1-005', reelQtyUsed:0,   currentStage:'',            qtyPlanned:2000, qtyProduced:0,    wastage:0,   status:'Not Started', expectedCompletion:'2026-09-04' },
      { id:'PP-004', linkedOrder:'ORD-2026-002', machine:'Printer',    plannedDate:'2026-08-28', sequence:1, reelUsed:null,        reelQtyUsed:0,   currentStage:'Printing',    qtyPlanned:5000, qtyProduced:3000, wastage:60,  status:'In Progress', expectedCompletion:'2026-08-29' },
      { id:'PP-005', linkedOrder:'ORD-2026-003', machine:'Die-cutter', plannedDate:'2026-08-30', sequence:1, reelUsed:null,        reelQtyUsed:0,   currentStage:'',            qtyPlanned:8000, qtyProduced:0,    wastage:0,   status:'Not Started', expectedCompletion:'2026-08-31' },
    ];

    for (const p of plans) {
      await client.query(`
        INSERT INTO production_plans (id, linked_order, machine, planned_date, sequence, reel_used, reel_qty_used, current_stage, qty_planned, qty_produced, wastage, status, expected_completion)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO NOTHING;
      `, [p.id, p.linkedOrder, p.machine, p.plannedDate, p.sequence, p.reelUsed, p.reelQtyUsed, p.currentStage, p.qtyPlanned, p.qtyProduced, p.wastage, p.status, p.expectedCompletion]);
    }

    await client.query('COMMIT');
    console.log('✅ Demo data successfully seeded!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  const force = process.argv.includes('--force');
  seed(force)
    .then(() => pool.end())
    .catch(() => {
      pool.end();
      process.exit(1);
    });
}

module.exports = { seed };
