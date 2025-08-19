import { PoolTable } from '@/hooks/useVenueData';
import React from 'react';
import styles from './TableCard.module.css';

interface TableCardProps {
  table: PoolTable;
  onStatusChange: (tableId: string, status?: string) => void;
  isManagementMode?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

const TableCard: React.FC<TableCardProps> = ({
  table,
  onStatusChange,
  isManagementMode = false,
  onEdit,
  onDelete,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return styles.statusAvailable;
      case 'IN_USE':
        return styles.statusInUse;
      case 'MAINTENANCE':
        return styles.statusMaintenance;
      default:
        return styles.statusUnknown;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'Available';
      case 'IN_USE':
        return 'In Use';
      case 'MAINTENANCE':
        return 'Maintenance';
      default:
        return 'Unknown';
    }
  };

  const handleClick = () => {
    if (isManagementMode) {
      // In management mode, clicking opens edit modal
      onEdit?.();
    } else {
      // Normal mode - change status
      onStatusChange(table.id, table.status);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  };

  return (
    <div className={styles.tableCardContainer}>
      <button
        className={`${styles.tableCard} ${
          isManagementMode ? styles.managementMode : ''
        }`}
        onClick={handleClick}
        aria-label={`Table ${table.id} - ${getStatusText(table.status)}. ${
          isManagementMode ? 'Click to edit.' : 'Click to change status.'
        }`}
      >
        <div className={styles.tableHeader}>
          <h3>Table {table.id}</h3>
          <span
            className={`${styles.statusBadge} ${getStatusColor(table.status)}`}
          >
            {getStatusText(table.status)}
          </span>
        </div>
        {table.currentMatch && (
          <div className={styles.currentMatch}>
            <p>Match: {table.currentMatch}</p>
          </div>
        )}
        <div className={styles.clickHint}>
          {isManagementMode ? 'Click to edit' : 'Click to change status'}
        </div>
      </button>

      {isManagementMode && (
        <div className={styles.managementActions}>
          <button
            onClick={handleEditClick}
            className={styles.editButton}
            aria-label={`Edit table ${table.id}`}
          >
            ✏️
          </button>
          <button
            onClick={handleDeleteClick}
            className={styles.deleteButton}
            aria-label={`Delete table ${table.id}`}
          >
            🗑️
          </button>
        </div>
      )}
    </div>
  );
};

export default TableCard;
