import { MatchResult } from '@/services/APIService';
import { useCallback, useState } from 'react';

interface MatchReportingState {
  isModalOpen: boolean;
  isSuccessModalOpen: boolean;
  isLoading: boolean;
  lastResult: MatchResult | null;
}

export const useMatchReporting = () => {
  const [state, setState] = useState<MatchReportingState>({
    isModalOpen: false,
    isSuccessModalOpen: false,
    isLoading: false,
    lastResult: null,
  });

  const openModal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isModalOpen: true,
    }));
  }, []);

  const closeModal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isModalOpen: false,
    }));
  }, []);

  const closeSuccessModal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isSuccessModalOpen: false,
      lastResult: null,
    }));
  }, []);

  const onMatchReported = useCallback((result: MatchResult) => {
    setState((prev) => ({
      ...prev,
      isModalOpen: false,
      isSuccessModalOpen: true,
      lastResult: result,
    }));
  }, []);

  const shareMatch = useCallback(
    async (
      result: MatchResult | null,
      playerAName: string,
      playerBName: string
    ) => {
      if (!result) return;

      const winnerName =
        result.winnerId === result.playerAStats.id ? playerAName : playerBName;
      const loserName =
        result.winnerId === result.playerAStats.id ? playerBName : playerAName;

      const shareText =
        `🏆 Just crushed ${loserName} in a real-life pool match! ` +
        `Final score: ${result.scoreA} - ${result.scoreB} ` +
        `#DojoPool #PoolMaster`;

      // Try native share API first
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Dojo Pool Match Result',
            text: shareText,
            url: window.location.href,
          });
          return;
        } catch (error) {
          // User cancelled or share failed, fallback to clipboard
          console.log('Native share failed, falling back to clipboard');
        }
      }

      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        alert('Match result copied to clipboard! 📋');
      } catch (error) {
        // Fallback: show text for manual copy
        const textArea = document.createElement('textarea');
        textArea.value = shareText;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          document.execCommand('copy');
          alert('Match result copied to clipboard! 📋');
        } catch (fallbackError) {
          // Final fallback: show text for manual copy
          alert('Share text: ' + shareText);
        }

        textArea.remove();
      }
    },
    []
  );

  return {
    ...state,
    openModal,
    closeModal,
    closeSuccessModal,
    onMatchReported,
    shareMatch,
  };
};
