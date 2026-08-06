import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Project, User } from '../types/rbac';
import { RBACGuard } from '../rbac/guard';
import { FolderKanban, Plus, Sparkles, Layers, ArrowRight } from 'lucide-react';

interface ProjectSelectPlaceholderProps {
  projects: Project[];
  currentUser: User;
  onSelectProject: (projectId: string) => void;
  onCreateProject?: () => void;
}

export const ProjectSelectPlaceholder: React.FC<ProjectSelectPlaceholderProps> = ({
  projects,
  currentUser,
  onCreateProject,
}) => {
  const navigate = useNavigate();
  const activeProjects = projects.filter(p => !p.isArchived);
  const canCreateProject = RBACGuard.canCreateProject(currentUser);

  return (
    <div
      style={{
        padding: '36px',
        maxWidth: '860px',
        margin: '0 auto',
        minHeight: 'calc(100vh - 40px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: '56px 40px',
          boxShadow: 'var(--shadow-rest)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          width: '100%',
        }}
      >
        {/* Soft Decorative Ambient Glow */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '380px',
            height: '380px',
            backgroundColor: 'var(--primary-soft)',
            borderRadius: '50%',
            filter: 'blur(90px)',
            opacity: 0.6,
            pointerEvents: 'none',
          }}
        />

        {/* Floating Icon Container */}
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
            boxShadow: '0 8px 24px rgba(39, 84, 255, 0.25)',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <FolderKanban size={40} color="var(--primary)" />
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--primary-soft)',
            color: 'var(--primary)',
            padding: '6px 16px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 800,
            marginBottom: '16px',
            border: '1px solid rgba(39, 84, 255, 0.2)',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <Sparkles size={14} />
          <span>ПРОЕКТ НЕ ВЫБРАН</span>
        </div>

        <h1
          className="h1-title"
          style={{
            fontSize: '26px',
            color: 'var(--text-main)',
            marginBottom: '12px',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            position: 'relative',
            zIndex: 2,
          }}
        >
          Выберите проект для работы 
        </h1>

        <p
          className="text-body"
          style={{
            color: 'var(--text-muted)',
            fontSize: '15px',
            lineHeight: '1.6',
            maxWidth: '540px',
            marginBottom: '36px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          Чтобы просмотреть задачи, менять статусы и загружать материалы, выберите нужный проект на вкладке «Проекты».
        </p>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <button
            onClick={() => navigate('/projects')}
            className="btn btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 28px',
              fontSize: '14px',
              fontWeight: 700,
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 4px 16px rgba(39, 84, 255, 0.3)',
            }}
          >
            <Layers size={18} />
            <span>Перейти к списку проектов ({activeProjects.length})</span>
            <ArrowRight size={16} />
          </button>

          {canCreateProject && onCreateProject && (
            <button
              onClick={onCreateProject}
              className="btn btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 24px',
                fontSize: '14px',
                fontWeight: 700,
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <Plus size={18} />
              <span>Создать проект</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
