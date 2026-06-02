import { Link } from 'react-router-dom';
import './NotFound.css';

export default function NotFound() {
  return (
    <main className="not-found">
      <div className="not-found__inner">
        <div className="not-found__code">404</div>
        <h1 className="not-found__title">Page introuvable</h1>
        <p className="not-found__msg">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <Link to="/" className="not-found__btn">Retour à l'accueil</Link>
      </div>
    </main>
  );
}
