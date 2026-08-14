import React, { useState } from 'react';

const LANGUAGE_ICONS = {
  javascript: 'JS',
  python: 'PY',
  java: 'JV',
  cpp: 'C++',
};

const LANGUAGE_COLORS = {
  javascript: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  python: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  java: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  cpp: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
};

function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

function ExecutionHistory({ executions, onReRun, isOpen }) {
  const [expandedId, setExpandedId] = useState(null);

  if (!isOpen) return null;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700 shrink-0">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Execution History
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          {executions.length} run{executions.length !== 1 ? 's' : ''} in this room
        </p>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {executions.length === 0 && (
          <div className="px-4 py-8 text-center">
            <svg className="h-8 w-8 mx-auto mb-2 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-slate-500">No executions yet</p>
            <p className="text-xs text-slate-600 mt-1">Click Run to see history</p>
          </div>
        )}

        {executions.map((exec) => {
          const isExpanded = expandedId === exec.id;
          const isSuccess = exec.exitCode === 0;

          return (
            <div
              key={exec.id}
              className="border-b border-slate-700/50 last:border-0"
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : exec.id)}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-700/40 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  {/* Status dot */}
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isSuccess ? 'bg-emerald-400' : 'bg-rose-400'
                    }`}
                  />

                  {/* Language badge */}
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                    LANGUAGE_COLORS[exec.language] || 'bg-slate-700 text-slate-400 border-slate-600'
                  }`}>
                    {LANGUAGE_ICONS[exec.language] || exec.language}
                  </span>

                  {/* User name */}
                  <span className="text-sm text-slate-300 truncate flex-1">
                    {exec.userName}
                  </span>

                  {/* Time */}
                  <span className="text-xs text-slate-500 shrink-0">
                    {formatTimeAgo(exec.createdAt)}
                  </span>

                  {/* Expand chevron */}
                  <svg
                    className={`h-3.5 w-3.5 text-slate-500 shrink-0 transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                <div className="flex items-center gap-2 mt-1 ml-4.5">
                  <span className={`text-xs ${isSuccess ? 'text-emerald-400' : 'text-rose-400'}`}>
                    exit {exec.exitCode}
                  </span>
                  <span className="text-xs text-slate-600">·</span>
                  <span className="text-xs text-slate-500">{exec.executionTime}ms</span>
                </div>
              </button>

              {/* Expanded output */}
              {isExpanded && (
                <div className="px-4 pb-3 ml-4.5">
                  <div className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
                    {/* Output */}
                    {(exec.output || exec.error) && (
                      <div className="p-2.5 max-h-32 overflow-auto">
                        {exec.output && (
                          <pre className="text-xs text-slate-300 whitespace-pre-wrap break-words font-mono">
                            {exec.output}
                          </pre>
                        )}
                        {exec.error && (
                          <pre className="text-xs text-rose-400 whitespace-pre-wrap break-words font-mono mt-1">
                            {exec.error}
                          </pre>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 px-2.5 py-1.5 border-t border-slate-700/50 bg-slate-800/50">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onReRun(exec.code, exec.language);
                        }}
                        className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                        </svg>
                        Re-run
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ExecutionHistory;
