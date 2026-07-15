/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { DB, isSupabaseConfigured } from './supabaseClient';
import { Profile, Task } from './types';
import Login from './components/Login';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import TaskList from './components/TaskList';
import TaskCreate from './components/TaskCreate';
import TaskAssign from './components/TaskAssign';
import Notifications from './components/Notifications';
import TaskDetail from './components/TaskDetail';
import { Sparkles, Palette, UserCog, Briefcase, BellRing } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Advanced state passing from dashboard to TaskList (e.g., clicking on "Waiting for me" or "Overdue")
  const [taskListFilters, setTaskListFilters] = useState<{
    status?: string;
    deadlineRange?: 'upcoming' | 'overdue' | null;
  } | undefined>(undefined);

  // Load and refresh state functions
  const refreshAllData = async () => {
    if (isSupabaseConfigured) {
      await DB.syncWithSupabase();
    }
    setTasks(DB.getTasks());
  };

  useEffect(() => {
    // Check if session exists
    const savedUser = localStorage.getItem('active_session_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch {
        // failed parse, stay in login screen
      }
    }
    refreshAllData();

    // Listen to tab transitions triggered by storage updates or clicks
    const handleStorageUpdate = () => {
      const savedUser = localStorage.getItem('active_session_user');
      if (savedUser) {
        try {
          setCurrentUser(JSON.parse(savedUser));
        } catch {}
      }
      refreshAllData();
    };

    window.addEventListener('storage', handleStorageUpdate);
    return () => window.removeEventListener('storage', handleStorageUpdate);
  }, []);

  // Compute unread notifications count
  const unreadCount = useMemo(() => {
    if (!currentUser) return 0;
    return DB.getNotifications(currentUser.id).filter(n => !n.is_read).length;
  }, [currentUser, tasks]);

  // Handle Login Event
  const handleLoginSuccess = (user: Profile) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
    setSelectedTask(null);
    setTaskListFilters(undefined);
    refreshAllData();
  };

  // Handle Logout Event
  const handleLogout = () => {
    localStorage.removeItem('active_session_user');
    setCurrentUser(null);
    setSelectedTask(null);
    setTaskListFilters(undefined);
  };

  // Handles navigating to a tab with predefined search filters (e.g. from Dashboard click-throughs)
  const handleNavigateToTabWithFilters = (tabId: string, filters?: any) => {
    setTaskListFilters(filters);
    setSelectedTask(null);
    setActiveTab(tabId);
  };

  // Main UI selector
  const renderMainContent = () => {
    if (!currentUser) return null;

    // View task detail has highest precedence if selected
    if (selectedTask) {
      return (
        <TaskDetail
          currentUser={currentUser}
          task={selectedTask}
          onBack={() => setSelectedTask(null)}
          onRefreshTasks={refreshAllData}
          onSelectTask={(task) => setSelectedTask(task)}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            currentUser={currentUser}
            tasks={tasks}
            onNavigateToTab={handleNavigateToTabWithFilters}
            onSelectTask={(task) => setSelectedTask(task)}
          />
        );
      case 'all_tasks':
        return (
          <TaskList
            currentUser={currentUser}
            tasks={tasks}
            onSelectTask={(task) => setSelectedTask(task)}
            initialFilters={taskListFilters}
          />
        );
      case 'my_tasks':
        const filteredMyTasks = currentUser.role === 'design_leader'
          ? tasks.filter(t => t.assignee_id === currentUser.id)
          : tasks;
        return (
          <TaskList
            currentUser={currentUser}
            tasks={filteredMyTasks}
            onSelectTask={(task) => setSelectedTask(task)}
            initialFilters={taskListFilters}
          />
        );
      case 'create_task':
        return (
          <TaskCreate
            currentUser={currentUser}
            onNavigateToTab={(tabId) => {
              setTaskListFilters(undefined);
              setActiveTab(tabId);
            }}
            onRefreshTasks={refreshAllData}
          />
        );
      case 'assign_tasks':
        return (
          <TaskAssign
            currentUser={currentUser}
            tasks={tasks}
            onRefreshTasks={refreshAllData}
            onSelectTask={(task) => setSelectedTask(task)}
          />
        );
      case 'notifications':
        return (
          <Notifications
            currentUser={currentUser}
            tasks={tasks}
            onSelectTask={(task) => setSelectedTask(task)}
            onRefreshNotifications={refreshAllData}
          />
        );
      default:
        return (
          <div className="py-20 text-center">
            <h2 className="text-lg font-bold text-slate-700">頁面尚未完成</h2>
            <p className="text-xs text-slate-400 mt-1">此部分功能正在積極建置中！</p>
          </div>
        );
    }
  };

  // If not logged in, show Login view
  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 font-sans" id="app_root_layout">
      {/* Navigation bar */}
      <Navbar
        currentUser={currentUser}
        activeTab={selectedTask ? '' : activeTab}
        setActiveTab={(tabId) => {
          setSelectedTask(null);
          setTaskListFilters(undefined); // Clear quick interactions
          setActiveTab(tabId);
        }}
        onLogout={handleLogout}
        unreadCount={unreadCount}
      />

      {/* Main Panel content view wrapper */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 md:py-10 max-w-7xl mx-auto w-full overflow-x-hidden">
        {/* Environment Alert Badge */}
        <div className={`mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border rounded-2xl shadow-xs ${
          isSupabaseConfigured 
            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' 
            : 'bg-amber-50/60 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isSupabaseConfigured ? 'bg-emerald-400' : 'bg-amber-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-500'
              }`}></span>
            </span>
            <div className="text-xs font-bold leading-snug">
              {isSupabaseConfigured ? (
                <>
                  <span>🎉 目前運作於 Supabase 雲端資料庫模式。</span>
                  <span className="text-slate-500 font-normal ml-1">
                    帳號、工單、留言與變更歷史已與您的 Supabase 即時安全同步！
                  </span>
                </>
              ) : (
                <>
                  <span>⚠️ 目前運作於沙盒展示模式 (Demo Mode)。</span>
                  <span className="text-slate-500 font-normal ml-1">
                    資料將儲存於 LocalStorage。在 settings 設定環境變數即可一鍵連結您的 Supabase！
                  </span>
                </>
              )}
            </div>
          </div>
          <div className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-lg border bg-white ${
            isSupabaseConfigured ? 'border-emerald-200 text-emerald-800' : 'border-amber-200 text-amber-800'
          }`}>
            {isSupabaseConfigured ? 'Supabase Connected' : 'Demo Sandbox'}
          </div>
        </div>

        {/* Dynamic Inner Panel View with staggered fade effects */}
        <div className="animate-fade-in" key={selectedTask ? `task-${selectedTask.id}` : activeTab}>
          {renderMainContent()}
        </div>
      </main>
    </div>
  );
}
