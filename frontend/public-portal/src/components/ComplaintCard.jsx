import StatusBadge from './StatusBadge';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const ISSUE_ICONS = {
  pothole:             '🚧',
  water_leak:          '💧',
  garbage_overflow:    '🗑️',
  streetlight_failure: '💡',
  power_outage:        '⚡',
  waterlogging:        '🌊',
  sewage_overflow:     '⚠️',
  tree_fallen:         '🌳',
  other:               '📍'
};

export default function ComplaintCard({ complaint, onClick }) {
  const icon = ISSUE_ICONS[complaint.issue_type] || '📍';
  const date = new Date(complaint.submitted_at)
    .toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

  return (
    <div
      onClick={() => onClick?.(complaint)}
      className="bg-white rounded-xl border border-slate-200
                 p-4 cursor-pointer hover:shadow-md hover:border-blue-300
                 transition-all duration-200 group"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <div>
            <p className="font-semibold text-sm text-slate-800">
              {complaint.issue_type?.replace(/_/g, ' ')
                .replace(/\b\w/g, c => c.toUpperCase())}
            </p>
            <p className="text-xs text-slate-500">{complaint.id}</p>
          </div>
        </div>
        <StatusBadge
          status={complaint.status}
          priority={complaint.priority}
        />
      </div>

      {/* Image */}
      {complaint.image_url && (
        <img
          src={`${BASE}/${complaint.image_url}`}
          alt="complaint"
          className="w-full h-36 object-cover rounded-lg mb-2"
          onError={(e) => {
            e.target.src = complaint.streetview_url || '';
          }}
        />
      )}

      {/* Location */}
      <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
        <span>📍</span>
        <span className="truncate">{complaint.location}</span>
      </div>

      {/* Description */}
      {complaint.description && (
        <p className="text-xs text-slate-600 line-clamp-2 mb-2">
          {complaint.description}
        </p>
      )}

      {/* Department */}
      {complaint.department && (
        <p className="text-xs text-blue-600 font-medium">
          → {complaint.department}
        </p>
      )}

      {/* Date */}
      <p className="text-xs text-slate-400 mt-2">{date}</p>

      {/* Prediction warning */}
      {complaint.prediction && (
        <div className="mt-2 text-xs bg-yellow-50 text-yellow-700
                        px-2 py-1 rounded border border-yellow-200">
          ⚠️ AI Alert: Pre-failure pattern detected
        </div>
      )}
    </div>
  );
}
