const cron = require('node-cron');
const Inventory = require('../models/Inventory');
const sendEmail = require('./sendEmail');

// finds items below their threshold and emails the admin
async function checkStock() {
  const lowItems = await Inventory.find({
    $expr: { $lt: ['$quantity', '$threshold'] },
    alertSent: false,
  });

  if (lowItems.length === 0) return 0;

  const rows = lowItems
    .map((i) => `<li><b>${i.name}</b> (${i.category}): ${i.quantity} left, threshold is ${i.threshold}</li>`)
    .join('');

  const sent = await sendEmail(
    process.env.ADMIN_EMAIL,
    'Low stock alert - Pizza Town',
    `<p>These items are running low:</p><ul>${rows}</ul><p>Restock them from the inventory page.</p>`
  );

  if (sent) {
    await Inventory.updateMany({ _id: { $in: lowItems.map((i) => i._id) } }, { alertSent: true });
    console.log(`Low stock email sent for ${lowItems.length} item(s)`);
  }
  return lowItems.length;
}

function startStockJob() {
  const schedule = process.env.STOCK_CHECK_CRON || '0 * * * *';
  cron.schedule(schedule, () => {
    checkStock().catch((err) => console.log('Stock check failed:', err.message));
  });
  console.log(`Stock check scheduled: ${schedule}`);
}

module.exports = { startStockJob, checkStock };
