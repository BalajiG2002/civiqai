import { Activity, MapPin, RefreshCw, AlertTriangle,
         FileText, Mail, Layers } from 'lucide-react';

const EVENT_CONFIG = {
  new_pin:    { icon: MapPin,        color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30' },
  pin_update: { icon: RefreshCw,     color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/30' },
  cluster:    { icon: Layers,        color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  prediction: { icon: AlertTriangle, color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/30' },
  work_order: { icon: FileText,      color: 'text-emerald-400',bg: 'bg-emerald-500/10',border: 'border-emerald-500/30' },
  email:      { icon: Mail,          color: 'text-cyan-400',   bg: 'bg-cyan-500/10',   border: 'border-cyan-500/30' },
};

export default function AlertFeed({ events }) {
  return (
    <div className="bg-[#111827] border border-[#1e293b] rounded-xl
                    flex flex-col h-full overflow-hidden">

      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1e293b]
                      flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-amber-400" />
          <h3 className="text-sm font-semibold text-white">Live Feed</h3>
        </div>
        <span className="text-[10px] bg-amber-500/10 text-amber-400
                        px-2 py-0.5 rounded-full font-medium">
          {events.length} events
        </span>
      </div>

      {/* Event stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center
                         h-full text-slate-600">
            <Activity size={28} className="mb-2 opacity-40" />
            <p className="text-xs">Waiting for events...</p>
            <p className="text-[10px] mt-1 text-slate-700">
              Events will appear here in real-time
            </p>
          </div>
        ) : (
          events.slice(0, 50).map((ev, i) => {
            const cfg = EVENT_CONFIG[ev.type] || EVENT_CONFIG.new_pin;
            const Icon = cfg.icon;
            const time = new Date(ev.timestamp || Date.now())
              .toLocaleTimeString('en-IN', {
                hour: '2-digit', minute: '2-digit', second: '2-digit'
              });

            return (
              <div key={i}
                   className={`feed-item flex items-start gap-2.5 p-2.5
                              rounded-lg border ${cfg.border} ${cfg.bg}
                              transition-colors hover:bg-white/[0.03]`}>
                <div className={`w-7 h-7 rounded-md flex items-center
                               justify-center flex-shrink-0 ${cfg.bg}`}>
                  <Icon size={14} className={cfg.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-semibold ${cfg.color}`}>
                      {ev.type?.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <span className="text-[9px] text-slate-600 flex-shrink-0">
                      {time}
                    </span>
                  </div>
                  {ev.complaint_id && (
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                      #{ev.complaint_id}
                    </p>
                  )}
                  {ev.issue_type && (
                    <p className="text-[10px] text-slate-500 capitalize truncate">
                      {ev.issue_type.replace(/_/g, ' ')}
                    </p>
                  )}
                  {ev.message && (
                    <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                      {ev.message}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
