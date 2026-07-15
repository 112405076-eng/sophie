/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Profile, Notification } from '../types';
import { DB } from '../supabaseClient';
import { 
  LayoutDashboard, 
  Layers, 
  FolderHeart, 
  PlusCircle, 
  UserCog, 
  Bell, 
  LogOut, 
  Menu, 
  X,
  Palette,
  Briefcase
} from 'lucide-react';

interface NavbarProps {
  currentUser: Profile;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  unreadCount: number;
}

export default function Navbar({ currentUser, activeTab, setActiveTab, onLogout, unreadCount }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Close mobile sidebar on transition
  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setIsOpen(false);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'design_leader':
        return '設計組長 (Leader)';
      case 'designer':
        return '設計師 (Designer)';
      case 'account':
        return '業務代理 (Account)';
      default:
        return '使用者';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'design_leader':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'designer':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'account':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const menuItems = [
    { id: 'dashboard', label: '儀表板', icon: LayoutDashboard, roles: ['account', 'design_leader', 'designer'] },
    { id: 'all_tasks', label: '所有工單', icon: Layers, roles: ['account', 'design_leader', 'designer'] },
    { id: 'my_tasks', label: '我的工單', icon: FolderHeart, roles: ['account', 'design_leader', 'designer'] },
    { id: 'create_task', label: '新增工單', icon: PlusCircle, roles: ['account'] },
    { id: 'assign_tasks', label: '任務分派', icon: UserCog, roles: ['design_leader'] },
    { id: 'notifications', label: '通知中心', icon: Bell, roles: ['account', 'design_leader', 'designer'], badge: true },
  ];

  const allowedMenuItems = menuItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <>
      {/* Mobile Top Navbar */}
      <div className="md:hidden bg-white border-b border-slate-100 h-16 px-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md">
            <Palette className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-slate-900 tracking-tight">設計工單系統</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleNavClick('notifications')}
            className="p-1.5 hover:bg-slate-50 rounded-lg relative"
          >
            <Bell className="h-5 w-5 text-slate-500" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-600"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/30 z-40 md:hidden backdrop-blur-xs" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <div className={`fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:hidden flex flex-col justify-between ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div>
          <div className="h-16 border-b border-slate-100 px-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 bg-indigo-600 rounded-xl flex items-center justify-center">
                <Palette className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-slate-900">設計工單系統</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 rounded-lg hover:bg-slate-50 text-slate-400">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="px-4 py-4 border-b border-slate-100 bg-slate-50/50">
            <p className="text-xs font-semibold text-slate-400">登入身分</p>
            <p className="text-sm font-bold text-slate-800 mt-1">{currentUser.name}</p>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{currentUser.email}</p>
            <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border leading-none uppercase tracking-wide bg-white shadow-xs">
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500" />
              {getRoleLabel(currentUser.role)}
            </div>
          </div>

          <nav className="px-3 py-4 space-y-1">
            {allowedMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition duration-150 ${
                    isActive 
                      ? 'bg-indigo-50 text-indigo-700 shadow-xs' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={() => {
              onLogout();
              setIsOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-xl transition duration-150"
          >
            <LogOut className="h-4 w-4" />
            <span>登出系統</span>
          </button>
        </div>
      </div>

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-100 h-screen sticky top-0 flex-shrink-0" id="desktop_sidebar">
        {/* Logo and Brand */}
        <div className="h-20 px-6 flex items-center gap-3 border-b border-slate-100/80">
          <div className="h-10 w-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
            <Palette className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 tracking-tight leading-none text-base">設計工單系統</span>
            <span className="text-[10px] text-indigo-600 font-bold tracking-wider uppercase mt-1">Management MVP</span>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 mx-4 mt-6 rounded-2xl border border-slate-100 bg-slate-50/50 shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">目前使用者</p>
          <p className="text-sm font-bold text-slate-800 mt-1 truncate">{currentUser.name}</p>
          <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">{currentUser.email}</p>
          <div className="mt-3">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${getRoleColor(currentUser.role)}`}>
              {currentUser.role === 'account' && <Briefcase className="h-3 w-3 mr-1" />}
              {currentUser.role === 'design_leader' && <UserCog className="h-3 w-3 mr-1" />}
              {currentUser.role === 'designer' && <Palette className="h-3 w-3 mr-1" />}
              {getRoleLabel(currentUser.role)}
            </span>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-4 mt-6 space-y-1.5 overflow-y-auto">
          {allowedMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition duration-150 ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
                id={`nav_btn_${item.id}`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && unreadCount > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${isActive ? 'bg-white text-indigo-600' : 'bg-red-500 text-white'}`}>
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition duration-150"
            id="nav_btn_logout"
          >
            <LogOut className="h-4 w-4" />
            <span>登出系統</span>
          </button>
        </div>
      </aside>
    </>
  );
}
