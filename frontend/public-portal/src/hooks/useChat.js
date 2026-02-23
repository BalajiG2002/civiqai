import { useState, useCallback } from 'react';
import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(false);

  const send = useCallback(async (text, image) => {
    setLoading(true);
    const userMsg = { role: 'user', text, image: image ? URL.createObjectURL(image) : null };
    setMessages(prev => [...prev, userMsg]);

    try {
      let response;
      if (image) {
        const fd = new FormData();
        fd.append('image', image);
        fd.append('location', text || 'Chennai');
        const { data } = await axios.post(`${BASE}/complaint`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        response = data.message || 'Complaint submitted successfully!';
      } else {
        const { data } = await axios.post(`${BASE}/chat`, { message: text });
        response = data.reply || data.message || 'Received your message.';
      }

      setMessages(prev => [...prev, { role: 'assistant', text: response }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: '❌ Something went wrong. Please try again.'
      }]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { messages, loading, send };
}
