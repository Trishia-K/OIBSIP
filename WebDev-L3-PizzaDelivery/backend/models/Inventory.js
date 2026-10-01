const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, enum: ['base', 'sauce', 'cheese', 'veggie', 'meat'], required: true },
    quantity: { type: Number, default: 0, min: 0 },
    threshold: { type: Number, default: 20, min: 0 },
    price: { type: Number, default: 0, min: 0 },
    // stops the same alert email going out every time the job runs
    alertSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Inventory', inventorySchema);