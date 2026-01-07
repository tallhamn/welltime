interface UndoBarProps {
  show: boolean;
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
}

export function UndoBar({ show, message, onUndo, onDismiss }: UndoBarProps) {
  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-stone-800 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-4 animate-slide-up">
      <span className="text-sm">{message}</span>
      <button
        onClick={onUndo}
        className="px-3 py-1 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 font-medium transition-colors"
      >
        Undo
      </button>
      <button onClick={onDismiss} className="text-stone-400 hover:text-white transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
