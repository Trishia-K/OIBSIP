import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errorText } from '../api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Photo from '../components/Photo';
import images from '../images';

// loads the Razorpay checkout script, only used when the backend is in razorpay mode
function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Summary() {
  const { user } = useAuth();
  const { items, changeQty, removeItem, clearCart, total } = useCart();
  const navigate = useNavigate();
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);
  const [demoOrder, setDemoOrder] = useState(null);

  async function handlePay(e) {
    e.preventDefault();
    setError('');
    setPaying(true);

    try {
      const { data } = await api.post('/orders/create', {
        address,
        phone,
        items: items.map((i) => ({
          custom: i.custom,
          pizzaId: i.pizzaId,
          base: i.base,
          sauce: i.sauce,
          cheese: i.cheese,
          veggies: i.veggies,
          qty: i.qty,
        })),
      });

      // demo mode (I could not get Razorpay keys, see backend/routes/orders.js)
      if (data.demo) {
        setDemoOrder(data);
        return;
      }

      // Razorpay checkout, written from their docs but not tested
      const loaded = await loadRazorpay();
      if (!loaded) {
        setError('Could not load Razorpay. Check your internet connection.');
        return setPaying(false);
      }

      const checkout = new window.Razorpay({
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        order_id: data.razorpayOrderId,
        name: 'Pizza Town',
        description: 'Pizza order',
        prefill: { name: user.name, email: user.email, contact: phone },
        theme: { color: '#E23744' },
        handler: async (response) => {
          try {
            await api.post('/orders/verify', { orderId: data.orderId, ...response });
            clearCart();
            navigate('/', { state: { justOrdered: true } });
          } catch (err) {
            setError(errorText(err));
            setPaying(false);
          }
        },
        modal: { ondismiss: () => setPaying(false) },
      });

      checkout.on('payment.failed', () => {
        setError('The payment did not go through. You can try again.');
        setPaying(false);
      });
      checkout.open();
    } catch (err) {
      setError(errorText(err));
      setPaying(false);
    }
  }

  // demo payment: Success confirms the order the same way Razorpay would
  async function demoSuccess() {
    try {
      await api.post('/orders/verify', {
        orderId: demoOrder.orderId,
        razorpay_order_id: demoOrder.razorpayOrderId,
        razorpay_payment_id: `demo_pay_${Date.now()}`,
      });
      clearCart();
      navigate('/', { state: { justOrdered: true } });
    } catch (err) {
      setError(errorText(err));
      setDemoOrder(null);
      setPaying(false);
    }
  }

  function demoFailure() {
    setDemoOrder(null);
    setPaying(false);
    setError('The payment did not go through. You can try again.');
  }

  if (items.length === 0) {
    return (
      <div className="page empty">
        <Photo src={images.empty} alt="Empty plate" className="empty-photo" />
        <h1>Your cart is empty</h1>
        <p className="muted">Add a pizza from the menu or build your own.</p>
        <div className="hero-actions">
          <Link to="/" className="btn">Go to the menu</Link>
          <Link to="/build" className="btn btn-ghost">Build your own</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Order summary</h1>
      <p className="muted">Check everything before you pay.</p>

      <div className="summary">
        <div className="summary-items">
          {items.map((item) => (
            <article key={item.key} className="line">
              <Photo src={item.image} alt={item.name} className="line-img" />
              <div className="line-info">
                <h3>{item.name}</h3>
                <p className="muted">
                  {item.base}, {item.sauce}, {item.cheese}
                  {item.veggies.length > 0 && `, ${item.veggies.join(', ')}`}
                </p>
                <div className="qty">
                  <button onClick={() => changeQty(item.key, item.qty - 1)} aria-label="One less">-</button>
                  <span>{item.qty}</span>
                  <button onClick={() => changeQty(item.key, item.qty + 1)} aria-label="One more">+</button>
                  <button className="remove" onClick={() => removeItem(item.key)}>Remove</button>
                </div>
              </div>
              <strong className="line-price">UGX {item.price * item.qty}</strong>
            </article>
          ))}
        </div>

        <form className="checkout" onSubmit={handlePay}>
          <h2>Delivery</h2>
          <label className="field">
            <span>Address</span>
            <textarea rows="3" value={address} onChange={(e) => setAddress(e.target.value)} required />
          </label>
          <label className="field">
            <span>Phone number</span>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </label>

          <div className="totals">
            <p><span>Subtotal</span><span>UGX {total}</span></p>
            <p><span>Delivery</span><span>Free</span></p>
            <p className="grand"><span>Total</span><span>UGX {total}</span></p>
          </div>

          {error && <p className="error">{error}</p>}
          <button className="btn btn-full" disabled={paying}>{paying ? 'Opening payment...' : `Pay UGX ${total}`}</button>
          <p className="hint">Test mode: no real money is taken. Click Success to confirm the order.</p>
        </form>
      </div>

      {demoOrder && (
        <div className="modal-back">
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="pay-title">
            <h2 id="pay-title">Test payment</h2>
            <p className="muted">This is a practice payment. No money is taken.</p>
            <p className="modal-amount">UGX {total}</p>
            <div className="modal-actions">
              <button className="btn" onClick={demoSuccess}>Success</button>
              <button className="btn btn-ghost" onClick={demoFailure}>Failure</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}