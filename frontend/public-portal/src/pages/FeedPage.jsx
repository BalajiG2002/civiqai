import { useState, useCallback } from 'react';
import ComplaintPost  from '../components/ComplaintPost';
import { useComplaints } from '../hooks/useComplaints';
import { useSSE }        from '../hooks/useSSE';
import { useTheme }      from '../context/ThemeContext';

const FILTERS = ['All', 'Open', 'In Progress', 'Resolved', 'Closed'];
const TYPES   = ['All', 'Pothole', 'Water Leak', 'Garbage',
                 'Streetlight', 'Power Outage', 'Waterlogging'];

export default function FeedPage() {
  const { complaints, loading, addComplaint,
          updateComplaint } = useComplaints();
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const [activeFilter, setActiveFilter] = useState('All');

  const handleSSE = useCallback((event) => {
    if (event.type === 'new_pin') addComplaint({
      id:          event.complaint_id,
      issue_type:  event.issue_type,
      lat:         event.lat,
      lng:         event.lng,
      status:      'open',
      priority:    event.priority || 'P3',
      location:    event.location || '',
      submitted_at:event.timestamp
    });
    if (event.type === 'pin_update' || event.type === 'status_update')
      updateComplaint(event.complaint_id, { status: event.status });
  }, [addComplaint, updateComplaint]);

  useSSE(handleSSE);

  const filtered = complaints.filter(c => {
    if (activeFilter === 'All')         return true;
    if (activeFilter === 'Open')        return c.status === 'open';
    if (activeFilter === 'In Progress') return c.status === 'in_progress';
    if (activeFilter === 'Resolved')    return c.status === 'resolved';
    if (activeFilter === 'Closed')      return c.status === 'closed';
    return true;
  });

  const counts = {
    open:     complaints.filter(c => c.status === 'open').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
    p1:       complaints.filter(c => c.priority === 'P1').length,
  };

  return (
    <div className="max-w-2xl mx-auto">

      {/* Stats strip */}
      <div className={`flex gap-4 px-4 py-3 border-b text-xs
                      ${dark ? 'border-white/10 text-zinc-500' : 'border-gray-200 text-gray-500'}`}>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500"/>
          {counts.open} open
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500"/>
          {counts.resolved} resolved
        </span>
        {counts.p1 > 0 && (
          <span className="flex items-center gap-1 text-red-400 font-semibold">
            ⚠️ {counts.p1} P1 alerts
          </span>
        )}
        <span className="ml-auto flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>
          Live
        </span>
      </div>

      {/* Filter tabs */}
      <div className={`flex gap-1 px-4 py-2 border-b overflow-x-auto scrollbar-none
                      ${dark ? 'border-white/10' : 'border-gray-200'}`}>
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium
                        whitespace-nowrap transition-all
                        ${activeFilter === f
                          ? (dark ? 'bg-white text-black' : 'bg-slate-900 text-white')
                          : (dark ? 'text-zinc-500 hover:text-white hover:bg-white/10'
                                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100')}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Feed */}
      {loading ? (
        <div className={`flex flex-col items-center py-20 ${dark ? 'text-zinc-600' : 'text-gray-400'}`}>
          <div className={`w-6 h-6 border-2 rounded-full animate-spin mb-3
                          ${dark ? 'border-zinc-600 border-t-white' : 'border-gray-300 border-t-gray-700'}`}/>
          Loading complaints...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-zinc-600">
          <p className="text-4xl mb-3">🏙️</p>
          <p>No complaints yet. Be the first to report!</p>
        </div>
      ) : (
        filtered.map(c => (
          <ComplaintPost key={c.id} complaint={c} />
        ))
      )}
    </div>
  );
}
