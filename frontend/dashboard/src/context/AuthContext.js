import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem('civiqai-auth');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const login = useCallback((username, password) => {
    if (username === 'admin' && password === 'admin') {
      const userData = { username: 'admin', role: 'Municipal Officer' };
      sessionStorage.setItem('civiqai-auth', JSON.stringify(userData));
      setUser(userData);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('civiqai-auth');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
