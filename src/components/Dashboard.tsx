/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Task, Profile } from '../types';
import { DB } from '../supabaseClient';
import { 
  PlusCircle, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Compass, 
  Users, 
  ArrowRight,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';

interface DashboardProps {
  currentUser: Profile;
  tasks: Task[];
  onNavigateToTab: (tabId: string, filterState?: any) => void;
  onSelectTask: (task: Task) => void;
}

export default function Dashboard({ currentUser, tasks, onNavigateToTab, onSelectTask }: DashboardProps) {
  const today = new Date();
  
  // Basic classification helper
  const getDaysDiff = (deadlineStr: string) => {
    const deadlineDate = new Date(deadlineStr);
    // Set both to midnight to count full days
    const d1 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const d2 = new Date(deadlineDate.getFullYear(), deadlineDate.getMonth(), deadlineDate.getDate());
    const diffTime = d2.getTime() - d1.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const isOverdue = (task: Task) => {
    return task.status !== '已完成' && getDaysDiff(task.deadline) < 0;
  };

  const isUpcoming = (task: Task) => {
    if (task.status === '已完成') return false;
    const diff = getDaysDiff(task.deadline);
    return diff >= 0 && diff <= 1; // within 1 day (today or tomorrow)
  };

  // 1. Account Dashboard calculations
  const accountTasks = tasks.filter(t => t.requester_id === currentUser.id);
  const myCreatedCount = accountTasks.length;
  const myInProgressCount = accountTasks.filter(t => t.status === '製作中' || t.status === '已分派' || t.status === '修改中').length;
  const myPendingApproval = accountTasks.filter(t => t.status === '待確認');
  const myUpcoming = accountTasks.filter(isUpcoming);
  
  // Sort account tasks by last updated
  const recentUpdatedTasks = [...accountTasks]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  // 2. Design Leader Dashboard calculations
  const pendingAssignCount = tasks.filter(t => t.status === '待分派').length;
  const allInProgressCount = tasks.filter(t => t.status === '製作中' || t.status === '已分派' || t.status === '修改中').length;
  const allUpcoming = tasks.filter(isUpcoming);
  const allOverdue = tasks.filter(isOverdue);
  const designerWorkloads = DB.getDesignerWorkloads();

  // 3. Designer Dashboard calculations
  const designerTasks = tasks.filter(t => t.assignee_id === currentUser.id);
  const myTodoTasks = designerTasks.filter(t => t.status === '已分派' || t.status === '製作中' || t.status === '修改中');
  const myInProgressDesigner = designerTasks.filter(t => t.status === '製作中');
  const myUpcomingDesigner = designerTasks.filter(isUpcoming);
  const myPendingAccountApproval = designerTasks.filter(t => t.status === '待確認');

  // Priority Labeling
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case '緊急':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-red-50 text-red-700 border border-red-200">緊急</span>;
      case '重要':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">重要</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-50 text-slate-600 border border-slate-100">一般</span>;
    }
  };

  // Status Labeling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case '待分派':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">待分派</span>;
      case '已分派':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">已分派</span>;
      case '製作中':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">製作中</span>;
      case '待確認':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">待確認</span>;
      case '修改中':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">修改中</span>;
      case '已完成':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">已完成</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 font-sans pb-10" id="dashboard_view">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-slate-100 rounded-2xl p-6 shadow-xs gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            哈囉，{currentUser.name}！
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            今天是 {today.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}。
            以下是今日工單的重要資訊。
          </p>
        </div>
        {currentUser.role === 'account' && (
          <button
            onClick={() => onNavigateToTab('create_task')}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-xs hover:shadow-md transition duration-150 cursor-pointer"
            id="dashboard_create_btn"
          >
            <PlusCircle className="h-4.5 w-4.5" />
            <span>建立新工單</span>
          </button>
        )}
      </div>

      {/* RENDER DYNAMIC DASHBOARDS ACCORDING TO ROLE */}

      {/* ACCOUNT DASHBOARD */}
      {currentUser.role === 'account' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" id="stats_cards_account">
            {/* Metric 1 */}
            <div 
              onClick={() => onNavigateToTab('my_tasks')}
              className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-indigo-200 transition cursor-pointer shadow-xs"
            >
              <div className="flex justify-between items-start">
                <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">我建立的工單</p>
                <span className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600"><FileSpreadsheet className="h-4.5 w-4.5" /></span>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 mt-4">{myCreatedCount}</p>
              <div className="flex items-center gap-1.5 mt-2.5 text-xs text-indigo-600 font-bold group">
                <span>查看列表</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition" />
              </div>
            </div>

            {/* Metric 2 */}
            <div 
              onClick={() => onNavigateToTab('my_tasks', { status: '製作中' })}
              className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-sky-200 transition cursor-pointer shadow-xs"
            >
              <div className="flex justify-between items-start">
                <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">製作中的工單</p>
                <span className="p-1.5 bg-sky-50 rounded-lg text-sky-600"><Compass className="h-4.5 w-4.5" /></span>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 mt-4">{myInProgressCount}</p>
              <p className="text-xs text-slate-400 mt-3 font-medium">設計師正積極製作中</p>
            </div>

            {/* Metric 3 */}
            <div 
              onClick={() => onNavigateToTab('my_tasks', { status: '待確認' })}
              className={`border rounded-2xl p-5 transition cursor-pointer shadow-xs ${
                myPendingApproval.length > 0 
                  ? 'bg-amber-50/30 border-amber-200 hover:border-amber-300' 
                  : 'bg-white border-slate-100 hover:border-amber-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">等待我確認</p>
                <span className={`p-1.5 rounded-lg ${myPendingApproval.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-50 text-slate-500'}`}><CheckCircle2 className="h-4.5 w-4.5" /></span>
              </div>
              <p className={`text-3xl font-extrabold mt-4 ${myPendingApproval.length > 0 ? 'text-amber-700' : 'text-slate-900'}`}>{myPendingApproval.length}</p>
              <p className={`text-xs mt-3 font-semibold ${myPendingApproval.length > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                {myPendingApproval.length > 0 ? '⚠️ 需要您核准或提出修改' : '目前無待確認事項'}
              </p>
            </div>

            {/* Metric 4 */}
            <div 
              onClick={() => onNavigateToTab('my_tasks', { deadlineRange: 'upcoming' })}
              className={`border rounded-2xl p-5 transition cursor-pointer shadow-xs ${
                myUpcoming.length > 0 
                  ? 'bg-red-50/20 border-red-200 hover:border-red-300' 
                  : 'bg-white border-slate-100 hover:border-red-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">即將到期的工單</p>
                <span className={`p-1.5 rounded-lg ${myUpcoming.length > 0 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-50 text-slate-500'}`}><Clock className="h-4.5 w-4.5" /></span>
              </div>
              <p className={`text-3xl font-extrabold mt-4 ${myUpcoming.length > 0 ? 'text-red-600' : 'text-slate-900'}`}>{myUpcoming.length}</p>
              <p className="text-xs text-slate-400 mt-3 font-medium">截止日於 1 日內</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: Pending Confirmation (Waiting for Me) */}
            <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex flex-col h-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  等待我確認的初稿 ({myPendingApproval.length})
                </h2>
                <button 
                  onClick={() => onNavigateToTab('my_tasks', { status: '待確認' })}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  查看全部
                </button>
              </div>

              {myPendingApproval.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400 mb-2" />
                  <p className="text-sm font-semibold text-slate-600">做得好！目前沒有等待您確認的工單</p>
                  <p className="text-xs text-slate-400 mt-1">當設計師提交完稿後，將會顯示於此處</p>
                </div>
              ) : (
                <div className="space-y-3.5 flex-1 overflow-y-auto max-h-96">
                  {myPendingApproval.map(task => (
                    <div 
                      key={task.id}
                      onClick={() => onSelectTask(task)}
                      className="p-4 border border-slate-100 hover:border-indigo-100 rounded-xl hover:bg-indigo-50/5 cursor-pointer transition flex justify-between items-center"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{task.task_number}</span>
                          <span className="text-xs text-slate-400 font-medium">[{task.platform}]</span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-800">{task.title}</h3>
                        <p className="text-xs text-slate-400">截止日期：{task.deadline}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {getPriorityBadge(task.priority)}
                        <span className="text-xs text-indigo-600 hover:underline font-bold flex items-center gap-0.5">
                          核准/修改 <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Col: Recent updates */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
              <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                我建立的工單最近異動
              </h2>

              {recentUpdatedTasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  尚無任何工單異動記錄
                </div>
              ) : (
                <div className="space-y-4">
                  {recentUpdatedTasks.map(task => (
                    <div 
                      key={task.id}
                      onClick={() => onSelectTask(task)}
                      className="group cursor-pointer border-b border-slate-50 last:border-b-0 pb-3 last:pb-0"
                    >
                      <div className="flex justify-between items-start">
                        <p className="text-xs font-semibold text-slate-800 group-hover:text-indigo-600 transition truncate max-w-[180px]">{task.title}</p>
                        {getStatusBadge(task.status)}
                      </div>
                      <div className="flex justify-between items-center mt-1.5">
                        <span className="text-[10px] text-slate-400 font-medium">編號：{task.task_number}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(task.updated_at).toLocaleString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}


      {/* DESIGN LEADER DASHBOARD */}
      {currentUser.role === 'design_leader' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" id="stats_cards_leader">
            {/* Card 1: Pending assign */}
            <div 
              onClick={() => onNavigateToTab('assign_tasks')}
              className={`border rounded-2xl p-5 transition cursor-pointer shadow-xs ${
                pendingAssignCount > 0 
                  ? 'bg-indigo-50/20 border-indigo-200 hover:border-indigo-300' 
                  : 'bg-white border-slate-100 hover:border-indigo-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">待分派工單</p>
                <span className={`p-1.5 rounded-lg ${pendingAssignCount > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-50 text-slate-500'}`}><PlusCircle className="h-4.5 w-4.5" /></span>
              </div>
              <p className={`text-3xl font-extrabold mt-4 ${pendingAssignCount > 0 ? 'text-indigo-600' : 'text-slate-900'}`}>{pendingAssignCount}</p>
              <div className="flex items-center gap-1 mt-3.5 text-xs text-indigo-600 font-bold group">
                <span>前往分派任務</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition" />
              </div>
            </div>

            {/* Card 2: In progress */}
            <div 
              onClick={() => onNavigateToTab('all_tasks', { status: '製作中' })}
              className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-sky-200 transition cursor-pointer shadow-xs"
            >
              <div className="flex justify-between items-start">
                <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">全體製作中</p>
                <span className="p-1.5 bg-sky-50 rounded-lg text-sky-600"><Compass className="h-4.5 w-4.5" /></span>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 mt-4">{allInProgressCount}</p>
              <p className="text-xs text-slate-400 mt-3 font-medium">團隊成員正在努力設計中</p>
            </div>

            {/* Card 3: Expiring soon */}
            <div 
              onClick={() => onNavigateToTab('all_tasks', { deadlineRange: 'upcoming' })}
              className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-amber-200 transition cursor-pointer shadow-xs"
            >
              <div className="flex justify-between items-start">
                <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">即將到期工單</p>
                <span className={`p-1.5 rounded-lg ${allUpcoming.length > 0 ? 'bg-amber-100 text-amber-600 animate-pulse' : 'bg-slate-50 text-slate-500'}`}><Clock className="h-4.5 w-4.5" /></span>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 mt-4">{allUpcoming.length}</p>
              <p className="text-xs text-slate-400 mt-3 font-medium">截止日於 1 日內 (不含完成)</p>
            </div>

            {/* Card 4: Overdue */}
            <div 
              onClick={() => onNavigateToTab('all_tasks', { deadlineRange: 'overdue' })}
              className={`border rounded-2xl p-5 transition cursor-pointer shadow-xs ${
                allOverdue.length > 0 
                  ? 'bg-red-50/20 border-red-200 hover:border-red-300' 
                  : 'bg-white border-slate-100 hover:border-red-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">已逾期工單</p>
                <span className={`p-1.5 rounded-lg ${allOverdue.length > 0 ? 'bg-red-100 text-red-600' : 'bg-slate-50 text-slate-500'}`}><AlertTriangle className="h-4.5 w-4.5" /></span>
              </div>
              <p className={`text-3xl font-extrabold mt-4 ${allOverdue.length > 0 ? 'text-red-600' : 'text-slate-900'}`}>{allOverdue.length}</p>
              <p className={`text-xs mt-3 font-semibold ${allOverdue.length > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                {allOverdue.length > 0 ? '⚠️ 注意：已落後預期時程' : '目前團隊無任何延誤'}
              </p>
            </div>
          </div>

          {/* Designer Workloads and Overdue list */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Designer Workloads */}
            <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
              <h2 className="text-base font-extrabold text-slate-900 mb-5 flex items-center gap-1.5">
                <Users className="h-5 w-5 text-indigo-600" />
                設計師目前負責工作量分析
              </h2>

              <div className="space-y-5" id="designer_workloads_list">
                {designerWorkloads.map(designer => {
                  const maxWorkload = 5; // standard target workload
                  const percentage = Math.min((designer.inProgress / maxWorkload) * 100, 100);
                  
                  // Color scale for workload
                  let progressColor = 'bg-emerald-500';
                  if (designer.inProgress >= 4) progressColor = 'bg-red-500';
                  else if (designer.inProgress >= 3) progressColor = 'bg-amber-500';

                  return (
                    <div key={designer.designerId} className="space-y-2 border-b border-slate-50 last:border-0 pb-4 last:pb-0">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{designer.designerName}</p>
                          <p className="text-xs text-slate-400">{designer.designerEmail}</p>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs text-slate-500">
                            進行中: <strong className="text-slate-800">{designer.inProgress}</strong> 筆
                          </span>
                          {designer.upcoming > 0 && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                              明日到期: {designer.upcoming}
                            </span>
                          )}
                          {designer.overdue > 0 && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-red-50 text-red-700 border border-red-100">
                              已逾期: {designer.overdue}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="relative pt-1">
                        <div className="overflow-hidden h-2.5 text-xs flex rounded bg-slate-100">
                          <div 
                            style={{ width: `${percentage}%` }}
                            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${progressColor} transition-all duration-500`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* High Priority Alerts */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex flex-col h-full">
              <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-1.5">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                緊急與延誤追蹤
              </h2>

              {allOverdue.length === 0 && allUpcoming.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 bg-slate-50/30 rounded-xl border border-dashed border-slate-100">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                  <p className="text-xs font-bold text-slate-600">無任何緊急或過期警示</p>
                </div>
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-96 flex-1">
                  {allOverdue.map(task => (
                    <div 
                      key={task.id}
                      onClick={() => onSelectTask(task)}
                      className="p-3 border border-red-100 bg-red-50/10 rounded-xl hover:bg-red-50/20 cursor-pointer transition flex items-center justify-between"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-bold text-red-700 bg-red-50 border border-red-100 px-1 py-0.5 rounded leading-none">已逾期</span>
                          <span className="text-[10px] text-slate-400 font-mono">{task.task_number}</span>
                        </div>
                        <h3 className="text-xs font-bold text-slate-800 mt-1 truncate">{task.title}</h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">截止：{task.deadline}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-300 flex-shrink-0" />
                    </div>
                  ))}

                  {allUpcoming.map(task => (
                    <div 
                      key={task.id}
                      onClick={() => onSelectTask(task)}
                      className="p-3 border border-amber-100 bg-amber-50/10 rounded-xl hover:bg-amber-50/20 cursor-pointer transition flex items-center justify-between"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-1 py-0.5 rounded leading-none">明日到期</span>
                          <span className="text-[10px] text-slate-400 font-mono">{task.task_number}</span>
                        </div>
                        <h3 className="text-xs font-bold text-slate-800 mt-1 truncate">{task.title}</h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">截止：{task.deadline}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-300 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Active Tasks Table for Design Leader if they have assigned tasks */}
          {myTodoTasks.length > 0 && (
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs mt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                  <TrendingUp className="h-5 w-5 text-indigo-600" />
                  我目前正在負責的個人待辦任務 ({myTodoTasks.length})
                </h2>
                <button 
                  onClick={() => onNavigateToTab('my_tasks')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  查看全部
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-left">
                  <thead>
                    <tr className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                      <th className="py-3 px-4">工單編號</th>
                      <th className="py-3 px-4">出圖名稱 / 專案</th>
                      <th className="py-3 px-4">截止日期</th>
                      <th className="py-3 px-4">優先程度</th>
                      <th className="py-3 px-4">目前狀態</th>
                      <th className="py-3 px-4 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {myTodoTasks.map(task => (
                      <tr key={task.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-4 px-4 font-mono text-xs font-bold text-slate-500">
                          {task.task_number}
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm font-bold text-slate-800">{task.title}</p>
                          <p className="text-xs text-slate-400">{task.project_name || '無專案名稱'}</p>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                            <Clock className={`h-3.5 w-3.5 ${isOverdue(task) ? 'text-red-500' : isUpcoming(task) ? 'text-amber-500' : 'text-slate-400'}`} />
                            <span className={isOverdue(task) ? 'text-red-600 font-bold' : isUpcoming(task) ? 'text-amber-600 font-bold' : ''}>
                              {task.deadline}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {getPriorityBadge(task.priority)}
                        </td>
                        <td className="py-4 px-4">
                          {getStatusBadge(task.status)}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => onSelectTask(task)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
                          >
                            <span>執行處理</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* DESIGNER DASHBOARD */}
      {currentUser.role === 'designer' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" id="stats_cards_designer">
            {/* Card 1: My Todo */}
            <div 
              onClick={() => onNavigateToTab('my_tasks')}
              className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-indigo-200 transition cursor-pointer shadow-xs"
            >
              <div className="flex justify-between items-start">
                <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">待辦工單總數</p>
                <span className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600"><FileSpreadsheet className="h-4.5 w-4.5" /></span>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 mt-4">{myTodoTasks.length}</p>
              <div className="flex items-center gap-1.5 mt-2.5 text-xs text-indigo-600 font-bold group">
                <span>前往待辦清單</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition" />
              </div>
            </div>

            {/* Card 2: In progress */}
            <div 
              onClick={() => onNavigateToTab('my_tasks', { status: '製作中' })}
              className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-sky-200 transition cursor-pointer shadow-xs"
            >
              <div className="flex justify-between items-start">
                <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">製作中工單</p>
                <span className="p-1.5 bg-sky-50 rounded-lg text-sky-600"><Compass className="h-4.5 w-4.5" /></span>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 mt-4">{myInProgressDesigner.length}</p>
              <p className="text-xs text-slate-400 mt-3 font-medium">全力製作並上傳初稿中</p>
            </div>

            {/* Card 3: Expiring soon */}
            <div 
              onClick={() => onNavigateToTab('my_tasks', { deadlineRange: 'upcoming' })}
              className={`border rounded-2xl p-5 transition cursor-pointer shadow-xs ${
                myUpcomingDesigner.length > 0 
                  ? 'bg-amber-50/20 border-amber-200 hover:border-amber-300' 
                  : 'bg-white border-slate-100 hover:border-amber-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">即將到期工單</p>
                <span className={`p-1.5 rounded-lg ${myUpcomingDesigner.length > 0 ? 'bg-amber-100 text-amber-600 animate-pulse' : 'bg-slate-50 text-slate-500'}`}><Clock className="h-4.5 w-4.5" /></span>
              </div>
              <p className={`text-3xl font-extrabold mt-4 ${myUpcomingDesigner.length > 0 ? 'text-amber-700' : 'text-slate-900'}`}>{myUpcomingDesigner.length}</p>
              <p className="text-xs text-slate-400 mt-3 font-medium">截止日於 1 日內</p>
            </div>

            {/* Card 4: Pending account approval */}
            <div 
              onClick={() => onNavigateToTab('my_tasks', { status: '待確認' })}
              className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-emerald-200 transition cursor-pointer shadow-xs"
            >
              <div className="flex justify-between items-start">
                <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">等待 Account 確認</p>
                <span className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600"><CheckCircle2 className="h-4.5 w-4.5" /></span>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 mt-4">{myPendingAccountApproval.length}</p>
              <p className="text-xs text-slate-400 mt-3 font-medium">已提交，待業務端回覆</p>
            </div>
          </div>

          {/* Active Tasks Table for Designer */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                我目前正在負責的待辦任務 ({myTodoTasks.length})
              </h2>
              <button 
                onClick={() => onNavigateToTab('my_tasks')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                查看全部
              </button>
            </div>

            {myTodoTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 className="h-10 w-10 text-emerald-400 mb-2" />
                <p className="text-sm font-bold text-slate-700">太棒了！手邊暫無進行中的工單</p>
                <p className="text-xs text-slate-400 mt-1">您可以稍微休息一下，或向組長確認是否有新任務需要支援！</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-left">
                  <thead>
                    <tr className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                      <th className="py-3 px-4">工單編號</th>
                      <th className="py-3 px-4">出圖名稱 / 專案</th>
                      <th className="py-3 px-4">截止日期</th>
                      <th className="py-3 px-4">優先程度</th>
                      <th className="py-3 px-4">目前狀態</th>
                      <th className="py-3 px-4 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {myTodoTasks.map(task => (
                      <tr key={task.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-4 px-4 font-mono text-xs font-bold text-slate-500">
                          {task.task_number}
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm font-bold text-slate-800">{task.title}</p>
                          <p className="text-xs text-slate-400">{task.project_name || '無專案名稱'}</p>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                            <Clock className={`h-3.5 w-3.5 ${isOverdue(task) ? 'text-red-500' : isUpcoming(task) ? 'text-amber-500' : 'text-slate-400'}`} />
                            <span className={isOverdue(task) ? 'text-red-600 font-bold' : isUpcoming(task) ? 'text-amber-600 font-bold' : ''}>
                              {task.deadline}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {getPriorityBadge(task.priority)}
                        </td>
                        <td className="py-4 px-4">
                          {getStatusBadge(task.status)}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => onSelectTask(task)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
                          >
                            <span>執行處理</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
