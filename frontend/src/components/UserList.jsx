import React from 'react';

function UserList({ users, isOpen }) {
  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!isOpen) return null;

  return (
    <div className="flex flex-col shrink-0 border-b border-slate-700 max-h-[45%]">
      <div className="px-4 py-3 border-b border-slate-700 shrink-0">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Active Users
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          {users.length} user{users.length !== 1 ? 's' : ''} in this room
        </p>
      </div>

      <div className="flex-1 overflow-y-auto py-2 min-h-0">
        {users.map((user) => (
          <div
            key={user.clientId}
            className={`flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700/50 transition-colors ${
              user.isMe ? 'bg-slate-700/30' : ''
            }`}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ backgroundColor: user.color }}
            >
              {getInitials(user.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white truncate">
                {user.name}
                {user.isMe && <span className="text-xs text-slate-500 ml-1.5">(you)</span>}
              </div>
              <div className="text-xs text-slate-500">
                {user.isMe ? 'Editing' : user.cursor ? `Line ${user.cursor.line}` : 'Idle'}
              </div>
            </div>
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: user.color }}
            />
          </div>
        ))}

        {users.length === 0 && (
          <div className="px-4 py-8 text-center text-slate-500 text-sm">
            No users online
          </div>
        )}
      </div>
    </div>
  );
}

export default UserList;
