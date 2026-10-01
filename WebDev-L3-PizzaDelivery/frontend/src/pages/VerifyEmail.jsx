import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errorText } from '../api';
import AuthLayout from '../components/AuthLayout';

export default function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const called = useRef(false);

  useEffect(() => {
    // only call once, the token is gone after the first use
    if (called.current) return;
    called.current = true;

    api
      .get(`/auth/verify/${token}`)
      .then(({ data }) => {
        setStatus('ok');
        setMessage(data.message);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(errorText(err));
      });
  }, [token]);

  if (status === 'loading') return <AuthLayout title="Verifying your email..." />;

  return (
    <AuthLayout title={status === 'ok' ? 'You are verified' : 'Link not working'} text={message}>
      <Link to={status === 'ok' ? '/login' : '/register'} className="btn btn-full">
        {status === 'ok' ? 'Go to log in' : 'Sign up again'}
      </Link>
    </AuthLayout>
  );
}
