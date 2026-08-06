import React, { useState } from 'react';
import { Project, TaskPriority, TaskStatus, User } from '../types/rbac';
import { X, Plus } from 'lucide-react';

interface NewTaskModalProps {
  project: Project;
  users: User[];
  initialStatus?: TaskStatus;
  onClose: () => void;
  onCreateTask: (data: {
    title: string;
    description: string;
    priority: TaskPriority;
    deadline?: string;
    assigneeId?: string;
    status?: TaskStatus;
  }) => void;
}

export const NewTaskModal: React.FC<NewTaskModalProps> = ({
  project,
  users,
  onClose,
  onCreateTask,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [deadline, setDeadline] = useState('2026-08-15');
  const [assigneeId, setAssigneeId] = useState<string>(users[0]?.id || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onCreateTask({
      title,
      description,
      priority,
      deadline,
      assigneeId,
    });
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(36, 43, 57, 0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: '520px',
          boxShadow: 'var(--shadow-modal)',
          border: '1px solid var(--border)',
          padding: '28px',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
          }}
        >
          <h2 className="h2-title" style={{ color: 'var(--text-main)' }}>
            Новая задача в {project.key}
          </h2>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '8px' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="text-label" style={{ display: 'block', marginBottom: '6px' }}>
              Название задачи
            </label>
            <input
              type="text"
              required
              placeholder="Например: Вёрстка каталога: фильтры и сортировка"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="text-label" style={{ display: 'block', marginBottom: '6px' }}>
              Описание
            </label>
            <textarea
              rows={3}
              placeholder="Подробное описание задачи для исполнителя..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="input-field"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="text-label" style={{ display: 'block', marginBottom: '6px' }}>
                Приоритет
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as TaskPriority)}
                className="input-field"
              >
                <option value="low">Низкий (Low)</option>
                <option value="medium">Средний (Medium)</option>
                <option value="high">Высокий (High)</option>
                <option value="urgent">Срочный (Urgent)</option>
              </select>
            </div>

            <div>
              <label className="text-label" style={{ display: 'block', marginBottom: '6px' }}>
                Дедлайн
              </label>
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="text-label" style={{ display: 'block', marginBottom: '6px' }}>
              Назначить исполнителя
            </label>
            <select
              value={assigneeId}
              onChange={e => setAssigneeId(e.target.value)}
              className="input-field"
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '12px',
            }}
          >
            <button type="button" onClick={onClose} className="btn btn-ghost">
              Отмена
            </button>
            <button type="submit" className="btn btn-primary">
              <Plus size={16} /> Создать задачу
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
