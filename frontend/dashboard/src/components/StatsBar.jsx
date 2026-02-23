import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, FileText, AlertCircle,
         CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export default function StatsBar() {
  const [stats, setStats] = useState({
    total: 0, open: 0, resolved: 0, p1: 0, inProgress: 0
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await axios.get(`${BASE}/complaints`);
        setStats({
          total:      data.length,
          open:       data.filter(c => c.status === 'open').length,
          resolved:   data.filter(c => c.status === 'resolved').length,
          inProgress: data.filter(c => c.status === 'in_progress').length,
          p1:         data.filter(c => c.priority === 'P1').length
        });
      } catch (e) {
        console.error('Failed to fetch stats:', e);
      }
    };
    fetch();
    const interval = setInterval(fetch, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);

  const cards = [
    {
      label: 'Total Complaints',
      value: stats.total,
      icon: FileText,
      color: 'blue',
      accent: 'text-blue-400',
      bg: 'bg-blue-500/10',
      trend: '+12%',
      trendUp: true,
      sub: 'All time'
    },
    {
      label: 'Open',
      value: stats.open,
      icon: AlertCircle,
      color: 'red',
      accent: 'text-red-400',
      bg: 'bg-red-500/10',
      trend: stats.open > 0 ? 'Needs attention' : 'All clear',
      trendUp: stats.open > 0,
      sub: 'Pending resolution'
    },
    {
      label: 'In Progress',
      value: stats.inProgress,
      icon: Clock,
      color: 'orange',
      accent: 'text-amber-400',
      bg: 'bg-amber-500/10',
      trend: 'Active',
      trendUp: false,
      sub: 'Being worked on'
    },
    {
      label: 'Resolved',
      value: stats.resolved,
      icon: CheckCircle2,
      color: 'green',
      accent: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      trend: stats.total > 0
        ? `${Math.round(stats.resolved / stats.total * 100)}%`
        : '0%',
      trendUp: false,
      sub: 'Resolution rate'
    },
    {
      label: 'P1 Alerts',
      value: stats.p1,
      icon: AlertTriangle,
      color: 'purple',
      accent: 'text-purple-400',
      bg: 'bg-purple-500/10',
      trend: stats.p1 > 0 ? 'Critical' : 'None',
      trendUp: stats.p1 > 0,
      sub: 'High priority'
    }
  ];

  return (
    <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 md:pb-0
                    snap-x snap-mandatory md:snap-none
                    md:grid md:grid-cols-5">
      {cards.map(c => {
        const Icon = c.icon;
        return (
          <div key={c.label}
               className={`stat-card ${c.color} bg-[#111827]
                          border border-[#1e293b] rounded-xl p-3 sm:p-4
                          min-w-[160px] md:min-w-0 snap-start flex-shrink-0 md:flex-shrink`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg ${c.bg}
                             flex items-center justify-center`}>
                <Icon size={20} className={c.accent} />
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5
                              rounded-full
                              ${c.trendUp
                                ? 'bg-red-500/10 text-red-400'
                                : 'bg-emerald-500/10 text-emerald-400'}`}>
                {c.trend}
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-white mb-0.5">
              {c.value.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500">{c.label}</p>
            <p className="text-[10px] text-slate-600 mt-1">{c.sub}</p>
          </div>
        );
      })}
    </div>
  );
}
