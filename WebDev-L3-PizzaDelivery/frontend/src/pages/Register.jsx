import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorText } from '../api';
import AuthLayout from '../components/AuthLayout';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('The passwords do not match');

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
      });
      setDone(data.message);
    } catch (err) {
      setError(errorText(err));
    }
    setLoading(false);
  }

  if (done) {
    return (
      <AuthLayout title="Check your email" text={done}>
        <p className="muted">Open the link we sent to {form.email}, then come back and log in.</p>
        <Link to="/login" className="btn btn-full">Go to log in</Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create your account" text="It takes a minute. We will send a link to verify your email.">
      <form onSubmit={handleSubmit} className="form">
        <label className="field">
          <span>Full name</span>
          <input name="name" value={form.name} onChange={handleChange} required />
        </label>
        <label className="field">
          <span>Email</span>
          <input type="email" name="email" value={form.email} onChange={handleChange} required />
        </label>
        <div className="field-row">
          <label className="field">
            <span>Password</span>
            <input type="password" name="password" value={form.password} onChange={handleChange} minLength={6} required />
          </label>
          <label className="field">
            <span>Confirm password</span>
            <input type="password" name="confirm" value={form.confirm} onChange={handleChange} required />
          </label>
        </div>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-full" disabled={loading}>{loading ? 'Creating account...' : 'Sign up'}</button>
      </form>
      <p className="switch">Already have an account? <Link to="/login">Log in</Link></p>
    </AuthLayout>
  );
}
