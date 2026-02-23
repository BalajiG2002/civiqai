import { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import ThinkingSteps from '../components/ThinkingSteps';
import { useTheme } from '../context/ThemeContext';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// Simulates the agent pipeline steps in real time
function buildSteps(phase, hasImage) {
  const imageSteps = [
    { id: 'analyze',  label: 'Analyzing image with Gemini Vision',
      detail: 'Identifying issue type, severity and condition' },
    { id: 'exif',     label: 'Extracting GPS from image metadata',
      detail: 'Reading EXIF data for latitude and longitude' },
    { id: 'ward',     label: 'Finding municipal ward',
      detail: 'Reverse geocoding to get ward and zone' },
    { id: 'search',   label: 'Searching municipal directory',
      detail: 'Looking up responsible officer in Redis' },
    { id: 'cluster',  label: 'Checking nearby complaints',
      detail: 'Scanning 500m radius for similar issues' },
    { id: 'dispatch', label: 'Sending work order email',
      detail: 'Dispatching to municipal department' },
    { id: 'publish',  label: 'Publishing to public feed',
      detail: 'Posting complaint on the portal' },
  ];

  const chatSteps = [
    { id: 'processing', label: 'Processing your query',
      detail: 'Understanding your question' },
    { id: 'search',   label: 'Searching complaint database',
      detail: 'Looking up relevant data' },
    { id: 'analyze',  label: 'Analyzing trends and patterns',
      detail: 'Generating insights' },
    { id: 'respond',  label: 'Preparing response',
      detail: 'Formatting answer for you' },
  ];

  const all = hasImage ? imageSteps : chatSteps;

  return all.map((s, i) => ({
    ...s,
    active: i <= phase,
    status: i < phase  ? 'done'
          : i === phase ? 'running'
          : 'analyzing'
  }));
}

const SUGGESTIONS = [
  '🚧 Report a pothole',
  '💧 Water pipe leaking',
  '🗑️ Garbage not collected',
  '💡 Streetlight not working',
  '🌊 Waterlogging issue',
];

export default function ReportPage() {
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState('');
  const [image,    setImage]    = useState(null);
  const [preview,  setPreview]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [phase,    setPhase]    = useState(-1);
  const [started,  setStarted]  = useState(false);
  const [hasImage, setHasImage] = useState(false);
  const bottomRef  = useRef(null);
  const fileRef    = useRef(null);
  const timerRef   = useRef(null);
  const { theme }  = useTheme();
  const dark       = theme === 'dark';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, phase]);

  // Handle paste event to capture images from clipboard
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
          }
          break;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  // Simulate step-by-step agent progress
  const simulateSteps = useCallback((onDone, isImageSubmission) => {
    let step = 0;
    const maxSteps = isImageSubmission ? 7 : 4;
    setPhase(0);
    timerRef.current = setInterval(() => {
      step++;
      if (step >= maxSteps) {
        clearInterval(timerRef.current);
        setPhase(maxSteps + 1); // all done
        onDone();
      } else {
        setPhase(step);
      }
    }, 2800);
  }, []);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImage(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async (text) => {
    const msg = text || input.trim();
    if (!msg && !image) return;

    const isImageSubmission = !!image;
    setHasImage(isImageSubmission);
    setStarted(true);
    setLoading(true);
    setPhase(0);

    // Add user message
    setMessages(prev => [...prev, {
      role:    'user',
      text:    msg,
      image:   preview
    }]);
    setInput('');
    setPreview(null);

    // Add thinking message
    const thinkingId = Date.now();
    setMessages(prev => [...prev, {
      role: 'thinking',
      id:   thinkingId
    }]);

    // Start API call immediately
    const apiPromise = image
      ? submitWithImage(msg)
      : submitChatOnly(msg);

    // Race: simulate steps, but resolve as soon as API responds
    let apiDone = false;
    let apiResult = null;
    let apiError = null;

    // Fire API and capture result
    apiPromise
      .then(result => { apiResult = result; })
      .catch(err => { apiError = err; })
      .finally(() => { apiDone = true; });

    const showResult = () => {
      if (apiError) {
        const errorMessage = apiError?.response?.data?.reply
          || apiError?.response?.data?.message
          || '❌ Something went wrong. Please try again.';
        setMessages(prev => prev.map(m =>
          m.id === thinkingId
            ? { role: 'assistant', text: errorMessage }
            : m
        ));
      } else {
        setMessages(prev => prev.map(m =>
          m.id === thinkingId
            ? { role: 'assistant', text: apiResult || 'Done!' }
            : m
        ));
      }
      setLoading(false);
      setPhase(-1);
      setImage(null);
      setHasImage(false);
      setGpsCoords(null);
    };

    // Simulate steps; check each tick if API already responded
    simulateSteps(() => {
      // Steps animation done — show result (API should be done by now)
      if (apiDone) {
        showResult();
      } else {
        // API still running — wait for it
        apiPromise.finally(() => showResult());
      }
    }, isImageSubmission);
  };

  const submitWithImage = async (description) => {
    const fd = new FormData();
    fd.append('image', image);
    if (description) fd.append('location', description);
    const { data } = await axios.post(`${BASE}/complaint`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data.message || 'Complaint submitted successfully!';
  };

  const submitChatOnly = async (msg) => {
    const { data } = await axios.post(`${BASE}/chat`, {
      message: msg,
      session_id: 'public_portal_chat'
    }, { timeout: 30000 });
    return data.reply || data.message || 'Received your message.';
  };

  // Welcome screen
  if (!started) return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-10 sm:py-16 flex flex-col
                    items-center text-center">
      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br
                      from-blue-600 to-purple-600 flex items-center
                      justify-center text-2xl sm:text-3xl mb-4 sm:mb-6 shadow-lg">
        🏙️
      </div>
      <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${dark ? 'text-white' : 'text-gray-900'}`}>
        Report a Civic Issue
      </h1>
      <p className={`mb-6 sm:mb-10 max-w-md text-sm sm:text-base px-2 ${dark ? 'text-zinc-400' : 'text-gray-500'}`}>
        Take a photo or paste an image — CiviqAI will extract the location
        from the image metadata, analyze it, and notify the right department.
      </p>

      {/* Main input */}
      <div className="w-full max-w-xl">
        <InputBar
          input={input}
          setInput={setInput}
          image={image}
          preview={preview}
          fileRef={fileRef}
          handleImage={handleImage}
          handleRemoveImage={handleRemoveImage}
          onSubmit={handleSubmit}
          loading={loading}
          dark={dark}
        />
      </div>

      {/* Suggestions */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center mt-4 sm:mt-6 px-1">
        {SUGGESTIONS.map(s => (
          <button
            key={s}
            onClick={() => handleSubmit(s)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 border
                       rounded-full text-xs sm:text-sm
                       active:scale-95 transition-all
                       ${dark ? 'bg-zinc-900 border-white/10 text-zinc-400 hover:border-white/30 hover:text-white'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900 shadow-sm'}`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );

  // Chat view
  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 flex flex-col
                    h-[calc(100vh-57px)] sm:h-[calc(100vh-65px)]">

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 sm:py-6 space-y-6 sm:space-y-8">
        {messages.map((m, i) => (
          <div key={i}>

            {/* User message */}
            {m.role === 'user' && (
              <div className="mb-4 sm:mb-6">
                {m.image && (
                  <img src={m.image} alt="uploaded"
                       className="w-full max-h-40 sm:max-h-56 object-cover
                                  rounded-xl sm:rounded-2xl mb-2 sm:mb-3 border border-white/10"/>
                )}
                <h2 className={`text-lg sm:text-2xl font-bold leading-tight ${dark ? 'text-white' : 'text-gray-900'}`}>
                  {m.text}
                </h2>
              </div>
            )}

            {/* Thinking / Processing */}
            {m.role === 'thinking' && phase >= 0 && (
              <div className={`border rounded-2xl p-5
                              ${dark ? 'bg-zinc-900 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-4 h-4 border-2 border-zinc-600
                                  border-t-blue-400 rounded-full animate-spin"/>
                  <span className="text-sm font-medium text-zinc-400">
                    {hasImage ? 'CiviqAI is processing your complaint...' : 'CiviqAI is thinking...'}
                  </span>
                </div>
                <ThinkingSteps steps={buildSteps(phase, hasImage)} />
              </div>
            )}

            {/* Assistant response */}
            {m.role === 'assistant' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br
                                  from-blue-500 to-purple-600 flex items-center
                                  justify-center text-xs">🤖</div>
                  <span className="text-sm font-semibold text-white">CiviqAI</span>
                </div>
                <div className={`prose text-base leading-relaxed max-w-none
                                ${dark ? 'prose-invert text-zinc-200' : 'text-gray-700'}`}>
                  <p>{m.text}</p>
                </div>

                {/* Success card */}
                {m.text?.includes('submitted') ||
                 m.text?.includes('sent') ? (
                  <div className="bg-green-500/10 border border-green-500/20
                                  rounded-xl p-4 flex items-start gap-3">
                    <span className="text-2xl">✅</span>
                    <div>
                      <p className="text-green-400 font-semibold text-sm">
                        Complaint Submitted
                      </p>
                      <p className="text-green-300/70 text-xs mt-0.5">
                        Your complaint is now live on the feed and the
                        department has been notified.
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Sticky input */}
      <div className={`pb-4 pt-2 border-t ${dark ? 'border-white/10' : 'border-gray-200'}`}>
        <InputBar
          input={input}
          setInput={setInput}
          image={image}
          preview={preview}
          fileRef={fileRef}
          handleImage={handleImage}
          handleRemoveImage={handleRemoveImage}
          onSubmit={handleSubmit}
          loading={loading}
          dark={dark}
        />
      </div>
    </div>
  );
}

// ── Shared Input Bar ──────────────────────────────────────────────
function InputBar({ input, setInput, image, preview, fileRef,
                    handleImage, handleRemoveImage, onSubmit, loading, dark }) {

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(input);
    }
  };

  return (
    <div className={`border rounded-2xl overflow-hidden transition-colors
                    ${dark ? 'bg-zinc-900 border-white/10 focus-within:border-white/30'
                           : 'bg-white border-gray-200 focus-within:border-gray-400 shadow-sm'}`}>

      {/* Image preview strip */}
      {preview && (
        <div className="px-4 pt-3">
          <div className="relative inline-block">
            <img src={preview} alt="preview"
                 className="h-20 w-32 object-cover rounded-xl"/>
            <button
              onClick={handleRemoveImage}
              className="absolute -top-1 -right-1 w-5 h-5 bg-zinc-700
                         rounded-full flex items-center justify-center
                         text-xs hover:bg-red-600 transition-colors">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Text input */}
      <div className="flex items-end gap-2 px-4 py-3">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={preview ? "Add a description (optional)..." : "Describe the issue or paste an image (Ctrl+V)..."}
          rows={1}
          className={`flex-1 bg-transparent text-sm resize-none focus:outline-none
                     max-h-32 overflow-y-auto
                     ${dark ? 'text-white placeholder:text-zinc-600'
                            : 'text-gray-900 placeholder:text-gray-400'}`}
          style={{ fieldSizing: 'content' }}
        />

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">

          {/* Attach photo */}
          <button
            onClick={() => fileRef.current.click()}
            className="w-8 h-8 rounded-full flex items-center justify-center
                       text-zinc-500 hover:text-white hover:bg-white/10
                       transition-colors"
            title="Attach photo (or paste with Ctrl+V)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor"
                 viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
            </svg>
          </button>
          <input ref={fileRef} type="file" accept="image/*"
                 className="hidden" onChange={handleImage} />

          {/* Submit */}
          <button
            onClick={() => onSubmit(input)}
            disabled={loading || (!input.trim() && !image)}
            className={`w-8 h-8 rounded-full flex items-center
                       justify-center disabled:opacity-30 disabled:cursor-not-allowed
                       transition-colors
                       ${dark ? 'bg-white hover:bg-zinc-200' : 'bg-slate-900 hover:bg-slate-800'}`}
          >
            {loading
              ? <div className={`w-4 h-4 border-2 rounded-full animate-spin
                                ${dark ? 'border-zinc-400 border-t-zinc-800' : 'border-gray-400 border-t-white'}`}/>
              : <svg className={`w-4 h-4 ${dark ? 'text-black' : 'text-white'}`} fill="none"
                     stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                        strokeWidth={2} d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
