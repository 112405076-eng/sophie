/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { Task, Profile } from '../types';
import { DB } from '../supabaseClient';
import { 
  Search, 
  SlidersHorizontal, 
  Clock, 
  User, 
  RotateCcw, 
  Tag, 
  ArrowUpDown,
  ChevronRight,
  Eye
} from 'lucide-react';

interface TaskListProps {
  currentUser: Profile;
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  // Allows the dashboard to pre-set filters
  initialFilters?: {
    status?: string;
    deadlineRange?: 'upcoming' | 'overdue' | null;
  };
}

export default function TaskList({ currentUser, tasks, onSelectTask, initialFilters }: TaskListProps) {
  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [requesterFilter, setRequesterFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [deadlineRangeFilter, setDeadlineRangeFilter] = useState<'all' | 'upcoming' | 'overdue'>('all');
  
  // Sorting state
  const [sortBy, setSortBy] = useState<'deadline' | 'priority' | 'created_at'>('deadline');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Load external/initial filters from dashboard interactions
  useEffect(() => {
    if (initialFilters) {
      if (initialFilters.status) {
        setStatusFilter(initialFilters.status);
      }
      if (initialFilters.deadlineRange) {
        setDeadlineRangeFilter(initialFilters.deadlineRange);
      }
    }
  }, [initialFilters]);

  // Load supporting dropdown metadata
  const profiles = useMemo(() => DB.getProfiles(), []);
  const designers = useMemo(() => profiles.filter(p => p.role === 'designer' || p.role === 'design_leader'), [profiles]);
  const accounts = useMemo(() => profiles.filter(p => p.role === 'account'), [profiles]);

  const platformsList = [
    'Instagram', 'Facebook', 'Threads', 'LINE', '官網', 'YouTube', '實體輸出', '其他'
  ];

  // 1. Role-based RLS Filter (Strict Security Isolation)
  const accessibleTasks = useMemo(() => {
    if (currentUser.role === 'design_leader') {
      return tasks;
    } else if (currentUser.role === 'designer') {
      return tasks.filter(t => t.assignee_id === currentUser.id);
    } else {
      // account
      return tasks.filter(t => t.requester_id === currentUser.id);
    }
  }, [tasks, currentUser]);

  // Helper date calculation
  const today = new Date();
  const getDaysDiff = (deadlineStr: string) => {
    const d1 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const deadlineDate = new Date(deadlineStr);
    const d2 = new Date(deadlineDate.getFullYear(), deadlineDate.getMonth(), deadlineDate.getDate());
    const diffTime = d2.getTime() - d1.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setAssigneeFilter('');
    setRequesterFilter('');
    setPlatformFilter('');
    setPriorityFilter('');
    setDeadlineRangeFilter('all');
    setSortBy('deadline');
    setSortOrder('asc');
  };

  // 2. Perform Filtering & Searching
  const filteredTasks = useMemo(() => {
    return accessibleTasks.filter(task => {
      // Search Box Fuzzy Match
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        task.task_number.toLowerCase().includes(searchLower) ||
        task.title.toLowerCase().includes(searchLower) ||
        (task.project_name || '').toLowerCase().includes(searchLower) ||
        (task.description || '').toLowerCase().includes(searchLower);

      // Category match
      const matchesStatus = statusFilter ? task.status === statusFilter : true;
      const matchesAssignee = assigneeFilter ? task.assignee_id === assigneeFilter : true;
      const matchesRequester = requesterFilter ? task.requester_id === requesterFilter : true;
      const matchesPlatform = platformFilter ? task.platform === platformFilter : true;
      const matchesPriority = priorityFilter ? task.priority === priorityFilter : true;

      // Deadline ranges
      let matchesDeadlineRange = true;
      if (task.status !== '已完成') {
        const diff = getDaysDiff(task.deadline);
        if (deadlineRangeFilter === 'upcoming') {
          matchesDeadlineRange = diff >= 0 && diff <= 1; // today or tomorrow
        } else if (deadlineRangeFilter === 'overdue') {
          matchesDeadlineRange = diff < 0; // past
        }
      } else {
        if (deadlineRangeFilter !== 'all') {
          matchesDeadlineRange = false; // completed tasks aren't considered upcoming/overdue
        }
      }

      return matchesSearch && matchesStatus && matchesAssignee && matchesRequester && matchesPlatform && matchesPriority && matchesDeadlineRange;
    });
  }, [accessibleTasks, searchTerm, statusFilter, assigneeFilter, requesterFilter, platformFilter, priorityFilter, deadlineRangeFilter]);

  // 3. Perform Sorting
  const sortedTasks = useMemo(() => {
    const sorted = [...filteredTasks];
    const priorityWeight = { '緊急': 3, '重要': 2, '一般': 1 };

    sorted.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'deadline') {
        comparison = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      } else if (sortBy === 'priority') {
        comparison = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      } else if (sortBy === 'created_at') {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [filteredTasks, sortBy, sortOrder]);

  // Helper labels & colors
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case '緊急':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-red-50 text-red-700 border border-red-100">緊急</span>;
      case '重要':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">重要</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-50 text-slate-600 border border-slate-100">一般</span>;
    }
  };

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

  const toggleSort = (field: 'deadline' | 'priority' | 'created_at') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Format date readable
  const formatDateTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6 pb-12 font-sans" id="task_list_container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">工單管理中心</h1>
          <p className="text-sm text-slate-500 mt-1">
            {currentUser.role === 'design_leader' ? '管理與分派全團隊設計工單' : '追蹤及更新您所屬的設計任務'}
          </p>
        </div>
        <div className="text-sm font-semibold text-slate-500 bg-white border border-slate-100 px-3.5 py-1.5 rounded-xl shadow-xs">
          篩選出 <strong className="text-indigo-600">{sortedTasks.length}</strong> 筆工單
        </div>
      </div>

      {/* SEARCH AND FILTERS PANEL */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
        {/* Search row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4.5 w-4.5 text-slate-400" />
            </span>
            <input
              type="text"
              className="block w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              placeholder="搜尋工單編號、標題、專案名稱或說明..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              id="search_task_input"
            />
          </div>
          <button
            onClick={handleResetFilters}
            className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-100 rounded-xl transition duration-150 cursor-pointer"
            id="clear_filters_btn"
          >
            <RotateCcw className="h-4 w-4" />
            <span>重設篩選</span>
          </button>
        </div>

        {/* Filter inputs grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
          {/* Status */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">工單狀態</label>
            <select
              className="block w-full p-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-1.5 focus:ring-indigo-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              id="filter_status"
            >
              <option value="">全部狀態</option>
              <option value="待分派">待分派</option>
              <option value="已分派">已分派</option>
              <option value="製作中">製作中</option>
              <option value="待確認">待確認</option>
              <option value="修改中">修改中</option>
              <option value="已完成">已完成</option>
            </select>
          </div>

          {/* Designer (Only for Leaders & Accounts) */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">負責設計師</label>
            <select
              className="block w-full p-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-1.5 focus:ring-indigo-500"
              value={assigneeFilter}
              disabled={currentUser.role === 'designer'}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              id="filter_designer"
            >
              <option value="">全部設計師</option>
              {designers.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Requester (Only for Leaders & Designers) */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">申請人 (Account)</label>
            <select
              className="block w-full p-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-1.5 focus:ring-indigo-500"
              value={requesterFilter}
              disabled={currentUser.role === 'account'}
              onChange={(e) => setRequesterFilter(e.target.value)}
              id="filter_requester"
            >
              <option value="">全部申請人</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          {/* Platform */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">上線平台</label>
            <select
              className="block w-full p-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-1.5 focus:ring-indigo-500"
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              id="filter_platform"
            >
              <option value="">全部平台</option>
              {platformsList.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">優先程度</label>
            <select
              className="block w-full p-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-1.5 focus:ring-indigo-500"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              id="filter_priority"
            >
              <option value="">全部程度</option>
              <option value="一般">一般</option>
              <option value="重要">重要</option>
              <option value="緊急">緊急</option>
            </select>
          </div>

          {/* Special date scope */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">時程警示</label>
            <select
              className="block w-full p-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-1.5 focus:ring-indigo-500"
              value={deadlineRangeFilter}
              onChange={(e) => setDeadlineRangeFilter(e.target.value as any)}
              id="filter_time_alerts"
            >
              <option value="all">不限時程</option>
              <option value="upcoming">即將到期 (24H內)</option>
              <option value="overdue">已逾期工單</option>
            </select>
          </div>
        </div>
      </div>

      {/* WORK ORDER LISTING TABLE */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
        {sortedTasks.length === 0 ? (
          <div className="py-16 text-center">
            <div className="h-12 w-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <SlidersHorizontal className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">找不到符合篩選條件的工單</p>
            <p className="text-xs text-slate-400 mt-1">請嘗試修改篩選條件或搜尋關鍵字</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left" id="tasks_table">
              <thead>
                <tr className="text-xs font-bold text-slate-400 tracking-wider uppercase border-b border-slate-50 bg-slate-50/20">
                  <th className="py-3.5 px-4 font-semibold">工單編號</th>
                  <th className="py-3.5 px-4 font-semibold">出圖名稱 / 專案名稱</th>
                  <th className="py-3.5 px-4 font-semibold">上線平台</th>
                  <th className="py-3.5 px-4 font-semibold cursor-pointer select-none hover:bg-slate-50 transition" onClick={() => toggleSort('deadline')}>
                    <div className="flex items-center gap-1">
                      <span>截止日期</span>
                      <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 font-semibold cursor-pointer select-none hover:bg-slate-50 transition" onClick={() => toggleSort('priority')}>
                    <div className="flex items-center gap-1">
                      <span>優先程度</span>
                      <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 font-semibold">目前狀態</th>
                  <th className="py-3.5 px-4 font-semibold">最後更新</th>
                  <th className="py-3.5 px-4 text-right font-semibold">詳細</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedTasks.map((task) => {
                  const requester = profiles.find(p => p.id === task.requester_id);
                  const assignee = task.assignee_id ? profiles.find(p => p.id === task.assignee_id) : null;
                  
                  const daysDiff = getDaysDiff(task.deadline);
                  const isTaskOverdue = task.status !== '已完成' && daysDiff < 0;
                  const isTaskUpcoming = task.status !== '已完成' && daysDiff >= 0 && daysDiff <= 1;

                  return (
                    <tr 
                      key={task.id} 
                      onClick={() => onSelectTask(task)}
                      className="hover:bg-indigo-50/5 cursor-pointer transition"
                    >
                      {/* Code */}
                      <td className="py-4 px-4 font-mono text-xs font-bold text-slate-500">
                        {task.task_number}
                      </td>

                      {/* Name */}
                      <td className="py-4 px-4">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{task.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-400">{task.project_name || '一般需求'}</span>
                            <span className="text-[10px] text-slate-300">•</span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                              <User className="h-2.5 w-2.5" /> 
                              {requester ? requester.name : '未知'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Platform */}
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                          {task.platform}
                        </span>
                      </td>

                      {/* Deadline */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          <Clock className={`h-3.5 w-3.5 ${isTaskOverdue ? 'text-red-500' : isTaskUpcoming ? 'text-amber-500' : 'text-slate-400'}`} />
                          <span className={`text-xs font-semibold ${
                            isTaskOverdue 
                              ? 'text-red-600 font-extrabold' 
                              : isTaskUpcoming 
                                ? 'text-amber-600 font-extrabold animate-pulse' 
                                : 'text-slate-600'
                          }`}>
                            {task.deadline}
                          </span>
                          {isTaskOverdue && (
                            <span className="text-[9px] font-bold text-red-700 bg-red-50 border border-red-100 px-1 py-0.2 rounded">逾期</span>
                          )}
                          {isTaskUpcoming && (
                            <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-1 py-0.2 rounded">即將到期</span>
                          )}
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="py-4 px-4">
                        {getPriorityBadge(task.priority)}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          {getStatusBadge(task.status)}
                          {assignee ? (
                            <span className="text-[10px] text-slate-400 font-medium ml-1">
                              負責：{assignee.name.split(' ')[0]}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic ml-1">
                              (待指派)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Updated */}
                      <td className="py-4 px-4 text-xs font-mono text-slate-400">
                        {formatDateTime(task.updated_at)}
                      </td>

                      {/* Action */}
                      <td className="py-4 px-4 text-right">
                        <button 
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          aria-label="View task details"
                        >
                          <Eye className="h-4.5 w-4.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
