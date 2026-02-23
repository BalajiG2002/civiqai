import { NavLink } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';

  return (
    <nav className={`sticky top-0 z-50 backdrop-blur-md
                    border-b px-3 sm:px-4 py-2.5 sm:py-3 transition-colors duration-300
                    ${dark
                      ? 'bg-black/80 border-white/10'
                      : 'bg-white/80 border-gray-200'}`}>
      <div className="max-w-2xl mx-auto flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-lg sm:text-xl">🏙️</span>
          <span className={`font-bold tracking-tight text-sm sm:text-base
                           ${dark ? 'text-white' : 'text-gray-900'}`}>
            CiviqAI
          </span>
          <span className={`text-[10px] sm:text-xs ml-0.5 sm:ml-1 hidden xs:inline
                           ${dark ? 'text-zinc-500' : 'text-gray-400'}`}>
            Chennai
          </span>
        </div>

        {/* Nav links + theme toggle */}
        <div className="flex items-center gap-1">
          <NavLink to="/"
            className={({ isActive }) =>
              `px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all
               ${isActive
                 ? dark ? 'bg-white text-black' : 'bg-gray-900 text-white'
                 : dark ? 'text-zinc-400 hover:text-white hover:bg-white/10'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`
            }
          >
            Feed
          </NavLink>
          <NavLink to="/report"
            className={({ isActive }) =>
              `px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all
               ${isActive
                 ? dark ? 'bg-white text-black' : 'bg-gray-900 text-white'
                 : dark ? 'text-zinc-400 hover:text-white hover:bg-white/10'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`
            }
          >
            + Report
          </NavLink>

          {/* Theme toggle */}
          <button
            onClick={toggle}
            className={`ml-1 sm:ml-2 p-1.5 sm:p-2 rounded-full transition-all
                       ${dark
                         ? 'text-zinc-400 hover:text-yellow-400 hover:bg-white/10'
                         : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
