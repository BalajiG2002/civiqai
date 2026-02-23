import ComplaintCard from './ComplaintCard';

const ISSUE_TYPES = [
  'pothole','water_leak','garbage_overflow',
  'streetlight_failure','power_outage',
  'waterlogging','sewage_overflow','tree_fallen'
];

export default function ComplaintFeed({
  complaints, loading, filter, setFilter, onCardClick
}) {
  const counts = {
    total:    complaints.length,
    open:     complaints.filter(c => c.status === 'open').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
    p1:       complaints.filter(c => c.priority === 'P1').length
  };

  return (
    <div className="flex flex-col h-full">

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {[
          { label: 'Total',    val: counts.total,    color: 'text-slate-700' },
          { label: 'Open',     val: counts.open,     color: 'text-red-600'   },
          { label: 'Resolved', val: counts.resolved, color: 'text-green-600' },
          { label: 'P1',       val: counts.p1,       color: 'text-red-700 font-bold' }
        ].map(s => (
          <div key={s.label}
               className="bg-white rounded-lg border p-2 text-center">
            <p className={`text-lg font-bold ${s.color}`}>{s.val}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-3">
        <select
          value={filter.status}
          onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
          className="flex-1 text-sm border border-slate-300 rounded-lg
                     px-2 py-1.5 focus:outline-none focus:ring-2
                     focus:ring-blue-400 bg-white"
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>

        <select
          value={filter.issue_type}
          onChange={e => setFilter(f => ({ ...f, issue_type: e.target.value }))}
          className="flex-1 text-sm border border-slate-300 rounded-lg
                     px-2 py-1.5 focus:outline-none focus:ring-2
                     focus:ring-blue-400 bg-white"
        >
          <option value="">All Issues</option>
          {ISSUE_TYPES.map(t => (
            <option key={t} value={t}>
              {t.replace(/_/g,' ')}
            </option>
          ))}
        </select>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {loading ? (
          <div className="text-center text-slate-400 py-10">
            Loading complaints...
          </div>
        ) : complaints.length === 0 ? (
          <div className="text-center text-slate-400 py-10">
            No complaints found
          </div>
        ) : (
          complaints.map(c => (
            <ComplaintCard key={c.id} complaint={c}
                           onClick={onCardClick} />
          ))
        )}
      </div>
    </div>
  );
}
