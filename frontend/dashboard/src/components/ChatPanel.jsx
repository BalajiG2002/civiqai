import { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Loader2 } from 'lucide-react';

export default function ChatPanel({ messages, loading, onSend }) {
  const [input, setInput] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const submit = (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    onSend(input.trim());
    setInput('');
  };

  return (
    <div className="bg-[#111827] border border-[#1e293b] rounded-xl
                    flex flex-col h-full overflow-hidden">

      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1e293b]
                      flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue-500/20
                         flex items-center justify-center">
            <Bot size={14} className="text-blue-400" />
          </div>
          <h3 className="text-sm font-semibold text-white">AI Assistant</h3>
        </div>
        {loading && (
          <div className="flex items-center gap-1.5">
            <Loader2 size={12} className="text-blue-400 animate-spin" />
            <span className="text-[10px] text-blue-400">Analyzing...</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((m, i) => (
          <div key={i}
               className={`chat-msg flex gap-2.5
                          ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>

            {/* Avatar */}
            <div className={`w-7 h-7 rounded-lg flex items-center
                           justify-center flex-shrink-0
                           ${m.role === 'user'
                             ? 'bg-emerald-500/20'
                             : 'bg-blue-500/20'}`}>
              {m.role === 'user'
                ? <User size={14} className="text-emerald-400" />
                : <Bot size={14} className="text-blue-400" />
              }
            </div>

            {/* Bubble */}
            <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-[13px]
                           leading-relaxed
                           ${m.role === 'user'
                             ? 'bg-emerald-600/20 text-emerald-100 border border-emerald-500/20'
                             : 'bg-[#1a2236] text-slate-300 border border-[#1e293b]'}`}>
              <p className="whitespace-pre-wrap">{m.text}</p>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="chat-msg flex gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500/20
                           flex items-center justify-center">
              <Bot size={14} className="text-blue-400" />
            </div>
            <div className="bg-[#1a2236] border border-[#1e293b]
                           rounded-xl px-4 py-3 flex gap-1.5">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full
                             animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full
                             animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full
                             animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Quick actions */}
      <div className="px-3 pt-2 flex gap-1.5 flex-wrap">
        {['Show open P1 complaints', 'Today\'s summary', 'Zone 5 status'].map(q => (
          <button key={q}
            onClick={() => !loading && onSend(q)}
            className="text-[10px] px-2.5 py-1 rounded-md
                      bg-[#1a2236] border border-[#1e293b]
                      text-slate-400 hover:text-blue-400
                      hover:border-blue-500/30
                      transition-colors truncate">
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={submit}
            className="p-3 border-t border-[#1e293b] flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about complaints, trends, clusters..."
          className="flex-1 bg-[#0a0f1a] text-slate-200
                    border border-[#1e293b] rounded-lg px-3 py-2
                    text-sm focus:outline-none focus:ring-1
                    focus:ring-blue-500/50 focus:border-blue-500/50
                    placeholder-slate-600 transition-all"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg
                    hover:bg-blue-700 transition-colors
                    disabled:opacity-30 disabled:cursor-not-allowed
                    flex items-center justify-center"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
