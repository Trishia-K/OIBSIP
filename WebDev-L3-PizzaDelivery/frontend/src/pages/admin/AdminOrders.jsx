import { useEffect, useState } from 'react';
import api, { errorText } from '../../api';
import { connectSocket } from '../../socket';

const statuses = ['Order Received', 'In Kitchen', 'Sent to Delivery', 'Delivered'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/orders')
      .then((res) => setOrders(res.data))
      .catch((err) => setError(errorText(err)))
      .finally(() => setLoading(false));

    const socket = connectSocket();
    // new paid orders show up without refreshing
    socket.on('order:new', (order) => {
      setOrders((prev) => (prev.some((o) => o._id === order._id) ? prev : [order, ...prev]));
    });
    // the customer answered "did you get your order?"
    socket.on('order:reply', ({ orderId, customerReply }) => {
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, customerReply } : o)));
    });
    return () => socket.disconnect();
  }, []);

  async function changeStatus(id, status) {
    setError('');
    try {
      const { data } = await api.put(`/orders/${id}/status`, { status });
      setOrders((prev) =>
        prev.map((o) => (o._id === id ? { ...o, status: data.status, customerReply: data.customerReply } : o))
      );
    } catch (err) {
      setError(errorText(err));
    }
  }

  const shown = filter === 'All' ? orders : orders.filter((o) => o.status === filter);
  const problems = orders.filter((o) => o.customerReply === 'not received').length;

  return (
    <div className="page">
      <h1>Orders</h1>
      <p className="muted">Change the status and the customer sees it on their dashboard right away.</p>

      {problems > 0 && (
        <p className="error">
          {problems} customer(s) said their order did not arrive. Look for the red note below, call them, then send the order again.
        </p>
      )}

      <div className="filters">
        {['All', ...statuses].map((s) => (
          <button key={s} className={filter === s ? 'active' : ''} onClick={() => setFilter(s)}>
            {s}
            <span className="filter-count">
              {s === 'All' ? orders.length : orders.filter((o) => o.status === s).length}
            </span>
          </button>
        ))}
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Loading orders...</p>}
      {!loading && shown.length === 0 && <p className="muted">No orders here yet.</p>}

      {shown.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((order) => (
                <tr key={order._id}>
                  <td>
                    <strong>#{order._id.slice(-6).toUpperCase()}</strong>
                    <span className="cell-sub">{new Date(order.createdAt).toLocaleString()}</span>
                  </td>
                  <td>
                    {order.user?.name}
                    <span className="cell-sub">{order.phone}</span>
                    <span className="cell-sub">{order.address}</span>
                  </td>
                  <td>
                    {order.items.map((item, i) => (
                      <div key={i} className="cell-item">
                        {item.qty} x {item.name}
                        <span className="cell-sub">
                          {item.base}, {item.sauce}, {item.cheese}
                          {item.veggies.length > 0 && `, ${item.veggies.join(', ')}`}
                        </span>
                      </div>
                    ))}
                  </td>
                  <td>UGX {order.total.toLocaleString()}</td>
                  <td>
                    <select
                      value={order.status}
                      onChange={(e) => changeStatus(order._id, e.target.value)}
                      className={`status-select s-${statuses.indexOf(order.status)}`}
                      aria-label="Order status"
                    >
                      {statuses.map((s) => <option key={s}>{s}</option>)}
                    </select>
                    {order.customerReply === 'received' && <span className="reply-tag yes">Customer got it</span>}
                    {order.customerReply === 'not received' && <span className="reply-tag no">Customer says not received</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}