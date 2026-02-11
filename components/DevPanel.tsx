import React from 'react';
import { AgentState } from '../types';

interface DevPanelProps {
  currentState: AgentState;
  allStates: AgentState[];
  isCycling: boolean;
  onSetState: (state: AgentState) => void;
  onCycleAll: () => void;
  onStopCycle: () => void;
  onReset: () => void;
  onClose: () => void;
}

/** Pretty label for each state */
const STATE_LABEL: Record<AgentState, string> = {
  working: '🔨 Working',
  thinking: '🤔 Thinking',
  idle: '😊 Idle',
  sleeping: '😴 Sleeping',
  error: '⚠️ Error',
  executing_cron: '⏰ Cron',
};

/** Accent colour per state for the button highlight */
const STATE_ACCENT: Record<AgentState, string> = {
  working: 'border-[#d29922] text-[#d29922]',
  thinking: 'border-[#8b5cf6] text-[#8b5cf6]',
  idle: 'border-[#3fb950] text-[#3fb950]',
  sleeping: 'border-[#8b949e] text-[#8b949e]',
  error: 'border-[#f85149] text-[#f85149]',
  executing_cron: 'border-[#58a6ff] text-[#58a6ff]',
};

export const DevPanel: React.FC<DevPanelProps> = ({
  currentState,
  allStates,
  isCycling,
  onSetState,
  onCycleAll,
  onStopCycle,
  onReset,
  onClose,
}) => {
  return (
    <div className="fixed bottom-4 left-4 z-50 bg-[#161b22]/95 backdrop-blur border border-border rounded-xl shadow-2xl p-4 w-72 select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-textMuted">Dev Panel</span>
        <button
          onClick={onClose}
          className="text-textMuted hover:text-white transition-colors text-sm"
          title="Close"
        >
          ✕
        </button>
      </div>

      {/* State buttons grid */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {allStates.map((s) => (
          <button
            key={s}
            onClick={() => onSetState(s)}
            className={`
              text-xs py-1.5 px-2 rounded border transition-all duration-200
              ${currentState === s
                ? `${STATE_ACCENT[s]} bg-white/5 font-semibold`
                : 'border-border text-textMuted hover:text-textMain hover:border-textMuted'
              }
            `}
          >
            {STATE_LABEL[s]}
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        {!isCycling ? (
          <button
            onClick={onCycleAll}
            className="flex-1 text-xs py-1.5 rounded bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 text-[#8b5cf6] hover:bg-[#8b5cf6]/30 transition-colors font-medium"
          >
            ▶ Cycle All
          </button>
        ) : (
          <button
            onClick={onStopCycle}
            className="flex-1 text-xs py-1.5 rounded bg-[#f85149]/20 border border-[#f85149]/40 text-[#f85149] hover:bg-[#f85149]/30 transition-colors font-medium"
          >
            ⏹ Stop
          </button>
        )}
        <button
          onClick={onReset}
          className="flex-1 text-xs py-1.5 rounded border border-border text-textMuted hover:text-textMain hover:border-textMuted transition-colors"
        >
          ↺ Reset
        </button>
      </div>

      {/* Hint */}
      <p className="text-[10px] text-textMuted/60 mt-3 text-center">
        Ctrl+Shift+D or click avatar 5× to toggle
      </p>
    </div>
  );
};
