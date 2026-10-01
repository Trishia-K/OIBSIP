// Run with: npm run seed
// Creates the admin account, the stock items and the menu.
// Running it again resets stock and menu (orders and users stay).
require('dotenv').config();
// use Google and Cloudflare DNS so MongoDB Atlas can be found on any network
require('dns').setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Inventory = require('./models/Inventory');
const Pizza = require('./models/Pizza');

const threshold = Number(process.env.DEFAULT_THRESHOLD) || 20;


const stock = [
  // bases
  { category: 'base', name: 'Thin Crust', price: 12000 },
  { category: 'base', name: 'Classic Hand-Tossed', price: 13000 },
  { category: 'base', name: 'Thick Pan', price: 14000 },
  { category: 'base', name: 'Whole Wheat', price: 14000 },
  { category: 'base', name: 'Cheese-Stuffed Crust', price: 17000 },
  // sauces
  { category: 'sauce', name: 'Classic Tomato', price: 2000 },
  { category: 'sauce', name: 'BBQ', price: 3000 },
  { category: 'sauce', name: 'Peri-Peri', price: 3000 },
  { category: 'sauce', name: 'Garlic Cream', price: 3000 },
  { category: 'sauce', name: 'Pesto', price: 4000 },
  // cheeses
  { category: 'cheese', name: 'Mozzarella', price: 5000 },
  { category: 'cheese', name: 'Cheddar', price: 5000 },
  { category: 'cheese', name: 'Parmesan', price: 6000 },
  { category: 'cheese', name: 'Feta', price: 6000 },
  // vegetables
  { category: 'veggie', name: 'Onions', price: 1000 },
  { category: 'veggie', name: 'Green Pepper', price: 1500 },
  { category: 'veggie', name: 'Tomatoes', price: 1000 },
  { category: 'veggie', name: 'Mushrooms', price: 2500 },
  { category: 'veggie', name: 'Sweet Corn', price: 1500 },
  { category: 'veggie', name: 'Pineapple', price: 2000 },
  { category: 'veggie', name: 'Black Olives', price: 2500 },
  { category: 'veggie', name: 'Chillies', price: 1000 },
  // meats (used by the menu pizzas)
  { category: 'meat', name: 'Chicken', price: 7000 },
  { category: 'meat', name: 'BBQ Beef', price: 7000 },
  { category: 'meat', name: 'Minced Beef', price: 6000 },
  { category: 'meat', name: 'Beef Sausage', price: 5000 },
  { category: 'meat', name: 'Chicken Tikka', price: 8000 },
].map((item) => ({ ...item, quantity: 50, threshold }));


const pizzas = [
  {
    name: 'Margherita',
    description: 'Tomato sauce and plenty of mozzarella. Simple and always good.',
    price: 25000,
    image: '/images/pizzas/margherita.png',
    base: 'Classic Hand-Tossed',
    sauce: 'Classic Tomato',
    cheese: 'Mozzarella',
    veggies: ['Tomatoes'],
    meats: [],
  },
  {
    name: 'Veggie Supreme',
    description: 'Green pepper, onions, sweet corn, mushrooms and olives.',
    price: 30000,
    image: '/images/pizzas/veggie-supreme.png',
    base: 'Thin Crust',
    sauce: 'Classic Tomato',
    cheese: 'Mozzarella',
    veggies: ['Green Pepper', 'Onions', 'Sweet Corn', 'Mushrooms', 'Black Olives'],
    meats: [],
  },
  {
    name: 'Chicken Hawaiian',
    description: 'Chicken and sweet pineapple on a cheesy base.',
    price: 32000,
    image: '/images/pizzas/chicken-hawaiian.png',
    base: 'Classic Hand-Tossed',
    sauce: 'Classic Tomato',
    cheese: 'Mozzarella',
    veggies: ['Pineapple'],
    meats: ['Chicken'],
  },
  {
    name: 'Chicken BBQ',
    description: 'BBQ chicken with onions, mushrooms and melted mozzarella.',
    price: 35000,
    image: '/images/pizzas/chicken-bbq.png',
    base: 'Thick Pan',
    sauce: 'BBQ',
    cheese: 'Mozzarella',
    veggies: ['Onions', 'Mushrooms'],
    meats: ['Chicken'],
  },
  {
    name: 'Beef BBQ',
    description: 'Tender beef in smoky BBQ sauce with onions and green pepper.',
    price: 35000,
    image: '/images/pizzas/beef-bbq.png',
    base: 'Thick Pan',
    sauce: 'BBQ',
    cheese: 'Cheddar',
    veggies: ['Onions', 'Green Pepper'],
    meats: ['BBQ Beef'],
  },
  {
    name: 'Pesto Chicken',
    description: 'Basil pesto, chicken, tomatoes and parmesan.',
    price: 35000,
    image: '/images/pizzas/pesto-chicken.png',
    base: 'Thin Crust',
    sauce: 'Pesto',
    cheese: 'Parmesan',
    veggies: ['Tomatoes'],
    meats: ['Chicken'],
  },
  {
    name: 'Chicken Tikka',
    description: 'Spicy chicken tikka with peri-peri sauce, onions and chillies.',
    price: 36000,
    image: '/images/pizzas/chicken-tikka.png',
    base: 'Classic Hand-Tossed',
    sauce: 'Peri-Peri',
    cheese: 'Mozzarella',
    veggies: ['Onions', 'Chillies', 'Green Pepper'],
    meats: ['Chicken Tikka'],
  },
  {
    name: 'Meat Lovers',
    description: 'Chicken, minced beef and beef sausage on a stuffed crust.',
    price: 42000,
    image: '/images/pizzas/meat-lovers.png',
    base: 'Cheese-Stuffed Crust',
    sauce: 'Classic Tomato',
    cheese: 'Mozzarella',
    veggies: ['Onions'],
    meats: ['Chicken', 'Minced Beef', 'Beef Sausage'],
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  const email = process.env.ADMIN_LOGIN_EMAIL.toLowerCase();
  const password = await bcrypt.hash(process.env.ADMIN_LOGIN_PASSWORD, 10);
  await User.findOneAndUpdate(
    { email },
    { name: 'Admin', email, password, role: 'admin', isVerified: true },
    { upsert: true }
  );

  await Inventory.deleteMany();
  await Inventory.insertMany(stock);

  await Pizza.deleteMany();
  await Pizza.insertMany(pizzas);

  console.log(`Done. Admin login: ${email}`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.log('Seed failed:', err.message);
  process.exit(1);
});