import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function LandingPage() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const createRoom = () => {
    const roomId = 'room-' + Math.random().toString(36).substring(2, 10);
    navigate(`/room/${roomId}`);
  };

  const features = [
    {
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: 'Real-Time Sync',
      desc: 'Every keystroke syncs instantly across all connected clients. No refresh, no delay.',
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: 'Live Presence',
      desc: 'See who is in the room with colored cursors, floating name tags, and an active user list.',
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
      title: 'In-Room Chat',
      desc: 'Message your team without leaving the editor. Context stays where the code lives.',
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      title: 'Multi-File Workspaces',
      desc: 'Create, rename, and manage multiple files per room. A real project environment, not a single snippet.',
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Instant Execution',
      desc: 'Run JavaScript, Python, Java, and C++ in isolated containers. See output in milliseconds.',
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Execution History',
      desc: 'Track every run — who, when, what output, and what broke. Re-run any past execution with one click.',
    },
  ];

  const steps = [
    {
      num: '01',
      title: 'Create a Room',
      desc: 'Click once. A unique room is generated instantly. No signup required.',
    },
    {
      num: '02',
      title: 'Invite Your Team',
      desc: 'Share the link. Anyone with the URL joins in real time. No installs, no accounts.',
    },
    {
      num: '03',
      title: 'Code Together',
      desc: 'Write, chat, run, and review — all in one shared workspace that persists forever.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden" onMouseMove={handleMouseMove}>
      {/* Ambient glow following cursor */}
      <div
        className="fixed pointer-events-none z-0 transition-opacity duration-300"
        style={{
          left: mousePos.x - 200,
          top: mousePos.y - 200,
          width: 400,
          height: 400,
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)',
        }}
      />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-slate-800/50">
        <div className="flex items-center gap-2.5">
          <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
            <rect x="4" y="4" width="40" height="40" rx="10" fill="rgba(16, 185, 129, 0.1)" stroke="#10b981" strokeWidth="2"/>
            <path d="M16 18L10 24L16 30" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M32 18L38 24L32 30" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 32L26 16" stroke="#10b981" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
          </svg>
          <span className="text-lg font-semibold tracking-tight">SyncLab</span>
        </div>
        <div className="flex items-center gap-4">
          <a 
            href="https://github.com/Mdsinan09/collab-code-editor" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            GitHub
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center px-6 pt-24 pb-20 text-center">
        <div 
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-8"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
            transition: 'all 0.6s ease-out 0.2s',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Now in beta — free to use
        </div>

        <h1 
          className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight max-w-4xl leading-[1.1]"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.8s ease-out 0.4s',
          }}
        >
          Code together.
          <br />
          <span className="text-emerald-400">In real time.</span>
        </h1>

        <p 
          className="mt-6 text-lg text-slate-400 max-w-xl leading-relaxed"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.8s ease-out 0.6s',
          }}
        >
          A collaborative workspace where your team writes, runs, and reviews code 
          together — with live cursors, in-room chat, and instant execution.
        </p>

        <div 
          className="flex flex-col sm:flex-row items-center gap-4 mt-10"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.8s ease-out 0.8s',
          }}
        >
          <button
            onClick={createRoom}
            className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-900/20 transition-all hover:shadow-emerald-900/30 hover:scale-[1.02] active:scale-[0.98] text-base"
          >
            Create a Room
          </button>
          <a
            href="https://github.com/Mdsinan09/collab-code-editor" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-8 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl border border-slate-700 transition-all hover:text-white"
          >
            View on GitHub
          </a>
        </div>

        {/* Mini preview */}
        <div 
          className="mt-16 w-full max-w-5xl"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 1s ease-out 1s',
          }}
        >
          <div className="relative rounded-xl overflow-hidden border border-slate-700/50 shadow-2xl shadow-black/50">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent z-10" />
            <div className="bg-slate-900 p-4 font-mono text-sm text-slate-300 overflow-hidden">
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-800">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-xs text-slate-500">project-room — SyncLab</span>
              </div>
              <div className="flex gap-4">
                <div className="w-48 shrink-0">
                  <div className="text-xs text-slate-500 mb-2">FILES</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 px-2 py-1 rounded bg-slate-800/80 text-emerald-300 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                      index.js
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1 rounded text-slate-400 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      utils.py
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1 rounded text-slate-400 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                      Main.java
                    </div>
                  </div>
                </div>
                <div className="flex-1 bg-slate-950 rounded-lg p-3 border border-slate-800">
                  <div className="text-xs text-slate-500 mb-2">index.js</div>
                  <div className="text-emerald-400">function <span className="text-blue-400">fib</span>(n) {'{'}</div>
                  <div className="text-slate-300 pl-4">return n &lt;= 1 ? n : fib(n - 1) + fib(n - 2);</div>
                  <div className="text-emerald-400">{'}'}</div>
                  <div className="text-slate-300 mt-2">console.log(<span className="text-yellow-300">'fib(10) ='</span>, fib(10));</div>
                  <div className="mt-3 pt-2 border-t border-slate-800 text-xs text-slate-500">
                    <span className="text-emerald-400">●</span> Sarah editing · <span className="text-purple-400">●</span> Alex viewing
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 px-6 py-24 border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Everything you need to code together</h2>
            <p className="mt-4 text-slate-400 max-w-lg mx-auto">Built for teams who want to move fast without stepping on each other.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group p-6 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-emerald-500/30 hover:bg-slate-800/50 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 px-6 py-24 border-t border-slate-800/50 bg-slate-900/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">How it works</h2>
            <p className="mt-4 text-slate-400">From zero to collaborating in 30 seconds.</p>
          </div>

          <div className="space-y-8">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-6">
                <div className="shrink-0 w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <span className="text-xl font-bold text-emerald-400">{step.num}</span>
                </div>
                <div className="pt-1">
                  <h3 className="text-xl font-semibold mb-1">{step.title}</h3>
                  <p className="text-slate-400">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-24 border-t border-slate-800/50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Ready to code together?</h2>
          <p className="text-slate-400 mb-8">No signup. No install. Just open a room and start building.</p>
          <button
            onClick={createRoom}
            className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-900/20 transition-all hover:shadow-emerald-900/30 hover:scale-[1.02] active:scale-[0.98] text-base"
          >
            Create a Room — It's Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8 border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
              <rect x="4" y="4" width="40" height="40" rx="10" fill="rgba(16, 185, 129, 0.1)" stroke="#10b981" strokeWidth="2"/>
              <path d="M16 18L10 24L16 30" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M32 18L38 24L32 30" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-sm font-medium text-slate-400">SyncLab</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <span>Built by Mdsinan09</span>
            <a 
              href="https://github.com/Mdsinan09/collab-code-editor" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-emerald-400 transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
