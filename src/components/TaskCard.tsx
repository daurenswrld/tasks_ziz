import React from 'react';
import { Task, User } from '../types/rbac';
import { RBACGuard } from '../rbac/guard';
import { UserAvatar } from './UserAvatar';
import { formatDeadlineShort } from '../utils/date';
import { Check } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  categoryName?: string;
  assignee?: User;
  currentUser: User;
  onSelectTask: (task: Task) => void;
  onDragStart?: (e: React.DragEvent, task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  categoryName = 'Дизайн',
  assignee,
  currentUser,
  onSelectTask,
  onDragStart,
}) => {
  const isDone = task.status === 'done';
  const canMove = RBACGuard.canMoveTask(currentUser, task);



  const isToday = task.deadline === '2026-08-05' || task.deadline === 'сегодня';
  const hasUnreadNotice = task.comments.length > 0 && task.status === 'doing';

  return (
    <div
      draggable={canMove}
      onDragStart={e => canMove && onDragStart && onDragStart(e, task)}
      onClick={() => onSelectTask(task)}
      className={`card task-card ${isDone ? 'card-done' : ''}`}
      style={{
        backgroundColor: 'var(--surface)',
        border: hasUnreadNotice ? '1.5px solid var(--primary)' : '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px',
        boxShadow: 'var(--shadow-rest)',
        cursor: canMove ? 'grab' : 'pointer',
        transition: 'all 0.15s ease',
        userSelect: 'none',
        position: 'relative',
      }}
    >
      {/* Top Header Row */}
      <div
        className="task-card-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
        }}
      >
        <div className="task-card-tags" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge badge-tag task-card-category">{categoryName}</span>
          <span className={`priority-dot ${task.priority}`} title={`Приоритет: ${task.priority}`} />
        </div>

        {hasUnreadNotice && !isDone && (
          <span className="badge badge-new task-card-notice" style={{ fontSize: '11px' }}>
            новое сообщение
          </span>
        )}
      </div>

      {/* Task Title */}
      <h3
        className="card-title task-card-title"
        style={{
          color: isDone ? 'var(--text-muted)' : 'var(--text-main)',
          marginBottom: '14px',
        }}
      >
        {task.title}
      </h3>

      {/* Bottom Footer Row */}
      <div
        className="task-card-footer"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Deadline / Status Badge */}
        <div className="task-card-deadline">
          {isDone ? (
            <span
              className="task-card-status-done"
              style={{
                fontSize: '12px',
                color: 'var(--success-text)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Check size={12} /> {task.updatedAt ? '2 авг' : 'выполнено'}
            </span>
          ) : isToday ? (
            <span className="badge badge-today task-card-status-today">сегодня</span>
          ) : (
            <span
              className="task-card-deadline-date"
              style={{
                fontSize: '12px',
                color: 'var(--text-faint)',
                fontWeight: 500,
              }}
            >
              {formatDeadlineShort(task.deadline)}
            </span>
          )}
        </div>

        {/* Assignee Avatar */}
        {assignee && (
          <UserAvatar
            user={assignee}
            size={28}
            className="avatar task-card-avatar"
          />
        )}
      </div>
    </div>
  );
};
