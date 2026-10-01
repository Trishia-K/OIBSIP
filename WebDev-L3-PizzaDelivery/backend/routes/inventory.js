const express = require('express');
const Inventory = require('../models/Inventory');
const { protect, adminOnly } = require('../middleware/auth');
const { checkStock } = require('../utils/stockCheck');

const router = express.Router();

// users need this too, for the pizza builder options
router.get('/', protect, async (req, res) => {
  const items = await Inventory.find().sort({ category: 1, name: 1 });
  res.json(items);
});

router.put('/:id', protect, adminOnly, async (req, res) => {
  const item = await Inventory.findById(req.params.id).catch(() => null);
  if (!item) return res.status(404).json({ message: 'Item not found' });

  for (const field of ['quantity', 'threshold', 'price']) {
    if (req.body[field] === undefined) continue;
    const value = Number(req.body[field]);
    if (Number.isNaN(value) || value < 0) {
      return res.status(400).json({ message: `${field} must be 0 or more` });
    }
    item[field] = value;
  }

  // restocked, so the next drop should send a fresh alert
  if (item.quantity >= item.threshold) item.alertSent = false;

  await item.save();
  res.json(item);
});

// lets the admin run the low stock check without waiting for the schedule
router.post('/check', protect, adminOnly, async (req, res) => {
  const count = await checkStock();
  res.json({
    message: count ? `Checked. ${count} low item(s) found and emailed.` : 'No new low stock items to report',
  });
});

module.exports = router;
