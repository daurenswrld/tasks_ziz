import React, { useState } from 'react';
import { User, UserRole } from '../types/rbac';
import { RBACGuard } from '../rbac/guard';
import { UserPlus, Key, Trash2, CheckCircle, XCircle } from 'lucide-react';

interface TeamManagementViewProps {
  users: User[];
  currentUser: User;
  onCreateUser: (data: { name: string; email: string; role: UserRole; password?: string }) => void;
  onDeleteUser: (userId: string) => void;
  onUpdateRole: (userId: string, newRole: UserRole) => void;
  onUpdatePassword: (userId: string, newPassword: string) => void;
  onToggleActive: (userId: string, currentActive: boolean) => void;
}

export const TeamManagementView: React.FC<TeamManagementViewProps> = ({
  users,
  currentUser,
  onCreateUser,
  onDeleteUser,
  onUpdateRole,
  onUpdatePassword,
  onToggleActive,
}) => {
  const canManage = RBACGuard.canManageUsers(currentUser);

  // New User Form State
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('developer');
  const [newPassword, setNewPassword] = useState('password123');

  // Change Password Modal/State
  const [changingPassUserId, setChangingPassUserId] = useState<string | null>(null);
  const [passInput, setPassInput] = useState('');

  if (!canManage) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 className="h2-title" style={{ marginBottom: '8px' }}>
          Доступ ограничен
        </h2>
        <p className="text-body" style={{ color: 'var(--text-muted)' }}>
          Управление списком команды доступно только Директору и Проектным менеджерам.
        </p>
      </div>
    );
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    onCreateUser({
      name: newName,
      email: newEmail,
      role: newRole,
      password: newPassword,
    });

    setIsAddingUser(false);
    setNewName('');
    setNewEmail('');
    setNewPassword('password123');
  };

  const handlePassSubmit = (userId: string) => {
    if (!passInput.trim()) return;
    onUpdatePassword(userId, passInput);
    setChangingPassUserId(null);
    setPassInput('');
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}
      >
        <div>
          <h2 className="h2-title" style={{ fontSize: '24px', marginBottom: '4px' }}>
            Команда ZIZ INC. ({users.length})
          </h2>
          <p className="text-body" style={{ color: 'var(--text-muted)' }}>
            Управление учетными записями, ролями и паролями для входа в систему.
          </p>
        </div>

        <button
          onClick={() => setIsAddingUser(true)}
          className="btn btn-primary"
          style={{ gap: '8px' }}
        >
          <UserPlus size={16} /> Добавить сотрудника
        </button>
      </div>

      {/* Add User Modal */}
      {isAddingUser && (
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
          onClick={() => setIsAddingUser(false)}
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
            <h3 className="h2-title" style={{ marginBottom: '20px' }}>
              Новый сотрудник
            </h3>

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="text-label" style={{ display: 'block', marginBottom: '6px' }}>
                  ФИО Сотрудника
                </label>
                <input
                  type="text"
                  required
                  placeholder="Например: Руслан Беков"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="text-label" style={{ display: 'block', marginBottom: '6px' }}>
                  Рабочий Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="ruslan@ziz.kz"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="text-label" style={{ display: 'block', marginBottom: '6px' }}>
                  Роль в команде
                </label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value as UserRole)}
                  className="input-field"
                >
                  <option value="developer">Разработчик</option>
                  <option value="pm">Проектный менеджер</option>
                  <option value="admin">Директор (Администратор)</option>
                </select>
              </div>

              <div>
                <label className="text-label" style={{ display: 'block', marginBottom: '6px' }}>
                  Пароль для входа
                </label>
                <input
                  type="text"
                  required
                  placeholder="password123"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddingUser(false)}
                  className="btn btn-ghost"
                >
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary">
                  Создать аккаунт
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users Table Card */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-rest)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)' }}>
                СОТРУДНИК
              </th>
              <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)' }}>
                EMAIL
              </th>
              <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)' }}>
                РОЛЬ
              </th>
              <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)' }}>
                СТАТУС
              </th>
              <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', textAlign: 'right' }}>
                ДЕЙСТВИЯ
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {u.avatar ? (
                      <img
                        src={u.avatar}
                        alt={u.name}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '1.5px solid var(--border)',
                        }}
                      />
                    ) : (
                      <div className="avatar avatar-blue" style={{ width: '36px', height: '36px', fontSize: '13px' }}>
                        {u.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                        {u.name} {u.id === currentUser.id && '(Вы)'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                        Пароль: {u.password || '••••••••'}
                      </div>
                    </div>
                  </div>
                </td>

                <td style={{ padding: '16px 20px', fontSize: '14px', color: 'var(--text-body-color)' }}>
                  {u.email}
                </td>

                <td style={{ padding: '16px 20px' }}>
                  <select
                    value={u.role}
                    onChange={e => onUpdateRole(u.id, e.target.value as UserRole)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      fontSize: '12px',
                      fontWeight: 700,
                      backgroundColor: 'var(--bg)',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="admin">Директор</option>
                    <option value="pm">Проектный менеджер</option>
                    <option value="developer">Разработчик</option>
                  </select>
                </td>

                <td style={{ padding: '16px 20px' }}>
                  <button
                    onClick={() => onToggleActive(u.id, u.isActive)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: u.isActive ? 'var(--success-text)' : 'var(--danger-text)',
                    }}
                  >
                    {u.isActive ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    <span>{u.isActive ? 'Активен' : 'Заблокирован'}</span>
                  </button>
                </td>

                <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                    {/* Change Password Inline Trigger */}
                    {changingPassUserId === u.id ? (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="text"
                          placeholder="Новый пароль..."
                          value={passInput}
                          onChange={e => setPassInput(e.target.value)}
                          className="input-field"
                          style={{ padding: '4px 8px', fontSize: '12px', width: '120px' }}
                        />
                        <button
                          onClick={() => handlePassSubmit(u.id)}
                          className="btn btn-primary btn-sm"
                        >
                          ОК
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setChangingPassUserId(u.id)}
                        className="btn btn-ghost btn-sm"
                        title="Сменить пароль для входа"
                      >
                        <Key size={14} /> Пароль
                      </button>
                    )}

                    {/* Delete User */}
                    {u.id !== currentUser.id && (
                      <button
                        onClick={() => onDeleteUser(u.id)}
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--danger)' }}
                        title="Удалить сотрудника"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
