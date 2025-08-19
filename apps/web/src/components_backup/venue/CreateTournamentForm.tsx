import React, { useState } from 'react';
import styles from './CreateTournamentForm.module.css';

export interface TournamentFormData {
  name: string;
  description: string;
  tournamentType: string;
  gameType: string;
  maxParticipants: number;
  entryFee: number;
  startDate: string;
  endDate: string;
  rules: string;
}

interface CreateTournamentFormProps {
  venueId: string;
  onSubmit: (data: TournamentFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const CreateTournamentForm: React.FC<CreateTournamentFormProps> = ({
  venueId,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<TournamentFormData>({
    name: '',
    description: '',
    tournamentType: 'SINGLE_ELIMINATION',
    gameType: '8_BALL',
    maxParticipants: 16,
    entryFee: 0,
    startDate: '',
    endDate: '',
    rules: '',
  });

  const [errors, setErrors] = useState<Partial<TournamentFormData>>({});

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name as keyof TournamentFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<TournamentFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tournament name is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    if (formData.maxParticipants < 2) {
      newErrors.maxParticipants = 'Minimum 2 participants required';
    }

    if (formData.entryFee < 0) {
      newErrors.entryFee = 'Entry fee cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Failed to create tournament:', error);
    }
  };

  const gameTypes = [
    { value: '8_BALL', label: '8-Ball Pool' },
    { value: '9_BALL', label: '9-Ball Pool' },
    { value: '10_BALL', label: '10-Ball Pool' },
    { value: 'STRAIGHT_POOL', label: 'Straight Pool' },
    { value: 'ONE_POCKET', label: 'One Pocket' },
    { value: 'BANK_POOL', label: 'Bank Pool' },
  ];

  const tournamentTypes = [
    { value: 'SINGLE_ELIMINATION', label: 'Single Elimination' },
    { value: 'DOUBLE_ELIMINATION', label: 'Double Elimination' },
    { value: 'ROUND_ROBIN', label: 'Round Robin' },
    { value: 'SWISS_SYSTEM', label: 'Swiss System' },
  ];

  return (
    <div className={styles.formContainer}>
      <div className={styles.formHeader}>
        <h2>Create New Tournament</h2>
        <p>Set up a new tournament for your venue</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.label}>
              Tournament Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`${styles.input} ${errors.name ? styles.error : ''}`}
              placeholder="Enter tournament name"
              disabled={isLoading}
            />
            {errors.name && (
              <span className={styles.errorText}>{errors.name}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="tournamentType" className={styles.label}>
              Tournament Type
            </label>
            <select
              id="tournamentType"
              name="tournamentType"
              value={formData.tournamentType}
              onChange={handleInputChange}
              className={styles.select}
              disabled={isLoading}
            >
              {tournamentTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="gameType" className={styles.label}>
              Game Type
            </label>
            <select
              id="gameType"
              name="gameType"
              value={formData.gameType}
              onChange={handleInputChange}
              className={styles.select}
              disabled={isLoading}
            >
              {gameTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="maxParticipants" className={styles.label}>
              Max Participants
            </label>
            <input
              type="number"
              id="maxParticipants"
              name="maxParticipants"
              value={formData.maxParticipants}
              onChange={handleInputChange}
              className={`${styles.input} ${
                errors.maxParticipants ? styles.error : ''
              }`}
              min="2"
              max="128"
              disabled={isLoading}
            />
            {errors.maxParticipants && (
              <span className={styles.errorText}>{errors.maxParticipants}</span>
            )}
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="startDate" className={styles.label}>
              Start Date & Time *
            </label>
            <input
              type="datetime-local"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              className={`${styles.input} ${
                errors.startDate ? styles.error : ''
              }`}
              disabled={isLoading}
            />
            {errors.startDate && (
              <span className={styles.errorText}>{errors.startDate}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="endDate" className={styles.label}>
              End Date & Time *
            </label>
            <input
              type="datetime-local"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
              className={`${styles.input} ${
                errors.endDate ? styles.error : ''
              }`}
              disabled={isLoading}
            />
            {errors.endDate && (
              <span className={styles.errorText}>{errors.endDate}</span>
            )}
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="entryFee" className={styles.label}>
              Entry Fee (Dojo Coins)
            </label>
            <input
              type="number"
              id="entryFee"
              name="entryFee"
              value={formData.entryFee}
              onChange={handleInputChange}
              className={`${styles.input} ${
                errors.entryFee ? styles.error : ''
              }`}
              min="0"
              step="0.01"
              disabled={isLoading}
            />
            {errors.entryFee && (
              <span className={styles.errorText}>{errors.entryFee}</span>
            )}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="description" className={styles.label}>
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className={styles.textarea}
            placeholder="Describe your tournament..."
            rows={3}
            disabled={isLoading}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="rules" className={styles.label}>
            Tournament Rules
          </label>
          <textarea
            id="rules"
            name="rules"
            value={formData.rules}
            onChange={handleInputChange}
            className={styles.textarea}
            placeholder="Enter tournament rules and special conditions..."
            rows={4}
            disabled={isLoading}
          />
        </div>

        <div className={styles.formActions}>
          <button
            type="button"
            onClick={onCancel}
            className={styles.cancelButton}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Tournament'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTournamentForm;
