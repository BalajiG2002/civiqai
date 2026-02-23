const STEP_ICONS = {
  analyzing:   '🔍',
  locating:    '📍',
  searching:   '🏛️',
  dispatching: '📧',
  publishing:  '🌐',
  done:        '✅',
  error:       '❌'
};

export default function ThinkingSteps({ steps }) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="my-4 space-y-2">
      {steps.map((step, i) => (
        <div key={i}
             className={`flex items-start gap-3 text-sm transition-all
                         duration-300 ${step.active ? 'opacity-100' : 'opacity-50'}`}>

          {/* Icon / Spinner */}
          <div className="w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
            {step.active && step.status === 'running' ? (
              <div className="w-4 h-4 border-2 border-zinc-600
                              border-t-blue-400 rounded-full animate-spin"/>
            ) : (
              <span className="text-base">
                {STEP_ICONS[step.status] || STEP_ICONS.analyzing}
              </span>
            )}
          </div>

          {/* Text */}
          <div className="flex-1">
            <p className={`font-medium ${
              step.status === 'done'  ? 'text-green-400' :
              step.status === 'error' ? 'text-red-400'   :
              step.active             ? 'text-white'      : 'text-zinc-500'
            }`}>
              {step.label}
            </p>
            {step.detail && (
              <p className="text-xs text-zinc-500 mt-0.5">{step.detail}</p>
            )}
          </div>

          {/* Time */}
          {step.time && (
            <span className="text-xs text-zinc-600 mt-0.5">{step.time}</span>
          )}
        </div>
      ))}
    </div>
  );
}
