import './Select.css';

type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = {
  options: SelectOption[];
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  label?: string;
};

export default function Select({ options, placeholder, value, onChange, error, label }: SelectProps) {
  return (
    <div className="select-wrapper">
      {label && <label className="select-label">{label}</label>}
      <select
        className={`select-field ${error ? 'select-error' : ''}`}
        value={value ?? ''}
        onChange={(e) => onChange?.(e.target.value)}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="select-error-msg">{error}</span>}
    </div>
  );
}
