import { useState, useEffect } from 'react';
import { ClipboardList, ExternalLink, Clock, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export default function WorkOrderLog() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await axios.get(`${BASE}/complaints`);
        const withOrders = data.filter(c => c.work_order_id);
        setOrders(withOrders.slice(0, 20));
      } catch (e) {
        console.error('Failed to fetch work orders:', e);
      }
    };
    fetch();
  }, []);

  return (
    <div className="bg-[#111827] border border-[#1e293b] rounded-xl
                    overflow-hidden">

      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1e293b]
                      flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList size={16} className="text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Work Orders</h3>
        </div>
        <span className="text-[10px] bg-emerald-500/10 text-emerald-400
                        px-2 py-0.5 rounded-full font-medium">
          {orders.length} dispatched
        </span>
      </div>

      {/* Orders list */}
      <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
        {orders.length === 0 ? (
          <div className="text-center py-8">
            <ClipboardList size={28} className="text-slate-700 mx-auto mb-2" />
            <p className="text-xs text-slate-600">No work orders yet</p>
            <p className="text-[10px] text-slate-700 mt-1">
              Work orders appear when complaints are dispatched
            </p>
          </div>
        ) : (
          orders.map(o => (
            <div key={o.id}
                 className="flex items-start gap-3 p-2.5 rounded-lg
                           bg-[#0d1321] border border-[#1e293b]
                           hover:border-[#2d3a50] transition-colors">
              <div className={`w-7 h-7 rounded-md flex items-center
                             justify-center flex-shrink-0
                             ${o.status === 'resolved'
                               ? 'bg-emerald-500/10'
                               : 'bg-amber-500/10'}`}>
                {o.status === 'resolved'
                  ? <CheckCircle2 size={14} className="text-emerald-400" />
                  : <Clock size={14} className="text-amber-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-200
                                  truncate">
                    {o.work_order_id}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded
                                  font-medium capitalize
                                  ${o.status === 'resolved'
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'bg-amber-500/10 text-amber-400'}`}>
                    {o.status}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 capitalize truncate mt-0.5">
                  {o.issue_type?.replace(/_/g, ' ')} · {o.location_text || 'Unknown'}
                </p>
                {o.officer_name && (
                  <p className="text-[10px] text-slate-600 truncate">
                    Assigned: {o.officer_name}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
