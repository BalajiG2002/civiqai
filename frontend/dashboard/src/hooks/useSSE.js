import { useEffect, useState } from 'react';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export function useSSE() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const es = new EventSource(`${BASE}/stream`);

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setEvents(prev => [data, ...prev].slice(0, 200));
      } catch (_) {}
    };

    es.onerror = () => es.close();

    return () => es.close();
  }, []);

  return events;
}
