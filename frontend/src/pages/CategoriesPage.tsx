import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Header from '@/components/Header/Header';
import Button from '@/components/Button/Button';
import Spinner from '@/components/Spinner/Spinner';
import Modal from '@/components/Modal/Modal';
import Input from '@/components/Input/Input';
import CategoryItem from '@/features/categories/components/CategoryItem';
import { useFetchCategories } from '@/features/categories/hooks/useFetchCategories';
import { useAddCategory } from '@/features/categories/hooks/useAddCategory';
import { useUpdateCategory } from '@/features/categories/hooks/useUpdateCategory';
import { useDeleteCategory } from '@/features/categories/hooks/useDeleteCategory';
import './CategoriesPage.css';

export default function CategoriesPage() {
  const { t } = useTranslation();
  const { data: categories = [], isLoading, isError } = useFetchCategories();
  const addCategory = useAddCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [nameError, setNameError] = useState('');

  function handleAddConfirm() {
    if (!newName.trim()) {
      setNameError(t('categories.validation.name'));
      return;
    }
    addCategory.mutate(
      { name: newName.trim() },
      {
        onSuccess: () => {
          setShowAddModal(false);
          setNewName('');
          setNameError('');
        },
      },
    );
  }

  function handleAddCancel() {
    setShowAddModal(false);
    setNewName('');
    setNameError('');
  }

  return (
    <>
      <Header />
      <main className="categories-page">
        <div className="categories-header">
          <h1>{t('categories.title')}</h1>
          <Button variant="primary" onClick={() => setShowAddModal(true)}>{t('categories.addBtn')}</Button>
        </div>

        {isLoading && <Spinner />}

        {isError && (
          <p className="error-message">{t('categories.error')}</p>
        )}

        {!isLoading && !isError && categories.length === 0 && (
          <p className="empty-message">{t('categories.empty')}</p>
        )}

        <div className="category-list">
          {categories.map((category) => (
            <CategoryItem
              key={category.id}
              category={category}
              onUpdate={(id, name) => updateCategory.mutate({ id, body: { name } })}
              onDelete={(id) => deleteCategory.mutate(id)}
              isDeleting={deleteCategory.isPending}
            />
          ))}
        </div>
      </main>

      {showAddModal && (
        <Modal
          title={t('categories.addModal.title')}
          onConfirm={handleAddConfirm}
          onCancel={handleAddCancel}
          confirmLabel={t('categories.addModal.confirm')}
          isLoading={addCategory.isPending}
        >
          <Input
            label={t('categories.addModal.label')}
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t('categories.addModal.placeholder')}
            error={nameError}
            autoFocus
          />
        </Modal>
      )}
    </>
  );
}
