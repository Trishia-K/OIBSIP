import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errorText } from '../api';
import AuthLayout from '../components/AuthLayout';

export default function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirm) return setError('The passwords do not match');

    setLoading(true);
    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, { password });
      setMessage(data.message);
    } catch (err) {
      setError(errorText(err));
    }
    setLoading(false);
  }

  if (message) {
    return (
      <AuthLayout title="Password changed" text={message}>
        <Link to="/login" className="btn btn-full">Go to log in</Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set a new password">
      <form onSubmit={handleSubmit} className="form">
        <label className="field">
          <span>New password</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
        </label>
        <label className="field">
          <span>Confirm new password</span>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-full" disabled={loading}>{loading ? 'Saving...' : 'Save new password'}</button>
      </form>
    </AuthLayout>
  );
}
