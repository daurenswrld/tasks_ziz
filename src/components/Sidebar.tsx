import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ZizLogo } from './ZizLogo';
import { User } from '../types/rbac';
import { RBACGuard } from '../rbac/guard';
import { FolderKanban, CheckSquare, Settings, Layers, Users as UsersIcon, ChevronRight, LogOut } from 'lucide-react';

interface SidebarProps {
  currentUser: User;
  onOpenRoleSwitcher?: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  onLogout,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const canManageTeam = RBACGuard.canManageUsers(currentUser);

  const getRoleLabel = (role: User['role']) => {
    switch (role) {
      case 'admin':
        return 'директор';
      case 'pm':
        return 'проектный менеджер';
      case 'developer':
        return 'разработчик';
    }
  };

  const getAvatarColorClass = (id: string) => {
    const colors = ['avatar-blue', 'avatar-green', 'avatar-purple', 'avatar-orange', 'avatar-red'];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash += id.charCodeAt(i);
    }
    return colors[hash % colors.length];
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        backgroundColor: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        zIndex: 40,
        padding: '24px 16px',
        color: '#FFFFFF',
      }}
    >
      <div>
        {/* Logo */}
        <div style={{ marginBottom: '32px', paddingLeft: '8px' }}>
          <ZizLogo lightText={true} />
        </div>

        {/* Navigation Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button
            onClick={() => navigate('/projects')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: isActive('/projects') ? 'var(--primary)' : 'transparent',
              color: isActive('/projects') ? '#FFFFFF' : 'var(--text-muted)',
              fontSize: '14px',
              fontWeight: 700,
              fontFamily: 'var(--font-family)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
            }}
          >
            <Layers size={18} />
            <span>Проекты</span>
          </button>

          <button
            onClick={() => navigate('/board')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: isActive('/board') ? 'var(--primary)' : 'transparent',
              color: isActive('/board') ? '#FFFFFF' : '#8E97AB',
              fontSize: '14px',
              fontWeight: 700,
              fontFamily: 'var(--font-family)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
            }}
          >
            <FolderKanban size={18} />
            <span>Доска</span>
          </button>

          <button
            onClick={() => navigate('/tasks')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: isActive('/tasks') ? 'var(--primary)' : 'transparent',
              color: isActive('/tasks') ? '#FFFFFF' : 'var(--text-muted)',
              fontSize: '14px',
              fontWeight: 700,
              fontFamily: 'var(--font-family)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
            }}
          >
            <CheckSquare size={18} />
            <span>Мои задачи</span>
          </button>

          {/* Team Management Tab (Visible only to Admin & PM under RBAC rules) */}
          {canManageTeam && (
            <button
              onClick={() => navigate('/team')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                backgroundColor: isActive('/team') ? 'var(--primary)' : 'transparent',
                color: isActive('/team') ? '#FFFFFF' : 'var(--text-muted)',
                fontSize: '14px',
                fontWeight: 700,
                fontFamily: 'var(--font-family)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <UsersIcon size={18} />
              <span>Команда</span>
            </button>
          )}

          <button
            onClick={() => navigate('/settings')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: isActive('/settings') ? 'var(--primary)' : 'transparent',
              color: isActive('/settings') ? '#FFFFFF' : 'var(--text-muted)',
              fontSize: '14px',
              fontWeight: 700,
              fontFamily: 'var(--font-family)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
            }}
          >
            <Settings size={18} />
            <span>Настройки</span>
          </button>
        </nav>
      </div>

      {/* Bottom Profile & Logout Container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* User Profile Card at Bottom */}
        <button
          onClick={() => navigate('/settings')}
          title="Перейти в настройки профиля"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: '#FFFFFF',
            cursor: 'pointer',
            textAlign: 'left',
            width: '100%',
            transition: 'all 0.15s ease',
          }}
        >
          {currentUser.avatar ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="sidebar-user-avatar"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '1.5px solid var(--primary)',
                flexShrink: 0,
              }}
            />
          ) : (
            <div className={`avatar ${getAvatarColorClass(currentUser.id)}`}>
              {getInitials(currentUser.name)}
            </div>
          )}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {currentUser.name}
            </div>
            <div style={{ fontSize: '11px', color: '#7B8499', textTransform: 'lowercase' }}>
              {getRoleLabel(currentUser.role)}
            </div>
          </div>
          <ChevronRight size={14} style={{ color: '#7B8499' }} />
        </button>

        {/* Logout Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#F87171',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              width: '100%',
              transition: 'all 0.15s ease',
            }}
          >
            <LogOut size={14} />
            <span>Выйти из аккаунта</span>
          </button>
        )}
      </div>
    </aside>
  );
};
