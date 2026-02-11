import React from 'react';

interface Toast {
  id: string;
  message: string;
  timestamp: number;
}

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="bg-[#161b22]/95 backdrop-blur border border-border rounded-lg shadow-2xl p-3 flex items-start gap-3 animate-slide-in-right"
        >
          <span className="text-[#8b5cf6] text-sm mt-0.5 shrink-0">⚡</span>
          <p className="text-xs text-textMain leading-relaxed flex-1">{toast.message}</p>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-textMuted hover:text-white text-xs shrink-0 ml-1"
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};
