import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { DashboardTab } from './components/DashboardTab';
import { DocsTab } from './components/DocsTab';
import { LogTab } from './components/LogTab';
import { OverviewTab } from './components/OverviewTab';
import { DevPanel } from './components/DevPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { ToastContainer } from './components/ToastContainer';
import { TabId, AgentStatus, AgentState } from './types';
import { useNotifications } from './lib/useNotifications';
import { useSyncTracker } from './lib/useSyncTracker';
import * as api from './lib/api';

const DEFAULT_POLL_INTERVAL = 10_000; // poll agent status every 10 seconds

const ALL_STATES: AgentState[] = ['working', 'thinking', 'idle', 'sleeping', 'error', 'executing_cron'];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  // Agent Status — starts with a safe default, then replaced by API data
  const [agentStatus, setAgentStatus] = useState<AgentStatus>({
    state: 'idle',
    message: 'Connecting...',
    isOnline: true,
    hasHelpers: false,
  });

  // Notification badges & toasts
  const { badges, toasts, markViewed, dismissToast } = useNotifications(activeTab);

  // Sync tracker
  const { formattedTime: syncTime, dotEmoji: syncDot, freshness, recordSync } = useSyncTracker();

  // Settings
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [agentName, setAgentName] = useState('Zyga');
  const [refreshInterval, setRefreshInterval] = useState(10); // seconds

  // Sidebar collapse (auto-collapse on narrow screens)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setSidebarCollapsed(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Dev panel
  const [devPanelOpen, setDevPanelOpen] = useState(false);
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cycleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isCycling, setIsCycling] = useState(false);

  // ── Poll /api/agent-status ──
  const fetchStatus = useCallback(async () => {
    try {
      const data = await api.fetchAgentStatus();
      setAgentStatus(data as AgentStatus);
      recordSync();
    } catch {
      // Silently ignore — keep last known status
    }
  }, [recordSync]);

  useEffect(() => {
    fetchStatus(); // initial fetch
    if (refreshInterval <= 0) return; // "Off" = no polling
    const id = setInterval(fetchStatus, refreshInterval * 1000);
    return () => clearInterval(id);
  }, [fetchStatus, refreshInterval]);

  // ── Dev panel: 5-rapid-click on avatar area ──
  const handleAvatarClick = useCallback(() => {
    clickCountRef.current += 1;
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    if (clickCountRef.current >= 5) {
      clickCountRef.current = 0;
      setDevPanelOpen((p) => !p);
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, 800);
    }
  }, []);

  // ── Dev panel: set state ──
  const handleDevSetState = useCallback(async (state: AgentState) => {
    try {
      const data = await api.setAgentStatus(state);
      setAgentStatus(data as AgentStatus);
    } catch (err) {
      console.error('Dev panel: failed to set state', err);
    }
  }, []);

  // ── Dev panel: reset to default ──
  const handleDevReset = useCallback(async () => {
    stopCycle();
    try {
      const data = await api.setAgentStatus(null as unknown as api.AgentState);
      if ('status' in data) setAgentStatus((data as any).status);
      else setAgentStatus(data as AgentStatus);
    } catch {
      // ignore
    }
  }, []);

  // ── Dev panel: cycle all states ──
  const startCycle = useCallback(() => {
    stopCycle();
    let idx = 0;
    setIsCycling(true);
    const tick = async () => {
      await handleDevSetState(ALL_STATES[idx % ALL_STATES.length]);
      idx++;
    };
    tick();
    cycleRef.current = setInterval(tick, 3000);
  }, [handleDevSetState]);

  const stopCycle = useCallback(() => {
    if (cycleRef.current) {
      clearInterval(cycleRef.current);
      cycleRef.current = null;
    }
    setIsCycling(false);
  }, []);

  // ── Manual refresh all data ──
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchStatus();
    } catch { /* ignore */ }
    setIsRefreshing(false);
  }, [fetchStatus]);

  // Keyboard shortcut: Ctrl+Shift+D
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setDevPanelOpen((p) => !p);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="flex h-screen bg-background text-textMain font-sans overflow-hidden">
      {/* Persistent Sidebar — avatar area is clickable for dev panel */}
      <div onClick={!sidebarCollapsed ? handleAvatarClick : undefined}>
        <Sidebar
          status={agentStatus}
          agentName={agentName}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((p) => !p)}
          onNavigateToOverview={() => setActiveTab('overview')}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Header / Navigation */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-8 border-b border-border shrink-0 bg-background/95 backdrop-blur z-10">
          <nav className="flex items-center h-full space-x-4 sm:space-x-8 overflow-x-auto scrollbar-none min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-white mr-2 sm:mr-4 whitespace-nowrap">{agentName} <span className="text-primary">•</span></h1>

            {(['dashboard', 'docs', 'log', 'overview'] as TabId[]).map((tab) => {
              const count = badges[tab] || 0;
              return (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); markViewed(tab); }}
                  className={`relative h-full px-2 text-sm font-medium transition-colors capitalize ${
                    activeTab === tab
                      ? 'text-white'
                      : 'text-textMuted hover:text-textMain'
                  }`}
                >
                  {tab}
                  {/* Notification badge */}
                  {count > 0 && activeTab !== tab && (
                    <span className="absolute -top-0.5 -right-2 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[#8b5cf6] text-white text-[10px] font-bold px-1 shadow-lg">
                      {count > 9 ? '9+' : count}
                    </span>
                  )}
                  {activeTab === tab && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary shadow-[0_0_8px_rgba(139,92,246,0.6)]"></span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-4 text-xs text-textMuted shrink-0">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 sm:gap-2 hover:text-textMain transition-colors cursor-pointer disabled:opacity-50"
              title={`Last sync: ${syncTime}. Click to refresh.`}
            >
              <span className={isRefreshing ? 'animate-spin' : ''}>
                {isRefreshing ? '🔄' : syncDot}
              </span>
              <span className="hidden sm:inline">Last sync: {syncTime}</span>
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-1.5 border border-border rounded hover:bg-surface hover:text-textMain transition-colors"
              title="Settings"
            >
              ⚙️
            </button>
            <button className="px-2 sm:px-3 py-1.5 border border-border rounded hover:bg-surface transition-colors">
              logout
            </button>
          </div>
        </header>

        {/* Tab Content */}
        <main className="flex-1 overflow-hidden relative bg-[#0d1117]">
          {activeTab === 'dashboard' && <DashboardTab />}
          {activeTab === 'docs' && <DocsTab />}
          {activeTab === 'log' && <LogTab />}
          {activeTab === 'overview' && <OverviewTab />}
        </main>
      </div>

      {/* Settings Panel */}
      {settingsOpen && (
        <SettingsPanel
          agentName={agentName}
          onAgentNameChange={setAgentName}
          currentStatus={agentStatus.state}
          onStatusOverride={handleDevSetState}
          refreshInterval={refreshInterval}
          onRefreshIntervalChange={setRefreshInterval}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Dev Panel (toggle: click avatar 5x or Ctrl+Shift+D) */}
      {devPanelOpen && (
        <DevPanel
          currentState={agentStatus.state}
          allStates={ALL_STATES}
          isCycling={isCycling}
          onSetState={handleDevSetState}
          onCycleAll={startCycle}
          onStopCycle={stopCycle}
          onReset={handleDevReset}
          onClose={() => { stopCycle(); setDevPanelOpen(false); }}
        />
      )}
    </div>
  );
};

export default App;
