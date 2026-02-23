import { useState } from 'react';
import CommentSection from './CommentSection';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const ICONS = {
  pothole:             '🚧',
  water_leak:          '💧',
  garbage_overflow:    '🗑️',
  streetlight_failure: '💡',
  power_outage:        '⚡',
  waterlogging:        '🌊',
  sewage_overflow:     '⚠️',
  tree_fallen:         '🌳',
  other:               '📍'
};

const STATUS_STYLE = {
  open:        { dot: 'bg-red-500',    label: 'Open',        text: 'text-red-400'   },
  in_progress: { dot: 'bg-yellow-400', label: 'In Progress', text: 'text-yellow-400'},
  resolved:    { dot: 'bg-green-500',  label: 'Resolved',    text: 'text-green-400' },
  closed:      { dot: 'bg-slate-400',  label: 'Closed',      text: 'text-slate-400' }
};

const PRIORITY_STYLE = {
  P1: 'bg-red-500/20 text-red-400 border-red-500/30',
  P2: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  P3: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
};

export default function ComplaintPost({ complaint }) {
  const [showComments, setShowComments] = useState(false);
  const [likes,        setLikes]        = useState(
    Math.floor(Math.random() * 40)
  );
  const [liked,        setLiked]        = useState(false);

  const s      = STATUS_STYLE[complaint.status] || STATUS_STYLE.open;
  const icon   = ICONS[complaint.issue_type]    || '📍';
  const time   = timeAgo(complaint.submitted_at);
  const title  = complaint.issue_type
    ?.replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  function handleLike() {
    setLiked(l => !l);
    setLikes(n => liked ? n - 1 : n + 1);
  }

  return (
    <article className="border-b border-white/10 px-4 py-5
                         hover:bg-white/[0.02] transition-colors">

      {/* Top row */}
      <div className="flex gap-3">

        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center
                        justify-center text-xl flex-shrink-0">
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* Meta row */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-sm text-white">
              Citizen Report
            </span>
            <span className="text-zinc-500 text-xs">#{complaint.id}</span>
            <span className="text-zinc-600 text-xs">·</span>
            <span className="text-zinc-500 text-xs">{time}</span>

            {/* Status pill */}
            <div className={`flex items-center gap-1 ml-auto`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot} animate-pulse`}/>
              <span className={`text-xs font-medium ${s.text}`}>
                {s.label}
              </span>
            </div>

            {/* Priority badge */}
            {complaint.priority && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5
                               rounded border ${PRIORITY_STYLE[complaint.priority]}`}>
                {complaint.priority}
              </span>
            )}
          </div>

          {/* Title */}
          <p className="text-white font-medium text-sm mb-1">{title}</p>

          {/* Location */}
          <p className="text-zinc-400 text-xs mb-2 flex items-center gap-1">
            <span>📍</span>{complaint.location}
          </p>

          {/* Description */}
          {complaint.description && (
            <p className="text-zinc-300 text-sm leading-relaxed mb-3">
              {complaint.description}
            </p>
          )}

          {/* Image */}
          {complaint.image_url && (
            <div className="rounded-2xl overflow-hidden border border-white/10 mb-3">
              <img
                src={`${BASE}/${complaint.image_url}`}
                alt="complaint"
                className="w-full max-h-72 object-cover"
                onError={e => {
                  e.target.src = complaint.streetview_url || '';
                  if (!complaint.streetview_url) e.target.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Department chip */}
          {complaint.department && (
            <div className="inline-flex items-center gap-1.5 bg-zinc-900
                            border border-white/10 rounded-full px-3 py-1 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"/>
              <span className="text-xs text-zinc-400">
                Sent to: <span className="text-white">
                  {complaint.department}
                </span>
              </span>
            </div>
          )}

          {/* Prediction alert */}
          {complaint.prediction && (
            <div className="bg-yellow-500/10 border border-yellow-500/20
                            rounded-xl px-3 py-2 mb-3 flex items-center gap-2">
              <span>⚠️</span>
              <p className="text-yellow-400 text-xs font-medium">
                AI detected pre-failure pattern — urgent attention needed
              </p>
            </div>
          )}

          {/* Action bar */}
          <div className="flex items-center gap-5 mt-1">

            {/* Comment */}
            <button
              onClick={() => setShowComments(s => !s)}
              className="flex items-center gap-1.5 text-zinc-500
                         hover:text-blue-400 transition-colors group"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor"
                   viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
              <span className="text-xs">Comment</span>
            </button>

            {/* Like */}
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 transition-colors
                ${liked
                  ? 'text-red-400'
                  : 'text-zinc-500 hover:text-red-400'}`}
            >
              <svg className="w-4 h-4" fill={liked ? 'currentColor' : 'none'}
                   stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
              </svg>
              <span className="text-xs">{likes}</span>
            </button>

            {/* Share */}
            <button
              onClick={() => navigator.clipboard.writeText(
                `${window.location.origin}/?id=${complaint.id}`
              )}
              className="flex items-center gap-1.5 text-zinc-500
                         hover:text-green-400 transition-colors ml-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor"
                   viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/>
              </svg>
              <span className="text-xs">Share</span>
            </button>
          </div>

          {/* Comments */}
          {showComments && (
            <CommentSection complaintId={complaint.id} />
          )}
        </div>
      </div>
    </article>
  );
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)   return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}
