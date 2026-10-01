const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    name: String,
    custom: Boolean,
    base: String,
    sauce: String,
    cheese: String,
    veggies: [String],
    meats: [String],
    price: Number,
    qty: Number,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [itemSchema],
    total: Number,
    address: String,
    phone: String,
    status: {
      type: String,
      enum: ['Order Received', 'In Kitchen', 'Sent to Delivery', 'Delivered'],
      default: 'Order Received',
    },
    paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    deliveredAt: Date,
    // what the customer said after delivery: '', 'received' or 'not received'
    customerReply: { type: String, enum: ['', 'received', 'not received'], default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);