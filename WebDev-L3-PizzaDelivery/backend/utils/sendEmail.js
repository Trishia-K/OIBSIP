const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// returns true if the email went out, false if it failed
async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: `"Pizza Town" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.log('Email not sent:', err.message);
    return false;
  }
}

module.exports = sendEmail;
