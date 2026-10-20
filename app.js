/* ================================================================
   CORRUGATED BOX MFG — APPLICATION LOGIC
   Data management, rendering, interactions
   ================================================================ */

'use strict';

/* ── Utilities ───────────────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const uid = () => 'ID' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2,4).toUpperCase();
const fmt = n => Number(n).toLocaleString('en-IN');
const fmtCur = n => '₹' + Number(n).toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2});
const today = () => new Date().toISOString().split('T')[0];
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'}) : '—';
const fmtTime = t => t || '—';

/* ── Local Storage DB ────────────────────────────────────────── */
const DB = {
  get(key) { try { return JSON.parse(localStorage.getItem('cbm_' + key)) || []; } catch { return []; } },
  set(key, val) { localStorage.setItem('cbm_' + key, JSON.stringify(val)); },
  getObj(key, def={}) { try { return JSON.parse(localStorage.getItem('cbm_' + key)) || def; } catch { return def; } },
  setObj(key, val) { localStorage.setItem('cbm_' + key, JSON.stringify(val)); }
};

/* ── Seed Demo Data ──────────────────────────────────────────── */
function seedData() {
  const s = DB.getObj('seeded');
  if (s.done && s.version === 2) return;
  // Clear old reel data so new inventory loads fresh
  localStorage.removeItem('cbm_reelstock');
  localStorage.removeItem('cbm_reorderLevels');


  // Employees
  DB.set('employees', [
    { id:'EMP001', name:'Ramesh Kumar',    dept:'Corrugation', designation:'Operator',    shift:'General', doj:'2022-03-15', phone:'9876543210', status:'Active' },
    { id:'EMP002', name:'Suresh Pillai',   dept:'Printing',    designation:'Supervisor',  shift:'Shift A', doj:'2021-07-01', phone:'9876543211', status:'Active' },
    { id:'EMP003', name:'Anand Sharma',    dept:'Die-cutting',  designation:'Operator',   shift:'Shift B', doj:'2023-01-10', phone:'9876543212', status:'Active' },
    { id:'EMP004', name:'Priya Devi',      dept:'Admin',       designation:'Accountant',  shift:'General', doj:'2020-11-20', phone:'9876543213', status:'Active' },
    { id:'EMP005', name:'Vijay Nair',      dept:'Stitching',   designation:'Helper',      shift:'Shift C', doj:'2024-02-05', phone:'9876543214', status:'Active' },
    { id:'EMP006', name:'Lakshmi Bai',     dept:'Dispatch',    designation:'Loader',      shift:'General', doj:'2022-08-12', phone:'9876543215', status:'Active' },
    { id:'EMP007', name:'Karthik Rajan',   dept:'Corrugation', designation:'Technician',  shift:'Shift A', doj:'2021-04-18', phone:'9876543216', status:'Active' },
    { id:'EMP008', name:'Meena Sundaram',  dept:'Quality',     designation:'Inspector',   shift:'General', doj:'2023-06-30', phone:'9876543217', status:'Active' },
  ]);

  // Attendance for today
  const att = [];
  DB.get('employees').forEach(e => {
    att.push({ id: uid(), empId: e.id, empName: e.name, dept: e.dept, date: today(), shift: e.shift,
      checkin: '08:30', checkout: '17:30', status: 'present', workingHours: 9, overtime: 1, remarks: '' });
  });
  DB.set('attendance', att);

  // Customers
  DB.set('customers', [
    { id:'CUST001', name:'Bharat Packaging Ltd',    contact:'Ravi Mehta',    phone:'9845001001', gstin:'29AABCB1234M1Z5', city:'Bangalore', category:'Regular',    creditLimit:500000 },
    { id:'CUST002', name:'Krishna Industries',       contact:'Sunil Kumar',   phone:'9845001002', gstin:'27AABCK5678N2Z3', city:'Mumbai',     category:'Regular',    creditLimit:300000 },
    { id:'CUST003', name:'Annapurna Foods Pvt Ltd', contact:'Asha Patel',    phone:'9845001003', gstin:'24AABCA9012P3Z1', city:'Ahmedabad',  category:'Occasional', creditLimit:150000 },
    { id:'CUST004', name:'Venkateswara Textiles',   contact:'Murugan S',     phone:'9845001004', gstin:'33AABCV3456Q4Z9', city:'Chennai',    category:'Regular',    creditLimit:400000 },
    { id:'CUST005', name:'Sunrise Pharma',           contact:'Dr. Nair',      phone:'9845001005', gstin:'32AABCS7890R5Z7', city:'Kochi',      category:'Occasional', creditLimit:200000 },
  ]);

  // Reel Stock — Company Actual Inventory (from reel stock register)
  // Schema: id, size(inches), gsm, bf, reels(count), weightKg(approx), colour, dateBought, status, location
  DB.set('reelstock', [
    // ── TABLE 1 — Standard Kraft ──────────────────────────────────────────────
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
    // ── TABLE 2 — Extended Sizes ──────────────────────────────────────────────
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
    // ── TABLE 2 — Golden Yellow Type ─────────────────────────────────────────
    { id:'RL-GY-001', size:24,    gsm:150, bf:16, reels:4,  weightKg:384,  colour:'Golden Yellow', dateBought:'2026-09-01', status:'In Stock', location:'Rack F1', supplier:'Golden Paper Mills', poRef:'PO-2026-GY-001', qtyReceived:4,  ratePkg:55, currentQty:384  },
    { id:'RL-GY-002', size:28,    gsm:150, bf:16, reels:2,  weightKg:192,  colour:'Golden Yellow', dateBought:'2026-09-01', status:'In Stock', location:'Rack F1', supplier:'Golden Paper Mills', poRef:'PO-2026-GY-002', qtyReceived:2,  ratePkg:55, currentQty:192  },
    { id:'RL-GY-003', size:40,    gsm:200, bf:16, reels:1,  weightKg:128,  colour:'Golden Yellow', dateBought:'2026-09-01', status:'In Stock', location:'Rack F1', supplier:'Golden Paper Mills', poRef:'PO-2026-GY-003', qtyReceived:1,  ratePkg:60, currentQty:128  },
    { id:'RL-GY-004', size:42,    gsm:200, bf:16, reels:2,  weightKg:256,  colour:'Golden Yellow', dateBought:'2026-09-01', status:'In Stock', location:'Rack F2', supplier:'Golden Paper Mills', poRef:'PO-2026-GY-004', qtyReceived:2,  ratePkg:60, currentQty:256  },
    { id:'RL-GY-005', size:44,    gsm:200, bf:16, reels:2,  weightKg:256,  colour:'Golden Yellow', dateBought:'2026-09-01', status:'In Stock', location:'Rack F2', supplier:'Golden Paper Mills', poRef:'PO-2026-GY-005', qtyReceived:2,  ratePkg:60, currentQty:256  },
    { id:'RL-GY-006', size:48,    gsm:150, bf:16, reels:2,  weightKg:192,  colour:'Golden Yellow', dateBought:'2026-09-01', status:'In Stock', location:'Rack F2', supplier:'Golden Paper Mills', poRef:'PO-2026-GY-006', qtyReceived:2,  ratePkg:55, currentQty:192  },
    { id:'RL-GY-007', size:58.5,  gsm:150, bf:16, reels:1,  weightKg:96,   colour:'Golden Yellow', dateBought:'2026-09-01', status:'In Stock', location:'Rack F2', supplier:'Golden Paper Mills', poRef:'PO-2026-GY-007', qtyReceived:1,  ratePkg:55, currentQty:96   },
    { id:'RL-GY-008', size:59,    gsm:200, bf:20, reels:4,  weightKg:512,  colour:'Golden Yellow', dateBought:'2026-09-01', status:'In Stock', location:'Rack F3', supplier:'Golden Paper Mills', poRef:'PO-2026-GY-008', qtyReceived:4,  ratePkg:60, currentQty:512  },
    // ── TABLE 2 — White Type ──────────────────────────────────────────────────
    { id:'RL-WH-001', size:54,    gsm:180, bf:18, reels:1,  weightKg:108,  colour:'White',         dateBought:'2026-09-01', status:'In Stock', location:'Rack G1', supplier:'JK Paper Mills',    poRef:'PO-2026-WH-001', qtyReceived:1,  ratePkg:58, currentQty:108  },
    { id:'RL-WH-002', size:56,    gsm:180, bf:18, reels:1,  weightKg:108,  colour:'White',         dateBought:'2026-09-01', status:'In Stock', location:'Rack G1', supplier:'JK Paper Mills',    poRef:'PO-2026-WH-002', qtyReceived:1,  ratePkg:58, currentQty:108  },
  ]);

  // Orders
  DB.set('orders', [
    { id:'ORD-2026-001', custId:'CUST001', custName:'Bharat Packaging Ltd',    boxSpec:'30x25x20cm 5-ply', ply:'5-ply', gsm:'150 BF20', qty:10000, orderDate:'2026-08-01', quotedPrice:8.5,  orderValue:85000,  deliveryDate:'2026-08-20', status:'Dispatched', dispatchQty:10000, dispatchDate:'2026-08-19', stage:'Dispatch Ready' },
    { id:'ORD-2026-002', custId:'CUST002', custName:'Krishna Industries',       boxSpec:'40x30x25cm 3-ply', ply:'3-ply', gsm:'120 BF16', qty:5000,  orderDate:'2026-08-10', quotedPrice:6.2,  orderValue:31000,  deliveryDate:'2026-08-28', status:'In Production', dispatchQty:0,   dispatchDate:'',          stage:'Printing' },
    { id:'ORD-2026-003', custId:'CUST003', custName:'Annapurna Foods Pvt Ltd', boxSpec:'25x20x15cm 3-ply', ply:'3-ply', gsm:'100 BF14', qty:8000,  orderDate:'2026-08-12', quotedPrice:4.8,  orderValue:38400,  deliveryDate:'2026-08-30', status:'In Production', dispatchQty:0,   dispatchDate:'',          stage:'Corrugation' },
    { id:'ORD-2026-004', custId:'CUST004', custName:'Venkateswara Textiles',   boxSpec:'50x40x30cm 7-ply', ply:'7-ply', gsm:'180 BF24', qty:2000,  orderDate:'2026-08-18', quotedPrice:22.5, orderValue:45000,  deliveryDate:'2026-09-05', status:'Confirmed',    dispatchQty:0,   dispatchDate:'',          stage:'' },
    { id:'ORD-2026-005', custId:'CUST001', custName:'Bharat Packaging Ltd',    boxSpec:'30x25x20cm 5-ply', ply:'5-ply', gsm:'150 BF20', qty:15000, orderDate:'2026-08-22', quotedPrice:8.2,  orderValue:123000, deliveryDate:'2026-09-10', status:'Received',     dispatchQty:0,   dispatchDate:'',          stage:'' },
    { id:'ORD-2026-006', custId:'CUST005', custName:'Sunrise Pharma',           boxSpec:'20x15x12cm 3-ply', ply:'3-ply', gsm:'120 BF16', qty:20000, orderDate:'2026-08-25', quotedPrice:3.8,  orderValue:76000,  deliveryDate:'2026-09-15', status:'Received',     dispatchQty:0,   dispatchDate:'',          stage:'' },
  ]);

  // Production Plans
  DB.set('production', [
    { id:'PP-001', linkedOrder:'ORD-2026-002', machine:'Corrugator', plannedDate:'2026-08-26', sequence:1, reelUsed:'RL001', reelQtyUsed:400, currentStage:'Printing', qtyPlanned:5000, qtyProduced:5000, wastage:120, status:'In Progress', expectedCompletion:'2026-08-29' },
    { id:'PP-002', linkedOrder:'ORD-2026-003', machine:'Corrugator', plannedDate:'2026-08-27', sequence:2, reelUsed:'RL004', reelQtyUsed:350, currentStage:'Corrugation', qtyPlanned:8000, qtyProduced:2000, wastage:80, status:'In Progress', expectedCompletion:'2026-08-31' },
    { id:'PP-003', linkedOrder:'ORD-2026-004', machine:'Corrugator', plannedDate:'2026-08-29', sequence:1, reelUsed:'RL005', reelQtyUsed:0,   currentStage:'', qtyPlanned:2000, qtyProduced:0, wastage:0, status:'Not Started', expectedCompletion:'2026-09-04' },
    { id:'PP-004', linkedOrder:'ORD-2026-002', machine:'Printer',    plannedDate:'2026-08-28', sequence:1, reelUsed:'',     reelQtyUsed:0,   currentStage:'Printing', qtyPlanned:5000, qtyProduced:3000, wastage:60, status:'In Progress', expectedCompletion:'2026-08-29' },
    { id:'PP-005', linkedOrder:'ORD-2026-003', machine:'Die-cutter', plannedDate:'2026-08-30', sequence:1, reelUsed:'',     reelQtyUsed:0,   currentStage:'', qtyPlanned:8000, qtyProduced:0, wastage:0, status:'Not Started', expectedCompletion:'2026-08-31' },
  ]);

  // Reorder levels
  // Reorder level: alert when reels count falls below 2 for any entry
  const reorderObj = {};
  DB.get('reelstock').forEach(r => { reorderObj[r.id] = 2; });
  DB.setObj('reorderLevels', reorderObj);
  DB.setObj('settings', { companyName: 'BoxCraft Industries Pvt. Ltd.', ageingDays: 30, shiftHours: 9 });
  DB.setObj('seeded', { done: true, version: 2 });
}

/* ================================================================
   NAVIGATION
   ================================================================ */
let currentPage = 'dashboard';

function navigate(page) {
  currentPage = page;
  $$('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.page === page));
  $$('.page').forEach(el => el.classList.toggle('active', el.id === 'page-' + page));
  const titles = {
    dashboard: ['Dashboard', 'Overview of all operations'],
    employees:  ['Module 1 — Employee Attendance', 'Track daily attendance and working hours'],
    warehouse:  ['Module 2 — Warehouse & Reel Stock', 'Manage raw material inventory'],
    production: ['Module 3 — Production Line Planning', 'Track production stages and machine allocation'],
    orders:     ['Module 4 — Order Management', 'Customer orders, dispatch and history'],
    customers:  ['Module 5 — Customer Management', 'Customer master, order history and pricing'],
  };
  const t = titles[page] || ['', ''];
  $('#topbar-title').textContent = t[0];
  $('#topbar-subtitle').textContent = t[1];
  renderPage(page);
}

function renderPage(page) {
  const renders = {
    dashboard:  renderDashboard,
    employees:  renderEmployees,
    warehouse:  renderWarehouse,
    production: renderProduction,
    orders:     renderOrders,
    customers:  renderCustomers,
  };
  if (renders[page]) renders[page]();
}

/* ================================================================
   MODULE: DASHBOARD
   ================================================================ */
function renderDashboard() {
  const employees = DB.get('employees');
  const att = DB.get('attendance').filter(a => a.date === today());
  const orders = DB.get('orders');
  const reels = DB.get('reelstock');
  const production = DB.get('production');
  const reorderLevels = DB.getObj('reorderLevels');

  const activeOrders = orders.filter(o => !['Dispatched','Closed'].includes(o.status)).length;
  const todayDispatched = orders.filter(o => o.dispatchDate === today()).length;
  const presentToday = att.filter(a => a.status === 'present').length;
  const lowStock = reels.filter(r => r.status === 'In Stock' && r.currentQty < (reorderLevels[r.id] || 1000)).length;
  const inProduction = production.filter(p => p.status === 'In Progress').length;

  const totalRevenue = orders.reduce((s, o) => s + (o.orderValue || 0), 0);

  $('#dash-kpi').innerHTML = `
    <div class="kpi-card blue kpi-clickable" onclick="navigate('orders')" title="Go to Order Management">
      <span class="kpi-icon">📋</span>
      <div class="kpi-value">${activeOrders}</div>
      <div class="kpi-label">Active Orders</div>
      <div class="kpi-change up">↑ ${orders.length} total orders</div>
      <div class="kpi-nav-hint">Click to open →</div>
    </div>
    <div class="kpi-card green kpi-clickable" onclick="navigate('employees')" title="Go to Employee Attendance">
      <span class="kpi-icon">👷</span>
      <div class="kpi-value">${presentToday}/${employees.length}</div>
      <div class="kpi-label">Present Today</div>
      <div class="kpi-change ${presentToday >= employees.length * 0.8 ? 'up' : 'down'}">
        ${Math.round(presentToday/employees.length*100)}% attendance rate
      </div>
      <div class="kpi-nav-hint">Click to open →</div>
    </div>
    <div class="kpi-card amber kpi-clickable" onclick="navigate('warehouse')" title="Go to Warehouse & Reel Stock">
      <span class="kpi-icon">📜</span>
      <div class="kpi-value">${reels.filter(r=>r.status==='In Stock').reduce((s,r)=>s+(r.reels||1),0)}</div>
      <div class="kpi-label">Reels In Stock</div>
      <div class="kpi-change ${lowStock > 0 ? 'down' : 'up'}">${lowStock > 0 ? '⚠ ' + lowStock + ' low stock' : '✓ ' + reels.filter(r=>r.status==='In Stock').length + ' variants'}</div>
      <div class="kpi-nav-hint">Click to open →</div>
    </div>
    <div class="kpi-card purple kpi-clickable" onclick="navigate('production')" title="Go to Production Planning">
      <span class="kpi-icon">🏭</span>
      <div class="kpi-value">${inProduction}</div>
      <div class="kpi-label">Production Runs Active</div>
      <div class="kpi-change up">${production.filter(p=>p.status==='Not Started').length} queued</div>
      <div class="kpi-nav-hint">Click to open →</div>
    </div>
    <div class="kpi-card teal kpi-clickable" onclick="navigate('orders')" title="Go to Order Management">
      <span class="kpi-icon">🚚</span>
      <div class="kpi-value">${todayDispatched}</div>
      <div class="kpi-label">Dispatched Today</div>
      <div class="kpi-change up">${orders.filter(o=>o.status==='Dispatched').length} total dispatched</div>
      <div class="kpi-nav-hint">Click to open →</div>
    </div>
    <div class="kpi-card green kpi-clickable" onclick="navigate('customers')" title="Go to Customer Management">
      <span class="kpi-icon">💰</span>
      <div class="kpi-value">${fmtCur(totalRevenue).replace('₹','').split('.')[0]}</div>
      <div class="kpi-label">Total Revenue (₹)</div>
      <div class="kpi-change up">Across all orders</div>
      <div class="kpi-nav-hint">Click to open →</div>
    </div>
  `;

  // Alerts
  let alertsHtml = '';
  if (lowStock > 0) {
    alertsHtml += `<div class="alert-banner warning"><span class="alert-icon">⚠️</span><div class="alert-text"><strong>Low Stock Alert</strong>${lowStock} reel variant(s) are below reorder level. Visit Warehouse module to review.</div></div>`;
  }
  const overdueOrders = orders.filter(o => o.deliveryDate < today() && !['Dispatched','Closed'].includes(o.status));
  if (overdueOrders.length > 0) {
    alertsHtml += `<div class="alert-banner danger"><span class="alert-icon">🚨</span><div class="alert-text"><strong>Overdue Deliveries</strong>${overdueOrders.length} order(s) past their delivery date: ${overdueOrders.map(o=>o.id).join(', ')}</div></div>`;
  }
  $('#dash-alerts').innerHTML = alertsHtml;

  // Recent orders
  const recentOrders = [...orders].sort((a,b)=>b.orderDate.localeCompare(a.orderDate)).slice(0,5);
  $('#dash-recent-orders').innerHTML = `
    <div class="table-wrapper">
    <table><thead><tr>
      <th>Order No.</th><th>Customer</th><th>Box Spec</th><th>Qty</th><th>Value</th><th>Status</th>
    </tr></thead><tbody>
      ${recentOrders.map(o => `<tr>
        <td class="td-mono">${o.id}</td>
        <td>${o.custName}</td>
        <td class="text-sm text-muted">${o.boxSpec}</td>
        <td>${fmt(o.qty)}</td>
        <td>${fmtCur(o.orderValue)}</td>
        <td>${statusBadge(o.status)}</td>
      </tr>`).join('')}
    </tbody></table></div>`;

  // Orders in production
  const liveProduction = DB.get('production').filter(p => p.status === 'In Progress');
  $('#dash-live-production').innerHTML = liveProduction.length === 0 ? '<div class="empty-state"><span class="empty-icon">🏭</span><p>No active production runs</p></div>' :
    liveProduction.map(p => `
      <div class="activity-item">
        <div class="activity-dot" style="background:var(--accent-blue)"></div>
        <div>
          <div class="activity-text"><strong>${p.linkedOrder}</strong> on ${p.machine}</div>
          <div class="activity-time">Stage: ${p.currentStage || 'Queued'} · ${fmt(p.qtyProduced)}/${fmt(p.qtyPlanned)} boxes · ETA ${fmtDate(p.expectedCompletion)}</div>
          ${stagePipeline(p.currentStage)}
        </div>
      </div>`).join('');

  // Reel Stock Dashboard Panel
  renderReelStockDashboard();
}

/* ================================================================
   REEL STOCK DASHBOARD PANEL
   ================================================================ */
function renderReelStockDashboard() {
  const reels = DB.get('reelstock');
  const el = $('#dash-reel-stock');
  if (!el) return;

  const inStock = reels.filter(r => r.status === 'In Stock');
  const totalReels = inStock.reduce((s, r) => s + (r.reels || 1), 0);
  const totalWeightKg = inStock.reduce((s, r) => s + (r.weightKg || r.currentQty || 0), 0);
  const reorderLevels = DB.getObj('reorderLevels');
  const lowStock = inStock.filter(r => (r.reels || 1) <= (reorderLevels[r.id] || 2));

  // GSM breakdown
  const gsmGroups = {};
  inStock.forEach(r => {
    const g = r.gsm + ' GSM'; 
    gsmGroups[g] = (gsmGroups[g] || 0) + (r.reels || 1);
  });
  const maxGsmVal = Math.max(...Object.values(gsmGroups), 1);
  const gsmBars = Object.entries(gsmGroups).sort((a,b)=>b[1]-a[1]).map(([label, val]) => {
    const pct = Math.round(val / maxGsmVal * 100);
    const colour = label.includes('180') ? '#f59e0b' : label.includes('150') ? '#3b82f6' : label.includes('120') ? '#10b981' : label.includes('100') ? '#8b5cf6' : '#ef4444';
    return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
      <div style="width:62px;font-size:11px;color:var(--text-secondary);text-align:right;flex-shrink:0">${label}</div>
      <div style="flex:1;background:var(--bg-tertiary);border-radius:4px;height:14px;overflow:hidden">
        <div style="width:${pct}%;height:100%;background:${colour};border-radius:4px;transition:width 0.6s"></div>
      </div>
      <div style="width:32px;font-size:11px;color:var(--text-primary);font-weight:700">${val}</div>
    </div>`;
  }).join('');

  // Colour type pills
  const colourGroups = {};
  inStock.forEach(r => { colourGroups[r.colour] = (colourGroups[r.colour] || 0) + (r.reels || 1); });
  const colourDot = { 'Kraft': '#b45309', 'White': '#6b7280', 'Golden Yellow': '#d97706', 'Duplex': '#7c3aed' };
  const colourPills = Object.entries(colourGroups).map(([c, n]) =>
    `<span style="display:inline-flex;align-items:center;gap:5px;background:var(--bg-tertiary);padding:4px 10px;border-radius:20px;font-size:12px;margin:3px">
      <span style="width:8px;height:8px;border-radius:50%;background:${colourDot[c]||'#6b7280'};display:inline-block"></span>
      ${c} <strong>(${n})</strong>
    </span>`
  ).join('');

  // Top 12 reel rows — sorted by reel count desc
  const topReels = [...inStock].sort((a,b) => (b.reels||1) - (a.reels||1)).slice(0, 12);
  const tableRows = topReels.map(r => {
    const isLow = (r.reels || 1) <= (reorderLevels[r.id] || 2);
    return `<tr>
      <td class="td-mono" style="font-size:11px">${r.id}</td>
      <td><strong>${r.size}"</strong></td>
      <td><span class="badge badge-blue">${r.gsm}GSM</span></td>
      <td><span class="badge badge-purple">${r.bf}BF</span></td>
      <td><span class="badge badge-amber">${r.colour}</span></td>
      <td style="font-weight:700;color:${isLow?'var(--accent-red)':'var(--accent-green)'};font-size:15px">${r.reels||1}</td>
      <td style="color:var(--text-secondary);font-size:12px">${fmt(r.weightKg||0)} kg</td>
      <td>${r.location}</td>
      ${isLow ? '<td><span class="badge badge-red">⚠ Low</span></td>' : '<td></td>'}
    </tr>`;
  }).join('');

  el.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:16px;margin-bottom:20px">
      <div style="background:linear-gradient(135deg,#1e3a5f,#0f2040);border-radius:12px;padding:18px;text-align:center">
        <div style="font-size:28px;font-weight:800;color:#60a5fa">${fmt(totalReels)}</div>
        <div style="font-size:12px;color:#93c5fd;margin-top:4px">Total Reels In Stock</div>
      </div>
      <div style="background:linear-gradient(135deg,#14532d,#052e16);border-radius:12px;padding:18px;text-align:center">
        <div style="font-size:28px;font-weight:800;color:#4ade80">${inStock.length}</div>
        <div style="font-size:12px;color:#86efac;margin-top:4px">Reel Variants</div>
      </div>
      <div style="background:linear-gradient(135deg,#44403c,#1c1917);border-radius:12px;padding:18px;text-align:center">
        <div style="font-size:28px;font-weight:800;color:#fbbf24">${fmt(Math.round(totalWeightKg))} kg</div>
        <div style="font-size:12px;color:#fde68a;margin-top:4px">Est. Total Weight</div>
      </div>
      <div style="background:linear-gradient(135deg,#4c1d95,#2e1065);border-radius:12px;padding:18px;text-align:center">
        <div style="font-size:28px;font-weight:800;color:${lowStock.length > 0 ? '#f87171' : '#a78bfa'}">${lowStock.length}</div>
        <div style="font-size:12px;color:${lowStock.length > 0 ? '#fca5a5' : '#c4b5fd'};margin-top:4px">Low Stock Alerts</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
      <div style="background:var(--card-bg);border:1px solid var(--border-color);border-radius:12px;padding:16px">
        <div style="font-size:13px;font-weight:600;color:var(--text-secondary);margin-bottom:12px">📊 Reel Count by GSM Grade</div>
        ${gsmBars}
      </div>
      <div style="background:var(--card-bg);border:1px solid var(--border-color);border-radius:12px;padding:16px">
        <div style="font-size:13px;font-weight:600;color:var(--text-secondary);margin-bottom:12px">🎨 By Paper Type</div>
        <div style="display:flex;flex-wrap:wrap">${colourPills}</div>
        ${lowStock.length > 0 ? `<div style="margin-top:12px;padding:10px;background:rgba(239,68,68,0.1);border-radius:8px;border:1px solid rgba(239,68,68,0.3)">
          <div style="font-size:12px;font-weight:600;color:#f87171;margin-bottom:6px">⚠ Low Stock Items:</div>
          ${lowStock.slice(0,4).map(r=>`<div style="font-size:11px;color:var(--text-secondary)">${r.id} — ${r.size}" ${r.gsm}GSM: <strong style="color:#fbbf24">${r.reels} reel(s)</strong></div>`).join('')}
        </div>` : `<div style="margin-top:12px;padding:10px;background:rgba(16,185,129,0.1);border-radius:8px"><div style="font-size:12px;color:#4ade80">✅ All stock levels are healthy</div></div>`}
      </div>
    </div>
    <div class="table-wrapper" style="max-height:320px;overflow-y:auto">
      <table>
        <thead><tr>
          <th>Reel ID</th><th>Size (in)</th><th>GSM</th><th>BF</th><th>Type</th>
          <th>Reels</th><th>Weight (kg)</th><th>Location</th><th>Alert</th>
        </tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>
    <div style="text-align:right;margin-top:10px">
      <button class="btn btn-ghost btn-sm" onclick="navigate('warehouse')">View Full Stock Register →</button>
    </div>
  `;
}

/* ================================================================
   MODULE 1: EMPLOYEES
   ================================================================ */
let empActiveTab = 'attendance';

function renderEmployees() {
  renderEmpTabs();
}

function renderEmpTabs() {
  $$('#page-employees .tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === empActiveTab);
  });
  $$('#page-employees .tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.dataset.panel === empActiveTab);
  });
  if (empActiveTab === 'attendance') renderAttendanceGrid();
  if (empActiveTab === 'employees') renderEmployeeList();
  if (empActiveTab === 'summary') renderAttendanceSummary();
}

function renderEmployeeList() {
  const employees = DB.get('employees');
  const filtered = filterList(employees, $('#emp-search')?.value || '', ['name','dept','designation','id']);
  const deptFilter = $('#emp-dept-filter')?.value || '';
  const final = deptFilter ? filtered.filter(e => e.dept === deptFilter) : filtered;

  $('#emp-table-body').innerHTML = final.map(e => `
    <tr>
      <td class="td-mono">${e.id}</td>
      <td><strong>${e.name}</strong></td>
      <td>${e.dept}</td>
      <td>${e.designation}</td>
      <td><span class="badge badge-blue">${e.shift}</span></td>
      <td>${fmtDate(e.doj)}</td>
      <td>${e.phone}</td>
      <td><span class="badge ${e.status==='Active'?'badge-green':'badge-red'}">${e.status}</span></td>
      <td class="td-actions">
        <button class="btn btn-ghost btn-sm" onclick="editEmployee('${e.id}')">✏ Edit</button>
        <button class="btn btn-ghost btn-sm btn-danger-hover" onclick="deleteEmployee('${e.id}')">🗑</button>
      </td>
    </tr>`).join('') || '<tr><td colspan="9" class="text-center text-muted" style="padding:32px">No employees found</td></tr>';
}

function renderAttendanceGrid() {
  const employees = DB.get('employees');
  const attDate = $('#att-date')?.value || today();
  const deptFilter = $('#att-dept-filter')?.value || '';
  const attendance = DB.get('attendance');

  let filtered = employees;
  if (deptFilter) filtered = filtered.filter(e => e.dept === deptFilter);

  const stats = { present:0, absent:0, halfday:0, leave:0, holiday:0 };

  const rows = filtered.map(emp => {
    const att = attendance.find(a => a.empId === emp.id && a.date === attDate) || {
      empId: emp.id, date: attDate, status: '', checkin: '', checkout: '', workingHours: 0, overtime: 0, remarks: ''
    };
    if (att.status) stats[att.status] = (stats[att.status] || 0) + 1;

    const statuses = ['present','absent','halfday','leave','holiday'];
    return `<tr>
      <td class="td-mono">${emp.id}</td>
      <td><strong>${emp.name}</strong></td>
      <td><span class="badge badge-blue">${emp.dept}</span></td>
      <td><span class="badge badge-gray">${emp.shift}</span></td>
      <td>
        <div style="display:flex;gap:4px;flex-wrap:wrap">
          ${statuses.map(s => `<button class="att-status-btn ${att.status===s?s:''}" onclick="setAttStatus('${emp.id}','${attDate}','${s}')">${statusShort(s)}</button>`).join('')}
        </div>
      </td>
      <td><input type="time" value="${att.checkin||''}" class="form-control" style="width:110px;padding:4px 8px"
        onchange="updateAttField('${emp.id}','${attDate}','checkin',this.value)"></td>
      <td><input type="time" value="${att.checkout||''}" class="form-control" style="width:110px;padding:4px 8px"
        onchange="updateAttField('${emp.id}','${attDate}','checkout',this.value)"></td>
      <td><span class="badge badge-${att.workingHours>=9?'green':att.workingHours>0?'amber':'gray'}">${att.workingHours||0}h</span></td>
      <td><span class="badge badge-${att.overtime>0?'amber':'gray'}">${att.overtime||0}h</span></td>
      <td><input type="text" value="${att.remarks||''}" class="form-control" style="min-width:120px;padding:4px 8px"
        placeholder="Remarks..." onchange="updateAttField('${emp.id}','${attDate}','remarks',this.value)"></td>
    </tr>`;
  }).join('');

  $('#att-stats-bar').innerHTML = `
    <div class="summary-stats">
      <div class="summary-stat"><div class="s-value" style="color:var(--accent-green)">${stats.present||0}</div><div class="s-label">Present</div></div>
      <div class="summary-stat"><div class="s-value" style="color:var(--accent-red)">${stats.absent||0}</div><div class="s-label">Absent</div></div>
      <div class="summary-stat"><div class="s-value" style="color:var(--accent-amber)">${stats.halfday||0}</div><div class="s-label">Half-day</div></div>
      <div class="summary-stat"><div class="s-value" style="color:var(--accent-purple)">${stats.leave||0}</div><div class="s-label">On Leave</div></div>
      <div class="summary-stat"><div class="s-value" style="color:var(--accent-teal)">${stats.holiday||0}</div><div class="s-label">Holiday</div></div>
      <div class="summary-stat"><div class="s-value" style="color:var(--text-primary)">${filtered.length}</div><div class="s-label">Total</div></div>
    </div>`;

  $('#att-grid-body').innerHTML = rows || '<tr><td colspan="10" class="text-center text-muted" style="padding:32px">No employees to show</td></tr>';
}

function renderAttendanceSummary() {
  const employees = DB.get('employees');
  const attendance = DB.get('attendance');
  const month = $('#summary-month')?.value || today().substr(0, 7);

  const monthAtt = attendance.filter(a => a.date.startsWith(month));
  const rows = employees.map(emp => {
    const empAtt = monthAtt.filter(a => a.empId === emp.id);
    const present = empAtt.filter(a => a.status === 'present').length;
    const absent = empAtt.filter(a => a.status === 'absent').length;
    const halfday = empAtt.filter(a => a.status === 'halfday').length;
    const leave = empAtt.filter(a => a.status === 'leave').length;
    const totalWH = empAtt.reduce((s, a) => s + (a.workingHours || 0), 0);
    const totalOT = empAtt.reduce((s, a) => s + (a.overtime || 0), 0);
    return `<tr>
      <td class="td-mono">${emp.id}</td>
      <td><strong>${emp.name}</strong></td>
      <td>${emp.dept}</td>
      <td><span class="badge badge-green">${present}</span></td>
      <td><span class="badge badge-red">${absent}</span></td>
      <td><span class="badge badge-amber">${halfday}</span></td>
      <td><span class="badge badge-purple">${leave}</span></td>
      <td><span class="badge badge-blue">${totalWH}h</span></td>
      <td><span class="badge badge-amber">${totalOT}h</span></td>
    </tr>`;
  });

  $('#att-summary-body').innerHTML = rows.join('') || '<tr><td colspan="9" class="text-center text-muted" style="padding:32px">No data for selected month</td></tr>';
}

function setAttStatus(empId, date, status) {
  let att = DB.get('attendance');
  let record = att.find(a => a.empId === empId && a.date === date);
  if (!record) {
    const emp = DB.get('employees').find(e => e.id === empId);
    record = { id: uid(), empId, empName: emp?.name || '', dept: emp?.dept || '', date, shift: emp?.shift || '', checkin: '', checkout: '', workingHours: 0, overtime: 0, remarks: '' };
    att.push(record);
  }
  record.status = record.status === status ? '' : status;
  if (status === 'holiday' || status === 'absent') { record.checkin = ''; record.checkout = ''; record.workingHours = 0; record.overtime = 0; }
  DB.set('attendance', att);
  renderAttendanceGrid();
}

function updateAttField(empId, date, field, value) {
  let att = DB.get('attendance');
  let record = att.find(a => a.empId === empId && a.date === date);
  if (!record) { const emp = DB.get('employees').find(e => e.id === empId); record = { id: uid(), empId, empName: emp?.name||'', dept: emp?.dept||'', date, shift: emp?.shift||'', checkin:'', checkout:'', status:'', workingHours:0, overtime:0, remarks:'' }; att.push(record); }
  record[field] = value;
  if (record.checkin && record.checkout) {
    const [h1,m1] = record.checkin.split(':').map(Number);
    const [h2,m2] = record.checkout.split(':').map(Number);
    const totalMins = (h2*60+m2) - (h1*60+m1);
    const settings = DB.getObj('settings');
    const shiftMins = (settings.shiftHours || 9) * 60;
    record.workingHours = Math.max(0, Math.round(totalMins / 60 * 10) / 10);
    record.overtime = Math.max(0, Math.round(Math.max(0, totalMins - shiftMins) / 60 * 10) / 10);
    if (!record.status) record.status = 'present';
  }
  DB.set('attendance', att);
  if (field !== 'remarks') renderAttendanceGrid();
}

function showAddEmployeeModal(existingId = null) {
  const emp = existingId ? DB.get('employees').find(e => e.id === existingId) : null;
  openModal('employee-modal', emp ? 'Edit Employee' : 'Add New Employee', `
    <div class="form-row">
      <div class="form-group"><label>Employee ID</label><input class="form-control" id="emp-id-field" value="${emp?.id || uid().replace('ID','EMP')}" ${emp ? 'readonly' : ''}></div>
      <div class="form-group"><label>Full Name *</label><input class="form-control" id="emp-name-field" placeholder="e.g. Ramesh Kumar" value="${emp?.name||''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Department *</label>
        <select class="form-select" id="emp-dept-field">
          ${['Corrugation','Printing','Die-cutting','Stitching','Dispatch','Admin','Quality','Maintenance'].map(d=>`<option ${emp?.dept===d?'selected':''}>${d}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Designation *</label><input class="form-control" id="emp-desig-field" placeholder="e.g. Operator" value="${emp?.designation||''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Shift Assignment</label>
        <select class="form-select" id="emp-shift-field">
          ${['General','Shift A','Shift B','Shift C'].map(s=>`<option ${emp?.shift===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Date of Joining</label><input type="date" class="form-control" id="emp-doj-field" value="${emp?.doj||today()}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Phone</label><input class="form-control" id="emp-phone-field" value="${emp?.phone||''}"></div>
      <div class="form-group"><label>Status</label>
        <select class="form-select" id="emp-status-field">
          <option ${emp?.status!=='Inactive'?'selected':''}>Active</option>
          <option ${emp?.status==='Inactive'?'selected':''}>Inactive</option>
        </select>
      </div>
    </div>
  `, () => saveEmployee(existingId));
}

function saveEmployee(existingId) {
  const name = $('#emp-name-field').value.trim();
  if (!name) { alert('Name is required'); return; }
  let employees = DB.get('employees');
  const data = {
    id: $('#emp-id-field').value.trim(),
    name, dept: $('#emp-dept-field').value, designation: $('#emp-desig-field').value.trim(),
    shift: $('#emp-shift-field').value, doj: $('#emp-doj-field').value,
    phone: $('#emp-phone-field').value, status: $('#emp-status-field').value
  };
  if (existingId) { const idx = employees.findIndex(e => e.id === existingId); employees[idx] = data; }
  else { employees.push(data); }
  DB.set('employees', employees);
  closeModal();
  renderEmployeeList();
}

function editEmployee(id) { showAddEmployeeModal(id); }
function deleteEmployee(id) {
  if (!confirm('Delete this employee?')) return;
  DB.set('employees', DB.get('employees').filter(e => e.id !== id));
  renderEmployeeList();
}

/* ================================================================
   MODULE 2: WAREHOUSE & REEL STOCK
   ================================================================ */
let warehouseActiveTab = 'stock';

function renderWarehouse() {
  renderWarehouseTabs();
}

function renderWarehouseTabs() {
  $$('#page-warehouse .tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === warehouseActiveTab));
  $$('#page-warehouse .tab-panel').forEach(p => p.classList.toggle('active', p.dataset.panel === warehouseActiveTab));
  if (warehouseActiveTab === 'stock') renderStockTable();
  if (warehouseActiveTab === 'ageing') renderAgeingReport();
  if (warehouseActiveTab === 'supplier') renderSupplierHistory();
}

function renderStockTable() {
  const reels = DB.get('reelstock');
  const reorderLevels = DB.getObj('reorderLevels');
  const search = $('#wh-search')?.value?.toLowerCase() || '';
  const colourFilter = $('#wh-colour-filter')?.value || '';
  const statusFilter = $('#wh-status-filter')?.value || '';

  let filtered = reels.filter(r => {
    const searchMatch = !search || JSON.stringify(r).toLowerCase().includes(search);
    const colourMatch = !colourFilter || r.colour === colourFilter;
    const statusMatch = !statusFilter || r.status === statusFilter;
    return searchMatch && colourMatch && statusMatch;
  });

  const inStock = reels.filter(r => r.status === 'In Stock');
  const totalReels  = inStock.reduce((s, r) => s + (r.reels || 1), 0);
  const totalWeightKg = inStock.reduce((s, r) => s + (r.weightKg || r.currentQty || 0), 0);
  const lowStock = inStock.filter(r => (r.reels || 1) <= (reorderLevels[r.id] || 2));

  $('#wh-summary').innerHTML = `
    <div class="summary-stats">
      <div class="summary-stat"><div class="s-value" style="color:var(--accent-blue)">${inStock.length}</div><div class="s-label">Variants In Stock</div></div>
      <div class="summary-stat"><div class="s-value" style="color:var(--accent-green)">${fmt(totalReels)}</div><div class="s-label">Total Reels</div></div>
      <div class="summary-stat"><div class="s-value" style="color:var(--accent-amber)">${fmt(Math.round(totalWeightKg))} kg</div><div class="s-label">Est. Total Weight</div></div>
      <div class="summary-stat"><div class="s-value" style="color:var(--accent-red)">${lowStock.length}</div><div class="s-label">Low Stock Alerts</div></div>
      <div class="summary-stat"><div class="s-value" style="color:var(--accent-purple)">${reels.filter(r=>r.status==='Consumed').length}</div><div class="s-label">Consumed Lots</div></div>
    </div>`;

  if (lowStock.length > 0) {
    $('#wh-alerts').innerHTML = `<div class="alert-banner warning"><span class="alert-icon">⚠️</span><div class="alert-text"><strong>Low Stock Alert</strong>${lowStock.map(r=>`${r.id} (${r.colour} ${r.gsm}GSM ${r.size}"): <strong>${r.reels} reel(s)</strong> remaining`).join('<br>')}</div></div>`;
  } else { $('#wh-alerts').innerHTML = ''; }

  $('#wh-table-body').innerHTML = filtered.map(r => {
    const reorder = reorderLevels[r.id] || 2;
    const reelCount = r.reels || 1;
    const pct = Math.min(100, Math.round(reelCount / (r.qtyReceived || reelCount) * 100));
    const isLow = reelCount <= reorder && r.status === 'In Stock';
    return `<tr>
      <td class="td-mono">${r.id}</td>
      <td><strong>${r.size}"</strong></td>
      <td><span class="badge badge-blue">${r.gsm} GSM</span></td>
      <td><span class="badge badge-purple">${r.bf} BF</span></td>
      <td><span class="badge badge-amber">${r.colour}</span></td>
      <td>${r.supplier || '—'}</td>
      <td>${fmtDate(r.dateBought)}</td>
      <td style="font-weight:700;font-size:18px;color:${isLow?'var(--accent-red)':'var(--accent-green)'}">
        ${reelCount}
        ${isLow ? '<span class="badge badge-red" style="margin-left:6px;font-size:10px">⚠ Low</span>' : ''}
      </td>
      <td style="color:var(--text-secondary)">${fmt(r.weightKg || r.currentQty || 0)} kg</td>
      <td>
        <div class="stock-level">
          <div class="stock-bar"><div class="stock-fill" style="width:${pct}%;background:${isLow?'var(--accent-red)':'var(--accent-green)'}"></div></div>
        </div>
      </td>
      <td>${r.location||'—'}</td>
      <td>${stockStatusBadge(r.status)}</td>
      <td class="td-actions">
        <button class="btn btn-ghost btn-sm" onclick="showStockOutModal('${r.id}')">📤 Issue</button>
        <button class="btn btn-ghost btn-sm" onclick="editReel('${r.id}')">✏</button>
        <button class="btn btn-ghost btn-sm" onclick="deleteReel('${r.id}')">🗑</button>
      </td>
    </tr>`;
  }).join('') || '<tr><td colspan="13" class="text-center text-muted" style="padding:32px">No stock records found</td></tr>';
}


function renderAgeingReport() {
  const settings = DB.getObj('settings');
  const ageingDays = settings.ageingDays || 30;
  const reels = DB.get('reelstock').filter(r => r.status === 'In Stock');
  const today_d = new Date();

  const aged = reels.filter(r => {
    const bought = new Date(r.dateBought);
    const diff = Math.floor((today_d - bought) / 86400000);
    return diff > ageingDays;
  }).map(r => {
    const days = Math.floor((today_d - new Date(r.dateBought)) / 86400000);
    return { ...r, daysInWarehouse: days };
  });

  $('#ageing-body').innerHTML = aged.map(r => `<tr>
    <td class="td-mono">${r.id}</td>
    <td>${r.reelSize}</td>
    <td>${r.colour} ${r.gsm}GSM</td>
    <td>${r.supplier}</td>
    <td>${fmtDate(r.dateBought)}</td>
    <td><span class="badge ${r.daysInWarehouse>60?'badge-red':r.daysInWarehouse>30?'badge-amber':'badge-gray'}">${r.daysInWarehouse} days</span></td>
    <td>${fmt(r.currentQty)} kg</td>
    <td>${fmtCur(r.currentQty * r.ratePkg)}</td>
  </tr>`).join('') || `<tr><td colspan="8" class="text-center text-muted" style="padding:32px">No reels older than ${ageingDays} days</td></tr>`;
}

function renderSupplierHistory() {
  const reels = DB.get('reelstock');
  const suppliers = [...new Set(reels.map(r => r.supplier))];
  const rows = suppliers.map(sup => {
    const lots = reels.filter(r => r.supplier === sup);
    const totalKg = lots.reduce((s,r) => s+r.qtyReceived, 0);
    const totalValue = lots.reduce((s,r) => s+r.qtyReceived*r.ratePkg, 0);
    const avgRate = totalKg ? totalValue/totalKg : 0;
    return `<tr>
      <td><strong>${sup}</strong></td>
      <td>${lots.length}</td>
      <td>${fmt(totalKg)} kg</td>
      <td>${fmtCur(avgRate)}/kg</td>
      <td>${fmtCur(totalValue)}</td>
      <td>${lots.map(l=>`<span class="badge badge-gray" style="margin:2px">${l.colour} ${l.gsm}GSM</span>`).join('')}</td>
      <td>${fmtDate(lots.sort((a,b)=>b.dateBought.localeCompare(a.dateBought))[0]?.dateBought)}</td>
    </tr>`;
  });
  $('#supplier-body').innerHTML = rows.join('') || '<tr><td colspan="7" class="text-center text-muted" style="padding:32px">No supplier data</td></tr>';
}

function showStockInModal() {
  openModal('wh-stockin-modal', '📥 Stock-In — New Reel Arrival', `
    <div class="form-row">
      <div class="form-group"><label>Reel/Lot ID</label><input class="form-control" id="si-id" value="${uid().replace('ID','RL')}"></div>
      <div class="form-group"><label>PO Reference</label><input class="form-control" id="si-po" placeholder="PO-2026-XXX"></div>
    </div>
    <div class="form-row cols-3">
      <div class="form-group"><label>Reel Size (WxD)</label><input class="form-control" id="si-size" placeholder="e.g. 100x80cm"></div>
      <div class="form-group"><label>GSM</label><input type="number" class="form-control" id="si-gsm" placeholder="e.g. 120"></div>
      <div class="form-group"><label>BF (Burst Factor)</label><input type="number" class="form-control" id="si-bf" placeholder="e.g. 16"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Colour / Grade</label>
        <select class="form-select" id="si-colour">
          <option>Kraft</option><option>White</option><option>Golden</option><option>Duplex</option><option>Other</option>
        </select>
      </div>
      <div class="form-group"><label>Supplier *</label><input class="form-control" id="si-supplier" placeholder="Supplier name"></div>
    </div>
    <div class="form-row cols-3">
      <div class="form-group"><label>Date Bought</label><input type="date" class="form-control" id="si-date" value="${today()}"></div>
      <div class="form-group"><label>Quantity Received (kg)</label><input type="number" class="form-control" id="si-qty" placeholder="0"></div>
      <div class="form-group"><label>Rate per kg (₹)</label><input type="number" class="form-control" id="si-rate" placeholder="0.00" step="0.01"></div>
    </div>
    <div class="form-group"><label>Warehouse Location / Rack</label><input class="form-control" id="si-location" placeholder="e.g. Rack A1"></div>
  `, saveStockIn);
}

function saveStockIn() {
  const supplier = $('#si-supplier').value.trim();
  const qty = parseFloat($('#si-qty').value);
  if (!supplier || !qty) { alert('Supplier and Quantity are required'); return; }
  const reels = DB.get('reelstock');
  reels.push({
    id: $('#si-id').value, poRef: $('#si-po').value, reelSize: $('#si-size').value,
    gsm: parseInt($('#si-gsm').value)||0, bf: parseInt($('#si-bf').value)||0,
    colour: $('#si-colour').value, supplier, dateBought: $('#si-date').value,
    qtyReceived: qty, ratePkg: parseFloat($('#si-rate').value)||0, currentQty: qty,
    location: $('#si-location').value, status: 'In Stock'
  });
  DB.set('reelstock', reels);
  closeModal(); renderStockTable();
}

function showStockOutModal(reelId) {
  const reel = DB.get('reelstock').find(r => r.id === reelId);
  const orders = DB.get('orders').filter(o => !['Dispatched','Closed'].includes(o.status));
  openModal('wh-stockout-modal', `📤 Issue Stock — ${reelId}`, `
    <div class="alert-banner info"><span class="alert-icon">ℹ️</span><div class="alert-text">Available: <strong>${fmt(reel.currentQty)} kg</strong> of ${reel.colour} ${reel.gsm}GSM ${reel.reelSize}</div></div>
    <div class="form-group"><label>Linked Order</label>
      <select class="form-select" id="so-order">
        <option value="">— Select Order —</option>
        ${orders.map(o=>`<option value="${o.id}">${o.id} — ${o.custName} (${o.boxSpec})</option>`).join('')}
      </select>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Quantity to Issue (kg)</label><input type="number" class="form-control" id="so-qty" placeholder="0" max="${reel.currentQty}"></div>
      <div class="form-group"><label>Issue Date</label><input type="date" class="form-control" id="so-date" value="${today()}"></div>
    </div>
    <div class="form-group"><label>Remarks</label><input class="form-control" id="so-remarks" placeholder="Reason / Notes"></div>
  `, () => saveStockOut(reelId));
}

function saveStockOut(reelId) {
  const qty = parseFloat($('#so-qty').value);
  const reels = DB.get('reelstock');
  const reel = reels.find(r => r.id === reelId);
  if (!qty || qty > reel.currentQty) { alert('Invalid quantity'); return; }
  reel.currentQty -= qty;
  if (reel.currentQty === 0) reel.status = 'Consumed';
  DB.set('reelstock', reels);
  closeModal(); renderStockTable();
}

function editReel(id) {
  const reel = DB.get('reelstock').find(r => r.id === id);
  openModal('reel-edit-modal', 'Edit Reel Record', `
    <div class="form-row">
      <div class="form-group"><label>Current Qty (kg)</label><input type="number" class="form-control" id="re-qty" value="${reel.currentQty}"></div>
      <div class="form-group"><label>Warehouse Location</label><input class="form-control" id="re-loc" value="${reel.location||''}"></div>
    </div>
    <div class="form-group"><label>Status</label>
      <select class="form-select" id="re-status">
        <option ${reel.status==='In Stock'?'selected':''}>In Stock</option>
        <option ${reel.status==='Reserved for Order'?'selected':''}>Reserved for Order</option>
        <option ${reel.status==='Consumed'?'selected':''}>Consumed</option>
      </select>
    </div>
  `, () => {
    const reels = DB.get('reelstock');
    const r = reels.find(x => x.id === id);
    r.currentQty = parseFloat($('#re-qty').value); r.location = $('#re-loc').value; r.status = $('#re-status').value;
    DB.set('reelstock', reels); closeModal(); renderStockTable();
  });
}

function deleteReel(id) {
  if (!confirm('Delete this reel record?')) return;
  DB.set('reelstock', DB.get('reelstock').filter(r => r.id !== id));
  renderStockTable();
}

/* ================================================================
   MODULE 3: PRODUCTION LINE PLANNING
   ================================================================ */
let prodActiveTab = 'board';

function renderProduction() { renderProductionTabs(); }

function renderProductionTabs() {
  $$('#page-production .tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === prodActiveTab));
  $$('#page-production .tab-panel').forEach(p => p.classList.toggle('active', p.dataset.panel === prodActiveTab));
  if (prodActiveTab === 'board') renderProductionBoard();
  if (prodActiveTab === 'live') renderLiveOrders();
  if (prodActiveTab === 'plans') renderProductionList();
}

const MACHINES = ['Corrugator','Printer','Flexo','Die-cutter','Stitching/Gluing'];
const STAGES = ['Corrugation','Printing','Die-Cutting','Stitching','QC','Packing','Dispatch Ready'];

function renderProductionBoard() {
  const plans = DB.get('production');
  const dateFilter = $('#prod-date-filter')?.value || today();

  const cols = MACHINES.map(machine => {
    const jobs = plans.filter(p => p.machine === machine && (dateFilter ? p.plannedDate === dateFilter : true));
    const cls = machine.toLowerCase().replace('/','-').replace(' ','-');
    return `
      <div class="machine-column">
        <div class="machine-header ${cls}">🏭 ${machine} <span class="text-sm">(${jobs.length})</span></div>
        <div class="machine-jobs">
          ${jobs.length === 0 ? '<div style="color:var(--text-muted);font-size:12px;text-align:center;padding:20px">No jobs scheduled</div>' :
            jobs.map(p => `
              <div class="job-card" onclick="showProdDetail('${p.id}')">
                <div class="job-order">${p.linkedOrder}</div>
                <div class="job-details">
                  Stage: <span class="badge badge-${stageColor(p.currentStage)}" style="padding:2px 6px;font-size:10px">${p.currentStage||'—'}</span><br>
                  ${fmt(p.qtyProduced)}/${fmt(p.qtyPlanned)} boxes
                </div>
                <div class="job-qty">${statusBadge(p.status)}</div>
              </div>`).join('')}
        </div>
      </div>`;
  });

  $('#prod-board').innerHTML = `<div class="production-board">${cols.join('')}</div>`;
}

function renderLiveOrders() {
  const orders = DB.get('orders').filter(o => o.status === 'In Production');
  const production = DB.get('production');

  $('#live-orders-body').innerHTML = orders.map(o => {
    const plans = production.filter(p => p.linkedOrder === o.id);
    const currentStage = plans.find(p => p.status === 'In Progress')?.currentStage || o.stage || '—';
    return `<tr>
      <td class="td-mono">${o.id}</td>
      <td><strong>${o.custName}</strong></td>
      <td class="text-sm">${o.boxSpec}</td>
      <td>${fmt(o.qty)}</td>
      <td>${stagePipeline(currentStage)}</td>
      <td>${fmtDate(o.deliveryDate)}</td>
      <td>${o.deliveryDate < today() ? '<span class="badge badge-red">⚠ Overdue</span>' : '<span class="badge badge-green">On Time</span>'}</td>
    </tr>`;
  }).join('') || '<tr><td colspan="7" class="text-center text-muted" style="padding:32px">No orders currently in production</td></tr>';
}

function renderProductionList() {
  const plans = DB.get('production');
  $('#prod-list-body').innerHTML = plans.map(p => `<tr>
    <td class="td-mono">${p.id}</td>
    <td class="td-mono text-link">${p.linkedOrder}</td>
    <td>${p.machine}</td>
    <td>${fmtDate(p.plannedDate)}</td>
    <td><span class="badge badge-${stageColor(p.currentStage)}">${p.currentStage||'—'}</span></td>
    <td>${fmt(p.qtyPlanned)}</td>
    <td>${fmt(p.qtyProduced)}</td>
    <td>${fmt(p.wastage)}</td>
    <td>${statusBadge(p.status)}</td>
    <td>${fmtDate(p.expectedCompletion)}</td>
    <td class="td-actions">
      <button class="btn btn-ghost btn-sm" onclick="editProdPlan('${p.id}')">✏ Update</button>
      <button class="btn btn-ghost btn-sm" onclick="deleteProdPlan('${p.id}')">🗑</button>
    </td>
  </tr>`).join('') || '<tr><td colspan="11" class="text-center text-muted" style="padding:32px">No production plans</td></tr>';
}

function showAddProdModal() {
  const orders = DB.get('orders').filter(o => ['Confirmed','In Production'].includes(o.status));
  const reels = DB.get('reelstock').filter(r => r.status === 'In Stock');
  openModal('prod-modal', 'New Production Plan', `
    <div class="form-row">
      <div class="form-group"><label>Production Plan ID</label><input class="form-control" id="pp-id" value="PP-${Date.now().toString().slice(-5)}"></div>
      <div class="form-group"><label>Linked Order *</label>
        <select class="form-select" id="pp-order">
          <option value="">— Select Order —</option>
          ${orders.map(o=>`<option value="${o.id}">${o.id} — ${o.custName}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Machine / Line *</label>
        <select class="form-select" id="pp-machine">
          ${MACHINES.map(m=>`<option>${m}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Planned Date</label><input type="date" class="form-control" id="pp-date" value="${today()}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Sequence</label><input type="number" class="form-control" id="pp-seq" value="1" min="1"></div>
      <div class="form-group"><label>Reel/Material Used</label>
        <select class="form-select" id="pp-reel">
          <option value="">— Select Reel —</option>
          ${reels.map(r=>`<option value="${r.id}">${r.id} — ${r.colour} ${r.gsm}GSM (${fmt(r.currentQty)}kg)</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Reel Qty Used (kg)</label><input type="number" class="form-control" id="pp-reel-qty" value="0"></div>
      <div class="form-group"><label>Qty Planned (boxes)</label><input type="number" class="form-control" id="pp-qty-plan" value="0"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Current Stage</label>
        <select class="form-select" id="pp-stage">
          <option value="">Not Started</option>
          ${STAGES.map(s=>`<option>${s}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Status</label>
        <select class="form-select" id="pp-status">
          <option>Not Started</option><option>In Progress</option><option>Completed</option><option>On Hold</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Qty Produced (boxes)</label><input type="number" class="form-control" id="pp-qty-prod" value="0"></div>
      <div class="form-group"><label>Expected Completion</label><input type="date" class="form-control" id="pp-eta" value="${today()}"></div>
    </div>
    <div class="form-group"><label>Wastage / Rejection Qty</label><input type="number" class="form-control" id="pp-waste" value="0"></div>
  `, saveProdPlan);
}

function saveProdPlan(existingId = null) {
  const orderId = $('#pp-order').value;
  if (!orderId) { alert('Please select a linked order'); return; }
  const plans = DB.get('production');
  const data = {
    id: $('#pp-id').value, linkedOrder: orderId, machine: $('#pp-machine').value,
    plannedDate: $('#pp-date').value, sequence: parseInt($('#pp-seq').value)||1,
    reelUsed: $('#pp-reel').value, reelQtyUsed: parseFloat($('#pp-reel-qty').value)||0,
    currentStage: $('#pp-stage').value, qtyPlanned: parseInt($('#pp-qty-plan').value)||0,
    qtyProduced: parseInt($('#pp-qty-prod').value)||0, wastage: parseInt($('#pp-waste').value)||0,
    status: $('#pp-status').value, expectedCompletion: $('#pp-eta').value
  };
  if (existingId) { const idx = plans.findIndex(p => p.id === existingId); plans[idx] = data; }
  else { plans.push(data); }
  // Update linked order status
  const orders = DB.get('orders');
  const ord = orders.find(o => o.id === orderId);
  if (ord && data.status === 'In Progress') { ord.status = 'In Production'; ord.stage = data.currentStage; }
  DB.set('orders', orders);
  DB.set('production', plans);
  closeModal(); renderProductionTabs();
}

function editProdPlan(id) {
  const p = DB.get('production').find(x => x.id === id);
  const orders = DB.get('orders');
  const reels = DB.get('reelstock').filter(r => r.status === 'In Stock');
  openModal('prod-edit-modal', `Update Production Plan — ${id}`, `
    <input type="hidden" id="pp-id" value="${p.id}">
    <div class="form-group"><label>Linked Order</label>
      <select class="form-select" id="pp-order">
        ${orders.map(o=>`<option value="${o.id}" ${o.id===p.linkedOrder?'selected':''}>${o.id} — ${o.custName}</option>`).join('')}
      </select>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Machine</label>
        <select class="form-select" id="pp-machine">${MACHINES.map(m=>`<option ${m===p.machine?'selected':''}>${m}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label>Planned Date</label><input type="date" class="form-control" id="pp-date" value="${p.plannedDate}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Sequence</label><input type="number" class="form-control" id="pp-seq" value="${p.sequence}"></div>
      <div class="form-group"><label>Reel Used</label>
        <select class="form-select" id="pp-reel">
          <option value="">—</option>
          ${reels.map(r=>`<option value="${r.id}" ${r.id===p.reelUsed?'selected':''}>${r.id}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Reel Qty Used (kg)</label><input type="number" class="form-control" id="pp-reel-qty" value="${p.reelQtyUsed}"></div>
      <div class="form-group"><label>Qty Planned</label><input type="number" class="form-control" id="pp-qty-plan" value="${p.qtyPlanned}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Current Stage</label>
        <select class="form-select" id="pp-stage">
          <option value="" ${!p.currentStage?'selected':''}>—</option>
          ${STAGES.map(s=>`<option ${s===p.currentStage?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Status</label>
        <select class="form-select" id="pp-status">
          ${['Not Started','In Progress','Completed','On Hold'].map(s=>`<option ${s===p.status?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Qty Produced</label><input type="number" class="form-control" id="pp-qty-prod" value="${p.qtyProduced}"></div>
      <div class="form-group"><label>Wastage</label><input type="number" class="form-control" id="pp-waste" value="${p.wastage}"></div>
    </div>
    <div class="form-group"><label>Expected Completion</label><input type="date" class="form-control" id="pp-eta" value="${p.expectedCompletion}"></div>
  `, () => saveProdPlan(id));
}

function deleteProdPlan(id) {
  if (!confirm('Delete this production plan?')) return;
  DB.set('production', DB.get('production').filter(p => p.id !== id));
  renderProductionTabs();
}

function showProdDetail(id) {
  const p = DB.get('production').find(x => x.id === id);
  openModal('prod-detail-modal', `Production Plan — ${p.id}`, `
    <div class="form-row">
      <div class="form-group"><label>Linked Order</label><div class="form-control" style="cursor:default">${p.linkedOrder}</div></div>
      <div class="form-group"><label>Machine</label><div class="form-control" style="cursor:default">${p.machine}</div></div>
    </div>
    <div class="form-group"><label>Production Stage Pipeline</label>${stagePipeline(p.currentStage)}</div>
    <div class="form-row cols-3">
      <div class="form-group"><label>Qty Planned</label><div class="form-control" style="cursor:default">${fmt(p.qtyPlanned)} boxes</div></div>
      <div class="form-group"><label>Qty Produced</label><div class="form-control" style="cursor:default">${fmt(p.qtyProduced)} boxes</div></div>
      <div class="form-group"><label>Wastage</label><div class="form-control" style="cursor:default;color:var(--accent-red)">${fmt(p.wastage)} boxes</div></div>
    </div>
    <div class="progress-bar"><div class="progress-fill blue" style="width:${Math.min(100,p.qtyPlanned?Math.round(p.qtyProduced/p.qtyPlanned*100):0)}%"></div></div>
    <div class="text-sm text-muted mt-4">${p.qtyPlanned?Math.round(p.qtyProduced/p.qtyPlanned*100):0}% complete</div>
    <hr class="divider">
    <div class="form-row">
      <div class="form-group"><label>ETA</label><div class="form-control" style="cursor:default">${fmtDate(p.expectedCompletion)}</div></div>
      <div class="form-group"><label>Status</label>${statusBadge(p.status)}</div>
    </div>
  `, null, true);
}

/* ================================================================
   MODULE 4: ORDER MANAGEMENT
   ================================================================ */
let ordersActiveTab = 'current';

function renderOrders() { renderOrdersTabs(); }

function renderOrdersTabs() {
  $$('#page-orders .tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === ordersActiveTab));
  $$('#page-orders .tab-panel').forEach(p => p.classList.toggle('active', p.dataset.panel === ordersActiveTab));
  if (ordersActiveTab === 'current') renderCurrentOrders();
  if (ordersActiveTab === 'past') renderPastOrders();
}

function renderCurrentOrders() {
  const orders = DB.get('orders').filter(o => !['Dispatched','Closed'].includes(o.status));
  const search = $('#cur-order-search')?.value?.toLowerCase() || '';
  const filtered = orders.filter(o => !search || JSON.stringify(o).toLowerCase().includes(search));

  const totalValue = orders.reduce((s,o) => s+o.orderValue, 0);
  $('#cur-order-stats').innerHTML = `
    <div class="summary-stats">
      <div class="summary-stat"><div class="s-value" style="color:var(--accent-blue)">${orders.length}</div><div class="s-label">Active Orders</div></div>
      <div class="summary-stat"><div class="s-value" style="color:var(--accent-green)">${fmtCur(totalValue)}</div><div class="s-label">Total Value</div></div>
      <div class="summary-stat"><div class="s-value" style="color:var(--accent-amber)">${orders.filter(o=>o.status==='In Production').length}</div><div class="s-label">In Production</div></div>
      <div class="summary-stat"><div class="s-value" style="color:var(--accent-red)">${orders.filter(o=>o.deliveryDate<today()).length}</div><div class="s-label">Overdue</div></div>
    </div>`;

  $('#cur-order-body').innerHTML = filtered.map(o => `<tr>
    <td class="td-mono">${o.id}</td>
    <td><strong>${o.custName}</strong></td>
    <td class="text-sm">${o.boxSpec}</td>
    <td>${o.ply}</td>
    <td>${fmt(o.qty)}</td>
    <td>${fmtDate(o.orderDate)}</td>
    <td>${fmtCur(o.quotedPrice)}/box</td>
    <td>${fmtCur(o.orderValue)}</td>
    <td>${fmtDate(o.deliveryDate)} ${o.deliveryDate<today()?'<span class="badge badge-red">Late</span>':''}</td>
    <td>${o.stage ? stagePipeline(o.stage) : '<span class="badge badge-gray">Not Started</span>'}</td>
    <td>${orderStatusBadge(o.status)}</td>
    <td class="td-actions">
      <button class="btn btn-ghost btn-sm" onclick="showUpdateOrderStatus('${o.id}')">📝 Update</button>
      <button class="btn btn-ghost btn-sm" onclick="showDispatchModal('${o.id}')">🚚 Dispatch</button>
    </td>
  </tr>`).join('') || '<tr><td colspan="12" class="text-center text-muted" style="padding:32px">No active orders</td></tr>';
}

function renderPastOrders() {
  const orders = DB.get('orders').filter(o => ['Dispatched','Closed'].includes(o.status));
  const custFilter = $('#past-cust-filter')?.value?.toLowerCase() || '';
  const filtered = orders.filter(o => !custFilter || o.custName.toLowerCase().includes(custFilter));

  $('#past-order-body').innerHTML = filtered.map(o => `<tr>
    <td class="td-mono">${o.id}</td>
    <td><strong>${o.custName}</strong></td>
    <td class="text-sm">${o.boxSpec}</td>
    <td>${fmt(o.qty)}</td>
    <td>${fmtDate(o.orderDate)}</td>
    <td>${fmtDate(o.dispatchDate)}</td>
    <td>${fmtCur(o.quotedPrice)}/box</td>
    <td>${fmtCur(o.orderValue)}</td>
    <td>${orderStatusBadge(o.status)}</td>
  </tr>`).join('') || '<tr><td colspan="9" class="text-center text-muted" style="padding:32px">No past orders</td></tr>';
}

function showAddOrderModal() {
  const customers = DB.get('customers');
  openModal('add-order-modal', '➕ New Customer Order', `
    <div class="form-row">
      <div class="form-group"><label>Order No.</label><input class="form-control" id="ord-id" value="ORD-${new Date().getFullYear()}-${String(DB.get('orders').length+1).padStart(3,'0')}"></div>
      <div class="form-group"><label>Customer *</label>
        <select class="form-select" id="ord-cust">
          <option value="">— Select Customer —</option>
          ${customers.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-group"><label>Box Specification (L×W×H)</label>
      <div style="display:flex;gap:8px;align-items:center">
        <input type="number" class="form-control" id="ord-l" placeholder="Length (cm)" style="flex:1">
        <span style="color:var(--text-muted)">×</span>
        <input type="number" class="form-control" id="ord-w" placeholder="Width (cm)" style="flex:1">
        <span style="color:var(--text-muted)">×</span>
        <input type="number" class="form-control" id="ord-h" placeholder="Height (cm)" style="flex:1">
      </div>
    </div>
    <div class="form-row cols-3">
      <div class="form-group"><label>Ply</label>
        <select class="form-select" id="ord-ply">
          <option>3-ply</option><option>5-ply</option><option>7-ply</option>
        </select>
      </div>
      <div class="form-group"><label>GSM + BF</label>
        <select class="form-select" id="ord-gsm">
          <option>100 BF14</option><option>120 BF16</option><option>150 BF20</option><option>180 BF24</option>
        </select>
      </div>
      <div class="form-group"><label>Quantity (boxes)</label><input type="number" class="form-control" id="ord-qty" placeholder="0"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Order Date</label><input type="date" class="form-control" id="ord-date" value="${today()}"></div>
      <div class="form-group"><label>Expected Delivery Date</label><input type="date" class="form-control" id="ord-del"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Quoted Price (₹ per box)</label><input type="number" class="form-control" id="ord-price" placeholder="0.00" step="0.01"></div>
      <div class="form-group"><label>Order Value (auto)</label><input class="form-control" id="ord-value" readonly placeholder="Auto-calculated"></div>
    </div>
  `, saveOrder);

  // Auto-calc value
  setTimeout(() => {
    const qtyEl = $('#ord-qty'); const priceEl = $('#ord-price'); const valEl = $('#ord-value');
    const calc = () => { valEl.value = (parseFloat(qtyEl.value)||0) * (parseFloat(priceEl.value)||0); };
    qtyEl?.addEventListener('input', calc); priceEl?.addEventListener('input', calc);
  }, 100);
}

function saveOrder() {
  const custId = $('#ord-cust').value; const qty = parseInt($('#ord-qty').value);
  const price = parseFloat($('#ord-price').value);
  if (!custId || !qty) { alert('Customer and quantity are required'); return; }
  const cust = DB.get('customers').find(c => c.id === custId);
  const L = $('#ord-l').value; const W = $('#ord-w').value; const H = $('#ord-h').value;
  const ply = $('#ord-ply').value; const gsm = $('#ord-gsm').value;
  const orders = DB.get('orders');
  orders.push({
    id: $('#ord-id').value, custId, custName: cust.name,
    boxSpec: `${L}x${W}x${H}cm ${ply}`, ply, gsm,
    qty, orderDate: $('#ord-date').value, quotedPrice: price,
    orderValue: qty * price, deliveryDate: $('#ord-del').value,
    status: 'Received', dispatchQty: 0, dispatchDate: '', stage: ''
  });
  // Log price history
  let priceHistory = DB.get('priceHistory');
  priceHistory.push({ custId, custName: cust.name, boxSpec: `${L}x${W}x${H}cm ${ply}`, gsm, price, date: today() });
  DB.set('priceHistory', priceHistory);
  DB.set('orders', orders);
  closeModal(); renderOrdersTabs();
}

function showUpdateOrderStatus(id) {
  const order = DB.get('orders').find(o => o.id === id);
  const statuses = ['Received','Confirmed','In Production','Ready for Dispatch','Dispatched','Closed'];
  openModal('update-status-modal', `Update Order Status — ${id}`, `
    <div class="alert-banner info"><span class="alert-icon">📋</span><div class="alert-text">${order.custName} · ${order.boxSpec} · ${fmt(order.qty)} boxes</div></div>
    <div class="form-group"><label>Current Status</label>${orderStatusBadge(order.status)}</div>
    <div class="form-group"><label>New Status</label>
      <select class="form-select" id="upd-status">
        ${statuses.map(s=>`<option ${s===order.status?'selected':''}>${s}</option>`).join('')}
      </select>
    </div>
  `, () => {
    const orders = DB.get('orders');
    const o = orders.find(x => x.id === id);
    o.status = $('#upd-status').value;
    DB.set('orders', orders); closeModal(); renderOrdersTabs();
  });
}

function showDispatchModal(id) {
  const order = DB.get('orders').find(o => o.id === id);
  openModal('dispatch-modal', `🚚 Dispatch — ${id}`, `
    <div class="alert-banner info"><span class="alert-icon">📦</span><div class="alert-text">${order.custName} · Ordered: ${fmt(order.qty)} · Already dispatched: ${fmt(order.dispatchQty||0)}</div></div>
    <div class="form-row">
      <div class="form-group"><label>Dispatch Quantity (boxes)</label><input type="number" class="form-control" id="disp-qty" value="${order.qty - (order.dispatchQty||0)}" max="${order.qty}"></div>
      <div class="form-group"><label>Dispatch Date</label><input type="date" class="form-control" id="disp-date" value="${today()}"></div>
    </div>
    <div class="form-group"><label>Remarks / Challan No.</label><input class="form-control" id="disp-remarks" placeholder="e.g. DC-2026-001"></div>
  `, () => {
    const orders = DB.get('orders');
    const o = orders.find(x => x.id === id);
    const qty = parseInt($('#disp-qty').value)||0;
    o.dispatchQty = (o.dispatchQty||0) + qty;
    o.dispatchDate = $('#disp-date').value;
    if (o.dispatchQty >= o.qty) o.status = 'Dispatched';
    else o.status = 'Ready for Dispatch';
    DB.set('orders', orders); closeModal(); renderOrdersTabs();
  });
}

/* ================================================================
   MODULE 5: CUSTOMER MANAGEMENT
   ================================================================ */
let custActiveTab = 'master';

function renderCustomers() { renderCustomerTabs(); }

function renderCustomerTabs() {
  $$('#page-customers .tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === custActiveTab));
  $$('#page-customers .tab-panel').forEach(p => p.classList.toggle('active', p.dataset.panel === custActiveTab));
  if (custActiveTab === 'master') renderCustomerMaster();
  if (custActiveTab === 'history') renderCustomerHistory();
  if (custActiveTab === 'ranking') renderCustomerRanking();
}

function renderCustomerMaster() {
  const customers = DB.get('customers');
  const search = $('#cust-search')?.value?.toLowerCase() || '';
  const filtered = customers.filter(c => !search || JSON.stringify(c).toLowerCase().includes(search));

  $('#cust-table-body').innerHTML = filtered.map(c => `<tr>
    <td class="td-mono">${c.id}</td>
    <td><strong>${c.name}</strong></td>
    <td>${c.contact}</td>
    <td>${c.phone}</td>
    <td class="td-mono text-sm">${c.gstin||'—'}</td>
    <td>${c.city}</td>
    <td><span class="badge ${c.category==='Regular'?'badge-green':'badge-amber'}">${c.category}</span></td>
    <td>${fmtCur(c.creditLimit||0)}</td>
    <td class="td-actions">
      <button class="btn btn-ghost btn-sm" onclick="viewCustomerHistory('${c.id}')">📊 History</button>
      <button class="btn btn-ghost btn-sm" onclick="editCustomer('${c.id}')">✏ Edit</button>
      <button class="btn btn-ghost btn-sm" onclick="deleteCustomer('${c.id}')">🗑</button>
    </td>
  </tr>`).join('') || '<tr><td colspan="9" class="text-center text-muted" style="padding:32px">No customers found</td></tr>';
}

function renderCustomerHistory() {
  const custId = $('#hist-cust-select')?.value || '';
  if (!custId) {
    $('#cust-history-content').innerHTML = '<div class="empty-state"><span class="empty-icon">🏢</span><p>Select a customer to view their order history</p></div>';
    return;
  }
  const orders = DB.get('orders').filter(o => o.custId === custId);
  const priceHistory = DB.get('priceHistory').filter(p => p.custId === custId);
  const totalRevenue = orders.reduce((s,o) => s+o.orderValue, 0);
  const cust = DB.get('customers').find(c => c.id === custId);

  $('#cust-history-content').innerHTML = `
    <div class="summary-stats mb-16">
      <div class="summary-stat"><div class="s-value" style="color:var(--accent-blue)">${orders.length}</div><div class="s-label">Total Orders</div></div>
      <div class="summary-stat"><div class="s-value" style="color:var(--accent-green)">${fmtCur(totalRevenue)}</div><div class="s-label">Total Revenue</div></div>
      <div class="summary-stat"><div class="s-value" style="color:var(--accent-amber)">${orders.filter(o=>o.status==='Dispatched'||o.status==='Closed').length}</div><div class="s-label">Completed</div></div>
    </div>
    <div class="table-wrapper mb-16">
    <table><thead><tr><th>Order No.</th><th>Box Spec</th><th>Qty</th><th>Date</th><th>Price/Box</th><th>Total Value</th><th>Status</th></tr></thead>
    <tbody>${orders.map(o=>`<tr>
      <td class="td-mono">${o.id}</td>
      <td class="text-sm">${o.boxSpec}</td>
      <td>${fmt(o.qty)}</td>
      <td>${fmtDate(o.orderDate)}</td>
      <td>${fmtCur(o.quotedPrice)}</td>
      <td>${fmtCur(o.orderValue)}</td>
      <td>${orderStatusBadge(o.status)}</td>
    </tr>`).join('')||'<tr><td colspan="7" class="text-center text-muted" style="padding:24px">No orders yet</td></tr>'}
    </tbody></table></div>
    ${priceHistory.length > 0 ? `
      <div class="card"><div class="card-header"><h3>📈 Price History Log</h3></div>
      <div class="table-wrapper"><table><thead><tr><th>Date</th><th>Box Spec</th><th>Price/Box</th></tr></thead>
      <tbody>${priceHistory.map(p=>`<tr><td>${fmtDate(p.date)}</td><td class="text-sm">${p.boxSpec}</td><td>${fmtCur(p.price)}</td></tr>`).join('')}</tbody>
      </table></div></div>` : ''}`;
}

function renderCustomerRanking() {
  const orders = DB.get('orders');
  const customers = DB.get('customers');
  const ranking = customers.map(c => {
    const custOrders = orders.filter(o => o.custId === c.id);
    return { ...c, revenue: custOrders.reduce((s,o)=>s+o.orderValue,0), orderCount: custOrders.length, totalBoxes: custOrders.reduce((s,o)=>s+o.qty,0) };
  }).sort((a,b) => b.revenue - a.revenue);

  const medalClass = i => i===0?'gold':i===1?'silver':i===2?'bronze':'';

  $('#cust-ranking').innerHTML = ranking.map((c,i) => `
    <div class="customer-rank">
      <div class="rank-number ${medalClass(i)}">${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</div>
      <div class="rank-info">
        <div class="rank-name">${c.name}</div>
        <div class="rank-sub">${c.orderCount} orders · ${fmt(c.totalBoxes)} boxes · ${c.city}</div>
      </div>
      <div class="rank-revenue">${fmtCur(c.revenue)}</div>
    </div>`).join('') || '<div class="empty-state"><span class="empty-icon">🏆</span><p>No customer data available</p></div>';
}

function viewCustomerHistory(id) {
  custActiveTab = 'history';
  renderCustomerTabs();
  setTimeout(() => {
    const sel = $('#hist-cust-select');
    if (sel) { sel.value = id; renderCustomerHistory(); }
  }, 50);
}

function showAddCustomerModal(existingId = null) {
  const c = existingId ? DB.get('customers').find(x => x.id === existingId) : null;
  openModal('add-cust-modal', c ? 'Edit Customer' : 'Add New Customer', `
    <div class="form-row">
      <div class="form-group"><label>Customer ID</label><input class="form-control" id="c-id" value="${c?.id || 'CUST' + String(DB.get('customers').length+1).padStart(3,'0')}" ${c?'readonly':''}></div>
      <div class="form-group"><label>Company Name *</label><input class="form-control" id="c-name" value="${c?.name||''}" placeholder="Registered business name"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Contact Person</label><input class="form-control" id="c-contact" value="${c?.contact||''}"></div>
      <div class="form-group"><label>Phone</label><input class="form-control" id="c-phone" value="${c?.phone||''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>GSTIN</label><input class="form-control" id="c-gstin" value="${c?.gstin||''}" placeholder="e.g. 29AABCB1234M1Z5"></div>
      <div class="form-group"><label>City</label><input class="form-control" id="c-city" value="${c?.city||''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Category</label>
        <select class="form-select" id="c-cat">
          <option ${c?.category==='Regular'?'selected':''}>Regular</option>
          <option ${c?.category==='Occasional'?'selected':''}>Occasional</option>
        </select>
      </div>
      <div class="form-group"><label>Credit Limit (₹)</label><input type="number" class="form-control" id="c-credit" value="${c?.creditLimit||0}"></div>
    </div>
  `, () => saveCustomer(existingId));
}

function saveCustomer(existingId) {
  const name = $('#c-name').value.trim();
  if (!name) { alert('Company name is required'); return; }
  let customers = DB.get('customers');
  const data = { id: $('#c-id').value, name, contact: $('#c-contact').value, phone: $('#c-phone').value, gstin: $('#c-gstin').value, city: $('#c-city').value, category: $('#c-cat').value, creditLimit: parseFloat($('#c-credit').value)||0 };
  if (existingId) { const idx = customers.findIndex(c => c.id === existingId); customers[idx] = data; }
  else { customers.push(data); }
  DB.set('customers', customers);
  closeModal(); renderCustomerMaster();
}

function editCustomer(id) { showAddCustomerModal(id); }
function deleteCustomer(id) {
  if (!confirm('Delete this customer?')) return;
  DB.set('customers', DB.get('customers').filter(c => c.id !== id));
  renderCustomerMaster();
}

/* ================================================================
   MODAL HELPERS
   ================================================================ */
function openModal(id, title, body, onSave, viewOnly = false) {
  const overlay = $('#modal-overlay');
  $('#modal-title').textContent = title;
  $('#modal-body').innerHTML = body;
  if (viewOnly) {
    $('#modal-save-btn').style.display = 'none';
  } else {
    $('#modal-save-btn').style.display = '';
    $('#modal-save-btn').onclick = onSave;
  }
  overlay.classList.add('open');
}

function closeModal() { $('#modal-overlay').classList.remove('open'); }

/* ================================================================
   SHARED HELPERS
   ================================================================ */
function statusShort(s) {
  return { present:'P', absent:'A', halfday:'H', leave:'L', holiday:'HOL' }[s] || s.toUpperCase();
}

function statusBadge(s) {
  const map = {
    'present': 'badge-green', 'absent': 'badge-red', 'halfday': 'badge-amber',
    'leave': 'badge-purple', 'holiday': 'badge-teal',
    'Not Started': 'badge-gray', 'In Progress': 'badge-blue',
    'Completed': 'badge-green', 'On Hold': 'badge-amber',
    'Active': 'badge-green', 'Inactive': 'badge-red',
    'Dispatched': 'badge-green', 'Closed': 'badge-gray',
  };
  return `<span class="badge ${map[s]||'badge-gray'}">${s}</span>`;
}

function orderStatusBadge(s) {
  const map = {
    'Received': 'badge-gray', 'Confirmed': 'badge-blue', 'In Production': 'badge-amber',
    'Ready for Dispatch': 'badge-teal', 'Dispatched': 'badge-green', 'Closed': 'badge-gray'
  };
  return `<span class="badge ${map[s]||'badge-gray'}">${s}</span>`;
}

function stockStatusBadge(s) {
  const map = { 'In Stock': 'badge-green', 'Reserved for Order': 'badge-amber', 'Consumed': 'badge-gray' };
  return `<span class="badge ${map[s]||'badge-gray'}">${s}</span>`;
}

function stageColor(s) {
  const map = { 'Corrugation':'blue', 'Printing':'purple', 'Die-Cutting':'red', 'Stitching':'amber', 'QC':'teal', 'Packing':'orange', 'Dispatch Ready':'green' };
  return map[s] || 'gray';
}

function stagePipeline(activeStage) {
  const stages = ['Corrugation','Printing','Die-Cutting','Stitching','QC','Packing','Dispatch Ready'];
  const activeIdx = stages.indexOf(activeStage);
  return `<div class="pipeline">${stages.map((s, i) => {
    const cls = i < activeIdx ? 'done' : i === activeIdx ? 'active' : 'pending';
    return `<div class="pipeline-stage"><span class="stage-pill ${cls}">${s}</span>${i<stages.length-1?'<span class="pipeline-arrow">→</span>':''}</div>`;
  }).join('')}</div>`;
}

function filterList(arr, query, fields) {
  if (!query) return arr;
  return arr.filter(item => fields.some(f => String(item[f]||'').toLowerCase().includes(query.toLowerCase())));
}

/* ================================================================
   INIT
   ================================================================ */
document.addEventListener('DOMContentLoaded', () => {
  seedData();

  // Navigation
  $$('.nav-item').forEach(el => {
    el.addEventListener('click', () => navigate(el.dataset.page));
  });

  // Modal close
  $('#modal-overlay').addEventListener('click', e => { if (e.target === $('#modal-overlay')) closeModal(); });
  $('#modal-close-btn').addEventListener('click', closeModal);

  // Top bar date
  $('#topbar-date').textContent = new Date().toLocaleDateString('en-IN', { weekday:'short', day:'2-digit', month:'long', year:'numeric' });

  // Navigate to dashboard
  navigate('dashboard');

  // Update alert badge
  const reels = DB.get('reelstock');
  const reorderLevels = DB.getObj('reorderLevels');
  const lowStock = reels.filter(r => r.status === 'In Stock' && r.currentQty < (reorderLevels[r.id] || 1000)).length;
  if (lowStock > 0) {
    const badge = document.querySelector('[data-page="warehouse"] .nav-badge');
    if (badge) badge.textContent = lowStock;
  }
});
