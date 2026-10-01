const mongoose = require('mongoose');

const pizzaSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  image: String,
  base: String,
  sauce: String,
  cheese: String,
  veggies: [String],
    meats: [String],
});

module.exports = mongoose.model('Pizza', pizzaSchema);
