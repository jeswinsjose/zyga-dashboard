import React, { useState } from 'react';
import { AgentState } from '../types';

interface SettingsPanelProps {
  agentName: string;
  onAgentNameChange: (name: string) => void;
  currentStatus: AgentState;
  onStatusOverride: (state: AgentState) => void;
  refreshInterval: number;  // seconds, 0 = off
  onRefreshIntervalChange: (seconds: number) => void;
  onClose: () => void;
}

const STATUS_OPTIONS: { value: AgentState; label: string; emoji: string }[] = [
  { value: 'working', label: 'Working', emoji: '🫡' },
  { value: 'thinking', label: 'Thinking', emoji: '🤔' },
  { value: 'idle', label: 'Idle', emoji: '😊' },
  { value: 'sleeping', label: 'Sleeping', emoji: '😴' },
  { value: 'error', label: 'Error', emoji: '😵‍💫' },
  { value: 'executing_cron', label: 'Running Cron', emoji: '🤖' },
];

const REFRESH_OPTIONS: { value: number; label: string }[] = [
  { value: 10, label: '10s' },
  { value: 30, label: '30s' },
  { value: 60, label: '60s' },
  { value: 300, label: '5m' },
  { value: 0, label: 'Off' },
];

const DATA_PATHS = [
  { label: 'Workspace', path: './zyga-dashboard' },
  { label: 'Data', path: './data/dashboard-data' },
  { label: 'Documents', path: './data/documents' },
];

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  agentName,
  onAgentNameChange,
  currentStatus,
  onStatusOverride,
  refreshInterval,
  onRefreshIntervalChange,
  onClose,
}) => {
  const [nameInput, setNameInput] = useState(agentName);

  const handleNameBlur = () => {
    const trimmed = nameInput.trim();
    if (trimmed && trimmed !== agentName) {
      onAgentNameChange(trimmed);
    } else {
      setNameInput(agentName);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="px-6 py-4 flex justify-between items-center border-b border-border bg-[#1c2128]">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>⚙️</span> Settings
          </h3>
          <button onClick={onClose} className="text-textMuted hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Agent Name */}
          <div>
            <label className="block text-xs uppercase tracking-wide text-textMuted font-bold mb-2">Agent Name</label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={handleNameBlur}
              onKeyDown={(e) => e.key === 'Enter' && handleNameBlur()}
              className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>

          {/* Status Override */}
          <div>
            <label className="block text-xs uppercase tracking-wide text-textMuted font-bold mb-2">Status Override</label>
            <div className="grid grid-cols-3 gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onStatusOverride(opt.value)}
                  className={`text-xs py-2 px-2 rounded-md border transition-all duration-200 flex items-center justify-center gap-1.5 ${
                    currentStatus === opt.value
                      ? 'border-primary bg-primary/15 text-white font-semibold'
                      : 'border-border text-textMuted hover:text-textMain hover:border-textMuted'
                  }`}
                >
                  <span>{opt.emoji}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div>
            <label className="block text-xs uppercase tracking-wide text-textMuted font-bold mb-2">Theme</label>
            <div className="flex gap-2">
              <button className="flex-1 text-xs py-2 px-3 rounded-md border border-primary bg-primary/15 text-white font-semibold transition-colors">
                🌙 Dark
              </button>
              <button className="flex-1 text-xs py-2 px-3 rounded-md border border-border text-textMuted/40 cursor-not-allowed" disabled>
                ☀️ Light (soon)
              </button>
              <button className="flex-1 text-xs py-2 px-3 rounded-md border border-border text-textMuted/40 cursor-not-allowed" disabled>
                🎨 Custom
              </button>
            </div>
          </div>

          {/* Auto-refresh Interval */}
          <div>
            <label className="block text-xs uppercase tracking-wide text-textMuted font-bold mb-2">Auto-refresh Interval</label>
            <div className="flex gap-2">
              {REFRESH_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onRefreshIntervalChange(opt.value)}
                  className={`flex-1 text-xs py-2 rounded-md border transition-all duration-200 ${
                    refreshInterval === opt.value
                      ? 'border-primary bg-primary/15 text-white font-semibold'
                      : 'border-border text-textMuted hover:text-textMain hover:border-textMuted'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Data Paths */}
          <div>
            <label className="block text-xs uppercase tracking-wide text-textMuted font-bold mb-2">Data Paths</label>
            <div className="bg-background rounded-md border border-border divide-y divide-border">
              {DATA_PATHS.map((dp) => (
                <div key={dp.label} className="flex items-center justify-between px-3 py-2">
                  <span className="text-xs text-textMuted">{dp.label}</span>
                  <span className="text-xs font-mono text-textMain/70">{dp.path}</span>
                </div>
              ))}
            </div>
          </div>

          {/* About */}
          <div>
            <label className="block text-xs uppercase tracking-wide text-textMuted font-bold mb-2">About</label>
            <div className="bg-background rounded-md border border-border p-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-textMuted">Version</span>
                <span className="text-textMain font-mono">1.0.0</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-textMuted">OpenClaw</span>
                <span className="text-textMain font-mono">v0.4.x</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-textMuted">GitHub</span>
                <a
                  href="https://github.com/mudrii/openclaw-dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#58a6ff] hover:underline font-mono"
                >
                  openclaw-dashboard
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border bg-[#1c2128] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm font-medium bg-primary hover:bg-primaryHover text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
