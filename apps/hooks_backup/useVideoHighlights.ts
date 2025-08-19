import { useState, useEffect, useRef } from 'react';
import axiosInstance from '../api/axiosInstance';

interface Highlight {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  duration: number;
  createdAt: string;
  videoRef: React.RefObject<HTMLVideoElement>;
}

export const useVideoHighlights = () => {
  const [highlights, setHighlights] = useState<Record<string, Highlight>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generateHighlight = async (data: {
    tournamentId: string;
    userId: string;
    gameType: string;
    highlights: string[];
  }) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axiosInstance.post(
        '/api/highlights/generate',
        data
      );
      const newHighlight = response.data;

      setHighlights((prev) => ({
        ...prev,
        [newHighlight.id]: {
          ...newHighlight,
          videoRef: useRef<HTMLVideoElement>(null),
        },
      }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate highlight'
      );
    } finally {
      setLoading(false);
    }
  };

  const shareHighlight = async (highlightId: string) => {
    try {
      setLoading(true);
      setError(null);

      await axiosInstance.post(`/api/highlights/${highlightId}/share`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to share highlight'
      );
    } finally {
      setLoading(false);
    }
  };

  const downloadHighlight = async (highlightId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axiosInstance.get(
        `/api/highlights/${highlightId}/download`,
        {
          responseType: 'blob',
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `highlight-${highlightId}.mp4`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to download highlight'
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchHighlights = async (tournamentId: string) => {
    try {
      const response = await axiosInstance.get(
        `/api/highlights/tournament/${tournamentId}`
      );
      const highlights = response.data.map((highlight: any) => ({
        ...highlight,
        videoRef: useRef<HTMLVideoElement>(null),
      }));

      setHighlights(
        highlights.reduce((acc: Record<string, Highlight>, highlight) => {
          acc[highlight.id] = highlight;
          return acc;
        }, {})
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch highlights'
      );
    }
  };

  useEffect(() => {
    const fetchUserHighlights = async () => {
      try {
        const response = await axiosInstance.get('/api/highlights');
        const highlights = response.data.map((highlight: any) => ({
          ...highlight,
          videoRef: useRef<HTMLVideoElement>(null),
        }));

        setHighlights(
          highlights.reduce((acc: Record<string, Highlight>, highlight) => {
            acc[highlight.id] = highlight;
            return acc;
          }, {})
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch highlights'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUserHighlights();
  }, []);

  return {
    highlights,
    generateHighlight,
    shareHighlight,
    downloadHighlight,
    loading,
    error,
  };
};
