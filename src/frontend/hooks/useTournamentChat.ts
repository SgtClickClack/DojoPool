import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderUsername: string;
  timestamp: string;
  type: 'text' | 'image' | 'video' | 'voice';
}

interface Participant {
  userId: string;
  username: string;
  score: number;
  teamName: string;
}

interface Team {
  id: string;
  name: string;
  score: number;
  memberCount: number;
}

export interface TournamentChat {
  messages: Message[];
  participants: Participant[];
  teams: Team[];
  loading: boolean;
  error: string | null;
  voiceEnabled: boolean;
  videoEnabled: boolean;
}

export const useTournamentChat = (tournamentId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);

  const fetchChatData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [messagesResponse, participantsResponse, teamsResponse] = await Promise.all([
        axiosInstance.get(`/api/tournaments/${tournamentId}/chat/messages`),
        axiosInstance.get(`/api/tournaments/${tournamentId}/chat/participants`),
        axiosInstance.get(`/api/tournaments/${tournamentId}/chat/teams`),
      ]);

      setMessages(messagesResponse.data);
      setParticipants(participantsResponse.data);
      setTeams(teamsResponse.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch chat data'
      );
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    try {
      await axiosInstance.post(`/api/tournaments/${tournamentId}/chat/messages`, {
        content,
        type: 'text',
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to send message'
      );
    }
  };

  const toggleVoice = async () => {
    try {
      await axiosInstance.post(`/api/tournaments/${tournamentId}/chat/voice`, {
        enabled: !voiceEnabled,
      });
      setVoiceEnabled(!voiceEnabled);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to toggle voice chat'
      );
    }
  };

  const toggleVideo = async () => {
    try {
      await axiosInstance.post(`/api/tournaments/${tournamentId}/chat/video`, {
        enabled: !videoEnabled,
      });
      setVideoEnabled(!videoEnabled);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to toggle video chat'
      );
    }
  };

  useEffect(() => {
    fetchChatData();

    // Set up real-time updates
    const socket = new WebSocket(`ws://localhost:8000/tournaments/${tournamentId}/chat`);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'message':
          setMessages((prev) => [data.message, ...prev]);
          break;
        case 'participant':
          setParticipants((prev) => [...prev, data.participant]);
          break;
        case 'team':
          setTeams((prev) => [...prev, data.team]);
          break;
        case 'voice':
          setVoiceEnabled(data.enabled);
          break;
        case 'video':
          setVideoEnabled(data.enabled);
          break;
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      socket.close();
    };
  }, [tournamentId]);

  return {
    messages,
    participants,
    teams,
    sendMessage,
    toggleVoice,
    toggleVideo,
    voiceEnabled,
    videoEnabled,
    loading,
    error,
  };
};
