import { useState, useRef } from 'react';
import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export default function SubmitForm({ onSuccess }) {
  const [form, setForm]       = useState({ citizen_email: '' });
  const [image,    setImage]   = useState(null);
  const [preview,  setPreview] = useState(null);
  const [loading,  setLoading] = useState(false);
  const [success,  setSuccess] = useState(false);
  const [error,    setError]   = useState('');
  const fileRef = useRef();

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) { setError('Please attach a photo'); return; }

    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('image',        image);
      fd.append('citizen_email', form.citizen_email);

      await axios.post(`${BASE}/complaint`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccess(true);
      setImage(null);
      setPreview(null);
      setForm({ citizen_email: '' });
      setTimeout(() => {
        setSuccess(false);
        onSuccess?.();
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Submission failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="bg-green-50 border border-green-200 rounded-xl
                    p-6 text-center">
      <p className="text-4xl mb-2">✅</p>
      <p className="font-semibold text-green-700">Complaint Submitted!</p>
      <p className="text-sm text-green-600 mt-1">
        Location was extracted from your photo's metadata.
        We've notified the relevant department.
      </p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <h2 className="font-bold text-lg text-slate-800">
        📢 Report a Civic Issue
      </h2>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Photo <span className="text-red-500">*</span>
        </label>
        <div
          onClick={() => fileRef.current.click()}
          className="border-2 border-dashed border-slate-300 rounded-lg
                     p-4 text-center cursor-pointer hover:border-blue-400
                     hover:bg-blue-50 transition-colors"
        >
          {preview
            ? <img src={preview} alt="preview"
                   className="w-full h-40 object-cover rounded" />
            : <div className="text-slate-400">
                <p className="text-3xl">📷</p>
                <p className="text-sm mt-1">Click to attach photo</p>
                <p className="text-xs mt-0.5 text-slate-300">
                  GPS location will be extracted from image metadata
                </p>
              </div>
          }
        </div>
        <input ref={fileRef} type="file"
               accept="image/*" className="hidden"
               onChange={handleImage} />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Your Email (for updates)
        </label>
        <input
          type="email"
          placeholder="youremail@gmail.com"
          value={form.citizen_email}
          onChange={e => setForm(f => ({ ...f, citizen_email: e.target.value }))}
          className="w-full border border-slate-300 rounded-lg px-3 py-2
                     text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {error && (
        <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-blue-600 text-white rounded-lg
                   font-semibold hover:bg-blue-700 transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? '⏳ Processing...' : '🚀 Submit Complaint'}
      </button>
    </form>
  );
}
