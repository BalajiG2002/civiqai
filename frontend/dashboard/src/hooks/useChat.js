import { useState, useCallback } from 'react';
import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export function useChat() {
  const [messages, setMessages] = useState([
    { role: 'assistant',
      text: 'Hello officer! I\'m your AI assistant. Ask me anything about complaints, trends, or clusters.' }
  ]);
  const [loading, setLoading] = useState(false);

  const send = useCallback(async (text) => {
    setMessages(prev => [...prev, { role: 'user', text }]);
    setLoading(true);
    try {
      const { data } = await axios.post(`${BASE}/chat`, {
        message: text,
        session_id: 'dashboard_officer'
      });
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: data.reply || 'No reply received.'
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: '⚠️ Error reaching AI backend.'
      }]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { messages, loading, send };
}
