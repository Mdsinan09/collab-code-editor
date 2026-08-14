import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import Editor from '../components/Editor';
import Header from '../components/Header';
import FileTree from '../components/FileTree';
import Tabs from '../components/Tabs';
import UserList from '../components/UserList';
import ExecutionHistory from '../components/ExecutionHistory';
import UsernameModal from '../components/UsernameModal';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useToast } from '../components/Toast';

const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:5001';

const STARTER_CODE = {
  javascript: `// JavaScript\nconsole.log('Hello from JavaScript!');\n\nfunction fib(n) {\n  return n <= 1 ? n : fib(n - 1) + fib(n - 2);\n}\n\nconsole.log('fib(10) =', fib(10));`,
  python: `# Python\nprint('Hello from Python!')\n\ndef fib(n):\n    if n <= 1:\n        return n\n    return fib(n - 1) + fib(n - 2)\n\nprint(f'fib(10) = {fib(10)}')`,
  java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Java!");\n        System.out.println("fib(10) = " + fib(10));\n    }\n\n    static int fib(int n) {\n        if (n <= 1) return n;\n        return fib(n - 1) + fib(n - 2);\n    }\n}`,
  cpp: `#include <iostream>\n\nint fib(int n) {\n    if (n <= 1) return n;\n    return fib(n - 1) + fib(n - 2);\n}\n\nint main() {\n    std::cout << "Hello from C++!" << std::endl;\n    std::cout << "fib(10) = " << fib(10) << std::endl;\n    return 0;\n}`,
};

function getLanguageFromFilename(name) {
  const ext = name.split('.').pop()?.toLowerCase();
  const map = { js: 'javascript', jsx: 'javascript', ts: 'javascript', tsx: 'javascript', py: 'python', java: 'java', cpp: 'cpp', cc: 'cpp', h: 'cpp', hpp: 'cpp' };
  return map[ext] || 'javascript';
}

function Room() {
  const { roomId } = useParams();
  const [files, setFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);
  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [outputHeight, setOutputHeight] = useState(200);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState('files'); // 'files' | 'users' | 'history'
  const [users, setUsers] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [usernameModalOpen, setUsernameModalOpen] = useState(false);

  const [username, setUsername] = useLocalStorage('collab-username', '');
  const editorRef = useRef(null);
  const ydocRef = useRef(null);
  const providerRef = useRef(null);
  const userColorRef = useRef(null);
  const { showToast, ToastComponent } = useToast();

  // Generate consistent user color
  if (!userColorRef.current) {
    let hash = 0;
    const str = (username || 'Anonymous') + roomId;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981', '#0ea5e9', '#a855f7'];
    userColorRef.current = colors[Math.abs(hash) % colors.length];
  }

  // Prompt for username on first visit
  useEffect(() => {
    if (!username) setUsernameModalOpen(true);
  }, [username]);

  // Create Y.Doc and connect
  useEffect(() => {
    const ydoc = new Y.Doc();
    const provider = new WebsocketProvider(WS_URL, roomId, ydoc);
    ydocRef.current = ydoc;
    providerRef.current = provider;

    provider.awareness.setLocalState({
      user: { name: username || 'Anonymous', color: userColorRef.current },
    });

    const filesMap = ydoc.getMap('files');
    const roomState = ydoc.getMap('roomState');

    const updateFromYjs = () => {
      const newFiles = [];
      filesMap.forEach((fileMap, fileId) => {
        newFiles.push({
          id: fileId,
          name: fileMap.get('name'),
          language: fileMap.get('language'),
        });
      });

      // Default initial file if room is empty
      if (newFiles.length === 0 && provider.synced) {
        const defaultId = 'file-' + Date.now();
        const defaultMap = new Y.Map();
        defaultMap.set('name', 'index.js');
        defaultMap.set('language', 'javascript');
        defaultMap.set('content', new Y.Text());
        filesMap.set(defaultId, defaultMap);
        roomState.set('activeFileId', defaultId);
        return;
      }

      setFiles(newFiles);
      const currentActive = roomState.get('activeFileId');
      if (currentActive && filesMap.has(currentActive)) {
        setActiveFileId(currentActive);
      } else if (newFiles.length > 0) {
        setActiveFileId(newFiles[0].id);
      }
    };

    const handleSync = (isSynced) => {
      if (isSynced) updateFromYjs();
    };

    provider.on('synced', handleSync);
    filesMap.observeDeep(updateFromYjs);
    roomState.observe(updateFromYjs);
    updateFromYjs();

    return () => {
      provider.off('synced', handleSync);
      filesMap.unobserveDeep(updateFromYjs);
      roomState.unobserve(updateFromYjs);
      provider.destroy();
      ydoc.destroy();
    };
  }, [roomId, username]);

  // Fetch execution history
  useEffect(() => {
    if (!roomId) return;
    fetch(`/api/executions/${roomId}?limit=50`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setExecutions(data))
      .catch(err => console.error('Failed to load history:', err));
  }, [roomId]);

  const handleUsernameSave = (name) => {
    setUsername(name);
    setUsernameModalOpen(false);
  };

  const activeFile = files.find(f => f.id === activeFileId);
  const currentLanguage = activeFile?.language || 'javascript';

  // File operations
  const handleSelectFile = useCallback((fileId) => {
    const ydoc = ydocRef.current;
    if (!ydoc) return;
    ydoc.getMap('roomState').set('activeFileId', fileId);
  }, []);

  const handleCreateFile = useCallback((name, language) => {
    const ydoc = ydocRef.current;
    if (!ydoc) return;
    const filesMap = ydoc.getMap('files');
    const roomState = ydoc.getMap('roomState');
    const fileId = 'file-' + Date.now();
    const fileMap = new Y.Map();
    fileMap.set('name', name);
    fileMap.set('language', language);
    fileMap.set('content', new Y.Text());
    filesMap.set(fileId, fileMap);
    roomState.set('activeFileId', fileId);
    showToast(`Created ${name}`);
  }, [showToast]);

  const handleRenameFile = useCallback((fileId, newName) => {
    const ydoc = ydocRef.current;
    if (!ydoc) return;
    const filesMap = ydoc.getMap('files');
    const fileMap = filesMap.get(fileId);
    if (fileMap) {
      fileMap.set('name', newName);
      fileMap.set('language', getLanguageFromFilename(newName));
      showToast('Renamed file');
    }
  }, [showToast]);

  const handleDeleteFile = useCallback((fileId) => {
    const ydoc = ydocRef.current;
    if (!ydoc) return;
    const filesMap = ydoc.getMap('files');
    const roomState = ydoc.getMap('roomState');

    const fileMap = filesMap.get(fileId);
    const fileName = fileMap?.get('name') || 'file';

    filesMap.delete(fileId);

    if (roomState.get('activeFileId') === fileId) {
      const remaining = Array.from(filesMap.keys());
      if (remaining.length > 0) {
        roomState.set('activeFileId', remaining[0]);
      } else {
        const newId = 'file-' + Date.now();
        const newMap = new Y.Map();
        newMap.set('name', 'index.js');
        newMap.set('language', 'javascript');
        newMap.set('content', new Y.Text());
        filesMap.set(newId, newMap);
        roomState.set('activeFileId', newId);
      }
    }
    showToast(`Deleted ${fileName}`);
  }, [showToast]);

  const handleCloseFile = useCallback((fileId) => {
    handleDeleteFile(fileId);
  }, [handleDeleteFile]);

  // Execution
  const handleRun = useCallback(async () => {
    const code = editorRef.current?.getValue();
    if (!code || !code.trim()) return;

    setIsRunning(true);
    setShowOutput(true);
    setOutput(null);

    try {
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language: currentLanguage,
          roomId,
          userName: username || 'Anonymous',
          fileName: activeFile?.name || 'untitled',
        }),
      });
      const data = await res.json();
      setOutput(data);

      if (data && !data.error?.includes('service unavailable')) {
        setExecutions(prev => [{
          id: `temp-${Date.now()}`,
          roomId,
          userName: username || 'Anonymous',
          fileName: activeFile?.name || 'untitled',
          language: currentLanguage,
          code,
          output: data.output || '',
          error: data.error || '',
          exitCode: data.exitCode ?? -1,
          executionTime: data.executionTime ?? 0,
          createdAt: new Date().toISOString(),
        }, ...prev]);
      }
    } catch (err) {
      setOutput({ output: '', error: `Network error: ${err.message}`, exitCode: -1, executionTime: 0 });
    } finally {
      setIsRunning(false);
    }
  }, [currentLanguage, roomId, username, activeFile]);

  const handleReRun = useCallback((code, lang) => {
    if (editorRef.current) {
      editorRef.current.setValue(code);
      const existingFile = files.find(f => f.language === lang);
      if (existingFile) {
        handleSelectFile(existingFile.id);
      }
      showToast(`Loaded ${lang} code from history`);
    }
  }, [files, handleSelectFile, showToast]);

  const handleLoadSample = useCallback(() => {
    const code = STARTER_CODE[currentLanguage];
    if (code && editorRef.current && activeFileId) {
      editorRef.current.setValue(code);
      showToast('Sample code loaded');
    }
  }, [currentLanguage, activeFileId, showToast]);

  const handleDownload = useCallback((ext) => {
    const code = editorRef.current?.getValue() || '';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeFile?.name || 'untitled'}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloaded as .${ext}`);
  }, [activeFile, showToast]);

  const handleCopy = useCallback(async () => {
    const code = editorRef.current?.getValue() || '';
    try { await navigator.clipboard.writeText(code); showToast('Copied to clipboard'); }
    catch { showToast('Failed to copy', 'error'); }
  }, [showToast]);

  const handleShare = useCallback(async () => {
    try { await navigator.clipboard.writeText(window.location.href); showToast('Room link copied'); }
    catch { showToast('Failed to copy link', 'error'); }
  }, [showToast]);

  // Output resize
  const handleMouseDown = (e) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = outputHeight;
    const handleMove = (ev) => setOutputHeight(Math.max(80, Math.min(500, startHeight + (startY - ev.clientY))));
    const handleUp = () => { document.removeEventListener('mousemove', handleMove); document.removeEventListener('mouseup', handleUp); };
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  };

  const exitCodeColor = output?.exitCode === 0 ? 'text-emerald-400' : 'text-rose-400';

  return (
    <div className="flex flex-col h-screen bg-slate-900">
      <UsernameModal isOpen={usernameModalOpen} onSave={handleUsernameSave} currentName={username} />

      <Header
        roomId={roomId}
        language={currentLanguage}
        onLanguageChange={(lang) => {
          const ydoc = ydocRef.current;
          if (!ydoc || !activeFileId) return;
          const fileMap = ydoc.getMap('files').get(activeFileId);
          if (fileMap) fileMap.set('language', lang);
        }}
        onRun={handleRun}
        isRunning={isRunning}
        onLoadSample={handleLoadSample}
        onDownload={handleDownload}
        onCopy={handleCopy}
        onShare={handleShare}
        username={username || 'Anonymous'}
        onUsernameClick={() => setUsernameModalOpen(true)}
        users={users}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
        fileName={activeFile?.name || ''}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col shrink-0">
            {/* Sidebar tabs */}
            <div className="flex items-center border-b border-slate-700 shrink-0">
              {[
                { id: 'files', label: 'Files', icon: (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                )},
                { id: 'users', label: 'Users', icon: (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                )},
                { id: 'history', label: 'History', icon: (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                )},
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSidebarTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
                    sidebarTab === tab.id
                      ? 'text-white bg-slate-700/50 border-b-2 border-emerald-500'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700/20'
                  }`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Sidebar content */}
            {sidebarTab === 'files' && (
              <FileTree
                files={files}
                activeFileId={activeFileId}
                onSelectFile={handleSelectFile}
                onCreateFile={handleCreateFile}
                onRenameFile={handleRenameFile}
                onDeleteFile={handleDeleteFile}
                currentLanguage={currentLanguage}
              />
            )}
            {sidebarTab === 'users' && <UserList users={users} isOpen={true} />}
            {sidebarTab === 'history' && (
              <ExecutionHistory executions={executions} onReRun={handleReRun} isOpen={true} />
            )}
          </div>
        )}

        {/* Main editor area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Tabs
            files={files}
            activeFileId={activeFileId}
            onSelectFile={handleSelectFile}
            onCloseFile={handleCloseFile}
          />

          <div className="flex-1 min-h-0">
            <Editor
              ref={editorRef}
              ydoc={ydocRef.current}
              activeFileId={activeFileId}
              provider={providerRef.current}
              username={username || 'Anonymous'}
              onUsersChange={setUsers}
            />
          </div>

          {/* Output Panel */}
          {showOutput && (
            <>
              <div onMouseDown={handleMouseDown} className="h-1.5 bg-slate-700 hover:bg-emerald-500 cursor-row-resize transition-colors shrink-0" />
              <div className="bg-slate-950 border-t border-slate-700 flex flex-col shrink-0" style={{ height: outputHeight }}>
                <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 shrink-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Console</span>
                    {output && <span className={`text-xs font-mono ${exitCodeColor}`}>exit {output.exitCode} · {output.executionTime}ms</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {output && <button onClick={() => setOutput(null)} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Clear</button>}
                    <button onClick={() => setShowOutput(false)} className="text-slate-500 hover:text-slate-300 transition-colors">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-4 font-mono text-sm">
                  {isRunning && !output && <div className="text-slate-500 italic">Executing code...</div>}
                  {output && (
                    <div className="space-y-2">
                      {output.output && <pre className="text-slate-200 whitespace-pre-wrap break-words">{output.output}</pre>}
                      {output.error && <pre className="text-rose-400 whitespace-pre-wrap break-words">{output.error}</pre>}
                      {!output.output && !output.error && <div className="text-slate-500 italic">No output</div>}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <footer className="px-6 py-2 bg-slate-800 border-t border-slate-700 text-xs text-slate-500 flex justify-between shrink-0">
        <span>Room: {roomId}</span>
        <span>{activeFile?.name || 'No file'} · {currentLanguage}</span>
      </footer>

      <ToastComponent />
    </div>
  );
}

export default Room;
