import type { InputHTMLAttributes } from 'react';
import './Input.css';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export default function Input({ label, error, type = 'text', className = '', id, ...props }: InputProps) {
  const inputId = id ?? (label ? `input-${label}` : undefined);
  return (
    <div className="input-wrapper">
      {label && <label className="input-label" htmlFor={inputId}>{label}</label>}
      <input
        id={inputId}
        type={type}
        className={`input-field ${error ? 'input-error' : ''} ${className}`}
        {...props}
      />
      {error && <span className="input-error-msg">{error}</span>}
    </div>
  );
}
