import React, { useState } from 'react';

export function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const ToastComponent = () => {
    if (!toast) return null;
    const bgColor = toast.type === 'success' ? 'bg-emerald-600' : toast.type === 'error' ? 'bg-rose-600' : 'bg-slate-600';
    return (
      <div className={`fixed bottom-6 right-6 z-50 ${bgColor} text-white px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium animate-bounce-in`}>
        {toast.message}
      </div>
    );
  };

  return { showToast, ToastComponent };
}
