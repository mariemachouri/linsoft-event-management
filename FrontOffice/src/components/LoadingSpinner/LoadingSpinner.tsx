import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullPage?: boolean;
}

export default function LoadingSpinner({ size = 'md', text, fullPage = false }: LoadingSpinnerProps) {
  const content = (
    <div className={`spinner-wrap spinner-wrap--${size}`}>
      <div className="spinner">
        <div className="spinner__ring spinner__ring--1" />
        <div className="spinner__ring spinner__ring--2" />
        <div className="spinner__dot" />
      </div>
      {text && <p className="spinner__text">{text}</p>}
    </div>
  );

  if (fullPage) {
    return <div className="spinner-page">{content}</div>;
  }

  return content;
}
