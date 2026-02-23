import { useState } from 'react';

// Dummy comments seeded per complaint
const SEED_COMMENTS = [
  { user: 'Ravi K',    text: 'This has been here for weeks! Dangerous at night.', time: '2h ago' },
  { user: 'Meena S',   text: 'I reported this last month too. No action yet.',     time: '5h ago' },
  { user: 'Arjun T',   text: 'Ward councillor has been informed.',                 time: '1d ago' },
];

export default function CommentSection({ complaintId }) {
  const [comments, setComments] = useState(SEED_COMMENTS);
  const [input,    setInput]    = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setComments(c => [{
      user: 'You', text: input.trim(), time: 'just now'
    }, ...c]);
    setInput('');
  };

  return (
    <div className="mt-4 border-t border-white/10 pt-4 space-y-4">

      {/* Comment input */}
      <form onSubmit={submit} className="flex gap-2">
        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center
                        justify-center text-xs font-bold flex-shrink-0">
          Y
        </div>
        <div className="flex-1 flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 bg-zinc-900 border border-white/10 rounded-full
                       px-4 py-1.5 text-sm text-white placeholder:text-zinc-600
                       focus:outline-none focus:border-blue-500"
          />
          <button type="submit"
                  disabled={!input.trim()}
                  className="px-3 py-1.5 bg-white text-black rounded-full
                             text-xs font-bold disabled:opacity-30
                             hover:bg-zinc-200 transition-colors">
            Post
          </button>
        </div>
      </form>

      {/* Comment list */}
      {comments.map((c, i) => (
        <div key={i} className="flex gap-2">
          <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center
                          justify-center text-xs font-bold flex-shrink-0">
            {c.user[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white">{c.user}</span>
              <span className="text-zinc-600 text-xs">{c.time}</span>
            </div>
            <p className="text-zinc-300 text-sm mt-0.5">{c.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
