import React, { useState } from 'react';
import { Task, TaskStatus, User } from '../types/rbac';
import { RBACGuard } from '../rbac/guard';
import { TaskCard } from './TaskCard';
import { Plus } from 'lucide-react';

interface KanbanBoardProps {
  tasks: Task[];
  users: User[];
  currentUser: User;
  onSelectTask: (task: Task) => void;
  onMoveTask: (taskId: string, newStatus: TaskStatus) => void;
  onOpenNewTaskModal: (initialStatus?: TaskStatus) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  users,
  currentUser,
  onSelectTask,
  onMoveTask,
  onOpenNewTaskModal,
}) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [showAllDone, setShowAllDone] = useState<boolean>(false);

  const columns: { id: TaskStatus; label: string; dotColor: string }[] = [
    { id: 'todo', label: 'TO DO', dotColor: 'var(--text-faint)' },
    { id: 'doing', label: 'DOING', dotColor: 'var(--primary)' },
    { id: 'done', label: 'DONE', dotColor: 'var(--success)' },
  ];

  const getCategoryName = (task: Task) => {
    if (task.title.toLowerCase().includes('дизайн') || task.title.toLowerCase().includes('макет'))
      return 'Дизайн';
    if (task.title.toLowerCase().includes('вёрстка') || task.title.toLowerCase().includes('фронт'))
      return 'Frontend';
    if (task.title.toLowerCase().includes('api') || task.title.toLowerCase().includes('backend'))
      return 'Backend';
    return 'Контент';
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.setData('taskId', task.id);
    setDraggedTaskId(task.id);
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData('taskId') || draggedTaskId;
    if (taskId) {
      onMoveTask(taskId, status);
    }
    setDraggedTaskId(null);
  };

  const canCreateTask = RBACGuard.canCreateTask(currentUser);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px',
        padding: '32px',
        alignItems: 'start',
        maxWidth: '1440px',
        margin: '0 auto',
      }}
    >
      {columns.map(col => {
        const columnTasks = tasks.filter(t => t.status === col.id);
        const isHovered = dragOverColumn === col.id;

        return (
          <div
            key={col.id}
            onDragOver={e => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, col.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              backgroundColor: isHovered ? 'rgba(39, 84, 255, 0.03)' : 'transparent',
              borderRadius: 'var(--radius-lg)',
              padding: '8px',
              transition: 'background-color 0.15s ease',
              minHeight: '600px',
            }}
          >
            {/* Column Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '4px',
                paddingLeft: '4px',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: col.dotColor,
                }}
              />
              <span className="text-label" style={{ color: 'var(--text-muted)' }}>
                {col.label}
              </span>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--text-faint)',
                }}
              >
                {columnTasks.length}
              </span>
            </div>

            {/* Tasks List */}
            {columnTasks
              .slice(0, col.id === 'done' && !showAllDone ? 2 : undefined)
              .map(task => {
                const assignee = users.find(u => u.id === task.assigneeId);
                return (
                  <TaskCard
                    key={task.id}
                    task={task}
                    categoryName={getCategoryName(task)}
                    assignee={assignee}
                    currentUser={currentUser}
                    onSelectTask={onSelectTask}
                    onDragStart={handleDragStart}
                  />
                );
              })}

            {/* Add Task Button (Only for TODO and DOING columns, HIDDEN for Developers) */}
            {col.id !== 'done' && canCreateTask && (
              <button
                onClick={() => onOpenNewTaskModal(col.id)}
                className="btn-dashed-add"
                title="Добавить задачу"
              >
                <Plus size={16} />
                <span>Добавить задачу</span>
              </button>
            )}

            {/* Column 3 (Done) Extra Expand / Collapse Button */}
            {col.id === 'done' && columnTasks.length > 2 && (
              <button
                onClick={() => setShowAllDone(!showAllDone)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed var(--dashed)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--primary-text)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginTop: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.backgroundColor = 'var(--primary-soft)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--dashed)';
                  e.currentTarget.style.backgroundColor = 'var(--surface)';
                }}
              >
                {showAllDone
                  ? 'Свернуть выполненные задачи'
                  : `+ ещё ${columnTasks.length - 2} выполненных`}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};
