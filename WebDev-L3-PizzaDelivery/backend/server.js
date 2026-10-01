require('dotenv').config();
// use Google and Cloudflare DNS so MongoDB Atlas can be found on any network
require('dns').setServers(['8.8.8.8', '1.1.1.1']);
const express = require('express');
const cors = require('cors');
const http = require('http');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const { startStockJob } = require('./utils/stockCheck');

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/pizzas', require('./routes/pizzas'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/orders', require('./routes/orders'));

app.get('/', (req, res) => res.send('Pizza Town API is running'));

// catches any error a route did not handle itself
app.use((err, req, res, next) => {
  console.log(err.message);
  res.status(500).json({ message: 'Something went wrong on the server' });
});

// socket.io for live order updates
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: process.env.CLIENT_URL } });

io.use((socket, next) => {
  try {
    socket.user = jwt.verify(socket.handshake.auth.token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    next(new Error('Not logged in'));
  }
});

io.on('connection', (socket) => {
  // each user gets their own room, admins share one
  socket.join(`user:${socket.user.id}`);
  if (socket.user.role === 'admin') socket.join('admins');
});

app.set('io', io);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    startStockJob();
  })
  .catch((err) => {
    console.log('Could not connect to MongoDB:', err.message);
    process.exit(1);
  });
