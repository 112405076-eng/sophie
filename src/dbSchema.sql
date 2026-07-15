-- =========================================================================
-- 設計工單管理網頁系統 - Supabase PostgreSQL Schema & SQL Migration
-- =========================================================================

-- 1. 建立必要 ENUM 與型別
CREATE TYPE user_role AS ENUM ('account', 'design_leader', 'designer');
CREATE TYPE task_priority AS ENUM ('一般', '重要', '緊急');
CREATE TYPE task_status AS ENUM ('待分派', '已分派', '製作中', '待確認', '修改中', '已完成');
CREATE TYPE attachment_category AS ENUM ('reference', 'draft', 'final', 'other');

-- 2. 建立 profiles (使用者資料表，並與 auth.users 連動)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'account',
    department TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. 建立 tasks (設計工單資料表)
CREATE TABLE public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- 建立索引以優化篩選效能
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_requester_id ON public.tasks(requester_id);
CREATE INDEX idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX idx_tasks_deadline ON public.tasks(deadline);

-- 4. 建立 comments (留言資料表)
CREATE TABLE public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX idx_comments_task_id ON public.comments(task_id);

-- 5. 建立 attachments (附件與作品集檔案資料表)
CREATE TABLE public.attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    uploaded_by UUID REFERENCES public.profiles(id) NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    category attachment_category NOT NULL DEFAULT 'other',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX idx_attachments_task_id ON public.attachments(task_id);

-- 6. 建立 notifications (通知中心資料表)
CREATE TABLE public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);

-- 7. 建立 task_history (工單異動軌跡)
CREATE TABLE public.task_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    changed_by UUID REFERENCES public.profiles(id) NOT NULL,
    action TEXT NOT NULL,
    previous_value TEXT,
    new_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX idx_history_task_id ON public.task_history(task_id);

-- =========================================================================
-- 自動化觸發器 (TRIGGERS)
-- =========================================================================

-- 定期更新 updated_at 輔助函數
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 為 profiles, tasks, comments 建立更新觸發器
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_comments_updated_at
BEFORE UPDATE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- =========================================================================
-- 安全性政策 (ROW LEVEL SECURITY - RLS)
-- =========================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_history ENABLE ROW LEVEL SECURITY;

-- 1. Profiles 政策
CREATE POLICY "允許登入使用者查看所有個人檔案" ON public.profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "允許使用者修改自己的個人檔案" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "允許使用者新增自己的個人檔案" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Tasks 工單政策
CREATE POLICY "設計 Leader 可以查看及管理所有工單" ON public.tasks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'design_leader'
        )
    );

CREATE POLICY "Account 只能查看自己建立的工單" ON public.tasks
    FOR SELECT USING (
        requester_id = auth.uid()
    );

CREATE POLICY "Account 可以新增與更新自己建立的工單" ON public.tasks
    FOR INSERT WITH CHECK (
        requester_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'account'
        )
    );

CREATE POLICY "Account 可以修改自己建立的工單" ON public.tasks
    FOR UPDATE USING (
        requester_id = auth.uid()
    );

CREATE POLICY "設計師可以查看指派給自己的工單" ON public.tasks
    FOR SELECT USING (
        assignee_id = auth.uid()
    );

CREATE POLICY "設計師可以更新指派給自己的工單進度" ON public.tasks
    FOR UPDATE USING (
        assignee_id = auth.uid()
    );

-- 3. Comments 留言政策
CREATE POLICY "使用者可以查看有權限工單的留言" ON public.comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tasks t
            WHERE t.id = task_id AND (
                t.requester_id = auth.uid() OR 
                t.assignee_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.profiles p 
                    WHERE p.id = auth.uid() AND p.role = 'design_leader'
                )
            )
        )
    );

CREATE POLICY "使用者可以在其有權限工單下發表留言" ON public.comments
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.tasks t
            WHERE t.id = task_id AND (
                t.requester_id = auth.uid() OR 
                t.assignee_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.profiles p 
                    WHERE p.id = auth.uid() AND p.role = 'design_leader'
                )
            )
        )
    );

-- 4. Attachments 附件政策
CREATE POLICY "使用者可以下載/查看有權限工單的附件" ON public.attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tasks t
            WHERE t.id = task_id AND (
                t.requester_id = auth.uid() OR 
                t.assignee_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.profiles p 
                    WHERE p.id = auth.uid() AND p.role = 'design_leader'
                )
            )
        )
    );

CREATE POLICY "使用者可以上傳附件到有權限的工單" ON public.attachments
    FOR INSERT WITH CHECK (
        auth.uid() = uploaded_by AND
        EXISTS (
            SELECT 1 FROM public.tasks t
            WHERE t.id = task_id AND (
                t.requester_id = auth.uid() OR 
                t.assignee_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.profiles p 
                    WHERE p.id = auth.uid() AND p.role = 'design_leader'
                )
            )
        )
    );

-- 5. Notifications 通知政策
CREATE POLICY "使用者只能查看自己的通知" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "使用者可以修改自己的通知已讀狀態" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "允許登入使用者新增通知" ON public.notifications
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 6. Task History 軌跡政策
CREATE POLICY "使用者可以查看有權限工單的變更紀錄" ON public.task_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tasks t
            WHERE t.id = task_id AND (
                t.requester_id = auth.uid() OR 
                t.assignee_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.profiles p 
                    WHERE p.id = auth.uid() AND p.role = 'design_leader'
                )
            )
        )
    );

CREATE POLICY "系統連動寫入工單變更紀錄" ON public.task_history
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
    );


-- =========================================================================
-- STORAGE BUCKETS CONFIGURATION (Supabase Storage)
-- =========================================================================

-- 請在 Supabase 後台創立名為 "task-attachments" 的 Public Storage Bucket。
-- 以下為 Storage 的 RLS 安全性設定 SQL (可於 Supabase SQL 執行)：

-- 1. 允許使用者下載/查看檔案
-- CREATE POLICY "允許登入會員查看工單附件檔案" ON storage.objects
--     FOR SELECT USING (bucket_id = 'task-attachments' AND auth.role() = 'authenticated');

-- 2. 允許使用者上傳檔案
-- CREATE POLICY "允許登入會員上傳工單附件檔案" ON storage.objects
--     FOR INSERT WITH CHECK (bucket_id = 'task-attachments' AND auth.role() = 'authenticated');


-- =========================================================================
-- DEMO SEED DATA (測試帳號與測試工單)
-- =========================================================================

-- 說明：請先在 Supabase Auth 註冊以下 6 位使用者的 Email。
-- 取得 UUID 後，將其對應填入下方 profiles 與 tasks 資料表中。

-- [測試帳號列表]
-- 1. 林宜君 (Account A): account.a@example.com
-- 2. 陳俊宇 (Account B): account.b@example.com
-- 3. 張大衛 (Leader): leader@example.com
-- 4. 王小明 (Designer A): designer.a@example.com
-- 5. 李佳玲 (Designer B): designer.b@example.com
-- 6. 張雅婷 (Designer C): designer.c@example.com
