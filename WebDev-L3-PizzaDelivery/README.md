# Pizza Delivery App

This is my Level 3 project for the Oasis Infobyte Web Development internship. It is a full stack pizza ordering app where users can order pizza and pay for it and an admin manages the orders and the stock.

I built it with React (Vite) for the frontend, Node.js and Express for the backend and MongoDB for the database.

## What the app does

**For users**
- Sign up, then verify the account from a link sent to your email
- Log in 
- Reset your password from an email link if you forget it
- See the pizzas on the menu and add them to the cart
- Build your own pizza in 4 steps: base (5 options), sauce (5 options), cheese, then vegetables (you can pick many)
- See an order summary before paying
- Clicking "Success" confirms the order
- Follow the order status live on the dashboard: Order Received, In Kitchen, Sent to Delivery

**For the admin**
- A separate admin login page at `/admin/login`. There is no way to become an admin from the sign up page
- An inventory page showing the stock of bases, sauces, cheeses and vegetables
- Stock goes down by itself after every paid order
- The admin can change the stock, the alert level and the price of every item
- A node-cron job checks the stock on a schedule and emails the admin when an item goes below its alert level (for example bases below 20)
- An orders page to see all orders and change their status. The user sees the new status straight away because I used Socket.io

Payment: The Razorpay test mode integration is fully written (creating the order and checking the payment signature on the backend). I could not get test keys because Razorpay asks for an Indian PAN number to sign up, and I am in Uganda. So I added a practice payment mode (PAYMENT_MODE=demo) that works the same way: you click Success and the order is confirmed. With Razorpay keys, set PAYMENT_MODE=razorpay and the real checkout opens.

