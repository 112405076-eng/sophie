/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';
import { Task, Profile, Comment, Attachment, Notification, TaskHistory, UserRole, TaskStatus, TaskPriority } from './types';

// Supabase environment variables (user can declare these in .env)
const rawSupabaseUrl = ((import.meta as any).env.VITE_SUPABASE_URL || '').trim();
const rawSupabaseAnonKey = ((import.meta as any).env.VITE_SUPABASE_ANON_KEY || '').trim();

// Sanitize Supabase URL: ensure it starts with http/https, and use only the origin
// (e.g. extracts "https://xxxx.supabase.co" from "https://xxxx.supabase.co/rest/v1/")
export let supabaseUrl = '';
if (rawSupabaseUrl) {
  try {
    let urlToParse = rawSupabaseUrl;
    if (!/^https?:\/\//i.test(urlToParse)) {
      urlToParse = 'https://' + urlToParse;
    }
    const parsed = new URL(urlToParse);
    supabaseUrl = parsed.origin;
  } catch (e) {
    // Fallback if URL parsing fails
    supabaseUrl = rawSupabaseUrl.replace(/\/+$/, '');
  }
}

export const supabaseAnonKey = rawSupabaseAnonKey;
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Real Supabase client instance (only initialized if variables are present)
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ==========================================
// SEED DATA FOR DEMO MODE
// ==========================================

const SEED_PROFILES: Profile[] = [
  { id: 'acc-1', name: '林宜君 (Account A)', email: 'account.a@example.com', role: 'account', department: '業務一部', created_at: '2026-07-01T00:00:00Z', updated_at: '2026-07-01T00:00:00Z' },
  { id: 'acc-2', name: '陳俊宇 (Account B)', email: 'account.b@example.com', role: 'account', department: '業務二部', created_at: '2026-07-01T00:00:00Z', updated_at: '2026-07-01T00:00:00Z' },
  { id: 'leader-1', name: '張大衛 (Leader)', email: 'leader@example.com', role: 'design_leader', department: '設計部', created_at: '2026-07-01T00:00:00Z', updated_at: '2026-07-01T00:00:00Z' },
  { id: 'designer-1', name: '王小明 (Designer A)', email: 'designer.a@example.com', role: 'designer', department: '設計一部', created_at: '2026-07-01T00:00:00Z', updated_at: '2026-07-01T00:00:00Z' },
  { id: 'designer-2', name: '李佳玲 (Designer B)', email: 'designer.b@example.com', role: 'designer', department: '設計二部', created_at: '2026-07-01T00:00:00Z', updated_at: '2026-07-01T00:00:00Z' },
  { id: 'designer-3', name: '張雅婷 (Designer C)', email: 'designer.c@example.com', role: 'designer', department: '設計三部', created_at: '2026-07-01T00:00:00Z', updated_at: '2026-07-01T00:00:00Z' },
];

const SEED_TASKS: Task[] = [
  {
    id: 'task-1',
    task_number: 'T-20260715-001',
    title: '夏季新品 IG 圖文設計',
    project_name: '2026夏季服飾新品發表',
    description: '需要製作一組包含 3 張圖的 Instagram 輪播貼文，主打「清涼、棉麻、防曬」特性。調性需要簡約偏日系風格。',
    copy_content: '首圖：盛夏，給肌膚呼吸的空間。\n第二張：嚴選 100% 有機棉麻，涼爽透氣。\n第三張：限時新品 85 折優惠，點選資訊欄看更多！',
    platform: 'Instagram',
    size: '1080 x 1080 px',
    reference_style: '簡約日系、大量白、自然採光背景',
    reference_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f',
    launch_date: '2026-07-22',
    deadline: '2026-07-20',
    priority: '重要',
    status: '待分派',
    requester_id: 'acc-1',
    assignee_id: null,
    created_at: '2026-07-14T09:00:00Z',
    updated_at: '2026-07-14T09:00:00Z',
    completed_at: null,
  },
  {
    id: 'task-2',
    task_number: 'T-20260715-002',
    title: 'Facebook 粉絲專頁橫幅 Banner',
    project_name: '品牌形象升級專案',
    description: '製作新一季官方粉絲專頁 Banner。視覺主體需包含品牌 Logo 及最新的 Slogan 標語。',
    copy_content: 'Slogan: 「串連美好，設計你我的生活。」\n小字：Design your lifestyle.',
    platform: 'Facebook',
    size: '820 x 312 px',
    reference_style: '高質感、科技感、暖色系背景',
    reference_url: '',
    launch_date: '2026-07-17',
    deadline: '2026-07-16', // Upcoming (tomorrow relative to 2026-07-15)
    priority: '緊急',
    status: '已分派',
    requester_id: 'acc-1',
    assignee_id: 'designer-1',
    created_at: '2026-07-13T10:30:00Z',
    updated_at: '2026-07-13T14:00:00Z',
    completed_at: null,
  },
  {
    id: 'task-3',
    task_number: 'T-20260715-003',
    title: 'Threads 趣味梗圖製作',
    project_name: '社群日常互動',
    description: '需要跟風最近網路上流行的上班梗，並結合公司產品「人體工學椅」做趣味情境圖。',
    copy_content: '上班前 vs 上班後（搭配有坐人體工學椅跟沒坐的對比）。',
    platform: 'Threads',
    size: '1200 x 900 px',
    reference_style: '手繪、簡單插畫或搞笑迷因感',
    reference_url: '',
    launch_date: '2026-07-25',
    deadline: '2026-07-22',
    priority: '一般',
    status: '製作中',
    requester_id: 'acc-2',
    assignee_id: 'designer-2',
    created_at: '2026-07-14T11:00:00Z',
    updated_at: '2026-07-14T15:30:00Z',
    completed_at: null,
  },
  {
    id: 'task-4',
    task_number: 'T-20260715-004',
    title: 'LINE 官方帳號歡迎圖與圖文選單',
    project_name: 'LINE 行銷整合規劃',
    description: '新客戶加入 LINE 官方帳號時會自動傳送的「歡迎圖」及常駐於底部的「圖文選單」（六格版型）。',
    copy_content: '歡迎圖：感謝加入！領取專屬 $100 折價券。\n選單格子：最新消息、會員綁定、聯絡客服、熱銷排行、常見問答、實體門市。',
    platform: 'LINE',
    size: '1200 x 810 px (選單), 1040 x 1040 px (歡迎圖)',
    reference_style: '色彩亮眼、格線分明、扁平化 ICON 視覺',
    reference_url: 'https://line.me/tw/',
    launch_date: '2026-07-15',
    deadline: '2026-07-14', // Overdue (deadline is past relative to 2026-07-15)
    priority: '重要',
    status: '待確認',
    requester_id: 'acc-2',
    assignee_id: 'designer-3',
    created_at: '2026-07-10T09:00:00Z',
    updated_at: '2026-07-13T16:00:00Z',
    completed_at: null,
  },
  {
    id: 'task-5',
    task_number: 'T-20260715-005',
    title: '官網年中慶活動主視覺 (KV)',
    project_name: '2026年中慶全站大促',
    description: '電商官網年中慶典活動的 Key Visual (KV)。畫面要有強烈的促銷、熱烈氛圍，字體要放大。',
    copy_content: '標題：年中驚喜大放送，全館 5 折起！\n副標：滿 2000 免運，再送百元折價券。',
    platform: '官網',
    size: '1920 x 700 px (首頁輪播圖)',
    reference_style: '霓虹炫彩風格、立體 3D 球體元素、帶有未來科技感',
    reference_url: '',
    launch_date: '2026-07-20',
    deadline: '2026-07-18',
    priority: '緊急',
    status: '修改中',
    requester_id: 'acc-1',
    assignee_id: 'designer-1',
    created_at: '2026-07-12T08:30:00Z',
    updated_at: '2026-07-14T17:00:00Z',
    completed_at: null,
  },
  {
    id: 'task-6',
    task_number: 'T-20260715-006',
    title: 'YouTube 影片縮圖設計 - 10大穿搭技巧',
    project_name: 'YouTube影音自媒體經營',
    description: '針對下一期美妝服飾 YouTube 影片的主題設計高點閱率縮圖。主角去背照、大字標題。',
    copy_content: '縮圖大字：「夏天這樣穿，秒變大長腿！」\n副標：視覺增高5公分',
    platform: 'YouTube',
    size: '1280 x 720 px',
    reference_style: '黃黑對比高飽和、字體加黑邊、重點處畫紅圈箭頭',
    reference_url: '',
    launch_date: '2026-07-12',
    deadline: '2026-07-10',
    priority: '一般',
    status: '已完成',
    requester_id: 'acc-2',
    assignee_id: 'designer-2',
    created_at: '2026-07-08T10:00:00Z',
    updated_at: '2026-07-09T16:00:00Z',
    completed_at: '2026-07-09T16:00:00Z',
  },
  {
    id: 'task-7',
    task_number: 'T-20260715-007',
    title: '實體展覽易拉寶 X 展架輸出',
    project_name: '台北夏季文創大展',
    description: '實體展位所使用的大型宣傳易拉寶 X 展架，畫面要清晰、放上官方 QR Code 供人掃描。',
    copy_content: '主標：解鎖全新設計美學。\n小字：現場填寫問卷，即可獲得品牌環保袋！',
    platform: '實體輸出',
    size: '90 x 200 cm (高解析度 300dpi)',
    reference_style: '清新極簡、幾何色塊拼接、暖白基底',
    reference_url: '',
    launch_date: '2026-07-28',
    deadline: '2026-07-25',
    priority: '重要',
    status: '待分派',
    requester_id: 'acc-1',
    assignee_id: null,
    created_at: '2026-07-14T16:30:00Z',
    updated_at: '2026-07-14T16:30:00Z',
    completed_at: null,
  },
  {
    id: 'task-8',
    task_number: 'T-20260715-008',
    title: '官網會員招募 Pop-up 插圖',
    project_name: '會員系統重構推廣',
    description: '在官網彈出的新會員註冊引導視窗中使用的插圖，需帶有親切、禮物、信件的意象。',
    copy_content: '註冊即享首購禮！',
    platform: '官網',
    size: '600 x 400 px',
    reference_style: '美式雙色插畫、流暢線條、帶有一點復古暖色調',
    reference_url: '',
    launch_date: '2026-07-25',
    deadline: '2026-07-21',
    priority: '一般',
    status: '製作中',
    requester_id: 'acc-2',
    assignee_id: 'designer-1',
    created_at: '2026-07-13T11:00:00Z',
    updated_at: '2026-07-14T11:00:00Z',
    completed_at: null,
  },
  {
    id: 'task-9',
    task_number: 'T-20260715-009',
    title: 'FB 廣告促銷貼文插圖',
    project_name: '2026年中慶全站大促',
    description: '用於 FB Ads 投放的單圖點擊廣告，主體要突出折扣，適合在手機端滑動時一眼被吸引。',
    copy_content: '全站限時 5 折！輸入折扣碼【SUMMER50】再現折 $50。',
    platform: 'Facebook',
    size: '1200 x 628 px',
    reference_style: '亮黃色為主色、大膽的手寫風字體、放射線背景',
    reference_url: '',
    launch_date: '2026-07-18',
    deadline: '2026-07-16', // Upcoming (tomorrow relative to 2026-07-15)
    priority: '緊急',
    status: '待確認',
    requester_id: 'acc-1',
    assignee_id: 'designer-2',
    created_at: '2026-07-12T14:00:00Z',
    updated_at: '2026-07-14T18:00:00Z',
    completed_at: null,
  },
  {
    id: 'task-10',
    task_number: 'T-20260715-010',
    title: 'Threads 品牌形象圖設計',
    project_name: '社群日常互動',
    description: '設計一組極簡線條插圖，呈現貓咪在辦公桌上看著電腦的逗趣畫面，用於 Threads 形象互動。',
    copy_content: '「今天的你，也是這隻貓嗎？」\n小字：Meow, it is Wednesday...',
    platform: 'Threads',
    size: '1080 x 1080 px',
    reference_style: '黑白黑線條極簡風、帶有小清新邊框',
    reference_url: '',
    launch_date: '2026-07-09',
    deadline: '2026-07-08',
    priority: '一般',
    status: '已完成',
    requester_id: 'acc-2',
    assignee_id: 'designer-3',
    created_at: '2026-07-05T09:00:00Z',
    updated_at: '2026-07-08T15:00:00Z',
    completed_at: '2026-07-08T15:00:00Z',
  }
];

const SEED_COMMENTS: Comment[] = [
  {
    id: 'c-1',
    task_id: 'task-4',
    user_id: 'designer-3',
    content: '已將圖文選單與歡迎圖的初稿一併上傳了，再請 Account 確認版型與文字是否有誤！',
    created_at: '2026-07-13T15:00:00Z',
    updated_at: '2026-07-13T15:00:00Z',
  },
  {
    id: 'c-2',
    task_id: 'task-4',
    user_id: 'acc-2',
    content: '收到！感謝雅婷，初稿看起來非常亮眼，我現在立刻發給客戶確認，一有消息會馬上通知妳。',
    created_at: '2026-07-13T16:00:00Z',
    updated_at: '2026-07-13T16:00:00Z',
  },
  {
    id: 'c-3',
    task_id: 'task-5',
    user_id: 'acc-1',
    content: '客戶回覆：希望主視覺的「5 折起」字體能再放大一些，霓虹效果可以更誇張一點。麻煩小明微調！',
    created_at: '2026-07-14T15:00:00Z',
    updated_at: '2026-07-14T15:00:00Z',
  },
  {
    id: 'c-4',
    task_id: 'task-5',
    user_id: 'designer-1',
    content: '好的，沒問題！下午會將「5 折起」字體放大 1.2 倍，並增強霓虹光暈對比，預計五點前重新上傳修改版本。',
    created_at: '2026-07-14T15:45:00Z',
    updated_at: '2026-07-14T15:45:00Z',
  }
];

const SEED_ATTACHMENTS: Attachment[] = [
  {
    id: 'att-1',
    task_id: 'task-4',
    uploaded_by: 'designer-3',
    file_name: 'LINE_Welcome_Draft_v1.png',
    file_path: 'drafts/LINE_Welcome_Draft_v1.png',
    file_url: 'https://images.unsplash.com/photo-1542744094-3a31f103e35f',
    file_type: 'image/png',
    file_size: 1542000,
    category: 'draft',
    created_at: '2026-07-13T14:50:00Z',
  },
  {
    id: 'att-2',
    task_id: 'task-4',
    uploaded_by: 'designer-3',
    file_name: 'LINE_Menu_6Grid_v1.png',
    file_path: 'drafts/LINE_Menu_6Grid_v1.png',
    file_url: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3',
    file_type: 'image/png',
    file_size: 2120000,
    category: 'draft',
    created_at: '2026-07-13T14:52:00Z',
  },
  {
    id: 'att-3',
    task_id: 'task-5',
    uploaded_by: 'designer-1',
    file_name: 'KV_Homepage_Summer_Draft_v1.png',
    file_path: 'drafts/KV_Homepage_Summer_Draft_v1.png',
    file_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f',
    file_type: 'image/png',
    file_size: 3450000,
    category: 'draft',
    created_at: '2026-07-14T12:00:00Z',
  }
];

const SEED_NOTIFICATIONS: Notification[] = [
  {
    id: 'n-1',
    user_id: 'leader-1',
    task_id: 'task-1',
    type: 'new_task',
    message: '林宜君 建立了一筆新工單「夏季新品 IG 圖文設計」，等待指派設計師。',
    is_read: false,
    created_at: '2026-07-14T09:00:00Z',
  },
  {
    id: 'n-2',
    user_id: 'designer-1',
    task_id: 'task-2',
    type: 'assigned',
    message: '設計 Leader 張大衛 已將工單「Facebook 粉絲專頁橫幅 Banner」指派給您。',
    is_read: false,
    created_at: '2026-07-13T14:00:00Z',
  },
  {
    id: 'n-3',
    user_id: 'acc-2',
    task_id: 'task-4',
    type: 'draft_submitted',
    message: '張雅婷 已經為工單「LINE 官方帳號歡迎圖與圖文選單」上傳了初稿，請確認。',
    is_read: false,
    created_at: '2026-07-13T14:55:00Z',
  },
  {
    id: 'n-4',
    user_id: 'designer-1',
    task_id: 'task-5',
    type: 'revision_requested',
    message: '林宜君 為工單「官網年中慶活動主視覺 (KV)」提出了修改需求。',
    is_read: false,
    created_at: '2026-07-14T15:05:00Z',
  }
];

const SEED_HISTORY: TaskHistory[] = [
  {
    id: 'h-1',
    task_id: 'task-4',
    changed_by: 'acc-2',
    action: '建立工單',
    previous_value: '',
    new_value: '狀態：待分派',
    created_at: '2026-07-10T09:00:00Z',
  },
  {
    id: 'h-2',
    task_id: 'task-4',
    changed_by: 'leader-1',
    action: '指派設計師',
    previous_value: '無',
    new_value: '負責人：張雅婷，狀態：已分派',
    created_at: '2026-07-11T10:00:00Z',
  },
  {
    id: 'h-3',
    task_id: 'task-4',
    changed_by: 'designer-3',
    action: '開始製作',
    previous_value: '已分派',
    new_value: '製作中',
    created_at: '2026-07-12T09:30:00Z',
  },
  {
    id: 'h-4',
    task_id: 'task-4',
    changed_by: 'designer-3',
    action: '提交確認',
    previous_value: '製作中',
    new_value: '狀態：待確認 (已上傳 LINE_Welcome_Draft_v1.png 等檔案)',
    created_at: '2026-07-13T14:55:00Z',
  }
];

// Clear mock data if running in Supabase mode and we haven't cleared yet
if (isSupabaseConfigured && !localStorage.getItem('supabase_initialized_clear_v1')) {
  localStorage.removeItem('db_profiles');
  localStorage.removeItem('db_tasks');
  localStorage.removeItem('db_comments');
  localStorage.removeItem('db_attachments');
  localStorage.removeItem('db_notifications');
  localStorage.removeItem('db_history');
  localStorage.setItem('supabase_initialized_clear_v1', 'true');
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ==========================================
// DB OPERATIONS MANAGER (LOCALSTORAGE / SUPABASE)
// ==========================================

export class DB {
  private static getStored<T>(key: string, initial: T[]): T[] {
    const val = localStorage.getItem(key);
    if (!val) {
      const defaultValue = isSupabaseConfigured ? [] : initial;
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    try {
      return JSON.parse(val);
    } catch {
      const defaultValue = isSupabaseConfigured ? [] : initial;
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
  }

  private static setStored<T>(key: string, data: T[]) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // Active Session simulation
  static getCurrentUser(): Profile {
    const session = localStorage.getItem('active_session_user');
    if (!session) {
      if (isSupabaseConfigured) {
        return null as any;
      }
      // Default to Design Leader張大衛 for convenient initial demo testing
      const defaultUser = SEED_PROFILES.find(p => p.role === 'design_leader') || SEED_PROFILES[0];
      localStorage.setItem('active_session_user', JSON.stringify(defaultUser));
      return defaultUser;
    }
    try {
      return JSON.parse(session);
    } catch {
      return isSupabaseConfigured ? null as any : SEED_PROFILES[2];
    }
  }

  static setCurrentUser(user: Profile) {
    localStorage.setItem('active_session_user', JSON.stringify(user));
    window.dispatchEvent(new Event('storage'));
  }

  // PROFILES
  static getProfiles(): Profile[] {
    return this.getStored<Profile>('db_profiles', SEED_PROFILES);
  }

  static setProfiles(profiles: Profile[]): void {
    this.setStored('db_profiles', profiles);
  }

  // Sync Supabase data to localStorage
  static async syncWithSupabase(): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const [
        { data: profilesData, error: profilesErr },
        { data: tasksData, error: tasksErr },
        { data: commentsData, error: commentsErr },
        { data: attachmentsData, error: attachmentsErr },
        { data: notificationsData, error: notificationsErr },
        { data: historyData, error: historyErr }
      ] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('tasks').select('*'),
        supabase.from('comments').select('*'),
        supabase.from('attachments').select('*'),
        supabase.from('notifications').select('*'),
        supabase.from('task_history').select('*')
      ]);

      if (!profilesErr && profilesData) {
        this.setStored('db_profiles', profilesData);
      }
      if (!tasksErr && tasksData) {
        this.setStored('db_tasks', tasksData);
      }
      if (!commentsErr && commentsData) {
        this.setStored('db_comments', commentsData);
      }
      if (!attachmentsErr && attachmentsData) {
        this.setStored('db_attachments', attachmentsData);
      }
      if (!notificationsErr && notificationsData) {
        this.setStored('db_notifications', notificationsData);
      }
      if (!historyErr && historyData) {
        this.setStored('db_history', historyData);
      }
    } catch (e) {
      console.error("Error syncing with Supabase:", e);
    }
  }

  static async testSupabaseConnection(): Promise<{
    success: boolean;
    message: string;
    details?: {
      url: string;
      hasUrl: boolean;
      hasAnonKey: boolean;
      authConnected: boolean;
      tables: {
        profiles: boolean;
        tasks: boolean;
        comments: boolean;
        attachments: boolean;
        notifications: boolean;
        task_history: boolean;
      }
    }
  }> {
    const hasUrl = !!supabaseUrl;
    const hasAnonKey = !!supabaseAnonKey;
    const details = {
      url: supabaseUrl,
      hasUrl,
      hasAnonKey,
      authConnected: false,
      tables: {
        profiles: false,
        tasks: false,
        comments: false,
        attachments: false,
        notifications: false,
        task_history: false,
      }
    };

    if (!isSupabaseConfigured || !supabase) {
      return { success: false, message: '未設定 Supabase 環境變數', details };
    }

    try {
      // 1. Check Auth connection
      const { data: authData, error: authError } = await supabase.auth.getSession();
      if (authError) {
        return { success: false, message: `Auth 連線失敗：${authError.message}`, details };
      }
      details.authConnected = true;

      // 2. Query each table with limit 1 to see if it exists and is readable
      // Profiles
      const { error: profErr } = await supabase.from('profiles').select('id').limit(1);
      details.tables.profiles = !profErr || (profErr.code !== '42P01' && profErr.code !== 'PGRST116');

      // Tasks
      const { error: taskErr } = await supabase.from('tasks').select('id').limit(1);
      details.tables.tasks = !taskErr || taskErr.code !== '42P01';

      // Comments
      const { error: commErr } = await supabase.from('comments').select('id').limit(1);
      details.tables.comments = !commErr || commErr.code !== '42P01';

      // Attachments
      const { error: attErr } = await supabase.from('attachments').select('id').limit(1);
      details.tables.attachments = !attErr || attErr.code !== '42P01';

      // Notifications
      const { error: notiErr } = await supabase.from('notifications').select('id').limit(1);
      details.tables.notifications = !notiErr || notiErr.code !== '42P01';

      // Task History
      const { error: histErr } = await supabase.from('task_history').select('id').limit(1);
      details.tables.task_history = !histErr || histErr.code !== '42P01';

      const allTablesExist = Object.values(details.tables).every(v => v);
      if (allTablesExist) {
        return { success: true, message: 'Supabase 連線成功且所有資料庫表皆已建置！', details };
      } else {
        return { success: true, message: 'Supabase 已成功連線，但部分資料表尚未建立或權限不足，請執行初始化 SQL。', details };
      }
    } catch (err: any) {
      return { success: false, message: `診斷過程中發生錯誤：${err.message || err}`, details };
    }
  }

  // TASKS
  static getTasks(): Task[] {
    return this.getStored<Task>('db_tasks', SEED_TASKS);
  }

  static getTaskById(id: string): Task | undefined {
    return this.getTasks().find(t => t.id === id);
  }

  static createTask(taskInput: Omit<Task, 'id' | 'task_number' | 'status' | 'created_at' | 'updated_at' | 'completed_at' | 'assignee_id' | 'requester_id'>, requesterId: string): Task {
    const tasks = this.getTasks();
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `T-${todayStr}`;
    
    // Generate a unique task number by verifying against local list
    let seqNum = tasks.length + 1;
    let taskNumber = `${prefix}-${String(seqNum).padStart(3, '0')}`;
    while (tasks.some(t => t.task_number === taskNumber)) {
      seqNum++;
      taskNumber = `${prefix}-${String(seqNum).padStart(3, '0')}`;
    }

    const newTask: Task = {
      ...taskInput,
      id: generateUUID(),
      task_number: taskNumber,
      requester_id: requesterId,
      status: '待分派',
      assignee_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      completed_at: null,
    };

    tasks.unshift(newTask);
    this.setStored('db_tasks', tasks);

    // Save history and notifications in local storage first (bypass immediate parallel Supabase insert)
    this.addHistory(newTask.id, requesterId, '建立工單', '', '狀態：待分派', true);

    const profiles = this.getProfiles();
    const leaders = profiles.filter(p => p.role === 'design_leader');
    const requester = profiles.find(p => p.id === requesterId);
    leaders.forEach(leader => {
      this.addNotification(
        leader.id,
        newTask.id,
        'new_task',
        `${requester?.name || 'Account'} 建立了一筆新工單「${newTask.title}」，等待指派設計師。`,
        true
      );
    });

    // Handle Supabase insert sequentially
    if (isSupabaseConfigured && supabase) {
      supabase.from('tasks').insert({
        id: newTask.id,
        task_number: newTask.task_number,
        title: newTask.title,
        project_name: newTask.project_name,
        description: newTask.description,
        copy_content: newTask.copy_content,
        platform: newTask.platform,
        custom_platform: newTask.custom_platform || null,
        size: newTask.size,
        reference_style: newTask.reference_style,
        reference_url: newTask.reference_url,
        launch_date: newTask.launch_date || null,
        deadline: newTask.deadline,
        priority: newTask.priority,
        status: newTask.status,
        requester_id: newTask.requester_id,
        assignee_id: newTask.assignee_id,
        created_at: newTask.created_at,
        updated_at: newTask.updated_at,
        completed_at: newTask.completed_at
      }).then(({ error }) => {
        if (error) {
          console.error("Error inserting task to Supabase:", error.message || error);
          return;
        }

        // 1. Parent insert was successful! Now it is safe to insert child records.
        // Insert history record in Supabase
        const historyId = generateUUID();
        supabase.from('task_history').insert({
          id: historyId,
          task_id: newTask.id,
          changed_by: requesterId,
          action: '建立工單',
          previous_value: '',
          new_value: '狀態：待分派',
          created_at: newTask.created_at
        }).then(({ error: hErr }) => {
          if (hErr) console.error("Error adding history in Supabase:", hErr.message || hErr);
        });

        // 2. Insert notifications in Supabase
        leaders.forEach(leader => {
          const notificationId = generateUUID();
          supabase.from('notifications').insert({
            id: notificationId,
            user_id: leader.id,
            task_id: newTask.id,
            type: 'new_task',
            message: `${requester?.name || 'Account'} 建立了一筆新工單「${newTask.title}」，等待指派設計師。`,
            is_read: false,
            created_at: new Date().toISOString()
          }).then(({ error: nErr }) => {
            if (nErr) console.error("Error adding notification in Supabase:", nErr.message || nErr);
          });
        });
      });
    }

    return newTask;
  }

  static updateTaskStatus(taskId: string, status: TaskStatus, userId: string): Task | null {
    const tasks = this.getTasks();
    const index = tasks.findIndex(t => t.id === taskId);
    if (index === -1) return null;

    const oldTask = tasks[index];
    const prevStatus = oldTask.status;

    if (prevStatus === status) return oldTask;

    const updatedTask: Task = {
      ...oldTask,
      status,
      updated_at: new Date().toISOString(),
      completed_at: status === '已完成' ? new Date().toISOString() : oldTask.completed_at
    };

    tasks[index] = updatedTask;
    this.setStored('db_tasks', tasks);

    if (isSupabaseConfigured && supabase) {
      supabase.from('tasks').update({
        status,
        updated_at: updatedTask.updated_at,
        completed_at: updatedTask.completed_at
      }).eq('id', taskId).then(({ error }) => {
        if (error) console.error("Error updating task status to Supabase:", error);
      });
    }

    // History Record
    this.addHistory(taskId, userId, '修改狀態', `原狀態：${prevStatus}`, `新狀態：${status}`);

    // Trigger Notifications based on workflow transition
    const profiles = this.getProfiles();
    const actor = profiles.find(p => p.id === userId);
    const actorName = actor?.name || '使用者';

    if (status === '製作中' && prevStatus === '已分派') {
      // Designer starts work, notifications can be added if leader wants to track
    } else if (status === '待確認') {
      // Designer submitted draft -> Notify requester
      if (oldTask.requester_id) {
        this.addNotification(
          oldTask.requester_id,
          taskId,
          'draft_submitted',
          `${actorName} 已經將工單「${oldTask.title}」標記為「待確認」，請查看並確認初稿。`
        );
      }
    } else if (status === '修改中') {
      // Account requested revision -> Notify designer
      if (oldTask.assignee_id) {
        this.addNotification(
          oldTask.assignee_id,
          taskId,
          'revision_requested',
          `${actorName} 針對工單「${oldTask.title}」提出了修改需求，請查看修改意見並更新。`
        );
      }
    } else if (status === '已完成') {
      // Account approved -> Notify designer and leaders
      if (oldTask.assignee_id) {
        this.addNotification(
          oldTask.assignee_id,
          taskId,
          'completed',
          `${actorName} 已確認完稿！工單「${oldTask.title}」已正式結案。`
        );
      }
      // Notify leader
      const leaders = profiles.filter(p => p.role === 'design_leader');
      leaders.forEach(l => {
        if (l.id !== userId) {
          this.addNotification(
            l.id,
            taskId,
            'completed',
            `${actorName} 已確認完稿，工單「${oldTask.title}」已結案。`
          );
        }
      });
    }

    return updatedTask;
  }

  static assignTask(taskId: string, assigneeId: string | null, leaderId: string): Task | null {
    const tasks = this.getTasks();
    const index = tasks.findIndex(t => t.id === taskId);
    if (index === -1) return null;

    const oldTask = tasks[index];
    const prevAssigneeId = oldTask.assignee_id;
    const profiles = this.getProfiles();

    const nextAssignee = assigneeId ? profiles.find(p => p.id === assigneeId) : null;
    const prevAssignee = prevAssigneeId ? profiles.find(p => p.id === prevAssigneeId) : null;

    const newStatus: TaskStatus = assigneeId ? '已分派' : '待分派';

    const updatedTask: Task = {
      ...oldTask,
      assignee_id: assigneeId,
      status: oldTask.status === '待分派' && assigneeId ? '已分派' : (assigneeId ? oldTask.status : '待分派'),
      updated_at: new Date().toISOString(),
    };

    tasks[index] = updatedTask;
    this.setStored('db_tasks', tasks);

    if (isSupabaseConfigured && supabase) {
      supabase.from('tasks').update({
        assignee_id: updatedTask.assignee_id,
        status: updatedTask.status,
        updated_at: updatedTask.updated_at
      }).eq('id', taskId).then(({ error }) => {
        if (error) console.error("Error assigning task in Supabase:", error);
      });
    }

    // History record
    const prevName = prevAssignee ? prevAssignee.name : '無';
    const nextName = nextAssignee ? nextAssignee.name : '未指派';
    this.addHistory(
      taskId,
      leaderId,
      assigneeId ? (prevAssigneeId ? '更換設計師' : '指派設計師') : '撤銷指派',
      `原負責人：${prevName}`,
      `新負責人：${nextName}，狀態：${updatedTask.status}`
    );

    // Notifications
    if (assigneeId) {
      this.addNotification(
        assigneeId,
        taskId,
        'assigned',
        `設計 Leader 張大衛 已將工單「${oldTask.title}」指派給您，截止日期為 ${oldTask.deadline}。`
      );
    }

    return updatedTask;
  }

  static updateTaskPriority(taskId: string, priority: TaskPriority, leaderId: string): Task | null {
    const tasks = this.getTasks();
    const index = tasks.findIndex(t => t.id === taskId);
    if (index === -1) return null;

    const oldTask = tasks[index];
    const prevPriority = oldTask.priority;

    if (prevPriority === priority) return oldTask;

    const updatedTask: Task = {
      ...oldTask,
      priority,
      updated_at: new Date().toISOString(),
    };

    tasks[index] = updatedTask;
    this.setStored('db_tasks', tasks);

    if (isSupabaseConfigured && supabase) {
      supabase.from('tasks').update({
        priority,
        updated_at: updatedTask.updated_at
      }).eq('id', taskId).then(({ error }) => {
        if (error) console.error("Error updating priority in Supabase:", error);
      });
    }

    // History record
    this.addHistory(taskId, leaderId, '調整優先程度', `原程度：${prevPriority}`, `新程度：${priority}`);

    // Notify designer if assigned
    if (oldTask.assignee_id) {
      this.addNotification(
        oldTask.assignee_id,
        taskId,
        'priority_updated',
        `設計 Leader 張大衛 將工單「${oldTask.title}」的優先程度調整為【${priority}】。`
      );
    }

    return updatedTask;
  }

  // COMMENTS
  static getComments(taskId: string): Comment[] {
    const comments = this.getStored<Comment>('db_comments', SEED_COMMENTS);
    const profiles = this.getProfiles();
    return comments
      .filter(c => c.task_id === taskId)
      .map(c => {
        const u = profiles.find(p => p.id === c.user_id);
        return {
          ...c,
          user_name: u ? u.name : '未知使用者',
          user_role: u ? u.role : 'account',
        };
      })
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  static addComment(taskId: string, content: string, userId: string): Comment {
    const comments = this.getStored<Comment>('db_comments', SEED_COMMENTS);
    const profiles = this.getProfiles();
    const author = profiles.find(p => p.id === userId);

    const newComment: Comment = {
      id: generateUUID(),
      task_id: taskId,
      user_id: userId,
      content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    comments.push(newComment);
    this.setStored('db_comments', comments);

    if (isSupabaseConfigured && supabase) {
      supabase.from('comments').insert({
        id: newComment.id,
        task_id: newComment.task_id,
        user_id: newComment.user_id,
        content: newComment.content,
        created_at: newComment.created_at,
        updated_at: newComment.updated_at
      }).then(({ error }) => {
        if (error) console.error("Error adding comment in Supabase:", error);
      });
    }

    // Notify other parties involved in the task
    const task = this.getTaskById(taskId);
    if (task) {
      const parties = new Set<string>();
      if (task.requester_id && task.requester_id !== userId) parties.add(task.requester_id);
      if (task.assignee_id && task.assignee_id !== userId) parties.add(task.assignee_id);
      
      // Also notify design leaders if they aren't the commenter
      const leaders = profiles.filter(p => p.role === 'design_leader');
      leaders.forEach(l => {
        if (l.id !== userId) parties.add(l.id);
      });

      parties.forEach(targetUserId => {
        this.addNotification(
          targetUserId,
          taskId,
          'new_comment',
          `${author?.name || '團隊成員'} 在工單「${task.title}」發表了新留言：「${content.slice(0, 30)}${content.length > 30 ? '...' : ''}」`
        );
      });
    }

    return {
      ...newComment,
      user_name: author ? author.name : '未知使用者',
      user_role: author ? author.role : 'account',
    };
  }

  // ATTACHMENTS
  static getAttachments(taskId: string): Attachment[] {
    const attachments = this.getStored<Attachment>('db_attachments', SEED_ATTACHMENTS);
    const profiles = this.getProfiles();
    return attachments
      .filter(a => a.task_id === taskId)
      .map(a => {
        const u = profiles.find(p => p.id === a.uploaded_by);
        return {
          ...a,
          uploader_name: u ? u.name : '未知使用者',
          uploader_role: u ? u.role : 'account',
        };
      })
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  static addAttachment(taskId: string, attachmentInput: { file_name: string; file_url: string; file_size: number; file_type: string; category: Attachment['category'] }, userId: string): Attachment {
    const attachments = this.getStored<Attachment>('db_attachments', SEED_ATTACHMENTS);
    const profiles = this.getProfiles();
    const author = profiles.find(p => p.id === userId);

    const newAttachment: Attachment = {
      id: generateUUID(),
      task_id: taskId,
      uploaded_by: userId,
      file_name: attachmentInput.file_name,
      file_path: `uploads/${attachmentInput.file_name}`,
      file_url: attachmentInput.file_url,
      file_type: attachmentInput.file_type,
      file_size: attachmentInput.file_size,
      category: attachmentInput.category,
      created_at: new Date().toISOString(),
    };

    attachments.push(newAttachment);
    this.setStored('db_attachments', attachments);

    if (isSupabaseConfigured && supabase) {
      supabase.from('attachments').insert({
        id: newAttachment.id,
        task_id: newAttachment.task_id,
        uploaded_by: newAttachment.uploaded_by,
        file_name: newAttachment.file_name,
        file_path: newAttachment.file_path,
        file_url: newAttachment.file_url,
        file_type: newAttachment.file_type,
        file_size: newAttachment.file_size,
        category: newAttachment.category,
        created_at: newAttachment.created_at
      }).then(({ error }) => {
        if (error) console.error("Error adding attachment in Supabase:", error);
      });
    }

    // History record
    const categoryLabels: Record<string, string> = {
      reference: '參考資料',
      draft: '初稿檔案',
      final: '完稿檔案',
      other: '其他附件'
    };
    this.addHistory(
      taskId,
      userId,
      `上傳附件`,
      '',
      `上傳了 ${categoryLabels[attachmentInput.category] || '附件'}：${attachmentInput.file_name}`
    );

    // Notify involved parties
    const task = this.getTaskById(taskId);
    if (task) {
      const targets = new Set<string>();
      if (task.requester_id && task.requester_id !== userId) targets.add(task.requester_id);
      if (task.assignee_id && task.assignee_id !== userId) targets.add(task.assignee_id);
      
      const leaders = profiles.filter(p => p.role === 'design_leader');
      leaders.forEach(l => {
        if (l.id !== userId) targets.add(l.id);
      });

      targets.forEach(targetId => {
        this.addNotification(
          targetId,
          taskId,
          'attachment_added',
          `${author?.name || '團隊成員'} 在工單「${task.title}」上傳了新的 ${categoryLabels[attachmentInput.category] || '檔案'}：${attachmentInput.file_name}`
        );
      });
    }

    return {
      ...newAttachment,
      uploader_name: author ? author.name : '未知使用者',
      uploader_role: author ? author.role : 'account',
    };
  }

  // NOTIFICATIONS
  static getNotifications(userId: string): Notification[] {
    const notifications = this.getStored<Notification>('db_notifications', SEED_NOTIFICATIONS);
    return notifications
      .filter(n => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  static addNotification(userId: string, taskId: string, type: string, message: string, skipSupabase = false): Notification {
    const notifications = this.getStored<Notification>('db_notifications', SEED_NOTIFICATIONS);
    const newNotification: Notification = {
      id: generateUUID(),
      user_id: userId,
      task_id: taskId,
      type,
      message,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    notifications.push(newNotification);
    this.setStored('db_notifications', notifications);

    if (!skipSupabase && isSupabaseConfigured && supabase) {
      supabase.from('notifications').insert({
        id: newNotification.id,
        user_id: newNotification.user_id,
        task_id: newNotification.task_id,
        type: newNotification.type,
        message: newNotification.message,
        is_read: newNotification.is_read,
        created_at: newNotification.created_at
      }).then(({ error }) => {
        if (error) console.error("Error adding notification in Supabase:", error);
      });
    }
    
    // Dispatch customized event to inform React UI about notification update
    window.dispatchEvent(new CustomEvent('new-notification', { detail: newNotification }));
    return newNotification;
  }

  static markNotificationRead(notificationId: string): void {
    const notifications = this.getStored<Notification>('db_notifications', SEED_NOTIFICATIONS);
    const index = notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      notifications[index].is_read = true;
      this.setStored('db_notifications', notifications);

      if (isSupabaseConfigured && supabase) {
        supabase.from('notifications').update({
          is_read: true
        }).eq('id', notificationId).then(({ error }) => {
          if (error) console.error("Error marking notification read in Supabase:", error);
        });
      }
    }
  }

  static markAllNotificationsRead(userId: string): void {
    const notifications = this.getStored<Notification>('db_notifications', SEED_NOTIFICATIONS);
    const updated = notifications.map(n => {
      if (n.user_id === userId) {
        return { ...n, is_read: true };
      }
      return n;
    });
    this.setStored('db_notifications', updated);

    if (isSupabaseConfigured && supabase) {
      supabase.from('notifications').update({
        is_read: true
      }).eq('user_id', userId).then(({ error }) => {
        if (error) console.error("Error marking all notifications read in Supabase:", error);
      });
    }
  }

  // TASK HISTORY
  static getTaskHistory(taskId: string): TaskHistory[] {
    const history = this.getStored<TaskHistory>('db_history', SEED_HISTORY);
    const profiles = this.getProfiles();
    return history
      .filter(h => h.task_id === taskId)
      .map(h => {
        const u = profiles.find(p => p.id === h.changed_by);
        return {
          ...h,
          user_name: u ? u.name : '系統成員',
          user_role: u ? u.role : 'account',
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  private static addHistory(taskId: string, userId: string, action: string, previousValue: string, newValue: string, skipSupabase = false): void {
    const history = this.getStored<TaskHistory>('db_history', SEED_HISTORY);
    const newHistory: TaskHistory = {
      id: generateUUID(),
      task_id: taskId,
      changed_by: userId,
      action,
      previous_value: previousValue,
      new_value: newValue,
      created_at: new Date().toISOString(),
    };
    history.push(newHistory);
    this.setStored('db_history', history);

    if (!skipSupabase && isSupabaseConfigured && supabase) {
      supabase.from('task_history').insert({
        id: newHistory.id,
        task_id: newHistory.task_id,
        changed_by: newHistory.changed_by,
        action: newHistory.action,
        previous_value: newHistory.previous_value,
        new_value: newHistory.new_value,
        created_at: newHistory.created_at
      }).then(({ error }) => {
        if (error) console.error("Error adding history in Supabase:", error);
      });
    }
  }

  // DESIGNER STATS & WORKLOAD
  static getDesignerWorkloads() {
    const tasks = this.getTasks();
    const profiles = this.getProfiles();
    const designers = profiles.filter(p => p.role === 'designer' || p.role === 'design_leader');

    const today = new Date();

    return designers.map(designer => {
      const designerTasks = tasks.filter(t => t.assignee_id === designer.id);
      
      const inProgress = designerTasks.filter(t => t.status === '製作中' || t.status === '已分派' || t.status === '修改中').length;
      
      // Calculate upcoming and overdue
      let upcoming = 0;
      let overdue = 0;

      designerTasks.forEach(t => {
        if (t.status !== '已完成') {
          const deadlineDate = new Date(t.deadline);
          const diffTime = deadlineDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays < 0) {
            overdue++;
          } else if (diffDays <= 1) {
            upcoming++;
          }
        }
      });

      return {
        designerId: designer.id,
        designerName: designer.name,
        designerEmail: designer.email,
        inProgress,
        upcoming,
        overdue,
        totalAssigned: designerTasks.length
      };
    });
  }
}
