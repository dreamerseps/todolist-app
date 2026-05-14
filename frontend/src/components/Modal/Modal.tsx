import type { ReactNode } from 'react';
import Button from '@/components/Button/Button';
import './Modal.css';

type ModalProps = {
  title: string;
  children: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
};

export default function Modal({
  title,
  children,
  onConfirm,
  onCancel,
  confirmLabel = '확인',
  cancelLabel = '취소',
  isLoading = false,
}: ModalProps) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2 className="modal-title">{title}</h2>
        <div className="modal-body">{children}</div>
        <div className="modal-actions">
          <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button variant="primary" onClick={onConfirm} isLoading={isLoading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
