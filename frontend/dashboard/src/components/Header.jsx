import { Bell, Search, Wifi, Shield, Sun, Moon, LogOut } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function Header({ eventCount }) {
  const { theme, toggle } = useTheme();
  const { logout } = useAuth();
  const dark = theme === 'dark';
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit'
  });
  const dateStr = now.toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  });

  return (
    <header className={`h-14 backdrop-blur-md
                       border-b px-3 sm:px-4 md:px-6
                       flex items-center justify-between sticky top-0 z-10
                       transition-colors duration-300
                       ${dark
                         ? 'bg-[#0d1321]/80 border-[#1e293b]'
                         : 'bg-white/80 border-gray-200'}`}>

      {/* Left: mobile brand + title + date */}
      <div className="flex items-center gap-3">
        {/* Mobile-only brand icon */}
        <div className="md:hidden w-8 h-8 rounded-lg bg-gradient-to-br
                        from-blue-500 to-blue-700 flex items-center
                        justify-center shadow-lg shadow-blue-500/20
                        flex-shrink-0">
          <Shield size={14} className="text-white" />
        </div>
        <div className="min-w-0">
          <h2 className={`text-xs sm:text-sm font-semibold truncate
                         ${dark ? 'text-white' : 'text-gray-900'}`}>
            <span className="hidden sm:inline">Municipal Operations Dashboard</span>
            <span className="sm:hidden">CiviqAI Dashboard</span>
          </h2>
          <p className={`text-[10px] sm:text-[11px] truncate
                        ${dark ? 'text-slate-500' : 'text-gray-400'}`}>
            {dateStr} · {timeStr}
          </p>
        </div>
      </div>

      {/* Center: search (hidden on small screens) */}
      <div className={`hidden lg:flex items-center rounded-lg px-3 py-1.5
                      w-72 gap-2 border
                      ${dark
                        ? 'bg-[#111827] border-[#1e293b]'
                        : 'bg-gray-100 border-gray-200'}`}>
        <Search size={14} className={dark ? 'text-slate-500' : 'text-gray-400'} />
        <input type="text" placeholder="Search complaints, zones..."
               className={`bg-transparent text-sm outline-none flex-1
                         ${dark
                           ? 'text-slate-200 placeholder-slate-500'
                           : 'text-gray-700 placeholder-gray-400'}`} />
      </div>

      {/* Right: theme toggle + status + notifications */}
      <div className="flex items-center gap-2 sm:gap-3 md:gap-5">

        {/* Theme toggle */}
        <button onClick={toggle}
                className={`p-1.5 sm:p-2 rounded-lg transition-colors
                           ${dark
                             ? 'text-slate-400 hover:text-yellow-400 hover:bg-white/5'
                             : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                title={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Live status — compact on mobile */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5
                        bg-emerald-500/10 border border-emerald-500/20
                        rounded-full">
          <div className="w-2 h-2 bg-emerald-500 rounded-full live-dot" />
          <Wifi size={12} className="text-emerald-400" />
          <span className="text-[10px] sm:text-[11px] font-medium text-emerald-400">
            LIVE
          </span>
          <span className="hidden sm:inline text-[11px] text-emerald-500/70">
            {eventCount} events
          </span>
        </div>

        {/* Notifications bell */}
        <button className={`relative p-1.5 sm:p-2 rounded-lg transition-colors
                           ${dark ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}>
          <Bell size={18} className={dark ? 'text-slate-400' : 'text-gray-400'} />
          {eventCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4
                            bg-red-500 rounded-full text-[9px]
                            font-bold text-white flex items-center
                            justify-center">
              {eventCount > 9 ? '9+' : eventCount}
            </span>
          )}
        </button>

        {/* Logout */}
        <button onClick={logout}
                className={`p-1.5 sm:p-2 rounded-lg transition-colors
                           ${dark ? 'text-slate-400 hover:text-red-400 hover:bg-white/5'
                                  : 'text-gray-400 hover:text-red-500 hover:bg-gray-100'}`}
                title="Sign out">
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
