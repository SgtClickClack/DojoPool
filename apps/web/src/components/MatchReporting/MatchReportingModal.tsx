import {
  MatchResult,
  ReportMatchData,
  reportMatch,
} from '@/services/APIService';
import React, { useState } from 'react';

interface MatchReportingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: MatchResult) => void;
  currentUserId: string;
  currentUserName: string;
}

interface FormData {
  playerAId: string;
  playerAName: string;
  playerBId: string;
  playerBName: string;
  winner: 'player-a' | 'player-b';
  scoreA: string;
  scoreB: string;
  venueId: string;
}

const MatchReportingModal: React.FC<MatchReportingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentUserId,
  currentUserName,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    playerAId: currentUserId,
    playerAName: currentUserName,
    playerBId: '',
    playerBName: '',
    winner: 'player-a',
    scoreA: '0',
    scoreB: '0',
    venueId: '',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      winner: e.target.value as 'player-a' | 'player-b',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.playerBId || !formData.playerBName) {
      alert('Please enter opponent information');
      return;
    }

    const scoreA = parseInt(formData.scoreA);
    const scoreB = parseInt(formData.scoreB);

    if (scoreA < 0 || scoreB < 0) {
      alert('Scores cannot be negative');
      return;
    }

    const winnerId =
      formData.winner === 'player-a' ? formData.playerAId : formData.playerBId;

    const reportData: ReportMatchData = {
      playerAId: formData.playerAId,
      playerBId: formData.playerBId,
      winnerId,
      scoreA,
      scoreB,
      venueId: formData.venueId || undefined,
    };

    setIsLoading(true);
    try {
      const result = await reportMatch(reportData);
      onSuccess(result);
      onClose();
      // Reset form
      setFormData({
        playerAId: currentUserId,
        playerAName: currentUserName,
        playerBId: '',
        playerBName: '',
        winner: 'player-a',
        scoreA: '0',
        scoreB: '0',
        venueId: '',
      });
    } catch (error) {
      console.error('Failed to report match:', error);
      alert('Failed to report match. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-green-400">
            Report Match Result
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Current User (Player A) */}
          <div>
            <label className="block text-sm font-medium mb-2">
              You (Player 1)
            </label>
            <input
              type="text"
              name="playerAId"
              value={formData.playerAId}
              onChange={handleInputChange}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              placeholder="Your Player ID"
              required
              disabled
            />
            <input
              type="text"
              name="playerAName"
              value={formData.playerAName}
              onChange={handleInputChange}
              className="w-full mt-2 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              placeholder="Your name (optional)"
            />
          </div>

          {/* Opponent (Player B) */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Opponent (Player 2)
            </label>
            <input
              type="text"
              name="playerBId"
              value={formData.playerBId}
              onChange={handleInputChange}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              placeholder="Opponent's Player ID"
              required
            />
            <input
              type="text"
              name="playerBName"
              value={formData.playerBName}
              onChange={handleInputChange}
              className="w-full mt-2 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              placeholder="Opponent's name (optional)"
            />
          </div>

          {/* Winner Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Who Won?</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="winner"
                  value="player-a"
                  checked={formData.winner === 'player-a'}
                  onChange={handleRadioChange}
                  className="mr-3"
                  required
                />
                <span>You (Player 1)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="winner"
                  value="player-b"
                  checked={formData.winner === 'player-b'}
                  onChange={handleRadioChange}
                  className="mr-3"
                  required
                />
                <span>Opponent (Player 2)</span>
              </label>
            </div>
          </div>

          {/* Scores */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Your Score
              </label>
              <input
                type="number"
                name="scoreA"
                value={formData.scoreA}
                onChange={handleInputChange}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                placeholder="0"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Opponent's Score
              </label>
              <input
                type="number"
                name="scoreB"
                value={formData.scoreB}
                onChange={handleInputChange}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                placeholder="0"
                min="0"
                required
              />
            </div>
          </div>

          {/* Venue (Optional) */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Venue (Optional)
            </label>
            <select
              name="venueId"
              value={formData.venueId}
              onChange={handleInputChange}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
            >
              <option value="">Select venue...</option>
              <option value="venue-1">The Jade Tiger</option>
              <option value="venue-2">Crimson Dragon Billiards</option>
              <option value="venue-3">Silent Fox Pool Club</option>
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
          >
            {isLoading ? '⏳ Submitting...' : '📤 Submit Match Report'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MatchReportingModal;
