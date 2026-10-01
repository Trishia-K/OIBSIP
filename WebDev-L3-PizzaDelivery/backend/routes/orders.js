const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const Pizza = require('../models/Pizza');
const Inventory = require('../models/Inventory');
const sendEmail = require('../utils/sendEmail');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// About payments:
// The task asked for Razorpay in test mode. I wrote the Razorpay part (creating
// the order and checking the signature after payment) from their docs, but I
// could not get test keys because signing up asks for an Indian PAN and I am in
// Uganda. So I added a demo mode that works like Razorpay's test screen: you
// click Success and the order goes through. Demo is the default.
// If you have Razorpay keys, put them in .env and set PAYMENT_MODE=razorpay.
const DEMO = process.env.PAYMENT_MODE !== 'razorpay';

const razorpay = DEMO
  ? null
  : new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

const STATUSES = ['Order Received', 'In Kitchen', 'Sent to Delivery', 'Delivered'];

// counts how much of each ingredient an order uses, e.g. { "base:Thin Crust": 2 }
function countIngredients(lines) {
  const needed = {};
  lines.forEach((line) => {
    const keys = [
      `base:${line.base}`,
      `sauce:${line.sauce}`,
      `cheese:${line.cheese}`,
      ...line.veggies.map((v) => `veggie:${v}`),
      ...(line.meats || []).map((m) => `meat:${m}`),
    ];
    keys.forEach((key) => {
      needed[key] = (needed[key] || 0) + line.qty;
    });
  });
  return needed;
}

function splitKey(key) {
  const i = key.indexOf(':');
  return { category: key.slice(0, i), name: key.slice(i + 1) };
}

// works out prices on the server so nobody can change them from the browser
async function buildLines(items) {
  const inventory = await Inventory.find();
  const stock = {};
  inventory.forEach((i) => (stock[`${i.category}:${i.name}`] = i));

  const lines = [];
  for (const item of items) {
    const qty = Math.max(1, parseInt(item.qty, 10) || 1);

    if (item.custom) {
      const base = stock[`base:${item.base}`];
      const sauce = stock[`sauce:${item.sauce}`];
      const cheese = stock[`cheese:${item.cheese}`];
      const veggies = (item.veggies || []).map((v) => stock[`veggie:${v}`]);
      if (!base || !sauce || !cheese || veggies.some((v) => !v)) {
        throw new Error('Your custom pizza has an ingredient we do not stock');
      }
      const price = base.price + sauce.price + cheese.price + veggies.reduce((sum, v) => sum + v.price, 0);
      lines.push({
        name: 'Custom pizza',
        custom: true,
        base: base.name,
        sauce: sauce.name,
        cheese: cheese.name,
        veggies: veggies.map((v) => v.name),
        meats: [],
        price,
        qty,
      });
    } else {
      if (!mongoose.isValidObjectId(item.pizzaId)) throw new Error('A pizza in your cart no longer exists');
      const pizza = await Pizza.findById(item.pizzaId);
      if (!pizza) throw new Error('A pizza in your cart no longer exists');
      lines.push({
        name: pizza.name,
        custom: false,
        base: pizza.base,
        sauce: pizza.sauce,
        cheese: pizza.cheese,
        veggies: pizza.veggies,
        meats: pizza.meats,
        price: pizza.price,
        qty,
      });
    }
  }

  // make sure the kitchen has enough before taking payment
  const needed = countIngredients(lines);
  for (const key in needed) {
    const item = stock[key];
    const { name } = splitKey(key);
    if (!item || item.quantity < needed[key]) {
      throw new Error(`Sorry, we only have ${item ? item.quantity : 0} portion(s) of ${name} left`);
    }
  }

  return lines;
}

router.post('/create', protect, async (req, res) => {
  try {
    const { items, address, phone } = req.body;
    if (!items || !items.length) return res.status(400).json({ message: 'Your cart is empty' });
    if (!address || !phone) return res.status(400).json({ message: 'Add a delivery address and phone number' });

    const lines = await buildLines(items);
    const total = lines.reduce((sum, l) => sum + l.price * l.qty, 0);

    // demo mode: no Razorpay, so I make my own order id
    if (DEMO) {
      const order = await Order.create({
        user: req.user._id,
        items: lines,
        total,
        address,
        phone,
        razorpayOrderId: `demo_${Date.now()}`,
      });
      return res.json({ demo: true, orderId: order._id, razorpayOrderId: order.razorpayOrderId });
    }

    // Razorpay part (not tested since I had no keys).
    // Prices are in UGX but Razorpay test mode works in rupees, so I convert.
    const rzpOrder = await razorpay.orders.create({
      amount: Math.round((total / Number(process.env.UGX_PER_INR || 44)) * 100),
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
    });

    const order = await Order.create({
      user: req.user._id,
      items: lines,
      total,
      address,
      phone,
      razorpayOrderId: rzpOrder.id,
    });

    res.json({
      orderId: order._id,
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    const message = err.message || (err.error && err.error.description) || 'Could not start payment';
    res.status(400).json({ message });
  }
});

router.post('/verify', protect, async (req, res) => {
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const order = await Order.findOne({ _id: orderId, user: req.user._id }).catch(() => null);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (order.paymentStatus === 'paid') return res.json(order);

  if (order.razorpayOrderId !== razorpay_order_id) {
    return res.status(400).json({ message: 'Payment could not be verified' });
  }

  // Razorpay signs order_id|payment_id with the secret key, so this checks it.
  // Demo payments have no signature, so this is skipped in demo mode.
  if (!DEMO) {
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment could not be verified' });
    }
  }

  order.paymentStatus = 'paid';
  order.razorpayPaymentId = razorpay_payment_id;
  await order.save();

  // take the used ingredients out of stock
  const needed = countIngredients(order.items);
  const updates = Object.entries(needed).map(([key, qty]) => ({
    updateOne: { filter: splitKey(key), update: { $inc: { quantity: -qty } } },
  }));
  await Inventory.bulkWrite(updates);
  await Inventory.updateMany({ quantity: { $lt: 0 } }, { quantity: 0 });

  const io = req.app.get('io');
  await order.populate('user', 'name email');
  io.to('admins').emit('order:new', order);
  io.to('admins').emit('inventory:changed');

  res.json(order);
});

router.get('/mine', protect, async (req, res) => {
  const orders = await Order.find({ user: req.user._id, paymentStatus: 'paid' }).sort({ createdAt: -1 });
  res.json(orders);
});

router.get('/', protect, adminOnly, async (req, res) => {
  const orders = await Order.find({ paymentStatus: 'paid' })
    .populate('user', 'name email')
    .sort({ createdAt: -1 });
  res.json(orders);
});

router.put('/:id/status', protect, adminOnly, async (req, res) => {
  const { status } = req.body;
  if (!STATUSES.includes(status)) return res.status(400).json({ message: 'Unknown status' });

  const order = await Order.findById(req.params.id).catch(() => null);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  order.status = status;
  order.deliveredAt = status === 'Delivered' ? new Date() : undefined;
  // any new status clears the old reply, so the customer gets asked again after the next delivery
  order.customerReply = '';
  await order.save();

  // tell the customer straight away
  req.app.get('io').to(`user:${order.user}`).emit('order:status', {
    orderId: order._id,
    status,
    customerReply: '',
  });

  res.json(order);
});

// the customer answers "did you get your order?" after it is marked Delivered
router.put('/:id/reply', protect, async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id })
    .populate('user', 'name email')
    .catch(() => null);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (order.status !== 'Delivered') return res.status(400).json({ message: 'This order is not marked delivered yet' });

  order.customerReply = req.body.received ? 'received' : 'not received';
  await order.save();

  // let the admin page know either way
  req.app.get('io').to('admins').emit('order:reply', {
    orderId: order._id,
    customerReply: order.customerReply,
  });

  // and email the admin if the pizza never arrived
  if (order.customerReply === 'not received') {
    const code = order._id.toString().slice(-6).toUpperCase();
    await sendEmail(
      process.env.ADMIN_EMAIL,
      `Order #${code} was not received`,
      `<p>${order.user.name} (${order.phone}) says order #${code} was marked delivered but did not arrive.</p>
       <p>Address: ${order.address}</p>`
    );
  }

  res.json(order);
});

module.exports = router;