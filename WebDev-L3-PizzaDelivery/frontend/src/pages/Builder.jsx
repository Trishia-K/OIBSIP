import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errorText } from '../api';
import { useCart } from '../context/CartContext';
import Photo from '../components/Photo';
import images from '../images';

const steps = [
  { key: 'base', label: 'Base', title: 'Choose your base', hint: 'Everything starts here.' },
  { key: 'sauce', label: 'Sauce', title: 'Choose a sauce', hint: 'One sauce per pizza.' },
  { key: 'cheese', label: 'Cheese', title: 'Choose your cheese', hint: 'Pick the one you like best.' },
  { key: 'veggie', label: 'Veggies', title: 'Add vegetables', hint: 'Pick as many as you like, or skip this step.' },
];

export default function Builder() {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [inventory, setInventory] = useState([]);
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);
  const [choice, setChoice] = useState({ base: '', sauce: '', cheese: '', veggies: [] });

  useEffect(() => {
    api.get('/inventory').then((res) => setInventory(res.data)).catch((err) => setError(errorText(err)));
  }, []);

  const current = steps[step];
  const options = inventory.filter((i) => i.category === current.key);

  function priceOf(category, name) {
    return inventory.find((i) => i.category === category && i.name === name)?.price || 0;
  }

  const total =
    priceOf('base', choice.base) +
    priceOf('sauce', choice.sauce) +
    priceOf('cheese', choice.cheese) +
    choice.veggies.reduce((sum, v) => sum + priceOf('veggie', v), 0);

  function isSelected(item) {
    if (current.key === 'veggie') return choice.veggies.includes(item.name);
    return choice[current.key] === item.name;
  }

  function pick(item) {
    if (current.key === 'veggie') {
      const veggies = choice.veggies.includes(item.name)
        ? choice.veggies.filter((v) => v !== item.name)
        : [...choice.veggies, item.name];
      setChoice({ ...choice, veggies });
    } else {
      setChoice({ ...choice, [current.key]: item.name });
    }
  }

  const canContinue = current.key === 'veggie' || choice[current.key];

  function finish() {
    addItem({
      custom: true,
      name: 'Custom pizza',
      base: choice.base,
      sauce: choice.sauce,
      cheese: choice.cheese,
      veggies: choice.veggies,
      price: total,
      image: images.builder,
    });
    navigate('/summary');
  }

  return (
    <div className="page builder">
      <div className="builder-main">
        <ol className="steps">
          {steps.map((s, i) => (
            <li key={s.key} className={i === step ? 'current' : i < step ? 'done' : ''}>
              <button onClick={() => i < step && setStep(i)} disabled={i > step}>
                <span className="dot">{i + 1}</span>
                {s.label}
              </button>
            </li>
          ))}
        </ol>

        <h1>{current.title}</h1>
        <p className="muted">{current.hint}</p>
        {error && <p className="error">{error}</p>}

        <div className="options">
          {options.map((item) => {
            const out = item.quantity <= 0;
            return (
              <button
                key={item._id}
                className={`option ${isSelected(item) ? 'selected' : ''}`}
                onClick={() => pick(item)}
                disabled={out}
                aria-pressed={isSelected(item)}
              >
                <span className="check" />
                <span className="option-name">{item.name}</span>
                <span className="option-price">{out ? 'Out of stock' : `+ UGX${item.price}`}</span>
              </button>
            );
          })}
        </div>

        <div className="builder-actions">
          {step > 0 && (
            <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>Back</button>
          )}
          {step < steps.length - 1 ? (
            <button className="btn" onClick={() => setStep(step + 1)} disabled={!canContinue}>Next</button>
          ) : (
            <button className="btn" onClick={finish}>Add to cart</button>
          )}
        </div>
      </div>

      <aside className="builder-side">
        <Photo src={images.builder} alt="Your pizza" className="builder-photo" />
        <h2>Your pizza</h2>
        <dl className="picked">
          <dt>Base</dt>
          <dd>{choice.base || <span className="muted">Not picked yet</span>}</dd>
          <dt>Sauce</dt>
          <dd>{choice.sauce || <span className="muted">Not picked yet</span>}</dd>
          <dt>Cheese</dt>
          <dd>{choice.cheese || <span className="muted">Not picked yet</span>}</dd>
          <dt>Veggies</dt>
          <dd>{choice.veggies.length ? choice.veggies.join(', ') : <span className="muted">None</span>}</dd>
        </dl>
        <p className="side-total">
          <span>Price</span>
          <strong>UGX{total}</strong>
        </p>
      </aside>
    </div>
  );
}
