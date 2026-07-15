/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DB, supabase, isSupabaseConfigured } from '../supabaseClient';
import { Profile } from '../types';
import { 
  Shield, Mail, Lock, UserCheck, Sparkles, CheckCircle2, 
  Database, AlertTriangle, Check, RefreshCw, X, Copy, ChevronDown, ChevronUp 
} from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: Profile) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Registration states
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerName, setRegisterName] = useState('');
  const [registerRole, setRegisterRole] = useState<'account' | 'design_leader' | 'designer'>('account');

  // Supabase Connection Diagnostics state
  const [diagResult, setDiagResult] = useState<any>(null);
  const [testingDiag, setTestingDiag] = useState(false);
  const [showSql, setShowSql] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showDiagPanel, setShowDiagPanel] = useState(false);

  useEffect(() => {
    if (isSupabaseConfigured) {
      runDiagnostics();
    }
  }, []);

  const runDiagnostics = async () => {
    setTestingDiag(true);
    try {
      const result = await DB.testSupabaseConnection();
      setDiagResult(result);
    } catch (e) {
      console.error(e);
    } finally {
      setTestingDiag(false);
    }
  };

  const handleCopySql = () => {
    const sqlText = `CREATE TYPE user_role AS ENUM ('account', 'design_leader', 'designer');
CREATE TYPE task_priority AS ENUM ('一般', '重要', '緊急');
CREATE TYPE task_status AS ENUM ('待分派', '已分派', '製作中', '待確認', '修改中', '已完成');
CREATE TYPE attachment_category AS ENUM ('reference', 'draft', 'final', 'other');

CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'account',
    department TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE public.tasks (
    id TEXT PRIMARY KEY,
    task_number TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    project_name TEXT,
    description TEXT NOT NULL,
    copy_content TEXT,
    platform TEXT NOT NULL,
    custom_platform TEXT,
    size TEXT NOT NULL,
    reference_style TEXT,
    reference_url TEXT,
    launch_date DATE,
    deadline DATE NOT NULL,
    priority task_priority NOT NULL DEFAULT '一般',
    status task_status NOT NULL DEFAULT '待分派',
    requester_id UUID REFERENCES public.profiles(id) NOT NULL,
    assignee_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE public.comments (
    id TEXT PRIMARY KEY,
    task_id TEXT REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE public.attachments (
    id TEXT PRIMARY KEY,
    task_id TEXT REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    uploaded_by UUID REFERENCES public.profiles(id) NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    category attachment_category NOT NULL DEFAULT 'other',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE public.notifications (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    task_id TEXT REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE public.task_history (
    id TEXT PRIMARY KEY,
    task_id TEXT REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    changed_by UUID REFERENCES public.profiles(id) NOT NULL,
    action TEXT NOT NULL,
    previous_value TEXT,
    new_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow auth read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow auth insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow auth update profiles" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow auth read tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Allow auth insert tasks" ON public.tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow auth update tasks" ON public.tasks FOR UPDATE USING (true);

CREATE POLICY "Allow auth read comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Allow auth insert comments" ON public.comments FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow auth read attachments" ON public.attachments FOR SELECT USING (true);
CREATE POLICY "Allow auth insert attachments" ON public.attachments FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow auth read notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Allow auth update notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Allow auth read task_history" ON public.task_history FOR SELECT USING (true);
CREATE POLICY "Allow auth insert task_history" ON public.task_history FOR INSERT WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, department)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'account'),
    COALESCE(new.raw_user_meta_data->>'department', '業務部')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`;

    navigator.clipboard.writeText(sqlText);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !registerName) {
      setError('請填寫所有欄位');
      return;
    }
    if (password.length < 6) {
      setError('密碼長度至少需要 6 個字元');
      return;
    }

    setLoading(true);
    setError('');

    const targetEmail = email.trim();

    if (isSupabaseConfigured && supabase) {
      try {
        // Sign up with Supabase Auth
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: targetEmail,
          password: password,
          options: {
            data: {
              name: registerName,
              role: registerRole,
              department: registerRole === 'account' ? '業務部' : '設計組',
            }
          }
        });

        if (signUpError) {
          setError(`註冊失敗：${signUpError.message}`);
          setLoading(false);
          return;
        }

        if (data.user) {
          const newProfile: Profile = {
            id: data.user.id,
            name: registerName,
            email: targetEmail,
            role: registerRole,
            department: registerRole === 'account' ? '業務部' : '設計組',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          // Try to insert the profile directly
          const { error: insErr } = await supabase
            .from('profiles')
            .insert([newProfile]);

          if (insErr) {
            console.warn("Direct profiles insertion failed (might already exist or was blocked, attempting update instead):", insErr);
            // Attempt update to set role and details in case trigger already inserted it with default role
            const { error: updErr } = await supabase
              .from('profiles')
              .update({ 
                name: registerName, 
                role: registerRole, 
                department: registerRole === 'account' ? '業務部' : '設計組' 
              })
              .eq('id', data.user.id);
            if (updErr) {
              console.error("Failed to update profile to selected role:", updErr);
            }
          }

          // Register in localStorage's profile list so local caching is synchronized
          const localProfiles = DB.getProfiles();
          if (!localProfiles.some(p => p.id === newProfile.id)) {
            localProfiles.push(newProfile);
            DB.setProfiles(localProfiles);
          }

          DB.setCurrentUser(newProfile);
          onLoginSuccess(newProfile);
        }
      } catch (err: any) {
        setError(`註冊過程發生異常：${err.message || err}`);
      } finally {
        setLoading(false);
      }
    } else {
      // Local offline register
      setTimeout(() => {
        const localProfiles = DB.getProfiles();
        if (localProfiles.some(p => p.email.toLowerCase() === targetEmail.toLowerCase())) {
          setError('此電子信箱已被註冊！');
          setLoading(false);
          return;
        }

        const newProfile: Profile = {
          id: 'local_' + Math.random().toString(36).substr(2, 9),
          name: registerName,
          email: targetEmail,
          role: registerRole,
          department: registerRole === 'account' ? '業務部' : '設計組',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        localProfiles.push(newProfile);
        DB.setProfiles(localProfiles);

        DB.setCurrentUser(newProfile);
        onLoginSuccess(newProfile);
        setLoading(false);
      }, 400);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('請輸入電子信箱與密碼');
      return;
    }

    setLoading(true);
    setError('');

    const targetEmail = email.trim();

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: targetEmail,
          password: password,
        });

        if (authError) {
          setError(`登入失敗（Supabase Auth 拒絕）：${authError.message}`);
          setLoading(false);
          return;
        }

        if (data.user) {
          // Attempt to fetch profile row from database
          let profile: Profile | null = null;
          try {
            const { data: profData, error: profErr } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .single();

            if (profErr || !profData) {
              console.warn("Profiles table is empty or unreadable. Auto-registering profile locally & attempting insert...");
              
              const defaultProfile: Profile = {
                id: data.user.id,
                name: data.user.email?.split('@')[0] || '新使用者',
                email: data.user.email || targetEmail,
                role: (data.user.user_metadata?.role as any) || 'account',
                department: data.user.user_metadata?.department || '業務部',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };

              // Try inserting into profiles table (handles missing row)
              const { data: insData, error: insErr } = await supabase
                .from('profiles')
                .insert([defaultProfile])
                .select()
                .single();

              if (!insErr && insData) {
                profile = insData as Profile;
              } else {
                profile = defaultProfile;
              }
            } else {
              profile = profData as Profile;

              // Sync database profile with auth user metadata if they differ and metadata is present
              const metaRole = data.user.user_metadata?.role;
              const metaName = data.user.user_metadata?.name;
              const metaDept = data.user.user_metadata?.department;

              if (metaRole && (profile.role !== metaRole || (metaName && profile.name !== metaName))) {
                console.log("Syncing database profile with auth user metadata...", { metaRole, metaName, metaDept });
                const { data: updatedProf, error: syncErr } = await supabase
                  .from('profiles')
                  .update({
                    name: metaName || profile.name,
                    role: metaRole,
                    department: metaDept || profile.department
                  })
                  .eq('id', data.user.id)
                  .select()
                  .single();

                if (!syncErr && updatedProf) {
                  profile = updatedProf as Profile;
                } else if (syncErr) {
                  console.error("Failed to sync profile role with database:", syncErr);
                }
              }
            }
          } catch (e) {
            console.error("Error reading database profiles table:", e);
            // Graceful fallback to avoid locking out the developer
            profile = {
              id: data.user.id,
              name: data.user.email?.split('@')[0] || '新使用者',
              email: data.user.email || targetEmail,
              role: 'account',
              department: '業務部',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
          }

          // Register in localStorage's profile list so other parts of the app can find this user
          const localProfiles = DB.getProfiles();
          if (!localProfiles.some(p => p.id === profile.id)) {
            localProfiles.push(profile);
            DB.setProfiles(localProfiles);
          }

          DB.setCurrentUser(profile);
          onLoginSuccess(profile);
        }
      } catch (err: any) {
        setError(`Supabase 連線異常：${err.message || err}`);
      } finally {
        setLoading(false);
      }
    } else {
      // Offline local sandbox mock login
      setTimeout(() => {
        const profiles = DB.getProfiles();
        const user = profiles.find(p => p.email.toLowerCase() === targetEmail.toLowerCase());

        if (user) {
          DB.setCurrentUser(user);
          onLoginSuccess(user);
        } else {
          setError('帳號或密碼錯誤。您的信箱目前不在 Demo 離線測試帳號列表中，請使用下方的「快速測試帳號」登入體驗，或設定 Supabase 環境變數以啟用真實資料庫！');
        }
        setLoading(false);
      }, 400);
    }
  };

  const handleQuickLogin = (user: Profile) => {
    setLoading(true);
    setTimeout(() => {
      DB.setCurrentUser(user);
      onLoginSuccess(user);
      setLoading(false);
    }, 200);
  };

  const seedProfiles = DB.getProfiles();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans" id="login_container">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <Shield className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900">
          設計工單管理系統
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          縮短團隊溝通時間，集中管理設計需求
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Supabase Connection Status Badge */}
        <div className="mb-4 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`h-2.5 w-2.5 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
              <div>
                <p className="text-xs font-bold text-slate-700">
                  {isSupabaseConfigured ? '已偵測到 Supabase 連線參數' : '離線示範模式 (LocalStorage)'}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {isSupabaseConfigured ? '連線：啟用中 (可執行 Auth 登入)' : '在 settings 中設定環境變數即可串接雲端'}
                </p>
              </div>
            </div>
            {isSupabaseConfigured && (
              <button
                type="button"
                onClick={() => {
                  setShowDiagPanel(!showDiagPanel);
                  if (!showDiagPanel) runDiagnostics();
                }}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-lg transition"
              >
                <Database className="h-3 w-3" />
                連線診斷 {showDiagPanel ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            )}
          </div>

          {/* Expanded Diagnostic Panel */}
          {showDiagPanel && isSupabaseConfigured && (
            <div className="mt-4 pt-3 border-t border-slate-100 space-y-3 animate-fade-in text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">連線診斷狀態：</span>
                <button
                  type="button"
                  onClick={runDiagnostics}
                  disabled={testingDiag}
                  className="text-[10px] text-slate-500 hover:text-indigo-600 flex items-center gap-1 font-semibold"
                >
                  <RefreshCw className={`h-3 w-3 ${testingDiag ? 'animate-spin' : ''}`} />
                  重新檢測
                </button>
              </div>

              {diagResult ? (
                <div className="space-y-2 bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                  <div className="flex items-center justify-between">
                    <span>1. Auth 驗證系統：</span>
                    {diagResult.details?.authConnected ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-0.5"><Check className="h-3.5 w-3.5" /> 正常連線</span>
                    ) : (
                      <span className="text-red-500 font-bold flex items-center gap-0.5"><X className="h-3.5 w-3.5" /> 連線異常</span>
                    )}
                  </div>
                  
                  <div className="pt-1.5 border-t border-slate-200">
                    <p className="font-semibold text-slate-700 mb-1">2. 資料庫結構表狀態：</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] font-mono">
                      <div className="flex items-center justify-between">
                        <span>• profiles:</span>
                        {diagResult.details?.tables.profiles ? (
                          <span className="text-emerald-600 font-semibold">✔ 已建置</span>
                        ) : (
                          <span className="text-red-500 font-bold">✘ 缺失</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span>• tasks:</span>
                        {diagResult.details?.tables.tasks ? (
                          <span className="text-emerald-600 font-semibold">✔ 已建置</span>
                        ) : (
                          <span className="text-red-500 font-bold">✘ 缺失</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span>• comments:</span>
                        {diagResult.details?.tables.comments ? (
                          <span className="text-emerald-600 font-semibold">✔ 已建置</span>
                        ) : (
                          <span className="text-red-500 font-bold">✘ 缺失</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span>• attachments:</span>
                        {diagResult.details?.tables.attachments ? (
                          <span className="text-emerald-600 font-semibold">✔ 已建置</span>
                        ) : (
                          <span className="text-red-500 font-bold">✘ 缺失</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span>• notifications:</span>
                        {diagResult.details?.tables.notifications ? (
                          <span className="text-emerald-600 font-semibold">✔ 已建置</span>
                        ) : (
                          <span className="text-red-500 font-bold">✘ 缺失</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span>• task_history:</span>
                        {diagResult.details?.tables.task_history ? (
                          <span className="text-emerald-600 font-semibold">✔ 已建置</span>
                        ) : (
                          <span className="text-red-500 font-bold">✘ 缺失</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 text-[10px] text-slate-400">
                    診斷資訊：{diagResult.message}
                  </div>
                </div>
              ) : (
                <div className="text-center py-2 text-slate-400">正在執行診斷...</div>
              )}

              {/* Show SQL button */}
              <div className="pt-2 border-t border-slate-100 flex gap-2">
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="flex-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 transition text-[11px]"
                >
                  <Copy className="h-3 w-3" />
                  {copiedSql ? '已複製 SQL 腳本！' : '複製初始化 SQL 腳本'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSql(!showSql)}
                  className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition text-[11px]"
                >
                  {showSql ? '隱藏 SQL' : '查看 SQL'}
                </button>
              </div>

              {showSql && (
                <div className="mt-2 bg-slate-900 text-slate-300 p-2.5 rounded-xl font-mono text-[9px] overflow-x-auto max-h-40 border border-slate-800 shadow-inner">
                  <pre>{`-- 執行此 SQL 即可完成 profiles 與其它資料表的建立與 RLS 設定：
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'account',
  department TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 自動建立 profiles 觸發器（支援註冊時自訂身分與部門）
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, department)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'account'),
    COALESCE(new.raw_user_meta_data->>'department', '業務部')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`}</pre>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white py-8 px-4 shadow-sm rounded-2xl border border-slate-100 sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600 flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                <span className="font-semibold text-red-700">錯誤提示</span>
              </div>
              <p className="text-xs text-red-600 leading-relaxed font-sans">{error}</p>
            </div>
          )}

          {!isRegistering ? (
            <form className="space-y-5" onSubmit={handleLogin} id="login_form">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  電子信箱 (Email)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  密碼
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-155 ease-in-out disabled:opacity-50"
                  id="login_submit_btn"
                >
                  {loading ? '登入中...' : '帳號密碼登入'}
                </button>
              </div>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(true);
                    setError('');
                  }}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                >
                  尚未擁有帳號？點此註冊
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-5" onSubmit={handleRegister} id="register_form">
              <div className="text-center pb-2">
                <h3 className="text-lg font-bold text-slate-800">註冊新帳號</h3>
                <p className="text-xs text-slate-400 mt-1">建立帳號並自動建立您的專屬 Profile 資料</p>
              </div>

              <div>
                <label htmlFor="reg-name" className="block text-sm font-medium text-slate-700">
                  姓名 (Name)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserCheck className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="reg-name"
                    name="name"
                    type="text"
                    required
                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="請輸入您的真實姓名"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-email" className="block text-sm font-medium text-slate-700">
                  電子信箱 (Email)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="reg-email"
                    name="email"
                    type="email"
                    required
                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-password" className="block text-sm font-medium text-slate-700">
                  密碼 (至少 6 個字元)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="reg-password"
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-role" className="block text-sm font-medium text-slate-700">
                  申請身分
                </label>
                <div className="mt-1">
                  <select
                    id="reg-role"
                    name="role"
                    value={registerRole}
                    onChange={(e) => setRegisterRole(e.target.value as 'account' | 'design_leader' | 'designer')}
                    className="block w-full px-3 py-2 border border-slate-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  >
                    <option value="account">業務端 Account (發起工單需求)</option>
                    <option value="design_leader">設計組長 Leader (分配/審核需求)</option>
                    <option value="designer">設計執行端 Designer (製作/上傳成品)</option>
                  </select>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-medium leading-relaxed">
                  {registerRole === 'account' && '※ 隸屬 業務部。可建立、追蹤與確認需求。'}
                  {registerRole === 'design_leader' && '※ 隸屬 設計組。可分派工單、指派給設計師。'}
                  {registerRole === 'designer' && '※ 隸屬 設計組。可查看被指派的工單、提交工作成果、上傳附檔與回覆留言。'}
                </p>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-155 ease-in-out disabled:opacity-50"
                  id="register_submit_btn"
                >
                  {loading ? '註冊中...' : '註冊新帳號'}
                </button>
              </div>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(false);
                    setError('');
                  }}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                >
                  已經有帳號？立即登入
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-slate-400">
        <div className="flex items-center justify-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span>本系統支援標準 RLS policy，前端與後端安全權限相互對應。</span>
        </div>
      </div>
    </div>
  );
}
