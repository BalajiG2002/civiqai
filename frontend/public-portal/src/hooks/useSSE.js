import { useEffect, useCallback } from 'react';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export function useSSE(onEvent) {
  useEffect(() => {
    const es = new EventSource(`${BASE}/stream`);

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        onEvent(data);
      } catch (_) {}
    };

    es.onerror = () => es.close();

    return () => es.close();
  }, [onEvent]);
}
