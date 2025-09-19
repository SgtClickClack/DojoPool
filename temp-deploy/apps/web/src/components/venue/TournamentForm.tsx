import React, { useState } from 'react';
import styles from './TournamentForm.module.css';

interface TournamentFormProps {
  tournament?: {
    id: string;
    name: string;
    description?: string;
    startTime: string;
    endTime?: string;
    maxPlayers: number;
    entryFee: number;
    prizePool: number;
    format: string;
    rewards?: string;
  };
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const TournamentForm: React.FC<TournamentFormProps> = ({ tournament, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: tournament?.name || '',
    description: tournament?.description || '',
    startTime: tournament?.startTime ? new Date(tournament.startTime).toISOString().slice(0, 16) : '',
    endTime: tournament?.endTime ? new Date(tournament.endTime).toISOString().slice(0, 16) : '',
    maxPlayers: tournament?.maxPlayers || 8,
    entryFee: tournament?.entryFee || 0,
    prizePool: tournament?.prizePool || 0,
    format: tournament?.format || 'SINGLE_ELIMINATION',
    rewards: tournament?.rewards || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      startTime: formData.startTime ? new Date(formData.startTime).toISOString() : undefined,
      endTime: formData.endTime ? new Date(formData.endTime).toISOString() : undefined
    });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formGroup}>
        <label htmlFor="name">Tournament Name *</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="Enter tournament name"
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          placeholder="Enter tournament description"
        />
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="startTime">Start Time *</label>
          <input
            type="datetime-local"
            id="startTime"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="endTime">End Time</label>
          <input
            type="datetime-local"
            id="endTime"
            name="endTime"
            value={formData.endTime}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="maxPlayers">Max Players</label>
          <input
            type="number"
            id="maxPlayers"
            name="maxPlayers"
            value={formData.maxPlayers}
            onChange={handleChange}
            min="2"
            max="64"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="format">Format</label>
          <select
            id="format"
            name="format"
            value={formData.format}
            onChange={handleChange}
          >
            <option value="SINGLE_ELIMINATION">Single Elimination</option>
            <option value="DOUBLE_ELIMINATION">Double Elimination</option>
            <option value="ROUND_ROBIN">Round Robin</option>
            <option value="SWISS">Swiss</option>
          </select>
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="entryFee">Entry Fee (Dojo Coins)</label>
          <input
            type="number"
            id="entryFee"
            name="entryFee"
            value={formData.entryFee}
            onChange={handleChange}
            min="0"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="prizePool">Prize Pool (Dojo Coins)</label>
          <input
            type="number"
            id="prizePool"
            name="prizePool"
            value={formData.prizePool}
            onChange={handleChange}
            min="0"
          />
        </div>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="rewards">Additional Rewards</label>
        <textarea
          id="rewards"
          name="rewards"
          value={formData.rewards}
          onChange={handleChange}
          rows={2}
          placeholder="Describe any additional rewards or prizes"
        />
      </div>

      <div className={styles.formActions}>
        <button type="button" className={styles.cancelButton} onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className={styles.submitButton}>
          {tournament ? 'Update Tournament' : 'Create Tournament'}
        </button>
      </div>
    </form>
  );
};

export default TournamentForm;
