/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'account' | 'design_leader' | 'designer';

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  created_at: string;
  updated_at: string;
}

export type TaskPriority = '一般' | '重要' | '緊急';

export type TaskStatus = '待分派' | '已分派' | '製作中' | '待確認' | '修改中' | '已完成';

export interface Task {
  id: string;
  task_number: string;
  title: string;
  project_name: string;
  description: string;
  copy_content: string;
  platform: string;
  custom_platform?: string;
  size: string;
  reference_style: string;
  reference_url: string;
  launch_date: string;
  deadline: string;
  priority: TaskPriority;
  status: TaskStatus;
  requester_id: string;
  assignee_id: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  // Joined field
  user_name?: string;
  user_role?: UserRole;
}

export type AttachmentCategory = 'reference' | 'draft' | 'final' | 'other';

export interface Attachment {
  id: string;
  task_id: string;
  uploaded_by: string;
  file_name: string;
  file_path: string;
  file_url: string;
  file_type: string;
  file_size: number;
  category: AttachmentCategory;
  created_at: string;
  // Joined field
  uploader_name?: string;
  uploader_role?: UserRole;
}

export interface Notification {
  id: string;
  user_id: string;
  task_id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface TaskHistory {
  id: string;
  task_id: string;
  changed_by: string;
  action: string;
  previous_value: string;
  new_value: string;
  created_at: string;
  // Joined field
  user_name?: string;
  user_role?: UserRole;
}
