import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

function getStartTheme() {
  const saved = localStorage.getItem('theme');
  if (saved) return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(getStartTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  function handleLogout() {
    const wasAdmin = user?.role === 'admin';
    logout();
    navigate(wasAdmin ? '/admin/login' : '/login');
  }

  const home = user?.role === 'admin' ? '/admin' : '/';

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to={home} className="logo">Pizza Town</Link>

        <nav className="nav-links">
          {user?.role === 'user' && (
            <>
              <NavLink to="/" end>Menu</NavLink>
              <NavLink to="/build">Build your own</NavLink>
              <NavLink to="/summary" className="cart-link">
                Cart {count > 0 && <span className="cart-count">{count}</span>}
              </NavLink>
            </>
          )}
          {user?.role === 'admin' && (
            <>
              <NavLink to="/admin" end>Orders</NavLink>
              <NavLink to="/admin/inventory">Inventory</NavLink>
            </>
          )}

          <button
            className="theme-btn"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
              </svg>
            )}
          </button>

          {user ? (
            <button className="btn btn-ghost btn-small" onClick={handleLogout}>Log out</button>
          ) : (
            <Link to="/login" className="btn btn-small">Log in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
