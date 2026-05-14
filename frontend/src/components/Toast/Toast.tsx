import './Toast.css';

type ToastType = 'success' | 'error' | 'warning';

type ToastProps = {
  id: string;
  type: ToastType;
  message: string;
  onClose: (id: string) => void;
};

export default function Toast({ id, type, message, onClose }: ToastProps) {
  return (
    <div className={`toast toast-${type}`}>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={() => onClose(id)}>
        ×
      </button>
    </div>
  );
}
