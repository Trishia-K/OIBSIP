import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api, { errorText } from '../api';
import { connectSocket } from '../socket';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Photo from '../components/Photo';
import OrderTracker from '../components/OrderTracker';
import images from '../images';

export default function Dashboard() {
  const { user } = useAuth();
  const { addItem } = useCart();
  const location = useLocation();
    const navigate = useNavigate();
  const [showNotice, setShowNotice] = useState(!!location.state?.justOrdered);

  // show the "payment received" message for 6 seconds, then remove it for good
  useEffect(() => {
    if (!showNotice) return;
    navigate(location.pathname, { replace: true }); // so it doesn't come back on refresh
    const timer = setTimeout(() => setShowNotice(false), 6000);
    return () => clearTimeout(timer);
  }, [showNotice]);
  const [pizzas, setPizzas] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/pizzas'), api.get('/orders/mine')])
      .then(([pizzaRes, orderRes]) => {
        setPizzas(pizzaRes.data);
        setOrders(orderRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // when the kitchen changes a status, update it here straight away
  useEffect(() => {
    const socket = connectSocket();
    socket.on('order:status', ({ orderId, status, customerReply }) => {
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status, customerReply } : o)));
    });
    return () => socket.disconnect();
  }, []);

  function showToast(text) {
    setToast(text);
    setTimeout(() => setToast(''), 2500);
  }

  function handleAdd(pizza) {
    addItem({
      custom: false,
      pizzaId: pizza._id,
      name: pizza.name,
      base: pizza.base,
      sauce: pizza.sauce,
      cheese: pizza.cheese,
      veggies: pizza.veggies,
      price: pizza.price,
      image: pizza.image,
    });
    showToast(`${pizza.name} added to your cart`);
  }

  // the customer says if the delivered order reached them
  async function answer(order, received) {
    setError('');
    try {
      const { data } = await api.put(`/orders/${order._id}/reply`, { received });
      setOrders((prev) => prev.map((o) => (o._id === order._id ? { ...o, customerReply: data.customerReply } : o)));
      if (received) showToast('Enjoy your pizza!');
    } catch (err) {
      setError(errorText(err));
    }
  }

  // a delivered order the customer has not answered about yet
  const toAsk = orders.find((o) => o.status === 'Delivered' && !o.customerReply);

  // once the customer says they got it, the order leaves the dashboard
  const activeOrders = orders.filter((o) => o.customerReply !== 'received');

  const firstName = user.name.split(' ')[0];

  return (
    <div className="page">
      <section className="hero">
        <div className="hero-text">
          <h1>Hungry, {firstName}? Your pizza is 30 minutes away.</h1>
          <p>Choose one from the menu or build your own from the base up. You can follow your order right here until it reaches you.</p>
          <div className="hero-actions">
            <Link to="/build" className="btn">Build your own pizza</Link>
            <a href="#menu" className="btn btn-ghost">See the menu</a>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-plate">
            <Photo src={images.hero} alt="A fresh pizza" className="hero-photo" />
          </div>
        </div>
      </section>

      {showNotice &&  (
        <p className="notice">Payment received and your order is in. You can follow it below.</p>
      )}

      {activeOrders.length > 0 && (
        <section className="section">
          <h2>Your orders</h2>
          <div className="orders">
            {activeOrders.map((order) => (
              <article key={order._id} className="order-card">
                <div className="order-top">
                  <div>
                    <h3>Order #{order._id.slice(-6).toUpperCase()}</h3>
                    <p className="muted">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <strong className="order-total">UGX {order.total.toLocaleString()}</strong>
                </div>
                <p className="order-items">
                  {order.items.map((i) => `${i.qty} x ${i.name}`).join(', ')}
                </p>
                <OrderTracker status={order.status} />
                {order.customerReply === 'not received' && (
                  <p className="order-note">
                    You told us this order did not arrive. The kitchen has been told and will call you on {order.phone}.
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="section" id="menu">
        <h2>On the menu</h2>
        {loading ? (
          <p className="muted">Loading the menu...</p>
        ) : (
          <div className="menu-grid">
            {pizzas.map((pizza) => (
              <article key={pizza._id} className="pizza-card">
                <Photo src={pizza.image} alt={pizza.name} className="pizza-img" />
                <h3>{pizza.name}</h3>
                <p className="muted">{pizza.description}</p>
                <p className="ingredients">
                  {pizza.base} base, {pizza.sauce} sauce, {pizza.cheese}
                </p>
                <div className="pizza-foot">
                  <strong>UGX {pizza.price.toLocaleString()}</strong>
                  <button className="btn btn-small" onClick={() => handleAdd(pizza)}>Add to cart</button>
                </div>
              </article>
            ))}

            <Link to="/build" className="build-card">
              <h3>Make it your way</h3>
              <p>Pick a base, a sauce, your cheese and as many vegetables as you want.</p>
              <span className="btn btn-light btn-small">Start building</span>
            </Link>
          </div>
        )}
      </section>

      {toAsk && (
        <div className="modal-back">
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="ask-title">
            <h2 id="ask-title">Your pizza has been delivered</h2>
            <p className="muted">
              Order #{toAsk._id.slice(-6).toUpperCase()} was marked as delivered. Did you get it?
            </p>
            {error && <p className="error">{error}</p>}
            <div className="modal-actions">
              <button className="btn" onClick={() => answer(toAsk, true)}>Yes, I got it</button>
              <button className="btn btn-ghost" onClick={() => answer(toAsk, false)}>No, I didn't</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}