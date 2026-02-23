import { useState } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage     from './components/LoginPage';
import Sidebar       from './components/Sidebar';
import Header        from './components/Header';
import StatsBar      from './components/StatsBar';
import AlertFeed     from './components/AlertFeed';
import ChatPanel     from './components/ChatPanel';
import ClusterMap    from './components/ClusterMap';
import ComplaintTable from './components/ComplaintTable';
import TrendChart    from './components/TrendChart';
import WorkOrderLog  from './components/WorkOrderLog';
import PredictionCard from './components/PredictionCard';
import { useSSE }    from './hooks/useSSE';
import { useChat }   from './hooks/useChat';

function DashboardInner() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const sseEvents = useSSE();
  const { messages, loading, send } = useChat();
  const [tab, setTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const dark = theme === 'dark';

  // Show login if not authenticated
  if (!user) return <LoginPage />;

  return (
    <div className={`min-h-screen flex flex-col md:flex-row transition-colors duration-300
                     ${dark ? 'bg-[#0a0f1a] text-slate-200' : 'bg-gray-50 text-gray-800'}`}>

      {/* Sidebar — hidden on mobile, shown on md+ */}
      <Sidebar tab={tab} setTab={setTab}
               open={sidebarOpen} setOpen={setSidebarOpen} />

      {/* Main area */}
      <div className={`flex-1 flex flex-col transition-all duration-300
                       pb-16 md:pb-0
                       ${sidebarOpen ? 'md:ml-60' : 'md:ml-16'}`}>

        {/* Top header */}
        <Header eventCount={sseEvents.length}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen} />

        {/* Content */}
        <main className="flex-1 p-3 sm:p-4 md:p-5 overflow-y-auto">

          {/* ─── OVERVIEW TAB ─── */}
          {tab === 'overview' && (
            <div className="space-y-4 md:space-y-5">
              <StatsBar />
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5"
                   style={{ minHeight: '400px' }}>
                <div className="lg:col-span-3 flex flex-col gap-4
                                order-2 lg:order-1">
                  <AlertFeed events={sseEvents} />
                </div>
                <div className="lg:col-span-6 order-1 lg:order-2"
                     style={{ minHeight: '300px' }}>
                  <ClusterMap sseEvents={sseEvents} />
                </div>
                <div className="lg:col-span-3 flex flex-col gap-4
                                order-3 lg:order-3">
                  <PredictionCard sseEvents={sseEvents} />
                  <div className="flex-1 min-h-0" style={{ minHeight: '300px' }}>
                    <ChatPanel messages={messages}
                               loading={loading}
                               onSend={send} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── COMPLAINTS TAB ─── */}
          {tab === 'complaints' && (
            <div className="space-y-4 md:space-y-5">
              <StatsBar />
              <ComplaintTable />
            </div>
          )}

          {/* ─── ANALYTICS TAB ─── */}
          {tab === 'analytics' && (
            <div className="space-y-4 md:space-y-5">
              <StatsBar />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                <TrendChart />
                <WorkOrderLog />
              </div>
              <ComplaintTable />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DashboardInner />
      </AuthProvider>
    </ThemeProvider>
  );
}
