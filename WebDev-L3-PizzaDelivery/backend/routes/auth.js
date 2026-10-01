const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const { protect } = require('../middleware/auth');

const router = express.Router();

function createToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role };
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Fill in all the fields' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ message: 'An account with this email already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const verifyToken = crypto.randomBytes(32).toString('hex');
    await User.create({ name, email, password: hashed, verifyToken });

    const link = `${process.env.CLIENT_URL}/verify/${verifyToken}`;
    console.log('Verification link:', link); // handy while testing
    await sendEmail(
      email,
      'Verify your Pizza Town account',
      `<p>Hi ${name},</p><p>Click the link below to verify your email.</p><p><a href="${link}">${link}</a></p>`
    );

    res.status(201).json({ message: 'Account created. Check your email for the verification link.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not create account' });
  }
});

router.get('/verify/:token', async (req, res) => {
  const user = await User.findOne({ verifyToken: req.params.token });
  if (!user) return res.status(400).json({ message: 'This link is invalid or has already been used' });

  user.isVerified = true;
  user.verifyToken = undefined;
  await user.save();
  res.json({ message: 'Email verified. You can log in now.' });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: (email || '').toLowerCase() });
  if (!user || !(await bcrypt.compare(password || '', user.password))) {
    return res.status(400).json({ message: 'Wrong email or password' });
  }
  if (user.role === 'admin') return res.status(403).json({ message: 'Admins sign in from the admin login page' });
  if (!user.isVerified) return res.status(403).json({ message: 'Verify your email before logging in' });

  res.json({ token: createToken(user), user: publicUser(user) });
});

// separate login for the admin, not linked to the user sign up flow
router.post('/admin-login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: (email || '').toLowerCase(), role: 'admin' });
  if (!user || !(await bcrypt.compare(password || '', user.password))) {
    return res.status(400).json({ message: 'Wrong admin email or password' });
  }
  res.json({ token: createToken(user), user: publicUser(user) });
});

router.post('/forgot-password', async (req, res) => {
  const user = await User.findOne({ email: (req.body.email || '').toLowerCase(), role: 'user' });

  // same reply either way so nobody can check which emails exist
  const reply = { message: 'If that email has an account, a reset link is on its way.' };
  if (!user) return res.json(reply);

  user.resetToken = crypto.randomBytes(32).toString('hex');
  user.resetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save();

  const link = `${process.env.CLIENT_URL}/reset/${user.resetToken}`;
  console.log('Reset link:', link);
  await sendEmail(
    user.email,
    'Reset your Pizza Town password',
    `<p>Hi ${user.name},</p><p>Use this link to set a new password. It expires in 1 hour.</p><p><a href="${link}">${link}</a></p>`
  );
  res.json(reply);
});

router.post('/reset-password/:token', async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  const user = await User.findOne({ resetToken: req.params.token, resetExpires: { $gt: Date.now() } });
  if (!user) return res.status(400).json({ message: 'This reset link is invalid or has expired' });

  user.password = await bcrypt.hash(password, 10);
  user.resetToken = undefined;
  user.resetExpires = undefined;
  await user.save();
  res.json({ message: 'Password changed. You can log in now.' });
});

router.get('/me', protect, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

module.exports = router;
