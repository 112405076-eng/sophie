/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { Notification, Profile, Task } from '../types';
import { DB } from '../supabaseClient';
import { 
  Bell, 
  CheckCheck, 
  MessageSquare, 
  FolderPlus, 
  UserCheck, 
  AlertCircle,
  FileCheck2,
  CalendarDays,
  ArrowRight
} from 'lucide-react';

interface NotificationsProps {
  currentUser: Profile;
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onRefreshNotifications: () => void;
}

export default function Notifications({ currentUser, tasks, onSelectTask, onRefreshNotifications }: NotificationsProps) {
  // Load notifications belonging strictly to me
  const notificationsList = useMemo(() => {
    return DB.getNotifications(currentUser.id);
  }, [currentUser.id, tasks]);

  // Handle click to read & select task
  const handleNotificationClick = (notification: Notification) => {
    DB.markNotificationRead(notification.id);
    onRefreshNotifications();

    // Find respective task and open details
    const targetTask = tasks.find(t => t.id === notification.task_id);
    if (targetTask) {
      onSelectTask(targetTask);
    }
  };

  // Mark all notifications read
  const handleMarkAllRead = () => {
    DB.markAllNotificationsRead(currentUser.id);
    onRefreshNotifications();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_task':
        return (
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
            <FolderPlus className="h-4.5 w-4.5" />
          </div>
        );
      case 'assigned':
        return (
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <UserCheck className="h-4.5 w-4.5" />
          </div>
        );
      case 'new_comment':
        return (
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <MessageSquare className="h-4.5 w-4.5" />
          </div>
        );
      case 'draft_submitted':
        return (
          <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
            <CalendarDays className="h-4.5 w-4.5" />
          </div>
        );
      case 'revision_requested':
        return (
          <div className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
            <AlertCircle className="h-4.5 w-4.5" />
          </div>
        );
      case 'completed':
        return (
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <FileCheck2 className="h-4.5 w-4.5" />
          </div>
        );
      default:
        return (
          <div className="p-2 bg-slate-50 text-slate-500 rounded-xl border border-slate-100">
            <Bell className="h-4.5 w-4.5" />
          </div>
        );
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-16 font-sans space-y-6" id="notifications_container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">系統通知中心</h1>
          <p className="text-sm text-slate-500 mt-1">追蹤與您參與的工單流程異動與團隊溝通留言</p>
        </div>

        {notificationsList.filter(n => !n.is_read).length > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold rounded-xl transition duration-150 cursor-pointer"
            id="mark_all_read_btn"
          >
            <CheckCheck className="h-4 w-4" />
            <span>全部標記為已讀</span>
          </button>
        )}
      </div>

      {/* Notifications Queue */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
        {notificationsList.length === 0 ? (
          <div className="py-16 text-center">
            <div className="h-12 w-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <Bell className="h-5 w-5" />
            </div>
            <p className="text-sm font-bold text-slate-700">目前沒有任何系統通知</p>
            <p className="text-xs text-slate-400 mt-1">當工單狀態變更、留言或被指派新工作時，您會在此收到提醒！</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100" id="notifications_queue">
            {notificationsList.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 sm:p-5 flex items-start gap-4 hover:bg-indigo-50/5 cursor-pointer transition relative ${
                  !notification.is_read ? 'bg-indigo-50/15' : 'bg-white'
                }`}
                id={`notification_item_${notification.id}`}
              >
                {/* Unread Indicator Bar */}
                {!notification.is_read && (
                  <span className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-r" />
                )}

                {/* State Icon */}
                <div className="flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Notification body */}
                <div className="flex-1 min-w-0 pr-4">
                  <p className={`text-xs sm:text-sm leading-relaxed text-slate-700 ${!notification.is_read ? 'font-bold' : 'font-medium'}`}>
                    {notification.message}
                  </p>
                  
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400 font-medium">
                    <span className="font-mono">
                      {new Date(notification.created_at).toLocaleString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span>•</span>
                    <span className="hover:underline font-semibold text-indigo-600 inline-flex items-center gap-0.5">
                      點擊查看對應工單 <ArrowRight className="h-2.5 w-2.5" />
                    </span>
                  </div>
                </div>

                {/* Mark read button (if unread) */}
                {!notification.is_read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // prevent selectTask navigate
                      DB.markNotificationRead(notification.id);
                      onRefreshNotifications();
                    }}
                    className="flex-shrink-0 p-1 bg-slate-50 border border-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                    title="標記為已讀"
                  >
                    <CheckCheck className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
