export type UserRole = 'admin' | 'pm' | 'developer';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export type Permission =
  // User permissions
  | 'user:create'
  | 'user:deactivate'
  | 'user:update_role'
  | 'user:update_password'
  | 'user:list_all'
  // Project permissions
  | 'project:view_all'
  | 'project:create'
  | 'project:delete'
  | 'project:edit_spec'
  | 'project:manage_spec_versions'
  // Task permissions
  | 'task:create'
  | 'task:delete'
  | 'task:edit_metadata' // description, priority, deadline, assignee
  | 'task:move_any'
  | 'task:move_own'
  | 'task:add_comment'
  | 'task:toggle_checklist'
  | 'task:attach_file'
  | 'task:ask_spec_question'
  | 'task:answer_spec_question'
  | 'task:close_spec_question';

export type TaskStatus = 'todo' | 'doing' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  completedBy?: string;
  completedAt?: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface TaskAttachment {
  id: string;
  taskId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  deadline?: string;
  assigneeId?: string;
  createdById: string;
  checklist: ChecklistItem[];
  comments: TaskComment[];
  attachments: TaskAttachment[];
  createdAt: string;
  updatedAt: string;
}

export type SpecContentType = 'text' | 'link' | 'file';

export interface SpecVersion {
  id: string;
  versionNumber: number;
  type: SpecContentType;
  content: string;
  title: string;
  changelog?: string;
  createdBy: string;
  createdAt: string;
}

export interface SpecQuestion {
  id: string;
  projectId: string;
  taskId?: string;
  question: string;
  askedBy: string;
  askedAt: string;
  answer?: string;
  answeredBy?: string;
  answeredAt?: string;
  status: 'open' | 'resolved';
}

export interface ProjectSpec {
  currentVersionId: string;
  versions: SpecVersion[];
  questions: SpecQuestion[];
}

export type DocumentCategory = 'tz' | 'invoice' | 'avr' | 'contract' | 'other';
export type DocumentStatus = 'draft' | 'pending' | 'signed' | 'paid' | 'approved';

export interface ProjectDocument {
  id: string;
  projectId: string;
  title: string;
  category: DocumentCategory;
  amount?: string;
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  status: DocumentStatus;
  uploadedBy: string;
  uploadedAt: string;
  notes?: string;
}

export interface Project {
  id: string;
  name: string;
  key: string;
  description: string;
  memberIds: string[];
  spec: ProjectSpec;
  documents?: ProjectDocument[];
  isArchived?: boolean;
  deadline?: string;
  color?: string;
  statusBadge?: string;
  updatedAtText?: string;
  completedTasksCount?: number;
  totalTasksCount?: number;
  createdAt: string;
  updatedAt: string;
}

export type TargetType = 'project' | 'task' | 'user' | 'spec' | 'spec_question';

export interface ActivityLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  details: string;
  targetType: TargetType;
  targetId: string;
  timestamp: string;
}
