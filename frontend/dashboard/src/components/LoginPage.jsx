import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Shield, Eye, EyeOff, LogIn } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate a brief auth delay
    setTimeout(() => {
      const ok = login(username, password);
      if (!ok) {
        setError('Invalid credentials. Try admin / admin');
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300
                     ${dark ? 'bg-[#0a0f1a]' : 'bg-gray-50'}`}>

      {/* Theme toggle - top right */}
      <button
        onClick={toggle}
        className={`fixed top-4 right-4 p-2 rounded-lg transition-colors z-10
                   ${dark ? 'text-slate-400 hover:text-yellow-400 hover:bg-white/5'
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
        title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {dark ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
          </svg>
        )}
      </button>

      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br
                          from-blue-500 to-blue-700 flex items-center
                          justify-center shadow-lg shadow-blue-500/25 mb-4">
            <Shield size={28} className="text-white" />
          </div>
          <h1 className={`text-2xl font-bold tracking-tight
                         ${dark ? 'text-white' : 'text-gray-900'}`}>
            CiviqAI
          </h1>
          <p className={`text-sm mt-1 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>
            Municipal Operations Dashboard
          </p>
        </div>

        {/* Login card */}
        <form onSubmit={handleSubmit}
              className={`rounded-2xl border p-6 space-y-5 transition-colors
                         ${dark
                           ? 'bg-[#111827] border-[#1e293b]'
                           : 'bg-white border-gray-200 shadow-lg shadow-gray-200/50'}`}>

          <div className="text-center">
            <h2 className={`text-lg font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>
              Sign in
            </h2>
            <p className={`text-xs mt-1 ${dark ? 'text-slate-500' : 'text-gray-400'}`}>
              Enter your credentials to access the dashboard
            </p>
          </div>

          {/* Username */}
          <div>
            <label className={`block text-xs font-medium mb-1.5
                              ${dark ? 'text-slate-300' : 'text-gray-600'}`}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter username"
              autoFocus
              className={`w-full px-3.5 py-2.5 rounded-lg border text-sm
                         outline-none transition-colors
                         ${dark
                           ? 'bg-[#0d1321] border-[#1e293b] text-white placeholder-slate-600 focus:border-blue-500'
                           : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'}`}
            />
          </div>

          {/* Password */}
          <div>
            <label className={`block text-xs font-medium mb-1.5
                              ${dark ? 'text-slate-300' : 'text-gray-600'}`}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                className={`w-full px-3.5 py-2.5 pr-10 rounded-lg border text-sm
                           outline-none transition-colors
                           ${dark
                             ? 'bg-[#0d1321] border-[#1e293b] text-white placeholder-slate-600 focus:border-blue-500'
                             : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'}`}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className={`absolute right-3 top-1/2 -translate-y-1/2
                           ${dark ? 'text-slate-500 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg
                            px-3 py-2 text-xs text-red-400 text-center">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm
                       font-semibold hover:bg-blue-700 disabled:opacity-40
                       disabled:cursor-not-allowed transition-colors
                       flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white
                              rounded-full animate-spin" />
            ) : (
              <>
                <LogIn size={16} />
                Sign in
              </>
            )}
          </button>

          {/* Hint */}
          <p className={`text-center text-[10px] ${dark ? 'text-slate-600' : 'text-gray-400'}`}>
            Default credentials: admin / admin
          </p>
        </form>

        {/* Footer */}
        <p className={`text-center text-[10px] mt-6
                      ${dark ? 'text-slate-600' : 'text-gray-400'}`}>
          CiviqAI Municipal Command Center · Chennai
        </p>
      </div>
    </div>
  );
}
