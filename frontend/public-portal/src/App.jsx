import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Navbar     from './components/Navbar';
import FeedPage   from './pages/FeedPage';
import ReportPage from './pages/ReportPage';

function AppInner() {
  const { theme } = useTheme();
  return (
    <div className={`min-h-screen transition-colors duration-300
                     ${theme === 'dark'
                       ? 'bg-black text-white'
                       : 'bg-gray-50 text-gray-900'}`}>
      <Navbar />
      <Routes>
        <Route path="/"       element={<FeedPage />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="*"       element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </ThemeProvider>
  );
}