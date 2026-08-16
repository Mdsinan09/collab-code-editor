import React, { useState, useRef, useEffect } from 'react';

function formatTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function Chat({ messages, currentUser, userColor, onSendMessage, isOpen }) {
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed) {
      onSendMessage(trimmed);
      setInput('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Group messages by sender for compact display
  const groupedMessages = [];
  messages.forEach((msg, i) => {
    const prev = messages[i - 1];
    const isSameSender = prev && prev.userName === msg.userName;
    const timeDiff = prev ? new Date(msg.timestamp) - new Date(prev.timestamp) : Infinity;
    const isCloseInTime = timeDiff < 60000; // 1 minute

    if (isSameSender && isCloseInTime) {
      groupedMessages[groupedMessages.length - 1].messages.push(msg);
    } else {
      groupedMessages.push({
        userName: msg.userName,
        userColor: msg.userColor,
        isMe: msg.userName === currentUser,
        messages: [msg],
      });
    }
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700 shrink-0">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Chat
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          {messages.length} message{messages.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <svg className="h-10 w-10 text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm text-slate-500">No messages yet</p>
            <p className="text-xs text-slate-600 mt-1">Say hello to your collaborators</p>
          </div>
        )}

        {groupedMessages.map((group, groupIdx) => (
          <div key={groupIdx} className={`flex gap-2.5 ${group.isMe ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5"
              style={{ backgroundColor: group.userColor || '#64748b' }}
            >
              {getInitials(group.userName)}
            </div>

            {/* Message bubble(s) */}
            <div className={`flex flex-col ${group.isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
              {/* Username + time */}
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs font-medium text-slate-400">
                  {group.userName}
                </span>
                <span className="text-[10px] text-slate-600">
                  {formatTime(group.messages[0].timestamp)}
                </span>
              </div>

              {/* Messages */}
              <div className="flex flex-col gap-1">
                {group.messages.map((msg, msgIdx) => (
                  <div
                    key={msg.id || msgIdx}
                    className={`px-3 py-1.5 rounded-lg text-sm leading-relaxed ${
                      group.isMe
                        ? 'bg-emerald-600/20 text-emerald-100 border border-emerald-600/20'
                        : 'bg-slate-700/50 text-slate-200 border border-slate-700/50'
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="px-3 py-2.5 border-t border-slate-700 bg-slate-800/50 shrink-0"
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none max-h-24"
            style={{ minHeight: '36px' }}
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white transition-colors shrink-0"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-slate-600 mt-1 ml-1">
          Enter to send, Shift+Enter for new line
        </p>
      </form>
    </div>
  );
}

export default Chat;
