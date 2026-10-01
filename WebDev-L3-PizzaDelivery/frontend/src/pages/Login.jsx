import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import api, { errorText } from '../api';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/'} />;

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(errorText(err));
    }
    setLoading(false);
  }

  return (
    <AuthLayout title="Welcome back" text="Log in to order and follow your pizza.">
      <form onSubmit={handleSubmit} className="form">
        <label className="field">
          <span>Email</span>
          <input type="email" name="email" value={form.email} onChange={handleChange} required />
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" name="password" value={form.password} onChange={handleChange} required />
        </label>
        <Link to="/forgot-password" className="small-link">Forgot password?</Link>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-full" disabled={loading}>{loading ? 'Logging in...' : 'Log in'}</button>
      </form>
      <p className="switch">No account yet? <Link to="/register">Sign up</Link></p>
    </AuthLayout>
  );
}
