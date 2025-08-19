import React, { useState, useEffect } from 'react';
import {
  ChallengeService,
  type Challenge,
} from '../../services/ChallengeService';

interface ChallengeManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChallengeManager: React.FC<ChallengeManagerProps> = ({
  isOpen,
  onClose,
}) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadChallenges();
    }
  }, [isOpen]);

  const loadChallenges = async () => {
    setLoading(true);
    try {
      const activeChallenges = await ChallengeService.getActiveChallenges();
      setChallenges(activeChallenges);
    } catch (error) {
      console.error('Error loading challenges:', error);
      setMessage('Failed to load challenges.');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (
    challengeId: string,
    response: 'accept' | 'decline'
  ) => {
    setLoading(true);
    try {
      if (response === 'accept') {
        await ChallengeService.acceptChallenge(challengeId);
      } else {
        await ChallengeService.declineChallenge(challengeId);
      }
      setMessage(`Challenge ${response}d successfully!`);
      await loadChallenges(); // Refresh the list
    } catch (error) {
      console.error(`Error ${response}ing challenge:`, error);
      setMessage(`Failed to ${response} challenge.`);
    } finally {
      setLoading(false);
    }
  };

  const incomingChallenges = challenges.filter((c) => c.status === 'active');
  const outgoingChallenges = challenges.filter((c) => c.status === 'accepted');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000]">
      <div className="bg-gray-900 border-2 border-cyan-400 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-cyan-400">
            Challenge Manager
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold"
          >
            &times;
          </button>
        </div>

        {message && (
          <div className="mb-4 p-3 rounded bg-gray-800 text-sm">{message}</div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto"></div>
            <p className="text-gray-400 mt-2">Loading challenges...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Incoming Challenges */}
            <div>
              <h3 className="text-lg font-bold text-white mb-3">
                Incoming Challenges
              </h3>
              {incomingChallenges.length > 0 ? (
                <div className="space-y-3">
                  {incomingChallenges.map((challenge) => (
                    <div
                      key={challenge.id}
                      className="bg-gray-800 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-white font-semibold">
                            {ChallengeService.getChallengeTypeName(
                              challenge.type
                            )}{' '}
                            Challenge
                          </p>
                          <p className="text-gray-400 text-sm">
                            From: {challenge.challengerId}
                          </p>
                          <p className="text-gray-400 text-sm">
                            Dojo: {challenge.dojoId}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-yellow-400 text-sm">
                            {ChallengeService.formatChallengeStatus(
                              challenge.status
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleRespond(challenge.id, 'accept')}
                          disabled={loading}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded font-bold transition-colors disabled:opacity-50"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRespond(challenge.id, 'decline')}
                          disabled={loading}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded font-bold transition-colors disabled:opacity-50"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No incoming challenges
                </p>
              )}
            </div>

            {/* Outgoing Challenges */}
            <div>
              <h3 className="text-lg font-bold text-white mb-3">
                Outgoing Challenges
              </h3>
              {outgoingChallenges.length > 0 ? (
                <div className="space-y-3">
                  {outgoingChallenges.map((challenge) => (
                    <div
                      key={challenge.id}
                      className="bg-gray-800 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-white font-semibold">
                            {ChallengeService.getChallengeTypeName(
                              challenge.type
                            )}{' '}
                            Challenge
                          </p>
                          <p className="text-gray-400 text-sm">
                            To: {challenge.defenderId}
                          </p>
                          <p className="text-gray-400 text-sm">
                            Dojo: {challenge.dojoId}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-green-400 text-sm">
                            {ChallengeService.formatChallengeStatus(
                              challenge.status
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No outgoing challenges
                </p>
              )}
            </div>
          </div>
        )}

        {/* Close button */}
        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-6 rounded font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChallengeManager;
