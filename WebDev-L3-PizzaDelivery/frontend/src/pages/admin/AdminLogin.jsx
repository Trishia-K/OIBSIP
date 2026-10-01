import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import api, { errorText } from '../../api';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/AuthLayout';

export default function AdminLogin() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user?.role === 'admin') return <Navigate to="/admin" />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/admin-login', form);
      login(data.token, data.user);
      navigate('/admin');
    } catch (err) {
      setError(errorText(err));
    }
    setLoading(false);
  }

  return (
    <AuthLayout admin title="Admin log in" text="For kitchen staff only.">
      <form onSubmit={handleSubmit} className="form">
        <label className="field">
          <span>Admin email</span>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-full" disabled={loading}>{loading ? 'Logging in...' : 'Log in'}</button>
      </form>
    </AuthLayout>
  );
}
