import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Divider, List, ListItem, ListItemText, TextField, Typography } from '@mui/material';
import { Socket } from 'socket.io-client';

interface ChatBoxProps {
  socket: Socket;
  matchId: string;
  username?: string;
}

interface ChatMessage {
  matchId: string;
  message: string;
  user: string;
  ts: number;
  type?: 'system' | 'user';
}

const ChatBox: React.FC<ChatBoxProps> = ({ socket, matchId, username }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onNewMessage = (payload: { userId?: string; username?: string; message: string; timestamp?: string | Date }) => {
      setMessages((prev) => [
        ...prev,
        {
          matchId,
          message: payload.message,
          user: payload.username || 'User',
          ts: payload.timestamp ? new Date(payload.timestamp).getTime() : Date.now(),
          type: 'user',
        },
      ]);
    };

    const onUserJoined = (payload: { message: string; timestamp?: string | Date }) => {
      setMessages((prev) => [
        ...prev,
        {
          matchId,
          message: payload.message,
          user: 'system',
          ts: payload.timestamp ? new Date(payload.timestamp).getTime() : Date.now(),
          type: 'system',
        },
      ]);
    };

    const onUserLeft = (payload: { message: string; timestamp?: string | Date }) => {
      setMessages((prev) => [
        ...prev,
        {
          matchId,
          message: payload.message,
          user: 'system',
          ts: payload.timestamp ? new Date(payload.timestamp).getTime() : Date.now(),
          type: 'system',
        },
      ]);
    };

    socket.on('newMessage', onNewMessage);
    socket.on('userJoined', onUserJoined);
    socket.on('userLeft', onUserLeft);
    return () => {
      socket.off('newMessage', onNewMessage);
      socket.off('userJoined', onUserJoined);
      socket.off('userLeft', onUserLeft);
    };
  }, [socket, matchId]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages.length]);

  const send = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    socket.emit('sendMessage', {
      matchId,
      userId: '',
      username: username || 'You',
      message: trimmed,
      timestamp: new Date(),
    });
    setInput('');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Live Chat
      </Typography>
      <Divider sx={{ mb: 1 }} />
      <Box ref={listRef} sx={{ flex: 1, overflowY: 'auto', mb: 1, maxHeight: 400 }}>
        <List dense>
          {messages.map((m, idx) => (
            <ListItem key={idx}>
              <ListItemText
                primary={
                  m.type === 'system' ? (
                    <Typography color="text.secondary" variant="caption">{m.message}</Typography>
                  ) : (
                    <>
                      <Typography component="span" sx={{ fontWeight: 600 }}>
                        {m.user}:
                      </Typography>{' '}
                      <Typography component="span">{m.message}</Typography>
                    </>
                  )
                }
                secondary={new Date(m.ts).toLocaleTimeString()}
              />
            </ListItem>
          ))}
        </List>
      </Box>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              send();
            }
          }}
        />
        <Button variant="contained" onClick={send}>
          Send
        </Button>
      </Box>
    </Box>
  );
};

export default ChatBox;
