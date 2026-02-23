import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export function useComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState({
    status: '', issue_type: ''
  });

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.status)     params.status     = filter.status;
      if (filter.issue_type) params.issue_type = filter.issue_type;
      const { data } = await axios.get(`${BASE}/complaints`, { params });
      setComplaints(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetch(); }, [fetch]);

  // Add new complaint from SSE without refetch
  const addComplaint = useCallback((c) => {
    setComplaints(prev => [c, ...prev]);
  }, []);

  const updateComplaint = useCallback((id, patch) => {
    setComplaints(prev =>
      prev.map(c => c.id === id ? { ...c, ...patch } : c)
    );
  }, []);

  return { complaints, loading, filter,
           setFilter, addComplaint, updateComplaint };
}
