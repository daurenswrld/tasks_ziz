import React from 'react';
import { Project, User } from '../types/rbac';
import { RBACGuard } from '../rbac/guard';
import { Plus, FolderOpen } from 'lucide-react';

interface HeaderProps {
  project: Project;
  taskCount: number;
  members: User[];
  currentUser: User;
  onOpenDocuments: () => void;
  onOpenNewTask: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  taskCount,
  members,
  currentUser,
  onOpenDocuments,
  onOpenNewTask,
}) => {
  const documentCount = project.documents?.length || 0;

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getAvatarColorClass = (index: number) => {
    const classes = ['avatar-blue', 'avatar-green', 'avatar-red', 'avatar-purple', 'avatar-orange'];
    return classes[index % classes.length];
  };

  // RBAC rule: UI hides unavailable actions completely instead of showing disabled buttons
  const canCreateTask = RBACGuard.canCreateTask(currentUser);

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '24px 32px',
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      {/* Left Title Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div>
          <h1 className="h1-title" style={{ color: 'var(--text-main)', marginBottom: '2px' }}>
            {project.name}
          </h1>
          <div className="text-secondary" style={{ color: 'var(--text-muted)' }}>
            {taskCount} {taskCount === 1 ? 'задача' : taskCount > 1 && taskCount < 5 ? 'задачи' : 'задач'}{project.deadline ? ` · дедлайн ${project.deadline}` : ''}
          </div>
        </div>

        {/* Documents Button */}
        <button
          onClick={onOpenDocuments}
          className="btn btn-secondary"
          style={{
            borderRadius: 'var(--radius-lg)',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textAlign: 'left',
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(39, 84, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
            }}
          >
            <FolderOpen size={16} />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary-text)' }}>
              Документы ({documentCount})
            </div>
            <div style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)' }}>
              Файлы проекта
            </div>
          </div>
        </button>
      </div>

      {/* Right Side: Avatars Stack & Action Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Avatars Stack */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {members.slice(0, 4).map((member, idx) =>
            member.avatar ? (
              <img
                key={member.id}
                src={member.avatar}
                alt={member.name}
                className="header-member-avatar"
                title={`${member.name} (${member.role})`}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  marginLeft: idx === 0 ? 0 : '-8px',
                  zIndex: 10 - idx,
                  border: '2px solid var(--surface)',
                  boxShadow: '0 0 0 1px var(--border)',
                }}
              />
            ) : (
              <div
                key={member.id}
                className={`avatar ${getAvatarColorClass(idx)}`}
                style={{
                  marginLeft: idx === 0 ? 0 : '-8px',
                  zIndex: 10 - idx,
                  boxShadow: '0 0 0 2px var(--surface)',
                }}
                title={`${member.name} (${member.role})`}
              >
                {getInitials(member.name)}
              </div>
            )
          )}
          {members.length > 4 && (
            <div
              className="avatar"
              style={{
                backgroundColor: 'var(--border-subtle)',
                color: 'var(--text-muted)',
                marginLeft: '-8px',
                zIndex: 1,
                fontSize: '11px',
                fontWeight: 700,
                border: '2px solid var(--surface)',
              }}
            >
              +{members.length - 4}
            </div>
          )}
        </div>

        {/* Create Task Button (Hidden for Developers under RBAC rules) */}
        {canCreateTask && (
          <button onClick={onOpenNewTask} className="btn btn-primary">
            <Plus size={16} />
            <span>Задача</span>
          </button>
        )}
      </div>
    </header>
  );
};
