import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Circle,
         Popup, useMap } from 'react-leaflet';
import { MapPin, Layers } from 'lucide-react';
import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const STATUS_COLORS = {
  open:        '#ef4444',
  in_progress: '#f59e0b',
  resolved:    '#10b981',
  closed:      '#94a3b8'
};

const ISSUE_ICONS = {
  pothole:             '🕳️',
  water_leak:          '💧',
  garbage_overflow:    '🗑️',
  streetlight_failure: '💡',
  power_outage:        '⚡',
  waterlogging:        '🌊',
  sewage_overflow:     '🚰',
  tree_fallen:         '🌳',
  other:               '📌'
};

// Auto-fit bounds when complaints change
function FitBounds({ complaints }) {
  const map = useMap();
  useEffect(() => {
    const valid = complaints.filter(c => c.lat && c.lng);
    if (valid.length > 0) {
      const bounds = valid.map(c => [c.lat, c.lng]);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [complaints, map]);
  return null;
}

export default function ClusterMap({ sseEvents }) {
  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await axios.get(`${BASE}/complaints`);
        setComplaints(data);
      } catch (e) {
        console.error('Failed to fetch complaints:', e);
      }
    };
    fetch();
    const interval = setInterval(fetch, 8000);
    return () => clearInterval(interval);
  }, []);

  // Add new pins from SSE
  useEffect(() => {
    sseEvents.forEach(ev => {
      if (ev.type === 'new_pin' && ev.lat && ev.lng) {
        setComplaints(prev => {
          if (prev.find(c => String(c.id) === String(ev.complaint_id))) return prev;
          return [...prev, {
            id: ev.complaint_id,
            lat: ev.lat,
            lng: ev.lng,
            status: ev.status || 'open',
            issue_type: ev.issue_type || 'other'
          }];
        });
      }
      // Update marker color when status changes
      if (ev.type === 'status_update' && ev.complaint_id && ev.status) {
        setComplaints(prev =>
          prev.map(c =>
            String(c.id) === String(ev.complaint_id)
              ? { ...c, status: ev.status }
              : c
          )
        );
      }
    });
  }, [sseEvents]);

  const filtered = filter === 'all'
    ? complaints
    : complaints.filter(c => c.status === filter);

  const clusterEvents = sseEvents.filter(e => e.type === 'cluster' && e.lat && e.lng);

  return (
    <div className="bg-[#111827] border border-[#1e293b] rounded-xl
                    overflow-hidden h-full flex flex-col">

      {/* Map header */}
      <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-[#1e293b]
                      flex flex-col sm:flex-row sm:items-center
                      sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-blue-400" />
          <h3 className="text-xs sm:text-sm font-semibold text-white">
            <span className="hidden sm:inline">Chennai — Live Complaint Map</span>
            <span className="sm:hidden">Live Map</span>
          </h3>
          <span className="text-[10px] bg-blue-500/10 text-blue-400
                          px-2 py-0.5 rounded-full font-medium">
            {filtered.filter(c => c.lat && c.lng).length} pins
          </span>
        </div>

        {/* Status filter */}
        <div className="flex gap-1 overflow-x-auto scrollbar-none">
          {['all', 'open', 'in_progress', 'resolved', 'closed'].map(s => (
            <button key={s}
              onClick={() => setFilter(s)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-medium
                         transition-colors capitalize
                         ${filter === s
                           ? 'bg-blue-600 text-white'
                           : 'text-slate-400 hover:bg-white/5'}`}>
              {s === 'all' ? 'All' : s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Leaflet map */}
      <div className="flex-1 relative">
        <MapContainer
          center={[13.0827, 80.2707]}
          zoom={12}
          className="w-full h-full"
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution=""
          />
          <FitBounds complaints={filtered} />

          {/* Complaint markers */}
          {filtered.map(c => {
            if (!c.lat || !c.lng) return null;
            const color = STATUS_COLORS[c.status] || STATUS_COLORS.open;
            return (
              <CircleMarker key={c.id}
                center={[c.lat, c.lng]}
                radius={8}
                pathOptions={{
                  fillColor: color,
                  fillOpacity: 0.8,
                  color: '#fff',
                  weight: 2
                }}>
                <Popup>
                  <div className="text-xs">
                    <p className="font-bold text-gray-800">
                      {ISSUE_ICONS[c.issue_type] || '📌'}{' '}
                      {(c.issue_type || 'unknown').replace(/_/g, ' ')}
                    </p>
                    <p className="text-gray-500">#{c.id}</p>
                    <p className="capitalize">{c.status?.replace(/_/g, ' ')}</p>
                    {c.location_text && <p>{c.location_text}</p>}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {/* Cluster circles from SSE */}
          {clusterEvents.map((ev, i) => (
            <Circle key={`cluster-${i}`}
              center={[ev.lat, ev.lng]}
              radius={ev.radius || 500}
              pathOptions={{
                fillColor: '#8b5cf6',
                fillOpacity: 0.12,
                color: '#8b5cf6',
                weight: 2,
                dashArray: '5,5'
              }} />
          ))}
        </MapContainer>

        {/* Map legend */}
        <div className="absolute bottom-3 left-3 bg-[#111827]/90
                        backdrop-blur border border-[#1e293b]
                        rounded-lg p-2.5 z-[1000]">
          <div className="flex items-center gap-1.5 mb-1">
            <Layers size={12} className="text-slate-400" />
            <span className="text-[10px] font-semibold text-slate-300">Legend</span>
          </div>
          {Object.entries(STATUS_COLORS).map(([s, color]) => (
            <div key={s} className="flex items-center gap-1.5 mt-1">
              <div className="w-2.5 h-2.5 rounded-full"
                   style={{ backgroundColor: color }} />
              <span className="text-[10px] text-slate-400 capitalize">
                {s.replace(/_/g, ' ')}
              </span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 mt-1">
            <div className="w-2.5 h-2.5 rounded-full border border-purple-500 bg-purple-500/30" />
            <span className="text-[10px] text-slate-400">Cluster zone</span>
          </div>
        </div>
      </div>
    </div>
  );
}
