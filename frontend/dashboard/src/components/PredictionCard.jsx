import { AlertTriangle, Shield, TrendingUp } from 'lucide-react';

export default function PredictionCard({ sseEvents }) {
  const predictions = sseEvents
    .filter(e => e.type === 'prediction' && e.prediction)
    .slice(0, 3);

  return (
    <div className="bg-[#111827] border border-[#1e293b] rounded-xl
                    overflow-hidden">

      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1e293b]
                      flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-400" />
          <h3 className="text-sm font-semibold text-white">
            AI Predictions
          </h3>
        </div>
        <span className="text-[10px] bg-red-500/10 text-red-400
                        px-2 py-0.5 rounded-full font-medium">
          {predictions.length} active
        </span>
      </div>

      {/* Predictions list */}
      <div className="p-3 space-y-2">
        {predictions.length === 0 ? (
          <div className="flex items-center gap-3 p-3 rounded-lg
                         bg-emerald-500/5 border border-emerald-500/10">
            <Shield size={20} className="text-emerald-500/50" />
            <div>
              <p className="text-xs text-emerald-400 font-medium">
                No active predictions
              </p>
              <p className="text-[10px] text-slate-600 mt-0.5">
                AI will flag infrastructure failure risks here
              </p>
            </div>
          </div>
        ) : (
          predictions.map((ev, i) => {
            const p = ev.prediction || {};
            const conf = p.confidence || 0;
            return (
              <div key={i}
                   className="p-2.5 rounded-lg bg-red-500/5
                             border border-red-500/15">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-red-400
                                  capitalize">
                    {(p.failure_type || 'unknown').replace(/_/g, ' ')}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5
                                  rounded
                                  ${conf > 70
                                    ? 'bg-red-500/20 text-red-400'
                                    : 'bg-amber-500/20 text-amber-400'}`}>
                    {conf}% conf
                  </span>
                </div>
                {/* Confidence bar */}
                <div className="w-full h-1.5 bg-[#1e293b] rounded-full mb-1.5">
                  <div className={`h-full rounded-full transition-all
                                  ${conf > 70 ? 'bg-red-500' : 'bg-amber-500'}`}
                       style={{ width: `${conf}%` }} />
                </div>
                {p.reasoning && (
                  <p className="text-[10px] text-slate-500 line-clamp-2">
                    {p.reasoning}
                  </p>
                )}
                {p.estimated_window_hrs && (
                  <p className="text-[10px] text-red-400/70 mt-1">
                    Est. window: {p.estimated_window_hrs}h
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
