/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { Task, Profile } from '../types';
import { DB } from '../supabaseClient';
import { 
  UserCheck, 
  Clock, 
  Briefcase, 
  AlertTriangle, 
  HelpCircle, 
  Calendar, 
  PlusCircle,
  ArrowRight,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';

interface TaskAssignProps {
  currentUser: Profile;
  tasks: Task[];
  onRefreshTasks: () => void;
  onSelectTask: (task: Task) => void;
}

export default function TaskAssign({ currentUser, tasks, onRefreshTasks, onSelectTask }: TaskAssignProps) {
  // Currently highlighted task in queue
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Load profiles
  const profiles = DB.getProfiles();
  const accounts = profiles.filter(p => p.role === 'account');
  const designers = profiles.filter(p => p.role === 'designer' || p.role === 'design_leader');

  // Filter for unassigned tasks (Status === '待分派' or Assignee === null)
  const unassignedTasks = useMemo(() => {
    return tasks.filter(t => t.status === '待分派' || !t.assignee_id);
  }, [tasks]);

  // Load active designer workloads with full metrics
  const designerWorkloads = useMemo(() => {
    return DB.getDesignerWorkloads();
  }, [tasks]);

  // Highlighted task details
  const activeTask = useMemo(() => {
    return unassignedTasks.find(t => t.id === selectedTaskId);
  }, [unassignedTasks, selectedTaskId]);

  // Handle assignment event
  const handleAssignDesigner = (designerId: string) => {
    if (!selectedTaskId) return;

    const designer = designers.find(d => d.id === designerId);
    if (!designer) return;

    const confirmAssign = window.confirm(`確認將工單「${activeTask?.title}」指派給設計師「${designer.name}」嗎？`);
    if (!confirmAssign) return;

    DB.assignTask(selectedTaskId, designerId, currentUser.id);
    setSelectedTaskId(null); // Clear selected
    onRefreshTasks();
  };

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

  return (
    <div className="space-y-6 pb-16 font-sans" id="task_assign_container">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">設計團隊任務指派</h1>
        <p className="text-sm text-slate-500 mt-1">
          檢視待處理工作量，科學指派最適合的設計師，避免人力分配不均。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Queue of Pending Assignment tasks */}
        <div className="lg:col-span-5 bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col h-[600px]">
          <div className="border-b border-slate-50 pb-3 mb-4 flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-600" />
              未分派需求隊列 ({unassignedTasks.length})
            </h2>
            <span className="text-[11px] font-bold text-slate-400">點擊工單以展開指派</span>
          </div>

          {unassignedTasks.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <CheckCircle2 className="h-10 w-10 text-emerald-400 mb-2" />
              <p className="text-sm font-bold text-slate-700">太棒了！無待指派工單</p>
              <p className="text-xs text-slate-400 mt-1">Account 發起的新需求將會即時顯示於此</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-3 pr-1" id="unassigned_queue">
              {unassignedTasks.map((task) => {
                const isSelected = task.id === selectedTaskId;
                const requester = accounts.find(a => a.id === task.requester_id);
                
                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className={`p-4 border rounded-xl cursor-pointer transition text-left space-y-2.5 ${
                      isSelected 
                        ? 'bg-indigo-50/30 border-indigo-500 shadow-xs ring-1.5 ring-indigo-500/10' 
                        : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                    }`}
                    id={`unassigned_item_${task.id}`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded leading-none">
                        {task.task_number}
                      </span>
                      {getPriorityBadge(task.priority)}
                    </div>

                    <div>
                      <h3 className="text-sm font-extrabold text-slate-800 truncate leading-snug">{task.title}</h3>
                      <p className="text-xs text-slate-400 font-medium truncate mt-0.5">{task.project_name || '一般排程項目'}</p>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium pt-1.5 border-t border-slate-50">
                      <span>申請人: {requester?.name || 'Account'}</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>截止日: {task.deadline}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Assignment Canvas / Designer Workload board */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          
          {/* Active Workload Panel when a Task is selected */}
          {activeTask ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-5 animate-fade-in" id="assign_panel">
              <div className="border-b border-slate-50 pb-3 flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">選取待分派工單</p>
                  <h3 className="text-base font-extrabold text-slate-800 mt-1">{activeTask.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">尺寸：{activeTask.size} | 平台：{activeTask.platform} | 截止日期：{activeTask.deadline}</p>
                </div>
                <button
                  onClick={() => onSelectTask(activeTask)}
                  className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-0.5 shrink-0 cursor-pointer"
                >
                  <span>檢視完整需求說明</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Designers Allocation grid */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">🎯 選擇指派負責設計師</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="designers_allocation_grid">
                  {designerWorkloads.map((designer) => {
                    const dProfile = designers.find(d => d.id === designer.designerId);
                    
                    // Workload warnings color
                    let workloadBg = 'bg-emerald-50 text-emerald-800 border-emerald-100';
                    if (designer.inProgress >= 4) workloadBg = 'bg-red-50 text-red-800 border-red-100';
                    else if (designer.inProgress >= 3) workloadBg = 'bg-amber-50 text-amber-800 border-amber-100';

                    return (
                      <div 
                        key={designer.designerId}
                        className="p-4 border border-slate-100 rounded-xl hover:bg-slate-50/50 transition flex flex-col justify-between"
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-800">{designer.designerName}</p>
                          <p className="text-xs text-slate-400 font-mono">{dProfile?.department}</p>
                          
                          {/* Workload Badges */}
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${workloadBg}`}>
                              <Briefcase className="h-2.5 w-2.5" />
                              進行中: {designer.inProgress}
                            </span>

                            {designer.upcoming > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-100">
                                <Clock className="h-2.5 w-2.5" />
                                明日到期: {designer.upcoming}
                              </span>
                            )}

                            {designer.overdue > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-800 border border-red-100">
                                <AlertTriangle className="h-2.5 w-2.5" />
                                逾期: {designer.overdue}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleAssignDesigner(designer.designerId)}
                          className="w-full mt-4 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs hover:shadow-sm transition cursor-pointer"
                          id={`assign_to_${designer.designerId}_btn`}
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          <span>指派給此設計師</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Standby State */
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 text-center flex-1 flex flex-col items-center justify-center min-h-[300px]">
              <HelpCircle className="h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-sm font-bold text-slate-700">尚未選取待指派工單</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1 mx-auto leading-relaxed">
                請在左側隊列中選擇一筆需要分派人力的工單，系統即會在此處展開設計師工作負載比對及調度面板。
              </p>
            </div>
          )}

          {/* Designer Workloads Standby Grid */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-2.5">
              <TrendingUp className="h-4.5 w-4.5 text-indigo-600" />
              設計團隊即時人力負載率 (ReadOnly)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" id="workload_summary_grid">
              {designerWorkloads.map(designer => {
                const totalActive = designer.inProgress;
                return (
                  <div key={designer.designerId} className="p-3 border border-slate-50 rounded-xl bg-slate-50/40 text-center">
                    <p className="text-xs font-bold text-slate-700">{designer.designerName}</p>
                    <p className="text-[22px] font-extrabold text-indigo-600 mt-1">{totalActive}</p>
                    <span className="text-[10px] text-slate-400 font-medium">個進行中工單</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
