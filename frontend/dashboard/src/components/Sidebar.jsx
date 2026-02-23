import { LayoutDashboard, FileText, BarChart3,
         ChevronLeft, ChevronRight, Shield } from 'lucide-react';

const NAV = [
  { id: 'overview',   label: 'Overview',    icon: LayoutDashboard },
  { id: 'complaints', label: 'Complaints',  icon: FileText },
  { id: 'analytics',  label: 'Analytics',   icon: BarChart3 },
];

export default function Sidebar({ tab, setTab, open, setOpen }) {
  return (
    <>
      {/* ── Desktop sidebar (md and up) ── */}
      <aside className={`hidden md:flex fixed top-0 left-0 h-screen bg-[#0d1321]
                         border-r border-[#1e293b] flex-col
                         transition-all duration-300 z-20
                         ${open ? 'w-60' : 'w-16'}`}>

        {/* Brand */}
        <div className="px-4 py-5 flex items-center gap-3 border-b border-[#1e293b]">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500
                          to-blue-700 flex items-center justify-center
                          shadow-lg shadow-blue-500/20 flex-shrink-0">
            <Shield size={18} className="text-white" />
          </div>
          {open && (
            <div className="overflow-hidden">
              <h1 className="text-sm font-bold text-white tracking-tight
                             whitespace-nowrap">CiviqAI</h1>
              <p className="text-[10px] text-slate-500 whitespace-nowrap">
                Command Center
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {NAV.map(item => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button key={item.id}
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5
                           rounded-lg text-sm font-medium transition-all
                           ${active
                             ? 'bg-blue-600/15 text-blue-400 shadow-inner'
                             : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                           }`}>
                <Icon size={18} className={active ? 'text-blue-400' : ''} />
                {open && <span className="whitespace-nowrap">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="p-3 border-t border-[#1e293b]">
          <button onClick={() => setOpen(!open)}
                  className="w-full flex items-center justify-center gap-2
                             py-2 rounded-lg text-slate-500 hover:text-slate-300
                             hover:bg-white/5 transition-colors text-xs">
            {open ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            {open && 'Collapse'}
          </button>
        </div>

        {/* Officer badge */}
        {open && (
          <div className="px-4 py-3 border-t border-[#1e293b]
                          flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br
                            from-emerald-500 to-emerald-700
                            flex items-center justify-center text-xs
                            font-bold text-white">MO</div>
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-slate-200 truncate">
                Municipal Officer
              </p>
              <p className="text-[10px] text-slate-500 truncate">
                Chennai Zone 5
              </p>
            </div>
          </div>
        )}
      </aside>

      {/* ── Mobile bottom nav (below md) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30
                      bg-[#0d1321]/95 backdrop-blur-md
                      border-t border-[#1e293b]
                      flex items-center justify-around
                      h-14 px-2
                      safe-area-bottom">
        {NAV.map(item => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex flex-col items-center gap-0.5 px-4 py-1.5
                         rounded-lg transition-all active:scale-95
                         ${active
                           ? 'text-blue-400'
                           : 'text-slate-500'}`}>
              <Icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
