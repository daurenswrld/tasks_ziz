import React, { useState } from 'react';
import { Project, User } from '../types/rbac';
import { RBACGuard } from '../rbac/guard';
import { Search, Plus, RotateCcw, X, CheckCircle, Users, Check, Trash2 } from 'lucide-react';

interface ProjectsViewProps {
  projects: Project[];
  users?: User[];
  currentUser: User;
  onSelectProject: (projectId: string) => void;
  onCreateProject: (data: { name: string; key: string; description: string; deadline?: string; color?: string; memberIds?: string[] }) => void;
  onRestoreProject?: (projectId: string) => void;
  onArchiveProject?: (projectId: string) => void;
  onDeleteProject?: (projectId: string) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  users = [],
  currentUser,
  onSelectProject,
  onCreateProject,
  onRestoreProject,
  onArchiveProject,
  onDeleteProject,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Project Form State
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [color, setColor] = useState('#2754FF');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  const handleOpenCreateModal = () => {
    setSelectedMemberIds(users.length > 0 ? users.map(u => u.id) : [currentUser.id]);
    setIsCreateModalOpen(true);
  };

  const canCreate = RBACGuard.canCreateProject(currentUser);
  const canDelete = RBACGuard.canDeleteProject(currentUser);

  const activeProjects = projects.filter(
    p => !p.isArchived && p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const archivedProjects = projects.filter(
    p => p.isArchived && p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getLetterIcon = (name: string) => {
    return name.trim().charAt(0).toUpperCase() || 'P';
  };

  const formatDeadline = (dateStr?: string) => {
    if (!dateStr) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [y, m, d] = dateStr.split('-');
      const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    }
    return dateStr;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const generatedKey = key.trim() || name.trim().slice(0, 3).toUpperCase();
    onCreateProject({
      name,
      key: generatedKey,
      description,
      deadline: deadline || undefined,
      color,
      memberIds: selectedMemberIds,
    });

    setIsCreateModalOpen(false);
    setName('');
    setKey('');
    setDescription('');
    setDeadline('');
    setSelectedMemberIds([]);
  };

  return (
    <div style={{ padding: '36px 40px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '32px',
        }}
      >
        <div>
          <h1
            className="h1-title"
            style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}
          >
            Проекты
          </h1>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
            {activeProjects.length} активных · {archivedProjects.length} в архиве
          </div>
        </div>

        {/* Right Search & Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', width: '260px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Поиск по проектам..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 14px 9px 38px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                fontSize: '13px',
                color: 'var(--text-main)',
                outline: 'none',
              }}
            />
          </div>

          {/* New Project Button */}
          {canCreate && (
            <button
              onClick={handleOpenCreateModal}
              className="btn btn-primary"
              style={{
                backgroundColor: '#2754FF',
                padding: '10px 20px',
                borderRadius: 'var(--radius-lg)',
                fontWeight: 700,
                fontSize: '14px',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(39, 84, 255, 0.25)',
              }}
            >
              <Plus size={16} /> Проект
            </button>
          )}
        </div>
      </div>

      {/* Active Projects Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '24px',
          marginBottom: '40px',
        }}
      >
        {activeProjects.map(project => {
          const completed = project.completedTasksCount || 0;
          const total = project.totalTasksCount ?? 0;
          const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
          const cardColor = project.color || '#2754FF';

          return (
            <div
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              style={{
                backgroundColor: 'var(--surface)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid var(--border)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                cursor: 'pointer',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '170px',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
              }}
            >
              {/* Top Colored Border Bar */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  borderTopLeftRadius: '16px',
                  borderTopRightRadius: '16px',
                  backgroundColor: cardColor,
                }}
              />

              {/* Top Info */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                  {/* Icon Avatar Circle */}
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      backgroundColor: cardColor,
                      color: '#FFFFFF',
                      fontSize: '18px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {getLetterIcon(project.name)}
                  </div>

                  <div>
                    <h3
                      style={{
                        fontSize: '16px',
                        fontWeight: 800,
                        color: 'var(--text-main)',
                        margin: 0,
                        lineHeight: 1.2,
                      }}
                    >
                      {project.name}
                    </h3>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {project.deadline ? `дедлайн ${formatDeadline(project.deadline)}` : 'без дедлайна'}
                    </div>
                  </div>
                </div>

                {/* Task Progress Bar */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '12px',
                      marginBottom: '8px',
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                      {completed} из {total} задач
                    </span>
                    <span style={{ color: cardColor, fontWeight: 800 }}>{percent}%</span>
                  </div>

                  <div
                    style={{
                      height: '6px',
                      backgroundColor: 'var(--bg)',
                      borderRadius: '3px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${percent}%`,
                        height: '100%',
                        backgroundColor: cardColor,
                        borderRadius: '3px',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Footer Tag, Time & Archive Action */}
              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  {project.statusBadge ? (
                    <span
                      style={{
                        backgroundColor: '#FFF4DE',
                        color: '#D97706',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: '12px',
                      }}
                    >
                      {project.statusBadge}
                    </span>
                  ) : project.updatedAtText ? (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {project.updatedAtText}
                    </span>
                  ) : null}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {canCreate && onArchiveProject && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onArchiveProject(project.id);
                      }}
                      className="btn btn-ghost btn-sm"
                      style={{
                        fontSize: '12px',
                        gap: '5px',
                        color: 'var(--success-text)',
                        borderRadius: 'var(--radius-md)',
                        padding: '4px 10px',
                      }}
                      title="Завершить и перенести проект в архив"
                    >
                      <CheckCircle size={14} /> Завершить
                    </button>
                  )}
                  {canDelete && onDeleteProject && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        if (window.confirm(`Вы действительно хотите безвозвратно удалить проект "${project.name}"?`)) {
                          onDeleteProject(project.id);
                        }
                      }}
                      className="btn btn-ghost btn-sm"
                      style={{
                        fontSize: '12px',
                        gap: '5px',
                        color: 'var(--danger-text)',
                        borderRadius: 'var(--radius-md)',
                        padding: '4px 8px',
                      }}
                      title="Удалить проект"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Plus New Project Dashed Placeholder Card */}
        {canCreate && (
          <div
            onClick={handleOpenCreateModal}
            style={{
              border: '2px dashed var(--border)',
              borderRadius: '16px',
              padding: '32px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              minHeight: '170px',
              backgroundColor: 'transparent',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#2754FF';
              e.currentTarget.style.backgroundColor = 'rgba(39, 84, 255, 0.02)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: 'rgba(39, 84, 255, 0.1)',
                color: '#2754FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '10px',
              }}
            >
              <Plus size={22} />
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)' }}>
              Новый проект
            </div>
          </div>
        )}
      </div>

      {/* Archive Section */}
      {archivedProjects.length > 0 && (
        <div>
          <div
            style={{
              fontSize: '11px',
              letterSpacing: '0.8px',
              fontWeight: 800,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              marginBottom: '16px',
            }}
          >
            АРХИВ · {archivedProjects.length}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {archivedProjects.map(proj => (
              <div
                key={proj.id}
                style={{
                  backgroundColor: 'var(--surface)',
                  borderRadius: '16px',
                  padding: '16px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: '#94A3B8',
                      color: '#FFFFFF',
                      fontSize: '15px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {getLetterIcon(proj.name)}
                  </div>

                  <div>
                    <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-main)', marginRight: '8px' }}>
                      {proj.name}
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {proj.deadline ? `дедлайн ${formatDeadline(proj.deadline)}` : 'без дедлайна'} · {proj.updatedAtText || 'в архиве'} · {proj.totalTasksCount || 0} задач
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {onRestoreProject && (
                    <button
                      onClick={() => onRestoreProject(proj.id)}
                      className="btn btn-secondary btn-sm"
                      style={{
                        borderRadius: '10px',
                        padding: '6px 16px',
                        fontSize: '13px',
                        fontWeight: 700,
                        gap: '6px',
                      }}
                    >
                      <RotateCcw size={14} /> Восстановить
                    </button>
                  )}
                  {canDelete && onDeleteProject && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Вы действительно хотите безвозвратно удалить проект "${proj.name}"?`)) {
                          onDeleteProject(proj.id);
                        }
                      }}
                      className="btn btn-ghost btn-sm"
                      style={{
                        borderRadius: '10px',
                        padding: '6px 10px',
                        color: 'var(--danger-text)',
                      }}
                      title="Безвозвратно удалить из архива"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Project Modal */}
      {isCreateModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(36, 43, 57, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius-xl)',
              width: '100%',
              maxWidth: '480px',
              padding: '28px',
              boxShadow: 'var(--shadow-modal)',
              border: '1px solid var(--border)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="h2-title" style={{ fontSize: '18px', margin: 0 }}>
                Создать новый проект
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="text-label" style={{ display: 'block', marginBottom: '6px' }}>
                  Название проекта *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Например: Мобильное приложение"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="text-label" style={{ display: 'block', marginBottom: '6px' }}>
                    Ключ проекта (буквы)
                  </label>
                  <input
                    type="text"
                    placeholder="MOB"
                    value={key}
                    onChange={e => setKey(e.target.value.toUpperCase())}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="text-label" style={{ display: 'block', marginBottom: '6px' }}>
                    Дедлайн проекта
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
                  Цвет обложки карточки
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {['#2754FF', '#1E293B', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B'].map(c => (
                    <div
                      key={c}
                      onClick={() => setColor(c)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: c,
                        cursor: 'pointer',
                        border: color === c ? '3px solid #000' : 'none',
                        boxShadow: color === c ? '0 0 0 2px #fff' : 'none',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-label" style={{ display: 'block', marginBottom: '6px' }}>
                  Описание проекта
                </label>
                <textarea
                  rows={2}
                  placeholder="Краткое описание целей..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="input-field"
                />
              </div>

              {/* Members Access Selection */}
              {users.length > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label className="text-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                      <Users size={14} style={{ color: 'var(--primary)' }} />
                      Команда проекта ({selectedMemberIds.length} из {users.length})
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedMemberIds.length === users.length) {
                          setSelectedMemberIds([currentUser.id]);
                        } else {
                          setSelectedMemberIds(users.map(u => u.id));
                        }
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      {selectedMemberIds.length === users.length ? 'Снять все' : 'Выбрать всех'}
                    </button>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
                      gap: '8px',
                      maxHeight: '180px',
                      overflowY: 'auto',
                      padding: '2px',
                    }}
                  >
                    {users.map(u => {
                      const isSelected = selectedMemberIds.includes(u.id);
                      const roleBadgeColor = u.role === 'admin' ? '#EF4444' : u.role === 'pm' ? '#8B5CF6' : '#10B981';
                      const roleText = u.role === 'admin' ? 'Админ' : u.role === 'pm' ? 'ПМ' : 'Разраб';

                      return (
                        <div
                          key={u.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedMemberIds(prev => prev.filter(id => id !== u.id));
                            } else {
                              setSelectedMemberIds(prev => [...prev, u.id]);
                            }
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-md)',
                            border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                            backgroundColor: isSelected ? 'rgba(39, 84, 255, 0.05)' : 'var(--surface)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            userSelect: 'none',
                            boxShadow: isSelected ? '0 2px 8px rgba(39, 84, 255, 0.12)' : 'none',
                          }}
                        >
                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <img
                              src={u.avatar}
                              alt={u.name}
                              style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                            {isSelected && (
                              <div
                                style={{
                                  position: 'absolute',
                                  bottom: '-2px',
                                  right: '-2px',
                                  width: '14px',
                                  height: '14px',
                                  borderRadius: '50%',
                                  backgroundColor: 'var(--primary)',
                                  color: '#fff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: '1.5px solid var(--surface)',
                                }}
                              >
                                <Check size={9} strokeWidth={3} />
                              </div>
                            )}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: '13px',
                                fontWeight: 700,
                                color: 'var(--text-main)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {u.name}
                            </div>
                            <div
                              style={{
                                fontSize: '11px',
                                color: 'var(--text-muted)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {u.email}
                            </div>
                          </div>

                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: '6px',
                              backgroundColor: `${roleBadgeColor}15`,
                              color: roleBadgeColor,
                              textTransform: 'uppercase',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {roleText}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn btn-ghost"
                >
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#2754FF' }}>
                  Создать проект
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
