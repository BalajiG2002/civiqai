import { useState, useEffect } from 'react';
import { FileText, Search, ChevronDown, Eye, MapPin,
         AlertCircle, CheckCircle2, Clock, AlertTriangle,
         XCircle, RefreshCw } from 'lucide-react';
import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const STATUS_CONFIG = {
  open:        { icon: AlertCircle,  color: 'text-red-400',     bg: 'bg-red-500/10' },
  in_progress: { icon: Clock,        color: 'text-amber-400',   bg: 'bg-amber-500/10' },
  resolved:    { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  closed:      { icon: XCircle,      color: 'text-slate-400',   bg: 'bg-slate-500/10' },
};

const SEVERITY_CONFIG = {
  low:      { color: 'text-blue-400',    bg: 'bg-blue-500/10' },
  moderate: { color: 'text-amber-400',   bg: 'bg-amber-500/10' },
  high:     { color: 'text-red-400',     bg: 'bg-red-500/10' },
};

const STATUS_OPTIONS = [
  { value: 'open',        label: 'Open',        color: 'text-red-400' },
  { value: 'in_progress', label: 'In Progress', color: 'text-amber-400' },
  { value: 'resolved',    label: 'Resolved',    color: 'text-emerald-400' },
  { value: 'closed',      label: 'Closed',      color: 'text-slate-400' },
];

export default function ComplaintTable() {
  const [complaints, setComplaints] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [updating, setUpdating] = useState(null);   // complaint id being updated

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get(`${BASE}/complaints`);
        setComplaints(data);
      } catch (e) {
        console.error('Failed to fetch complaints:', e);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  // Status change handler
  const handleStatusChange = async (complaintId, newStatus) => {
    setUpdating(complaintId);
    try {
      await axios.patch(`${BASE}/complaints/${complaintId}/status`, {
        status: newStatus,
        changed_by: 'dashboard_officer'
      });
      // Optimistic update
      setComplaints(prev =>
        prev.map(c => c.id === complaintId ? { ...c, status: newStatus } : c)
      );
    } catch (e) {
      console.error('Status update failed:', e);
    } finally {
      setUpdating(null);
    }
  };

  const filtered = complaints
    .filter(c => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (c.id || '').toLowerCase().includes(q)
          || (c.issue_type || '').toLowerCase().includes(q)
          || (c.location_text || '').toLowerCase().includes(q)
          || (c.description || '').toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.submitted_at || 0) - new Date(a.submitted_at || 0);
      if (sortBy === 'severity') {
        const order = { high: 0, moderate: 1, low: 2 };
        return (order[a.severity] || 2) - (order[b.severity] || 2);
      }
      return 0;
    });

  return (
    <div className="bg-[#111827] border border-[#1e293b] rounded-xl
                    overflow-hidden">

      {/* Header with search + filters */}
      <div className="px-3 sm:px-4 py-3 border-b border-[#1e293b]
                      flex flex-col sm:flex-row sm:items-center
                      sm:justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-blue-400" />
          <h3 className="text-sm font-semibold text-white">
            Complaints
          </h3>
          <span className="text-[10px] bg-blue-500/10 text-blue-400
                          px-2 py-0.5 rounded-full font-medium">
            {filtered.length} of {complaints.length}
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto
                        scrollbar-none">
          {/* Search */}
          <div className="flex items-center bg-[#0a0f1a]
                         border border-[#1e293b] rounded-lg px-2.5 py-1.5
                         gap-1.5 flex-shrink-0">
            <Search size={13} className="text-slate-500" />
            <input type="text" value={search}
                   onChange={e => setSearch(e.target.value)}
                   placeholder="Search..."
                   className="bg-transparent text-xs text-slate-200
                             placeholder-slate-600 outline-none
                             w-28 sm:w-40" />
          </div>

          {/* Status filter pills */}
          <div className="flex gap-1 flex-shrink-0">
            {['all', 'open', 'in_progress', 'resolved'].map(s => (
              <button key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2 py-1 rounded-md text-[10px] font-medium
                           capitalize transition-colors whitespace-nowrap
                           ${statusFilter === s
                             ? 'bg-blue-600 text-white'
                             : 'text-slate-400 hover:bg-white/5'}`}>
                {s === 'all' ? 'All' : s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                  className="bg-[#0a0f1a] border border-[#1e293b]
                            rounded-lg px-2 py-1.5 text-[10px]
                            text-slate-400 outline-none flex-shrink-0">
            <option value="newest">Newest first</option>
            <option value="severity">By severity</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
        <table className="w-full text-left">
          <thead className="bg-[#0d1321] sticky top-0">
            <tr>
              <th className="px-3 sm:px-4 py-2.5 text-[10px] font-semibold
                           text-slate-500 uppercase tracking-wider">ID</th>
              <th className="px-3 sm:px-4 py-2.5 text-[10px] font-semibold
                           text-slate-500 uppercase tracking-wider">Type</th>
              <th className="px-3 sm:px-4 py-2.5 text-[10px] font-semibold
                           text-slate-500 uppercase tracking-wider
                           hidden md:table-cell">Location</th>
              <th className="px-3 sm:px-4 py-2.5 text-[10px] font-semibold
                           text-slate-500 uppercase tracking-wider
                           hidden sm:table-cell">Severity</th>
              <th className="px-3 sm:px-4 py-2.5 text-[10px] font-semibold
                           text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-3 sm:px-4 py-2.5 text-[10px] font-semibold
                           text-slate-500 uppercase tracking-wider
                           hidden sm:table-cell">Priority</th>
              <th className="px-3 sm:px-4 py-2.5 text-[10px] font-semibold
                           text-slate-500 uppercase tracking-wider
                           hidden lg:table-cell">Time</th>
              <th className="px-3 sm:px-4 py-2.5 text-[10px] font-semibold
                           text-slate-500 uppercase tracking-wider">Update</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <FileText size={28} className="text-slate-700 mx-auto mb-2" />
                  <p className="text-xs text-slate-600">No complaints found</p>
                </td>
              </tr>
            ) : (
              filtered.map(c => {
                const stCfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.open;
                const svCfg = SEVERITY_CONFIG[c.severity] || SEVERITY_CONFIG.moderate;
                const StIcon = stCfg.icon;
                const time = c.submitted_at
                  ? new Date(c.submitted_at).toLocaleString('en-IN', {
                      day: '2-digit', month: 'short',
                      hour: '2-digit', minute: '2-digit'
                    })
                  : '—';

                return (
                  <tr key={c.id}
                      className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-3 sm:px-4 py-3">
                      <span className="text-[11px] font-mono text-blue-400">
                        {c.id}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <span className="text-[11px] text-slate-300 capitalize">
                        {(c.issue_type || 'other').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={11} className="text-slate-500" />
                        <span className="text-[11px] text-slate-400 truncate max-w-[180px]">
                          {c.location_text || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 hidden sm:table-cell">
                      <span className={`text-[10px] font-medium px-2 py-0.5
                                      rounded-full capitalize
                                      ${svCfg.bg} ${svCfg.color}`}>
                        {c.severity || 'moderate'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <StIcon size={12} className={stCfg.color} />
                        <span className={`text-[10px] font-medium capitalize
                                        ${stCfg.color}`}>
                          {(c.status || 'open').replace(/_/g, ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 hidden sm:table-cell">
                      {c.priority ? (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5
                                        rounded
                                        ${c.priority === 'P1'
                                          ? 'bg-red-500/20 text-red-400'
                                          : c.priority === 'P2'
                                            ? 'bg-amber-500/20 text-amber-400'
                                            : 'bg-blue-500/20 text-blue-400'}`}>
                          {c.priority}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-4 py-3 hidden lg:table-cell">
                      <span className="text-[10px] text-slate-500">{time}</span>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="relative">
                        {updating === c.id ? (
                          <RefreshCw size={14} className="text-blue-400 animate-spin" />
                        ) : (
                          <select
                            value={c.status || 'open'}
                            onChange={(e) => handleStatusChange(c.id, e.target.value)}
                            className="bg-[#0a0f1a] border border-[#1e293b] rounded-md
                                      px-1.5 py-1 text-[10px] font-medium
                                      text-slate-300 outline-none cursor-pointer
                                      hover:border-blue-500/50 transition-colors
                                      appearance-none pr-5
                                      dark:bg-[#0a0f1a]"
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                              backgroundRepeat: 'no-repeat',
                              backgroundPosition: 'right 4px center',
                            }}>
                            {STATUS_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
