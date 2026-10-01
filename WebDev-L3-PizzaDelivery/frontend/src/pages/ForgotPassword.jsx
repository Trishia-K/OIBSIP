import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorText } from '../api';
import AuthLayout from '../components/AuthLayout';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setMessage(data.message);
    } catch (err) {
      setError(errorText(err));
    }
    setLoading(false);
  }

  return (
    <AuthLayout title="Forgot your password?" text="Enter your email and we will send you a reset link.">
      {message ? (
        <p className="success">{message}</p>
      ) : (
        <form onSubmit={handleSubmit} className="form">
          <label className="field">
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="btn btn-full" disabled={loading}>{loading ? 'Sending...' : 'Send reset link'}</button>
        </form>
      )}
      <p className="switch"><Link to="/login">Back to log in</Link></p>
    </AuthLayout>
  );
}
