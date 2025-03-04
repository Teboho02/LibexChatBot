import { useState, useRef, useEffect } from 'react';
import { Box, Container, TextField, IconButton, Paper, Typography, Avatar } from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import Typewriter from 'typewriter-effect';
import axios from 'axios';

interface Message {
  text: string;
  isBot: boolean;
  isTyping?: boolean;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { text: input, isBot: false };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      setMessages(prev => [...prev, { text: '', isBot: true, isTyping: true }]);

      const response = await axios.post('https://libex-chat-bot-backend.vercel.app/generate', {
        question: input,
        messages: messages.map(msg => msg.text)
      });

      setMessages(prev => [
        ...prev.filter(msg => !msg.isTyping),
        { text: response.data.answer, isBot: true }
      ]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [
        ...prev.filter(msg => !msg.isTyping),
        { text: 'Sorry, I encountered an error. Please try again.', isBot: true }
      ]);
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#f5f7fb',
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          py: 3,
          gap: 3,
          height: 'calc(100vh - 32px)'
        }}
      >
        <Paper
          elevation={3}
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: 3,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: '#f1f1f1',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#c1c1c1',
                borderRadius: '4px',
                '&:hover': {
                  background: '#a8a8a8',
                },
              },
            }}
          >
            {messages.map((message, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: message.isBot ? 'flex-start' : 'flex-end',
                  gap: 1.5
                }}
              >
                {message.isBot && (
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: 'primary.main'
                    }}
                    alt="Libex AI"
                    src="/libexlogo.png"
                  />
                )}
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    maxWidth: '60%',
                    bgcolor: message.isBot ? '#ffffff' : 'primary.main',
                    color: message.isBot ? 'text.primary' : '#ffffff',
                    borderRadius: 2,
                    position: 'relative',
                    '&::before': message.isBot ? {
                      content: '""',
                      position: 'absolute',
                      left: -8,
                      top: 15,
                      borderStyle: 'solid',
                      borderWidth: '8px 8px 8px 0',
                      borderColor: 'transparent #ffffff transparent transparent'
                    } : {}
                  }}
                >
                  {message.isTyping ? (
                    <Typography sx={{ fontSize: '1rem' }}>...</Typography>
                  ) : message.isBot ? (
                    <Typewriter
                      options={{
                        delay: 30,
                        cursor: ''
                      }}
                      onInit={(typewriter) => {
                        typewriter
                          .typeString(message.text)
                          .start();
                      }}
                    />
                  ) : (
                    <Typography sx={{ fontSize: '1rem', lineHeight: 1.5 }}>
                      {message.text}
                    </Typography>
                  )}
                </Paper>
              </Box>
            ))}
            <div ref={messagesEndRef} />
          </Box>
        </Paper>
        <Paper
          elevation={6}
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: '#ffffff'
          }}
        >
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: '#f8f9fa'
                }
              }}
            />
            <IconButton
              onClick={handleSend}
              disabled={!input.trim()}
              sx={{
                bgcolor: 'primary.main',
                color: '#ffffff',
                width: 56,
                height: 56,
                borderRadius: 2,
                '&:hover': {
                  bgcolor: 'primary.dark'
                },
                '&.Mui-disabled': {
                  bgcolor: 'action.disabledBackground',
                  color: 'action.disabled'
                }
              }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default App;
