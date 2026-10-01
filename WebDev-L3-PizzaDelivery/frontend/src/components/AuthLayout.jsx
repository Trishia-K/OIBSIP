import Photo from './Photo';
import images from '../images';

export default function AuthLayout({ title, text, admin, children }) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <aside className="auth-side">
          <span className="badge-logo">Pizza Town</span>
          <Photo src={images.auth} alt="Pizza" className="auth-photo" />
          <h2>{admin ? 'Kitchen admin' : 'You Crave it, We deliver'}</h2>
          <p>
            {admin
              ? 'Manage incoming orders and keep the shelves stocked.'
              : 'Straight from the oven to your door'}
          </p>
        </aside>
        <section className="auth-form">
          <h1>{title}</h1>
          {text && <p className="muted">{text}</p>}
          {children}
        </section>
      </div>
    </div>
  );
}
