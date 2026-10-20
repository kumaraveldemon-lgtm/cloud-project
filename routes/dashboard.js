// routes/dashboard.js
const express = require('express');
const router = express.Router();
const { query } = require('../db');

router.get('/', async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Parallel aggregate queries for high performance
    const [
      ordersRes,
      employeesRes,
      attendanceRes,
      reelsRes,
      reorderRes,
      prodRes
    ] = await Promise.all([
      query(`
        SELECT o.id, o.cust_id as "custId", c.name as "custName", o.box_spec as "boxSpec",
               o.ply, o.gsm, o.qty, o.order_date as "orderDate", o.quoted_price as "quotedPrice",
               o.order_value as "orderValue", o.delivery_date as "deliveryDate", o.status,
               o.dispatch_qty as "dispatchQty", o.dispatch_date as "dispatchDate", o.stage
        FROM orders o
        JOIN customers c ON o.cust_id = c.id
        ORDER BY o.order_date DESC, o.created_at DESC;
      `),
      query('SELECT id, name, dept, status FROM employees WHERE status = $1;', ['Active']),
      query('SELECT employee_id, status FROM attendance WHERE attendance_date = $1;', [today]),
      query(`
        SELECT r.id, r.size, r.reel_size as "reelSize", r.gsm, r.bf, r.reels,
               r.weight_kg as "weightKg", r.colour, r.date_bought as "dateBought",
               r.status, r.location, r.supplier, r.po_ref as "poRef",
               r.qty_received as "qtyReceived", r.rate_pkg as "ratePkg",
               r.current_qty as "currentQty", COALESCE(rl.min_reels, 2) as "minReels"
        FROM reel_stock r
        LEFT JOIN reorder_levels rl ON r.id = rl.reel_id;
      `),
      query('SELECT reel_id, min_reels FROM reorder_levels;'),
      query(`
        SELECT p.id, p.linked_order as "linkedOrder", p.machine, p.planned_date as "plannedDate",
               p.sequence, p.reel_used as "reelUsed", p.reel_qty_used as "reelQtyUsed",
               p.current_stage as "currentStage", p.qty_planned as "qtyPlanned",
               p.qty_produced as "qtyProduced", p.wastage, p.status,
               p.expected_completion as "expectedCompletion"
        FROM production_plans p
        ORDER BY p.planned_date ASC, p.sequence ASC;
      `)
    ]);

    const orders = ordersRes.rows;
    const activeOrders = orders.filter(o => !['Dispatched', 'Closed'].includes(o.status));
    const todayDispatched = orders.filter(o => {
      if (!o.dispatchDate) return false;
      const dStr = new Date(o.dispatchDate).toISOString().split('T')[0];
      return dStr === today;
    });

    const employees = employeesRes.rows;
    const attToday = attendanceRes.rows;
    const presentToday = attToday.filter(a => a.status === 'present').length;

    const reels = reelsRes.rows;
    const inStockReels = reels.filter(r => r.status === 'In Stock');
    const totalReelsCount = inStockReels.reduce((s, r) => s + (parseInt(r.reels, 10) || 1), 0);
    const totalReelWeightKg = inStockReels.reduce((s, r) => s + (parseFloat(r.weightKg) || parseFloat(r.currentQty) || 0), 0);
    const lowStockReels = inStockReels.filter(r => (parseInt(r.reels, 10) || 1) <= (parseInt(r.minReels, 10) || 2));

    const production = prodRes.rows;
    const inProgressProd = production.filter(p => p.status === 'In Progress');
    const queuedProd = production.filter(p => p.status === 'Not Started');

    const totalRevenue = orders.reduce((s, o) => s + (parseFloat(o.orderValue) || 0), 0);

    // Overdue orders
    const overdueOrders = orders.filter(o => {
      if (!o.deliveryDate) return false;
      const delStr = new Date(o.deliveryDate).toISOString().split('T')[0];
      return delStr < today && !['Dispatched', 'Closed'].includes(o.status);
    });

    // GSM breakdown
    const gsmGroups = {};
    inStockReels.forEach(r => {
      const g = r.gsm + ' GSM';
      gsmGroups[g] = (gsmGroups[g] || 0) + (parseInt(r.reels, 10) || 1);
    });

    // Colour groups
    const colourGroups = {};
    inStockReels.forEach(r => {
      colourGroups[r.colour] = (colourGroups[r.colour] || 0) + (parseInt(r.reels, 10) || 1);
    });

    // Top 12 reels
    const topReels = [...inStockReels]
      .sort((a, b) => (parseInt(b.reels, 10) || 1) - (parseInt(a.reels, 10) || 1))
      .slice(0, 12);

    res.json({
      kpis: {
        activeOrders: activeOrders.length,
        totalOrders: orders.length,
        presentToday,
        totalEmployees: employees.length,
        attendanceRatePct: employees.length ? Math.round((presentToday / employees.length) * 100) : 0,
        reelsInStock: totalReelsCount,
        reelVariantsInStock: inStockReels.length,
        lowStockCount: lowStockReels.length,
        productionActive: inProgressProd.length,
        productionQueued: queuedProd.length,
        dispatchedToday: todayDispatched.length,
        totalDispatched: orders.filter(o => o.status === 'Dispatched').length,
        totalRevenue: Math.round(totalRevenue),
      },
      alerts: {
        lowStock: lowStockReels.map(r => ({
          id: r.id,
          colour: r.colour,
          gsm: r.gsm,
          size: r.size,
          reels: r.reels,
          minReels: r.minReels,
        })),
        overdueOrders: overdueOrders.map(o => ({
          id: o.id,
          custName: o.custName,
          deliveryDate: o.deliveryDate,
          status: o.status,
        })),
      },
      recentOrders: orders.slice(0, 5),
      liveProduction: inProgressProd,
      reelSummary: {
        totalReels: totalReelsCount,
        variantsCount: inStockReels.length,
        totalWeightKg: Math.round(totalReelWeightKg),
        lowStockCount: lowStockReels.length,
        gsmGroups,
        colourGroups,
        topReels,
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
