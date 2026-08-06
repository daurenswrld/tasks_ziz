import React from 'react';
import { Task, User } from '../types/rbac';
import { formatDeadlineDate } from '../utils/date';
import { Sparkles, FolderKanban, Calendar, ArrowRight, LayoutGrid } from 'lucide-react';

interface MyTasksViewProps {
  tasks: Task[];
  currentUser: User;
  onSelectTask: (task: Task) => void;
  onNavigateBoard: () => void;
  onNavigateProjects: () => void;
}

export const MyTasksView: React.FC<MyTasksViewProps> = ({
  tasks,
  currentUser,
  onSelectTask,
  onNavigateBoard,
  onNavigateProjects,
}) => {
  const myTasks = tasks.filter(t => t.assigneeId === currentUser.id);

  const getStatusBadge = (status: Task['status']) => {
    switch (status) {
      case 'todo':
        return { label: 'К выполнению', class: 'badge-new' };
      case 'doing':
        return { label: 'В работе', class: 'badge-tag' };
      case 'done':
        return { label: 'Готово', class: 'badge-success' };
      default:
        return { label: status, class: 'badge-tag' };
    }
  };

  const getPriorityBadge = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent':
        return { label: 'СРОЧНО', color: 'var(--danger)', bg: 'var(--danger-soft)' };
      case 'high':
        return { label: 'ВЫСОКИЙ', color: 'var(--warn)', bg: 'var(--warn-soft)' };
      case 'medium':
        return { label: 'СРЕДНИЙ', color: 'var(--primary)', bg: 'var(--primary-soft)' };
      case 'low':
      default:
        return { label: 'НИЗКИЙ', color: 'var(--text-muted)', bg: 'var(--bg)' };
    }
  };

  return (
    <div
      style={{
        padding: '32px',
        maxWidth: '1080px',
        margin: '0 auto',
        minHeight: 'calc(100vh - 40px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      {/* View Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="h1-title" style={{ color: 'var(--text-main)', marginBottom: '4px' }}>
            Мои задачи
          </h1>
          <p className="text-body" style={{ color: 'var(--text-muted)' }}>
            Персональный список назначенных вам задач и их текущий статус
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="badge badge-tag" style={{ fontSize: '13px', padding: '6px 14px', fontWeight: 800 }}>
            {myTasks.length} {myTasks.length === 1 ? 'задача' : myTasks.length > 1 && myTasks.length < 5 ? 'задачи' : 'задач'}
          </span>
        </div>
      </div>

      {/* Main Content: Tasks List or Empty State */}
      {myTasks.length === 0 ? (
        <div
          className="empty-tasks-placeholder"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px dashed var(--border-hover)',
            borderRadius: 'var(--radius-xl)',
            padding: '64px 32px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-rest)',
            marginTop: '20px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle Background Glow */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '320px',
              height: '320px',
              backgroundColor: 'var(--primary-soft)',
              borderRadius: '50%',
              filter: 'blur(80px)',
              opacity: 0.6,
              pointerEvents: 'none',
            }}
          />

          {/* Floating Icon Box */}
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '24px',
              backgroundColor: 'var(--primary-soft)',
              border: '1.5px solid var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px',
              boxShadow: '0 8px 24px rgba(39, 84, 255, 0.2)',
              position: 'relative',
              zIndex: 2,
            }}
          >
            <Sparkles size={38} color="var(--primary)" />
          </div>

          <h2
            className="h2-title"
            style={{
              fontSize: '22px',
              color: 'var(--text-main)',
              marginBottom: '10px',
              position: 'relative',
              zIndex: 2,
            }}
          >
            У вас нет назначенных задач! 
          </h2>

          <p
            className="text-body"
            style={{
              maxWidth: '520px',
              color: 'var(--text-muted)',
              fontSize: '14px',
              lineHeight: '1.6',
              marginBottom: '32px',
              position: 'relative',
              zIndex: 2,
            }}
          >
            Все текущие поручения успешно выполнены, либо вы еще не назначены ответственным исполнителем.
            Вы можете посмотреть рабочую доску или перейти в список проектов.
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              position: 'relative',
              zIndex: 2,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <button
              onClick={onNavigateBoard}
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 24px',
                fontSize: '14px',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <LayoutGrid size={18} />
              <span>Перейти на доску</span>
            </button>

            <button
              onClick={onNavigateProjects}
              className="btn btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 24px',
                fontSize: '14px',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <FolderKanban size={18} />
              <span>Все проекты</span>
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {myTasks.map(task => {
            const statusInfo = getStatusBadge(task.status);
            const prioInfo = getPriorityBadge(task.priority);

            return (
              <div
                key={task.id}
                onClick={() => onSelectTask(task)}
                className="my-task-card"
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px 24px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '20px',
                  transition: 'all 0.15s ease',
                  boxShadow: 'var(--shadow-rest)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-rest)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                  <div
                    style={{
                      width: '74px',
                      padding: '6px 8px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: prioInfo.bg,
                      color: prioInfo.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontWeight: 800,
                      fontSize: '11px',
                      textAlign: 'center',
                    }}
                  >
                    {prioInfo.label}
                  </div>

                  <div>
                    <h4
                      className="card-title"
                      style={{
                        fontSize: '16px',
                        color: 'var(--text-main)',
                        marginBottom: '6px',
                      }}
                    >
                      {task.title}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} color="var(--primary)" />
                        Дедлайн: {formatDeadlineDate(task.deadline)}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span className={`badge ${statusInfo.class}`} style={{ textTransform: 'uppercase', padding: '6px 12px', fontSize: '11px' }}>
                    {statusInfo.label}
                  </span>
                  <ArrowRight size={18} color="var(--text-muted)" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
