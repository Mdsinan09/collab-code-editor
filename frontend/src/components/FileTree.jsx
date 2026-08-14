import React, { useState, useRef, useEffect } from 'react';

const LANGUAGE_COLORS = {
  javascript: 'bg-yellow-500',
  python: 'bg-blue-500',
  java: 'bg-orange-500',
  cpp: 'bg-cyan-500',
};

const LANGUAGE_ICONS = {
  javascript: 'JS',
  python: 'PY',
  java: 'JV',
  cpp: 'C++',
};

function getLanguageFromFilename(name) {
  const ext = name.split('.').pop()?.toLowerCase();
  const map = {
    js: 'javascript', jsx: 'javascript', ts: 'javascript', tsx: 'javascript',
    py: 'python',
    java: 'java',
    cpp: 'cpp', cc: 'cpp', h: 'cpp', hpp: 'cpp',
  };
  return map[ext] || 'javascript';
}

function getDefaultFilename(language) {
  const map = {
    javascript: 'untitled.js',
    python: 'untitled.py',
    java: 'Main.java',
    cpp: 'untitled.cpp',
  };
  return map[language] || 'untitled.txt';
}

function FileTree({ files, activeFileId, onSelectFile, onCreateFile, onRenameFile, onDeleteFile, currentLanguage }) {
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [contextMenu, setContextMenu] = useState(null);
  const renameInputRef = useRef(null);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  const handleStartRename = (file, e) => {
    e.stopPropagation();
    setRenamingId(file.id);
    setRenameValue(file.name);
    setContextMenu(null);
  };

  const handleRenameSubmit = (fileId) => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== files.find(f => f.id === fileId)?.name) {
      onRenameFile(fileId, trimmed);
    }
    setRenamingId(null);
  };

  const handleKeyDown = (e, fileId) => {
    if (e.key === 'Enter') handleRenameSubmit(fileId);
    if (e.key === 'Escape') setRenamingId(null);
  };

  const handleContextMenu = (e, file) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, file });
  };

  const handleCreateFile = () => {
    const existingNames = files.map(f => f.name);
    let baseName = getDefaultFilename(currentLanguage);
    let finalName = baseName;
    let counter = 1;
    while (existingNames.includes(finalName)) {
      const ext = baseName.split('.').pop();
      const base = baseName.replace(`.${ext}`, '');
      finalName = `${base}-${counter}.${ext}`;
      counter++;
    }
    onCreateFile(finalName, getLanguageFromFilename(finalName));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-700 shrink-0">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Files
        </span>
        <button
          onClick={handleCreateFile}
          className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          title="New file"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto py-1">
        {files.length === 0 && (
          <div className="px-3 py-4 text-center text-slate-500 text-sm">
            No files yet
          </div>
        )}

        {files.map((file) => {
          const isActive = file.id === activeFileId;
          const isRenaming = renamingId === file.id;
          const langColor = LANGUAGE_COLORS[file.language] || 'bg-slate-500';
          const langIcon = LANGUAGE_ICONS[file.language] || '?';

          return (
            <div
              key={file.id}
              onClick={() => !isRenaming && onSelectFile(file.id)}
              onContextMenu={(e) => handleContextMenu(e, file)}
              className={`group flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors ${
                isActive
                  ? 'bg-slate-700/80 text-white'
                  : 'text-slate-400 hover:bg-slate-700/40 hover:text-slate-200'
              }`}
            >
              {/* Language dot */}
              <div className={`w-2 h-2 rounded-full shrink-0 ${langColor}`} />

              {/* File icon */}
              <span className={`text-[9px] font-bold px-1 py-0.5 rounded border shrink-0 ${
                isActive
                  ? 'border-slate-500 text-slate-300'
                  : 'border-slate-700 text-slate-500'
              }`}>
                {langIcon}
              </span>

              {/* Filename */}
              {isRenaming ? (
                <input
                  ref={renameInputRef}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, file.id)}
                  onBlur={() => handleRenameSubmit(file.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 bg-slate-900 text-white text-sm px-1.5 py-0.5 rounded border border-emerald-500 focus:outline-none min-w-0"
                />
              ) : (
                <span className="flex-1 text-sm truncate min-w-0">
                  {file.name}
                </span>
              )}

              {/* Hover actions */}
              {!isRenaming && (
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleStartRename(file, e)}
                    className="p-1 rounded hover:bg-slate-600 text-slate-500 hover:text-slate-300"
                    title="Rename"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteFile(file.id); }}
                    className="p-1 rounded hover:bg-rose-600/20 text-slate-500 hover:text-rose-400"
                    title="Delete"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 w-36 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); handleStartRename(contextMenu.file, e); }}
            className="w-full text-left px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            Rename
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDeleteFile(contextMenu.file.id); setContextMenu(null); }}
            className="w-full text-left px-3 py-1.5 text-sm text-rose-400 hover:bg-rose-600/20 transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default FileTree;
