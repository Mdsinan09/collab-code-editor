import React from 'react';

const LANGUAGE_COLORS = {
  javascript: 'border-yellow-500/50 text-yellow-400',
  python: 'border-blue-500/50 text-blue-400',
  java: 'border-orange-500/50 text-orange-400',
  cpp: 'border-cyan-500/50 text-cyan-400',
};

function Tabs({ files, activeFileId, onSelectFile, onCloseFile }) {
  if (files.length === 0) return null;

  return (
    <div className="flex items-center bg-slate-900 border-b border-slate-700 overflow-x-auto shrink-0 scrollbar-hide">
      {files.map((file) => {
        const isActive = file.id === activeFileId;
        const langClass = LANGUAGE_COLORS[file.language] || 'border-slate-600 text-slate-400';

        return (
          <button
            key={file.id}
            onClick={() => onSelectFile(file.id)}
            className={`group flex items-center gap-2 px-3 py-2 text-sm border-t-2 transition-all min-w-0 ${
              isActive
                ? `bg-slate-800 ${langClass} border-t-2`
                : 'bg-slate-900/50 text-slate-500 border-t-2 border-transparent hover:bg-slate-800/50 hover:text-slate-300'
            }`}
          >
            <span className="truncate max-w-[120px]">{file.name}</span>
            <span
              onClick={(e) => { e.stopPropagation(); onCloseFile(file.id); }}
              className={`p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                isActive ? 'hover:bg-slate-700 text-slate-400 hover:text-white' : 'hover:bg-slate-700 text-slate-600 hover:text-slate-300'
              }`}
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
