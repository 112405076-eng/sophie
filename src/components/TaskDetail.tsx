/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Task, Profile, Comment, Attachment, TaskHistory, TaskStatus, TaskPriority, AttachmentCategory } from '../types';
import { DB } from '../supabaseClient';
import { 
  ArrowLeft, 
  Clock, 
  User, 
  Send, 
  Paperclip, 
  History, 
  CheckCircle2, 
  Edit3, 
  FileText, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  Flame,
  Plus
} from 'lucide-react';

interface TaskDetailProps {
  currentUser: Profile;
  task: Task;
  onBack: () => void;
  onRefreshTasks: () => void;
  onSelectTask: (task: Task) => void;
}

export default function TaskDetail({ currentUser, task: initialTask, onBack, onRefreshTasks, onSelectTask }: TaskDetailProps) {
  // Sync state if task updates
  const [task, setTask] = useState<Task>(initialTask);
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [history, setHistory] = useState<TaskHistory[]>([]);

  // Input states
  const [commentText, setCommentText] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(task.priority);

  // File Upload popup state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadFileUrl, setUploadFileUrl] = useState('');
  const [uploadCategory, setUploadCategory] = useState<AttachmentCategory>('draft');

  // Revision popup state
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [revisionFeedback, setRevisionFeedback] = useState('');

  // Dropdown options
  const profiles = DB.getProfiles();
  const designers = profiles.filter(p => p.role === 'designer' || p.role === 'design_leader');

  // Refresh data on mount & task change
  const reloadData = () => {
    const updatedTask = DB.getTaskById(task.id);
    if (updatedTask) {
      setTask(updatedTask);
      onSelectTask(updatedTask); // Keep parent updated
    }
    setComments(DB.getComments(task.id));
    setAttachments(DB.getAttachments(task.id));
    setHistory(DB.getTaskHistory(task.id));
  };

  useEffect(() => {
    reloadData();
    setAssigneeId(task.assignee_id || '');
    setPriority(task.priority);
  }, [task.id]);

  // Handle Comment Submission
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    DB.addComment(task.id, commentText.trim(), currentUser.id);
    setCommentText('');
    reloadData();
    onRefreshTasks();
  };

  // Handle Status Update (Simple buttons)
  const handleUpdateStatus = (newStatus: TaskStatus) => {
    const confirmMsg: Record<string, string> = {
      '製作中': '確認開始製作此工單嗎？工單狀態將更新為「製作中」！',
      '待確認': '確認提交目前初稿/完稿供核准嗎？工單狀態將更新為「待確認」！',
      '已完成': '您確認此工單的設計已經完美結案了嗎？這將把工單標示為「已完成」！',
    };

    if (confirmMsg[newStatus] && !window.confirm(confirmMsg[newStatus])) {
      return;
    }

    DB.updateTaskStatus(task.id, newStatus, currentUser.id);
    reloadData();
    onRefreshTasks();
  };

  // Handle Assignment (Leader action)
  const handleAssignChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextVal = e.target.value || null;
    setAssigneeId(e.target.value);
    DB.assignTask(task.id, nextVal, currentUser.id);
    reloadData();
    onRefreshTasks();
  };

  // Handle Priority change (Leader action)
  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextVal = e.target.value as TaskPriority;
    setPriority(nextVal);
    DB.updateTaskPriority(task.id, nextVal, currentUser.id);
    reloadData();
    onRefreshTasks();
  };

  // Handle Attachment Upload submission
  const handleUploadFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFileName.trim()) return;

    // Use Unsplash images as simulated placeholders if no real URL is set
    const finalUrl = uploadFileUrl.trim() || 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?w=1000';

    DB.addAttachment(task.id, {
      file_name: uploadFileName.trim(),
      file_url: finalUrl,
      file_size: Math.floor(Math.random() * 2000000) + 100000, // random size 100kb to 2mb
      file_type: uploadFileName.endsWith('.pdf') ? 'application/pdf' : 'image/png',
      category: uploadCategory,
    }, currentUser.id);

    // If designer or design_leader uploads draft/final, automatically suggest status change to '待確認'
    if ((currentUser.role === 'designer' || currentUser.role === 'design_leader') && (uploadCategory === 'draft' || uploadCategory === 'final')) {
      DB.updateTaskStatus(task.id, '待確認', currentUser.id);
    }

    setUploadFileName('');
    setUploadFileUrl('');
    setUploadOpen(false);
    reloadData();
    onRefreshTasks();
  };

  // Handle Revision Submission (Account action)
  const handleRevisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionFeedback.trim()) return;

    // 1. Add comment explaining what to change
    DB.addComment(task.id, `【提出修改需求】\n${revisionFeedback.trim()}`, currentUser.id);
    
    // 2. Change task status to '修改中'
    DB.updateTaskStatus(task.id, '修改中', currentUser.id);

    setRevisionFeedback('');
    setRevisionOpen(false);
    reloadData();
    onRefreshTasks();
  };

  // Helpers
  const getDaysDiff = (deadlineStr: string) => {
    const today = new Date();
    const d1 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const deadlineDate = new Date(deadlineStr);
    const d2 = new Date(deadlineDate.getFullYear(), deadlineDate.getMonth(), deadlineDate.getDate());
    const diffTime = d2.getTime() - d1.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const isTaskOverdue = task.status !== '已完成' && getDaysDiff(task.deadline) < 0;
  const isTaskUpcoming = task.status !== '已完成' && getDaysDiff(task.deadline) >= 0 && getDaysDiff(task.deadline) <= 1;

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case '緊急':
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-800 border border-red-200"><Flame className="h-3.5 w-3.5 text-red-600" />緊急</span>;
      case '重要':
        return <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">重要</span>;
      default:
        return <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">一般</span>;
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case '待分派':
        return <span className="inline-flex items-center px-3.5 py-1 rounded-full text-sm font-bold bg-slate-100 text-slate-700 border border-slate-200">待分派</span>;
      case '已分派':
        return <span className="inline-flex items-center px-3.5 py-1 rounded-full text-sm font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">已分派</span>;
      case '製作中':
        return <span className="inline-flex items-center px-3.5 py-1 rounded-full text-sm font-bold bg-sky-100 text-sky-800 border border-sky-200">製作中</span>;
      case '待確認':
        return <span className="inline-flex items-center px-3.5 py-1 rounded-full text-sm font-bold bg-amber-100 text-amber-800 border border-amber-200">待確認</span>;
      case '修改中':
        return <span className="inline-flex items-center px-3.5 py-1 rounded-full text-sm font-bold bg-rose-100 text-rose-800 border border-rose-200">修改中</span>;
      case '已完成':
        return <span className="inline-flex items-center px-3.5 py-1 rounded-full text-sm font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">已完成</span>;
      default:
        return null;
    }
  };

  const requester = profiles.find(p => p.id === task.requester_id);
  const assignee = task.assignee_id ? profiles.find(p => p.id === task.assignee_id) : null;

  return (
    <div className="space-y-6 pb-20 font-sans" id="task_detail_container">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 bg-white border border-slate-100 rounded-xl text-slate-500 hover:text-slate-800 hover:shadow-xs transition duration-150 cursor-pointer"
            id="detail_back_btn"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                {task.task_number}
              </span>
              {getStatusBadge(task.status)}
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">{task.title}</h1>
          </div>
        </div>

        {/* Chrono warnings if needed */}
        <div className="flex gap-2">
          {isTaskOverdue && (
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-red-50 text-red-700 border border-red-200">
              <AlertTriangle className="h-4 w-4 animate-bounce" />
              <span>本工單已落後截止日！請加緊協調。</span>
            </div>
          )}
          {isTaskUpcoming && (
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="h-4 w-4 text-amber-600 animate-pulse" />
              <span>截止期限在即（24小時內）</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Specification Spec in Left, Workflow and Comments in Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Spec Sheet & Attachment Vault */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Specifications Bento Box */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-6">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2">
              📋 需求詳細規格
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">活動 / 專案名稱</span>
                <p className="text-sm font-bold text-slate-800">{task.project_name || '(未提供專案分類)'}</p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">上線平台與尺寸規格</span>
                <p className="text-sm font-bold text-slate-800">{task.platform} <span className="text-slate-400">({task.size})</span></p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">申請人 (Account)</span>
                <p className="text-sm font-medium text-slate-800">{requester ? `${requester.name} (${requester.department})` : '未知'}</p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">負責設計師</span>
                <p className="text-sm font-bold text-indigo-600">{assignee ? assignee.name : '🕒 等待組長指派中'}</p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">設計截止日期</span>
                <p className="text-sm font-semibold text-slate-800">{task.deadline}</p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">預計上線日期</span>
                <p className="text-sm font-semibold text-slate-800">{task.launch_date || '(未註明)'}</p>
              </div>

              {task.reference_style && (
                <div className="sm:col-span-2 space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">參考風格說明</span>
                  <p className="text-sm text-slate-800 font-medium">{task.reference_style}</p>
                </div>
              )}

              {task.reference_url && (
                <div className="sm:col-span-2 space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">參考連結</span>
                  <a 
                    href={task.reference_url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-sm text-indigo-600 font-semibold hover:underline flex items-center gap-1 w-fit"
                  >
                    <span>開啟外部參考連結</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Description Block */}
            <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 space-y-2">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">需求說明描述</h3>
              <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed font-medium">
                {task.description}
              </p>
            </div>

            {/* Copy Block */}
            {task.copy_content && (
              <div className="bg-amber-50/10 rounded-xl p-4 border border-amber-100 space-y-2">
                <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wider">置入文案內容</h3>
                <div className="bg-white p-3 rounded-lg border border-amber-200/55 font-mono text-xs text-slate-700 whitespace-pre-wrap leading-relaxed select-all">
                  {task.copy_content}
                </div>
              </div>
            )}
          </div>

          {/* Files and Versions Vault */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-50 pb-2">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                📁 檔案與版本管理區
              </h2>
              {/* Upload trigger button (Allowed for any authenticated team member) */}
              <button
                onClick={() => setUploadOpen(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-xs rounded-lg transition duration-150 cursor-pointer"
                id="trigger_upload_btn"
              >
                <Paperclip className="h-3.5 w-3.5" />
                <span>上傳檔案</span>
              </button>
            </div>

            {attachments.length === 0 ? (
              <div className="py-12 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <Paperclip className="h-8 w-8 text-slate-400 mb-2 mx-auto" />
                <p className="text-xs font-bold text-slate-600">尚無任何上傳檔案記錄</p>
                <p className="text-[10px] text-slate-400 mt-1">您可以上傳參考圖、PDF需求書，或是設計師上傳初稿與完稿</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-left text-xs" id="attachments_table">
                  <thead>
                    <tr className="font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50">
                      <th className="pb-2.5">類別</th>
                      <th className="pb-2.5">檔案名稱</th>
                      <th className="pb-2.5">上傳者</th>
                      <th className="pb-2.5">時間</th>
                      <th className="pb-2.5">大小</th>
                      <th className="pb-2.5 text-right">取得</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {attachments.map((file) => {
                      const categoryLabels: Record<string, { t: string; c: string }> = {
                        reference: { t: '參考資料', c: 'bg-slate-100 text-slate-800' },
                        draft: { t: '設計初稿', c: 'bg-amber-100 text-amber-800' },
                        final: { t: '作品完稿', c: 'bg-emerald-100 text-emerald-800' },
                        other: { t: '其它附件', c: 'bg-slate-100 text-slate-600' }
                      };
                      const cat = categoryLabels[file.category] || { t: '檔案', c: 'bg-slate-100' };

                      return (
                        <tr key={file.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-2.5">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${cat.c}`}>
                              {cat.t}
                            </span>
                          </td>
                          <td className="py-2.5 font-semibold text-slate-800 max-w-[150px] truncate" title={file.file_name}>
                            {file.file_name}
                          </td>
                          <td className="py-2.5 text-slate-500 font-medium">
                            {file.uploader_name?.split(' ')[0] || '成員'}
                          </td>
                          <td className="py-2.5 text-slate-400 font-mono">
                            {new Date(file.created_at).toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' })}
                          </td>
                          <td className="py-2.5 text-slate-400">
                            {Math.round(file.file_size / 1000) / 1000} MB
                          </td>
                          <td className="py-2.5 text-right">
                            <a 
                              href={file.file_url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-indigo-600 font-bold hover:underline inline-flex items-center gap-0.5 hover:text-indigo-800"
                            >
                              <span>檢視</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
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

        {/* RIGHT COLUMN: Action center & Live timeline */}
        <div className="space-y-6">
          
          {/* Status and Action center */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2">
              ⚡ 狀態流程控制區
            </h2>

            {/* CURRENT ASSIGNEE & PRIORITY CHANGE (FOR DESIGN LEADER) */}
            {currentUser.role === 'design_leader' ? (
              <div className="space-y-4 bg-indigo-50/20 p-4 rounded-xl border border-indigo-50">
                <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide">🎖️ 組長專屬排程調度</p>
                
                {/* 1. Assignment drop */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500">指派負責設計師</label>
                  <select
                    className="block w-full p-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1.5 focus:ring-indigo-500"
                    value={assigneeId}
                    onChange={handleAssignChange}
                    id="detail_assign_dropdown"
                  >
                    <option value="">-- 未指派 --</option>
                    {designers.map(d => (
                      <option key={d.id} value={d.id}>{d.name} (進行中: {DB.getTasks().filter(t => t.assignee_id === d.id && t.status !== '已完成').length} 筆)</option>
                    ))}
                  </select>
                </div>

                {/* 2. Priority drop */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500">調整優先程度</label>
                  <select
                    className="block w-full p-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1.5 focus:ring-indigo-500"
                    value={priority}
                    onChange={handlePriorityChange}
                    id="detail_priority_dropdown"
                  >
                    <option value="一般">一般</option>
                    <option value="重要">重要</option>
                    <option value="緊急">緊急</option>
                  </select>
                </div>

                <div className="space-y-1 pt-1 border-t border-indigo-100/40">
                  <p className="text-[10px] text-indigo-600">
                    ※ 更改指派或調整優先程度會自動寫入變更紀錄，並發送即時通知給負責成員。
                  </p>
                </div>
              </div>
            ) : (
              // NON-LEADERS JUST SEE SPEC READONLY
              <div className="grid grid-cols-2 gap-2 text-xs py-1">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase">優先程度</span>
                  <div className="mt-1">{getPriorityBadge(task.priority)}</div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase">負責人</span>
                  <div className="mt-1 font-bold text-slate-700">{assignee ? assignee.name.split(' ')[0] : '未指派'}</div>
                </div>
              </div>
            )}

            {/* WORKFLOW STATUS STEPPERS ACCORDING TO ROLE */}
            <div className="space-y-2 pt-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">目前可執行操作</p>

              {/* DESIGNER WORKFLOW BUTTONS */}
              {(currentUser.role === 'designer' || currentUser.role === 'design_leader') && task.assignee_id === currentUser.id && (
                <div className="space-y-2" id="designer_workflow_actions">
                  {task.status === '已分派' && (
                    <button
                      onClick={() => handleUpdateStatus('製作中')}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-xs transition duration-150 cursor-pointer"
                      id="designer_start_work_btn"
                    >
                      <Plus className="h-4 w-4" />
                      <span>開始製作</span>
                    </button>
                  )}

                  {(task.status === '製作中' || task.status === '修改中') && (
                    <button
                      onClick={() => {
                        setUploadCategory('draft');
                        setUploadOpen(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-xs transition duration-150 cursor-pointer"
                      id="designer_submit_draft_btn"
                    >
                      <Paperclip className="h-4 w-4" />
                      <span>上傳初稿 / 提交核准</span>
                    </button>
                  )}

                  {task.status === '待確認' && (
                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl p-3 font-semibold text-center">
                      🕒 已提交作品。請靜候 Account 確認或留言回覆！
                    </p>
                  )}

                  {task.status === '已完成' && (
                    <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl p-3 font-semibold text-center flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="h-4.5 w-4.5" />
                      <span>此工單已順利結案完成！</span>
                    </p>
                  )}
                </div>
              )}

              {/* ACCOUNT WORKFLOW BUTTONS */}
              {currentUser.role === 'account' && task.requester_id === currentUser.id && (
                <div className="space-y-2.5" id="account_workflow_actions">
                  {task.status === '待分派' && (
                    <p className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                      🕒 需求已送出。等待設計組長分派設計師...
                    </p>
                  )}

                  {task.status === '已分派' && (
                    <p className="text-xs text-indigo-700 bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 text-center font-medium">
                      🎯 設計師 [{assignee?.name}] 已認領！等待其安排製作。
                    </p>
                  )}

                  {task.status === '製作中' && (
                    <p className="text-xs text-sky-700 bg-sky-50/50 border border-sky-100 rounded-xl p-3 text-center font-medium">
                      🖌️ 設計師正積極製作中，初稿上傳後會第一時間通知您。
                    </p>
                  )}

                  {task.status === '修改中' && (
                    <p className="text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-xl p-3 text-center font-medium">
                      ✏️ 設計師收到修改建議，正在重新修正作品中。
                    </p>
                  )}

                  {task.status === '待確認' && (
                    <div className="grid grid-cols-2 gap-2" id="account_verify_panel">
                      <button
                        onClick={() => handleUpdateStatus('已完成')}
                        className="flex items-center justify-center gap-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition duration-150 cursor-pointer"
                        id="account_approve_btn"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>確認完稿結案</span>
                      </button>
                      <button
                        onClick={() => setRevisionOpen(true)}
                        className="flex items-center justify-center gap-1 py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition duration-150 cursor-pointer"
                        id="account_request_revision_btn"
                      >
                        <Edit3 className="h-4 w-4" />
                        <span>提出修改需求</span>
                      </button>
                    </div>
                  )}

                  {task.status === '已完成' && (
                    <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl p-3 font-semibold text-center flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="h-4.5 w-4.5" />
                      <span>此工單已確認結案。感謝團隊協助！</span>
                    </p>
                  )}
                </div>
              )}

              {/* DESIGN LEADER STATUS REVIEWS */}
              {currentUser.role === 'design_leader' && (
                <div className="space-y-1">
                  {task.status === '待分派' && (
                    <p className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-xl p-3 text-center font-semibold">
                      ※ 此工單目前尚無負責人。請使用上方面板指派設計師。
                    </p>
                  )}
                  {task.status !== '待分派' && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 space-y-1">
                      <div className="flex justify-between">
                        <span>目前狀態：</span>
                        <strong className="text-slate-700">{task.status}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>負責設計師：</span>
                        <strong className="text-indigo-600">{assignee ? assignee.name : '未指派'}</strong>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Comment discussion board */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex flex-col max-h-[500px]">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2 mb-4">
              💬 團隊留言溝通區 ({comments.length})
            </h2>

            {/* Comments feed */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1 min-h-[150px]">
              {comments.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 italic">
                  目前尚無留言。請在下方輸入留言討論需求！
                </div>
              ) : (
                comments.map((comment) => {
                  const isMe = comment.user_id === currentUser.id;
                  const roleColors: Record<string, string> = {
                    design_leader: 'text-amber-600',
                    designer: 'text-emerald-600',
                    account: 'text-indigo-600'
                  };
                  const roleLabel: Record<string, string> = {
                    design_leader: 'Leader',
                    designer: '設計',
                    account: '業務'
                  };

                  return (
                    <div 
                      key={comment.id} 
                      className={`flex flex-col space-y-1 ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <span className="font-bold text-slate-700">{comment.user_name}</span>
                        <span className={`font-bold uppercase ${roleColors[comment.user_role || ''] || ''}`}>
                          [{roleLabel[comment.user_role || ''] || '成員'}]
                        </span>
                        <span>•</span>
                        <span className="font-mono">
                          {new Date(comment.created_at).toLocaleString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      <div className={`p-3 text-xs rounded-xl max-w-[90%] leading-relaxed whitespace-pre-wrap ${
                        isMe 
                          ? 'bg-indigo-600 text-white rounded-tr-none' 
                          : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/50'
                      }`}>
                        {comment.content}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Comment input box */}
            <form onSubmit={handleAddComment} className="relative rounded-xl border border-slate-200 overflow-hidden shadow-xs focus-within:ring-1.5 focus-within:ring-indigo-500 focus-within:border-indigo-500">
              <textarea
                rows={2}
                className="block w-full px-3 py-2 text-xs border-0 focus:outline-none focus:ring-0 bg-white"
                placeholder="輸入您的留言、補充說明或提問..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                id="comment_textarea"
              />
              <div className="flex items-center justify-end px-2 py-1.5 bg-slate-50 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="inline-flex items-center justify-center p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-40 cursor-pointer"
                  id="submit_comment_btn"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          </div>

          {/* Task history log */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2 mb-3 flex items-center gap-1.5">
              <History className="h-4 w-4 text-slate-400" />
              工單異動軌跡紀錄
            </h2>

            <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
              {history.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-4">無異動紀錄</p>
              ) : (
                history.map((log) => (
                  <div key={log.id} className="relative pl-4 pb-2 border-l border-slate-100 last:border-l-0 last:pb-0">
                    {/* Node Dot */}
                    <span className="absolute -left-[4.5px] top-1.5 h-2 w-2 rounded-full bg-slate-200" />
                    
                    <div className="text-[10px] text-slate-400 flex justify-between">
                      <span className="font-bold text-slate-600">{log.user_name} ({log.action})</span>
                      <span className="font-mono">{new Date(log.created_at).toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' })}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">{log.new_value}</p>
                    {log.previous_value && (
                      <p className="text-[9px] text-slate-400 line-through mt-0.5">{log.previous_value}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {/* POPUP: FILE UPLOADER PANEL */}
      {uploadOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="upload_modal">
          <div className="bg-white border border-slate-100 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="font-extrabold text-slate-900 text-base">上傳作品檔案 / 需求附件</h3>
              <button onClick={() => setUploadOpen(false)} className="p-1 rounded-lg hover:bg-slate-50 text-slate-400">
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </button>
            </div>

            <form onSubmit={handleUploadFile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">檔案類別</label>
                <select
                  className="block w-full p-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-1.5 focus:ring-indigo-500"
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value as AttachmentCategory)}
                  id="upload_category"
                >
                  <option value="reference">參考資料/素材 (Reference)</option>
                  <option value="draft">設計初稿 (Draft)</option>
                  <option value="final">作品完稿 (Final)</option>
                  <option value="other">其它附件 (Other)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">檔案名稱 (必填)</label>
                <input
                  type="text"
                  required
                  className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  placeholder="例如：KV_Main_Banner_v2.png"
                  value={uploadFileName}
                  onChange={(e) => setUploadFileName(e.target.value)}
                  id="upload_file_name_input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">下載連結 / 外部儲存位址 (選填)</label>
                <input
                  type="url"
                  className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  placeholder="可留空由系統模擬生成，或貼上 Drive、Figma 連結"
                  value={uploadFileUrl}
                  onChange={(e) => setUploadFileUrl(e.target.value)}
                  id="upload_file_url_input"
                />
              </div>

              {currentUser.role === 'designer' && (uploadCategory === 'draft' || uploadCategory === 'final') && (
                <div className="bg-amber-50 text-amber-800 border border-amber-200 p-3 rounded-xl text-xs leading-relaxed font-semibold">
                  ⚠️ 提示：設計師上傳「設計初稿」或「作品完稿」後，系統會自動將工單狀態變更為【待確認】，並發送即時通知給 Account 團隊進行校對核准。
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setUploadOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs rounded-xl"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs"
                  id="confirm_upload_btn"
                >
                  確定上傳
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP: REVISION FEEDBACK PANEL */}
      {revisionOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="revision_modal">
          <div className="bg-white border border-slate-100 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="font-extrabold text-slate-900 text-base">提出修改需求建議</h3>
              <button onClick={() => setRevisionOpen(false)} className="p-1 rounded-lg hover:bg-slate-50 text-slate-400">
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </button>
            </div>

            <form onSubmit={handleRevisionSubmit} className="space-y-4">
              <div className="bg-rose-50 text-rose-800 border border-rose-100 p-3 rounded-xl text-xs leading-relaxed font-semibold">
                ⚠️ 提交後，工單將會退回為【修改中】狀態。設計師將會立即收到通知，並重啟修改流程。
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">修改意见描述 (必填)</label>
                <textarea
                  required
                  rows={4}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1.5 focus:ring-rose-500"
                  placeholder="請具體寫下需要調整的細節（例如：文字主標題改大、底色改用日系粉、LOGO放大10%...）"
                  value={revisionFeedback}
                  onChange={(e) => setRevisionFeedback(e.target.value)}
                  id="revision_feedback_input"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setRevisionOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs rounded-xl"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-xs"
                  id="confirm_revision_btn"
                >
                  送出修改意見
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
