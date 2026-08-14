import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Editor from '../components/Editor';
import Header from '../components/Header';
import UserList from '../components/UserList';
import ExecutionHistory from '../components/ExecutionHistory';
import UsernameModal from '../components/UsernameModal';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useToast } from '../components/Toast';

const STARTER_CODE = {
  javascript: `// JavaScript\nconsole.log('Hello from JavaScript!');\n\nfunction fib(n) {\n  return n <= 1 ? n : fib(n - 1) + fib(n - 2);\n}\n\nconsole.log('fib(10) =', fib(10));`,
  python: `# Python\nprint('Hello from Python!')\n\ndef fib(n):\n    if n <= 1:\n        return n\n    return fib(n - 1) + fib(n - 2)\n\nprint(f'fib(10) = {fib(10)}')`,
  java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Java!");\n        System.out.println("fib(10) = " + fib(10));\n    }\n\n    static int fib(int n) {\n        if (n <= 1) return n;\n        return fib(n - 1) + fib(n - 2);\n    }\n}`,
  cpp: `#include <iostream>\n\nint fib(int n) {\n    if (n <= 1) return n;\n    return fib(n - 1) + fib(n - 2);\n}\n\nint main() {\n    std::cout << "Hello from C++!" << std::endl;\n    std::cout << "fib(10) = " << fib(10) << std::endl;\n    return 0;\n}`,
};

function Room() {
  const { roomId } = useParams();
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [outputHeight, setOutputHeight] = useState(200);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [usernameModalOpen, setUsernameModalOpen] = useState(false);

  const [username, setUsername] = useLocalStorage('collab-username', '');
  const editorRef = useRef(null);
  const { showToast, ToastComponent } = useToast();

  // Prompt for username on first visit
  useEffect(() => {
    if (!username) {
      setUsernameModalOpen(true);
    }
  }, [username]);

  // Fetch execution history on room load
  useEffect(() => {
    if (!roomId) return;

    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/executions/${roomId}?limit=50`);
        if (res.ok) {
          const data = await res.json();
          setExecutions(data);
        }
      } catch (err) {
        console.error('Failed to load execution history:', err);
      }
    };

    fetchHistory();
  }, [roomId]);

  const handleUsernameSave = (name) => {
    setUsername(name);
    setUsernameModalOpen(false);
  };

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
          language,
          roomId,
          userName: username || 'Anonymous',
        }),
      });
      const data = await res.json();
      setOutput(data);

      // Append to local history
      if (data && !data.error?.includes('service unavailable')) {
        const newExecution = {
          id: `temp-${Date.now()}`,
          roomId,
          userName: username || 'Anonymous',
          language,
          code,
          output: data.output || '',
          error: data.error || '',
          exitCode: data.exitCode ?? -1,
          executionTime: data.executionTime ?? 0,
          createdAt: new Date().toISOString(),
        };
        setExecutions(prev => [newExecution, ...prev]);
      }
    } catch (err) {
      setOutput({
        output: '',
        error: `Network error: ${err.message}`,
        exitCode: -1,
        executionTime: 0,
      });
    } finally {
      setIsRunning(false);
    }
  }, [language, roomId, username]);

  const handleReRun = useCallback((code, lang) => {
    if (editorRef.current) {
      editorRef.current.setValue(code);
      setLanguage(lang);
      showToast(`Loaded ${lang} code from history`);
    }
  }, [showToast]);

  const handleLoadSample = useCallback(() => {
    const code = STARTER_CODE[language];
    if (code && editorRef.current) {
      editorRef.current.setValue(code);
      showToast('Sample code loaded');
    }
  }, [language, showToast]);

  const handleDownload = useCallback((ext) => {
    const code = editorRef.current?.getValue() || '';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${roomId}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloaded as .${ext}`);
  }, [roomId, showToast]);

  const handleCopy = useCallback(async () => {
    const code = editorRef.current?.getValue() || '';
    try {
      await navigator.clipboard.writeText(code);
      showToast('Copied to clipboard');
    } catch {
      showToast('Failed to copy', 'error');
    }
  }, [showToast]);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      showToast('Room link copied');
    } catch {
      showToast('Failed to copy link', 'error');
    }
  }, [showToast]);

  // Resize handler for output panel
  const handleMouseDown = (e) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = outputHeight;

    const handleMouseMove = (moveEvent) => {
      const delta = startY - moveEvent.clientY;
      setOutputHeight(Math.max(80, Math.min(500, startHeight + delta)));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const exitCodeColor = output?.exitCode === 0 ? 'text-emerald-400' : 'text-rose-400';

  return (
    <div className="flex flex-col h-screen bg-slate-900">
      <UsernameModal
        isOpen={usernameModalOpen}
        onSave={handleUsernameSave}
        currentName={username}
      />

      <Header
        roomId={roomId}
        language={language}
        onLanguageChange={setLanguage}
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
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-72 bg-slate-800 border-r border-slate-700 flex flex-col shrink-0">
            <UserList users={users} isOpen={true} />
            <ExecutionHistory
              executions={executions}
              onReRun={handleReRun}
              isOpen={true}
            />
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          {/* Editor */}
          <div className="flex-1 min-h-0">
            <Editor
              ref={editorRef}
              roomId={roomId}
              language={language}
              username={username || 'Anonymous'}
              onUsersChange={setUsers}
            />
          </div>

          {/* Output Panel */}
          {showOutput && (
            <>
              <div
                onMouseDown={handleMouseDown}
                className="h-1.5 bg-slate-700 hover:bg-emerald-500 cursor-row-resize transition-colors shrink-0"
              />

              <div
                className="bg-slate-950 border-t border-slate-700 flex flex-col shrink-0"
                style={{ height: outputHeight }}
              >
                <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 shrink-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Console
                    </span>
                    {output && (
                      <span className={`text-xs font-mono ${exitCodeColor}`}>
                        exit {output.exitCode} · {output.executionTime}ms
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {output && (
                      <button
                        onClick={() => setOutput(null)}
                        className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        Clear
                      </button>
                    )}
                    <button
                      onClick={() => setShowOutput(false)}
                      className="text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-auto p-4 font-mono text-sm">
                  {isRunning && !output && (
                    <div className="text-slate-500 italic">Executing code...</div>
                  )}

                  {output && (
                    <div className="space-y-2">
                      {output.output && (
                        <pre className="text-slate-200 whitespace-pre-wrap break-words">
                          {output.output}
                        </pre>
                      )}
                      {output.error && (
                        <pre className="text-rose-400 whitespace-pre-wrap break-words">
                          {output.error}
                        </pre>
                      )}
                      {!output.output && !output.error && (
                        <div className="text-slate-500 italic">No output</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 py-2 bg-slate-800 border-t border-slate-700 text-xs text-slate-500 flex justify-between shrink-0">
        <span>Room: {roomId}</span>
        <span>Language: {language}</span>
      </footer>

      <ToastComponent />
    </div>
  );
}

export default Room;
