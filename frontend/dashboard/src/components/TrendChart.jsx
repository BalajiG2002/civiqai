import { useState, useEffect } from 'react';
import { BarChart3 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell
} from 'recharts';
import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const ISSUE_COLORS = {
  pothole:             '#3b82f6',
  water_leak:          '#06b6d4',
  garbage_overflow:    '#f59e0b',
  streetlight_failure: '#eab308',
  power_outage:        '#ef4444',
  waterlogging:        '#6366f1',
  sewage_overflow:     '#a855f7',
  tree_fallen:         '#10b981',
  other:               '#64748b'
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1e293b] border border-[#334155]
                    rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-300 font-medium capitalize mb-1">
        {label?.replace(/_/g, ' ')}
      </p>
      {payload.map((p, i) => (
        <p key={i} className="text-slate-400">
          {p.name}: <span className="text-white font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function TrendChart() {
  const [barData, setBarData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [view, setView] = useState('bar');

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await axios.get(`${BASE}/complaints`);

        // Issue type distribution
        const counts = {};
        data.forEach(c => {
          const t = c.issue_type || 'other';
          counts[t] = (counts[t] || 0) + 1;
        });

        const bar = Object.entries(counts)
          .map(([name, count]) => ({
            name: name.replace(/_/g, ' '),
            count,
            fill: ISSUE_COLORS[name] || '#64748b'
          }))
          .sort((a, b) => b.count - a.count);

        setBarData(bar);

        // Status pie chart
        const statusCounts = {};
        data.forEach(c => {
          const s = c.status || 'open';
          statusCounts[s] = (statusCounts[s] || 0) + 1;
        });
        const pie = Object.entries(statusCounts).map(([name, value]) => ({
          name: name.replace(/_/g, ' '),
          value
        }));
        setPieData(pie);
      } catch (e) {
        console.error('Failed to fetch trend data:', e);
      }
    };
    fetch();
  }, []);

  const PIE_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6'];

  return (
    <div className="bg-[#111827] border border-[#1e293b] rounded-xl
                    overflow-hidden">

      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1e293b]
                      flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-purple-400" />
          <h3 className="text-sm font-semibold text-white">
            Analytics
          </h3>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setView('bar')}
            className={`px-2 py-1 rounded-md text-[10px] font-medium
                       ${view === 'bar'
                         ? 'bg-blue-600 text-white'
                         : 'text-slate-400 hover:bg-white/5'}`}>
            By Type
          </button>
          <button onClick={() => setView('pie')}
            className={`px-2 py-1 rounded-md text-[10px] font-medium
                       ${view === 'pie'
                         ? 'bg-blue-600 text-white'
                         : 'text-slate-400 hover:bg-white/5'}`}>
            By Status
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="p-4 h-72">
        {barData.length === 0 && pieData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <BarChart3 size={28} className="text-slate-700 mb-2" />
            <p className="text-xs text-slate-600">No data yet</p>
            <p className="text-[10px] text-slate-700 mt-1">
              Charts populate as complaints come in
            </p>
          </div>
        ) : view === 'bar' ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }}
                     axisLine={{ stroke: '#1e293b' }}
                     tickLine={false}
                     angle={-35} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }}
                     axisLine={{ stroke: '#1e293b' }}
                     tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData}
                   cx="50%" cy="50%"
                   innerRadius={50} outerRadius={80}
                   paddingAngle={4}
                   dataKey="value"
                   label={({ name, percent }) =>
                     `${name} ${(percent * 100).toFixed(0)}%`
                   }
                   labelLine={false}>
                {pieData.map((_, i) => (
                  <Cell key={i}
                        fill={PIE_COLORS[i % PIE_COLORS.length]}
                        fillOpacity={0.8} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
