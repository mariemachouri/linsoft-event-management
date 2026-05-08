import { Link } from 'react-router-dom';
import './NotFound.css';

export default function NotFound() {
  return (
    <main className="not-found">
      <div className="not-found__inner">
        <div className="not-found__code">404</div>
        <h1 className="not-found__title">Page Not Found</h1>
        <p className="not-found__msg">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link to="/" className="not-found__btn">Back to Home</Link>
      </div>
    </main>
  );
}
