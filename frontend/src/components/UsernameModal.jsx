import React, { useState, useEffect } from 'react';

function UsernameModal({ isOpen, onSave, currentName }) {
  const [name, setName] = useState(currentName || '');

  useEffect(() => {
    if (isOpen) {
      setName(currentName || '');
    }
  }, [isOpen, currentName]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) {
      onSave(trimmed);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-6 w-full max-w-sm">
        <h2 className="text-xl font-semibold text-white mb-2">Welcome to Collab Editor</h2>
        <p className="text-slate-400 text-sm mb-4">Choose a display name so others can see who you are.</p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name..."
            autoFocus
            maxLength={20}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent mb-4"
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            Join Room
          </button>
        </form>
      </div>
    </div>
  );
}

export default UsernameModal;
