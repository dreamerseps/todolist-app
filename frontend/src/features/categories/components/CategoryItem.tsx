import { useState } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '@/components/Button/Button';
import Modal from '@/components/Modal/Modal';
import type { Category } from '@/types';
import './CategoryItem.css';

type CategoryItemProps = {
  category: Category;
  onUpdate: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
};

export default function CategoryItem({ category, onUpdate, onDelete, isDeleting }: CategoryItemProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  function handleEditConfirm() {
    if (!editName.trim() || editName.trim() === category.name) {
      setIsEditing(false);
      setEditName(category.name);
      return;
    }
    onUpdate(category.id, editName.trim());
    setIsEditing(false);
  }

  function handleEditCancel() {
    setIsEditing(false);
    setEditName(category.name);
  }

  function handleDeleteConfirm() {
    onDelete(category.id);
    setShowDeleteModal(false);
  }

  return (
    <>
      <div className={`category-item${category.is_default ? ' category-item-default' : ''}`}>
        {isEditing ? (
          <div className="category-item-edit">
            <input
              className="category-item-input"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              autoFocus
              aria-label={t('categories.aria.editName')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleEditConfirm();
                if (e.key === 'Escape') handleEditCancel();
              }}
            />
            <button className="category-item-icon-btn" onClick={handleEditConfirm} aria-label={t('categories.aria.confirmEdit')}>
              <Check size={14} />
            </button>
            <button className="category-item-icon-btn" onClick={handleEditCancel} aria-label={t('categories.aria.cancelEdit')}>
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="category-item-view">
            <span className="category-item-name">{category.name}</span>
            {category.is_default && (
              <span className="category-item-badge">{t('common.default')}</span>
            )}
            <div className="category-item-actions">
              <Button
                variant="secondary"
                size="sm"
                disabled={category.is_default}
                onClick={() => setIsEditing(true)}
                aria-label={t('common.edit')}
              >
                <Pencil size={14} />
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={category.is_default}
                onClick={() => setShowDeleteModal(true)}
                aria-label={t('common.delete')}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {showDeleteModal && (
        <Modal
          title={t('categories.deleteModal.title')}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteModal(false)}
          isLoading={isDeleting}
        >
          <p>{t('categories.deleteModal.confirm')}</p>
        </Modal>
      )}
    </>
  );
}
