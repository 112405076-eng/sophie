/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DB } from '../supabaseClient';
import { Profile, TaskPriority } from '../types';
import { 
  PlusCircle, 
  HelpCircle, 
  Calendar, 
  FileText, 
  Link2, 
  Sparkles,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';

interface TaskCreateProps {
  currentUser: Profile;
  onNavigateToTab: (tabId: string) => void;
  onRefreshTasks: () => void;
}

export default function TaskCreate({ currentUser, onNavigateToTab, onRefreshTasks }: TaskCreateProps) {
  // Fields state
  const [title, setTitle] = useState('');
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [copyContent, setCopyContent] = useState('');
  const [platform, setPlatform] = useState('Instagram');
  const [customPlatform, setCustomPlatform] = useState('');
  const [size, setSize] = useState('');
  const [referenceStyle, setReferenceStyle] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [launchDate, setLaunchDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('一般');

  // Interactive states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdTaskNum, setCreatedTaskNum] = useState('');

  const platformsList = [
    'Instagram', 'Facebook', 'Threads', 'LINE', '官網', 'YouTube', '實體輸出', '其他'
  ];

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic Validation
    if (!title.trim()) return setError('請填寫「出圖名稱」');
    if (!description.trim()) return setError('請填寫「需求說明」');
    if (platform === '其他' && !customPlatform.trim()) return setError('請填寫「自訂平台名稱」');
    if (!size.trim()) return setError('請填寫「版位尺寸」');
    if (!deadline) return setError('請選擇「截止日期」');

    // Date validations
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);

    if (deadlineDate < today) {
      return setError('截止日期不能早於今日！');
    }

    if (launchDate) {
      const launch = new Date(launchDate);
      launch.setHours(0, 0, 0, 0);
      if (launch < deadlineDate) {
        return setError('「上線日期」建議排在「設計截止日期」之後。');
      }
    }

    setLoading(true);

    try {
      // Create work order
      const taskData = {
        title: title.trim(),
        project_name: projectName.trim(),
        description: description.trim(),
        copy_content: copyContent.trim(),
        platform: platform === '其他' ? customPlatform.trim() : platform,
        custom_platform: platform === '其他' ? customPlatform.trim() : '',
        size: size.trim(),
        reference_style: referenceStyle.trim(),
        reference_url: referenceUrl.trim(),
        launch_date: launchDate,
        deadline: deadline,
        priority: priority,
      };

      const result = DB.createTask(taskData, currentUser.id);
      
      setCreatedTaskNum(result.task_number);
      setSuccess(true);
      onRefreshTasks();

      // Reset form
      setTitle('');
      setProjectName('');
      setDescription('');
      setCopyContent('');
      setPlatform('Instagram');
      setCustomPlatform('');
      setSize('');
      setReferenceStyle('');
      setReferenceUrl('');
      setLaunchDate('');
      setDeadline('');
      setPriority('一般');

    } catch (err: any) {
      setError(err?.message || '建立工單時發生未知錯誤');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-8 max-w-xl mx-auto shadow-sm text-center font-sans mt-10" id="create_success_card">
        <div className="h-14 w-14 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">工單建立成功！</h2>
        <p className="text-sm text-slate-500 mt-2">
          系統已為您自動生成工單編號：
        </p>
        <p className="text-lg font-mono font-extrabold text-indigo-600 bg-indigo-50/50 inline-block px-4 py-1.5 rounded-xl border border-indigo-100 mt-3 shadow-xs">
          {createdTaskNum}
        </p>
        <p className="text-xs text-slate-400 mt-3">
          系統已自動通知設計組長，安排指派最適合的設計師。
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => setSuccess(false)}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-sm rounded-xl transition"
            id="create_another_btn"
          >
            繼續建立工單
          </button>
          <button
            onClick={() => onNavigateToTab('all_tasks')}
            className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-xs hover:shadow-sm transition"
            id="view_tasks_btn"
          >
            查看所有工單
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-16 font-sans space-y-6" id="create_task_container">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigateToTab('all_tasks')}
          className="p-1.5 hover:bg-white border border-transparent hover:border-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">申請設計需求</h1>
          <p className="text-sm text-slate-500 mt-0.5">填寫以下詳細規格，以協助設計團隊精準理解需求</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-600 font-semibold">
          ⚠️ 欄位填寫錯誤：{error}
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleFormSubmit} className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden" id="task_create_form">
        <div className="p-6 sm:p-8 space-y-6">
          {/* Section 1: Basic specifications */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
              一、基本工單規格
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Title */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  出圖名稱 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="block w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="例如：夏季新品 IG 輪播圖文設計、FB Banner 主視覺"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  id="task_title"
                />
              </div>

              {/* Project Name */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  活動或專案名稱 <span className="text-slate-400 font-normal">(選填)</span>
                </label>
                <input
                  type="text"
                  className="block w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="例如：2026年中大促、品牌升級計畫"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  id="task_project_name"
                />
              </div>

              {/* Platform */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  上線平台 <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    className="block w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    id="task_platform"
                  >
                    {platformsList.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  {platform === '其他' && (
                    <input
                      type="text"
                      required
                      className="block w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      placeholder="請輸入自訂平台"
                      value={customPlatform}
                      onChange={(e) => setCustomPlatform(e.target.value)}
                      id="task_custom_platform"
                    />
                  )}
                </div>
              </div>

              {/* Size */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  版位尺寸規格 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="block w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="例如：1080 x 1080 px、1200 x 630 px"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  id="task_size"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  優先程度 <span className="text-red-500">*</span>
                </label>
                <select
                  className="block w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  id="task_priority"
                >
                  <option value="一般">一般 (排程正常製作)</option>
                  <option value="重要">重要 (專案急需出圖)</option>
                  <option value="緊急">緊急 (24H - 48H內出圖)</option>
                </select>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section 2: Copy and Description */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
              二、詳細製作需求說明
            </h2>

            <div className="grid grid-cols-1 gap-4">
              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  需求說明 (版型、風格描述、訴求) <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  className="block w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="請清楚描述設計主體與想要呈現的氛圍（例：希望呈現夏日清涼、極簡無印風格、突出折扣字樣）"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  id="task_description"
                />
              </div>

              {/* Copy Content */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  文案內容 / 置入文字 <span className="text-slate-400 font-normal">(選填)</span>
                </label>
                <textarea
                  rows={3}
                  className="block w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono text-xs"
                  placeholder="首圖：年中驚喜大促\n副標：全館 5 折起，滿千免運！"
                  value={copyContent}
                  onChange={(e) => setCopyContent(e.target.value)}
                  id="task_copy_content"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section 3: Timeline and References */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
              三、設計時程與參考資料
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Deadline */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  設計截止日期 <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-md shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Calendar className="h-4.5 w-4.5 text-slate-400" />
                  </div>
                  <input
                    type="date"
                    required
                    className="block w-full pl-10 pr-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    id="task_deadline"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">※ 設計截止日不能早於今天。</p>
              </div>

              {/* Launch Date */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  預計上線日期 <span className="text-slate-400 font-normal">(選填)</span>
                </label>
                <div className="relative rounded-md shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Calendar className="h-4.5 w-4.5 text-slate-400" />
                  </div>
                  <input
                    type="date"
                    className="block w-full pl-10 pr-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                    value={launchDate}
                    onChange={(e) => setLaunchDate(e.target.value)}
                    id="task_launch_date"
                  />
                </div>
              </div>

              {/* Reference Style */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  參考風格敘述 <span className="text-slate-400 font-normal">(選填)</span>
                </label>
                <input
                  type="text"
                  className="block w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="例如：日系無印、霓虹炫彩、扁平化插圖"
                  value={referenceStyle}
                  onChange={(e) => setReferenceStyle(e.target.value)}
                  id="task_reference_style"
                />
              </div>

              {/* Reference Link */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  參考連結 / URL <span className="text-slate-400 font-normal">(選填)</span>
                </label>
                <div className="relative rounded-md shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Link2 className="h-4.5 w-4.5 text-slate-400" />
                  </div>
                  <input
                    type="url"
                    className="block w-full pl-10 pr-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder="https://example.com/reference-images"
                    value={referenceUrl}
                    onChange={(e) => setReferenceUrl(e.target.value)}
                    id="task_reference_url"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form actions footer */}
        <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => onNavigateToTab('all_tasks')}
            className="px-5 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-sm rounded-xl transition cursor-pointer"
            id="create_cancel_btn"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-xs hover:shadow-md transition duration-150 disabled:opacity-50 cursor-pointer"
            id="create_submit_btn"
          >
            {loading ? '正在建立...' : '送出申請工單'}
          </button>
        </div>
      </form>
    </div>
  );
}
