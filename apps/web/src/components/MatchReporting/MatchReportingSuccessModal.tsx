import { MatchResult } from '@/services/APIService';
import React from 'react';

interface MatchReportingSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: () => void;
  result: MatchResult | null;
  playerAName: string;
  playerBName: string;
}

const MatchReportingSuccessModal: React.FC<MatchReportingSuccessModalProps> = ({
  isOpen,
  onClose,
  onShare,
  result,
  playerAName,
  playerBName,
}) => {
  if (!isOpen || !result) return null;

  const winnerName =
    result.winnerId === result.playerAStats.id ? playerAName : playerBName;
  const loserName =
    result.winnerId === result.playerAStats.id ? playerBName : playerAName;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6 text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h2 className="text-xl font-bold text-green-400 mb-4">
            Match Reported Successfully!
          </h2>

          <div className="bg-gray-700 rounded-lg p-4 mb-6">
            <div className="text-lg mb-2">
              <strong>{winnerName} won!</strong>
            </div>
            <div>
              Final Score: {result.scoreA} - {result.scoreB}
            </div>
            <div className="mt-2 text-sm text-gray-400">
              Winner's Stats: {result.playerAStats.totalWins}W /{' '}
              {result.playerAStats.totalLosses}L
            </div>
          </div>

          {/* Share Button */}
          <div className="flex gap-3">
            <button
              onClick={onShare}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              📤 Share Match
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchReportingSuccessModal;
