import { useEffect, useState } from 'react';
import api, { errorText } from '../../api';
import { connectSocket } from '../../socket';

const groups = [
  { key: 'base', title: 'Pizza bases' },
  { key: 'sauce', title: 'Sauces' },
  { key: 'cheese', title: 'Cheeses' },
  { key: 'veggie', title: 'Vegetables' },
  { key: 'meat', title: 'Meats' },
];

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [drafts, setDrafts] = useState({}); // values being edited, by item id
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function loadItems() {
    api.get('/inventory').then((res) => setItems(res.data)).catch((err) => setError(errorText(err)));
  }

  useEffect(() => {
    loadItems();
    // stock goes down when orders are paid, so reload when that happens
    const socket = connectSocket();
    socket.on('inventory:changed', loadItems);
    return () => socket.disconnect();
  }, []);

  function valueOf(item, field) {
    return drafts[item._id]?.[field] ?? item[field];
  }

  function edit(id, field, value) {
    setDrafts({ ...drafts, [id]: { ...drafts[id], [field]: value } });
  }

  async function save(item) {
    setError('');
    setMessage('');
    try {
      const { data } = await api.put(`/inventory/${item._id}`, {
        quantity: valueOf(item, 'quantity'),
        threshold: valueOf(item, 'threshold'),
        price: valueOf(item, 'price'),
      });
      setItems((prev) => prev.map((i) => (i._id === data._id ? data : i)));
      const rest = { ...drafts };
      delete rest[item._id];
      setDrafts(rest);
      setMessage(`${data.name} saved`);
    } catch (err) {
      setError(errorText(err));
    }
  }

  async function runCheck() {
    setError('');
    try {
      const { data } = await api.post('/inventory/check');
      setMessage(data.message);
    } catch (err) {
      setError(errorText(err));
    }
  }

  const lowCount = items.filter((i) => i.quantity < i.threshold).length;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Inventory</h1>
          <p className="muted">
            {lowCount > 0 ? `${lowCount} item(s) below their alert level.` : 'Everything is above its alert level.'}
          </p>
        </div>
        <button className="btn btn-ghost" onClick={runCheck}>Run stock check now</button>
      </div>

      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}

      {groups.map((group) => (
        <section key={group.key} className="stock-group">
          <h2>{group.title}</h2>
          <div className="table-wrap">
            <table className="table stock-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>In stock</th>
                  <th>Alert below</th>
                  <th>Price (UGX)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items
                  .filter((i) => i.category === group.key)
                  .map((item) => {
                    const low = item.quantity < item.threshold;
                    return (
                      <tr key={item._id} className={low ? 'low' : ''}>
                        <td>
                          {item.name}
                          {low && <span className="tag-low">Low</span>}
                        </td>
                        <td>
                          <input type="number" min="0" value={valueOf(item, 'quantity')}
                            onChange={(e) => edit(item._id, 'quantity', e.target.value)} aria-label={`${item.name} stock`} />
                        </td>
                        <td>
                          <input type="number" min="0" value={valueOf(item, 'threshold')}
                            onChange={(e) => edit(item._id, 'threshold', e.target.value)} aria-label={`${item.name} alert level`} />
                        </td>
                        <td>
                          <input type="number" min="0" value={valueOf(item, 'price')}
                            onChange={(e) => edit(item._id, 'price', e.target.value)} aria-label={`${item.name} price`} />
                        </td>
                        <td>
                          <button className="btn btn-small" onClick={() => save(item)} disabled={!drafts[item._id]}>
                            Save
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
