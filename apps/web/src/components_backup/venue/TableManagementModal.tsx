import React, { useEffect, useState } from 'react';
import styles from './TableManagementModal.module.css';

export type TableManagementMode = 'create' | 'edit' | 'delete';

export interface TableData {
  id?: string;
  name: string;
  status?: string;
}

interface TableManagementModalProps {
  isOpen: boolean;
  mode: TableManagementMode;
  tableData?: TableData;
  onClose: () => void;
  onSubmit: (data: TableData) => Promise<void>;
}

const TableManagementModal: React.FC<TableManagementModalProps> = ({
  isOpen,
  mode,
  tableData,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<TableData>({ name: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen && tableData) {
      setFormData(tableData);
    } else if (isOpen && mode === 'create') {
      setFormData({ name: '' });
    }
    setError('');
  }, [isOpen, mode, tableData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, name: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode !== 'delete' && !formData.name.trim()) {
      setError('Table name is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const getModalTitle = () => {
    switch (mode) {
      case 'create':
        return 'Add New Table';
      case 'edit':
        return 'Edit Table';
      case 'delete':
        return 'Delete Table';
      default:
        return 'Table Management';
    }
  };

  const getSubmitButtonText = () => {
    switch (mode) {
      case 'create':
        return 'Create Table';
      case 'edit':
        return 'Update Table';
      case 'delete':
        return 'Delete Table';
      default:
        return 'Submit';
    }
  };

  const getSubmitButtonClass = () => {
    return mode === 'delete' ? styles.deleteButton : styles.submitButton;
  };

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{getModalTitle()}</h2>
          <button
            className={styles.closeButton}
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {mode === 'delete' ? (
            <div className={styles.deleteConfirmation}>
              <p>
                Are you sure you want to delete the table "{tableData?.name}"?
              </p>
              <p className={styles.warningText}>
                This action cannot be undone.
              </p>
            </div>
          ) : (
            <div className={styles.formGroup}>
              <label htmlFor="tableName" className={styles.label}>
                Table Name
              </label>
              <input
                id="tableName"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="Enter table name"
                disabled={isSubmitting}
                autoFocus
              />
            </div>
          )}

          {error && <div className={styles.errorMessage}>{error}</div>}

          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={handleClose}
              className={styles.cancelButton}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={getSubmitButtonClass()}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : getSubmitButtonText()}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TableManagementModal;
