const steps = ['Order Received', 'In Kitchen', 'Sent to Delivery', 'Delivered'];

export default function OrderTracker({ status }) {
  const current = steps.indexOf(status);
  const finished = status === 'Delivered';

  return (
    <ol className="tracker">
      {steps.map((step, i) => {
        let state = '';
        // once delivered, every step shows as done (green)
        if (i < current || finished) state = 'done';
        else if (i === current) state = 'current';
        return (
          <li key={step} className={state}>
            <span className="dot">{i + 1}</span>
            <span className="tracker-label">{step}</span>
          </li>
        );
      })}
    </ol>
  );
}