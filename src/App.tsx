import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, Outlet } from 'react-router-dom';
import { RBACEngine } from './rbac/engine';
import { RBACGuard } from './rbac/guard';
import { Task, TaskStatus, User, UserRole } from './types/rbac';
import { apiRequest } from './api/client';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { KanbanBoard } from './components/KanbanBoard';
import { TaskDetailModal } from './components/TaskDetailModal';
import { NewTaskModal } from './components/NewTaskModal';
import { TechSpecModal } from './components/TechSpecModal';
import { TeamManagementView } from './components/TeamManagementView';
import { ProjectDocumentsModal } from './components/ProjectDocumentsModal';
import { ProjectsView } from './components/ProjectsView';
import { ProjectSelectPlaceholder } from './components/ProjectSelectPlaceholder';
import { SettingsView } from './components/SettingsView';
import { MyTasksView } from './components/MyTasksView';
import { LoginPage } from './components/LoginPage';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

const engine = new RBACEngine();
const LOCAL_STORAGE_KEY = 'ziz_tasks_current_user';

const THEME_STORAGE_KEY = 'ziz_theme_mode';

export const App: React.FC = () => {
  const navigate = useNavigate();

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const [userListVersion, setUserListVersion] = useState<number>(0);
  const refreshUsers = () => setUserListVersion(v => v + 1);

  const allUsers = engine.getAllUsersForSelection();

  // Restore authenticated session from localStorage so refresh doesn't log out
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) return parsed;
      } catch (e) {
        console.error('Error parsing stored user session:', e);
      }
    }
    return {
      id: 'u_abylai',
      name: 'Абылай Жусипбек',
      email: 'abylai@ziz.kz',
      role: 'admin',
      isActive: true,
      avatar: '',
      createdAt: '2026-01-01T00:00:00Z',
    };
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return !!saved;
  });

  const CURRENT_PROJECT_KEY = 'ziz_current_project_id';

  const [currentProjectId, setCurrentProjectIdState] = useState<string>(() => {
    return localStorage.getItem(CURRENT_PROJECT_KEY) || '';
  });

  const setCurrentProjectId = (id: string) => {
    setCurrentProjectIdState(id);
    if (id) {
      localStorage.setItem(CURRENT_PROJECT_KEY, id);
    } else {
      localStorage.removeItem(CURRENT_PROJECT_KEY);
    }
  };

  // Modals state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [newTaskInitialStatus, setNewTaskInitialStatus] = useState<TaskStatus>('todo');
  const [isTechSpecOpen, setIsTechSpecOpen] = useState(false);
  const [isDocumentsOpen, setIsDocumentsOpen] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2000);
  };

  useEffect(() => {
    const doSync = () => {
      engine.syncWithBackend().then(() => {
        refreshUsers();
      });
    };

    // Initial sync
    doSync();

    // Re-sync when user returns to the browser tab
    window.addEventListener('focus', doSync);

    return () => {
      window.removeEventListener('focus', doSync);
    };
  }, [isAuthenticated]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(user));
    showToast(`Вы вошли как ${user.name} (${user.role.toUpperCase()})`);
    navigate('/projects');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    showToast('Вы вышли из системы');
    navigate('/login');
  };

  const userProjects = engine.getProjectsForUser(currentUser);
  const activeProject = userProjects.find(p => p.id === currentProjectId && !p.isArchived) || userProjects.find(p => !p.isArchived);

  const projectTasks = activeProject
    ? engine.getTasksForProject(currentUser, activeProject.id)
    : [];

  const projectMembers = allUsers.filter(u => activeProject?.memberIds.includes(u.id));
  const canManageTeam = RBACGuard.canManageUsers(currentUser);

  // Handler methods with error handling
  const handleMoveTask = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const updated = engine.moveTask(currentUser, taskId, newStatus);
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({ ...updated });
      }
      showToast(`Задача перенесена в status '${newStatus.toUpperCase()}'`);
      await apiRequest(`/tasks/${taskId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      }).catch(() => null);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleCreateTask = async (data: any) => {
    if (!activeProject) return;
    try {
      const payload = {
        projectId: activeProject.id,
        ...data,
      };
      const created = await apiRequest<Task>('/tasks', {
        method: 'POST',
        body: JSON.stringify(payload),
      }).catch(() => null);
      const task = engine.createTask(currentUser, created || payload);
      if (data.status && data.status !== 'todo') {
        engine.moveTask(currentUser, task.id, data.status);
      }
      refreshUsers();
      showToast(`Задача '${task.title}' создана`);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await apiRequest(`/tasks/${taskId}`, { method: 'DELETE' }).catch(() => null);
      engine.deleteTask(currentUser, taskId);
      refreshUsers();
      showToast(`Задача была удалена`);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleToggleChecklist = async (taskId: string, itemId: string) => {
    try {
      const updated = engine.toggleChecklistItem(currentUser, taskId, itemId);
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({ ...updated });
      }
      await apiRequest(`/tasks/${taskId}/checklist/${itemId}`, {
        method: 'PUT',
      }).catch(() => null);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleAddComment = async (taskId: string, content: string) => {
    try {
      const createdComment = await apiRequest(`/tasks/${taskId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }).catch(() => null);

      const updated = engine.addComment(currentUser, taskId, content, createdComment);
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({ ...updated });
      }
      refreshUsers();
      showToast(`Комментарий добавлен`);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteTaskComment = async (taskId: string, commentId: string) => {
    try {
      await apiRequest(`/tasks/${taskId}/comments/${commentId}`, {
        method: 'DELETE',
      }).catch(() => null);

      const updated = engine.deleteTaskComment(currentUser, taskId, commentId);
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({ ...updated });
      }
      refreshUsers();
      showToast(`Комментарий удален`);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleAttachFile = async (
    taskId: string,
    fileData: { fileName: string; fileUrl: string; fileSize: number } | string
  ) => {
    try {
      const data =
        typeof fileData === 'string'
          ? { fileName: fileData, fileUrl: `/files/${fileData}`, fileSize: 204800 }
          : fileData;

      const createdAttachment = await apiRequest(`/tasks/${taskId}/attachments`, {
        method: 'POST',
        body: JSON.stringify(data),
      }).catch(() => null);

      const updated = engine.attachFile(currentUser, taskId, data, createdAttachment);
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({ ...updated });
      }
      refreshUsers();
      showToast(`Прикреплено: '${data.fileName}'`);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteTaskAttachment = async (taskId: string, attachmentId: string) => {
    try {
      await apiRequest(`/tasks/${taskId}/attachments/${attachmentId}`, {
        method: 'DELETE',
      }).catch(() => null);

      const updated = engine.deleteTaskAttachment(currentUser, taskId, attachmentId);
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({ ...updated });
      }
      refreshUsers();
      showToast(`Файл удален из задачи`);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleAddSpecVersion = async (data: any) => {
    if (!activeProject) return;
    try {
      await apiRequest(`/projects/${activeProject.id}/spec/versions`, {
        method: 'POST',
        body: JSON.stringify(data),
      }).catch(() => null);
      engine.addSpecVersion(currentUser, activeProject.id, data);
      refreshUsers();
      showToast(`Выпущена новая версия ТЗ!`);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleAskSpecQuestion = async (question: string) => {
    if (!activeProject) return;
    try {
      await apiRequest(`/projects/${activeProject.id}/spec/questions`, {
        method: 'POST',
        body: JSON.stringify({ question, taskId: selectedTask?.id }),
      }).catch(() => null);
      engine.askSpecQuestion(currentUser, activeProject.id, question, selectedTask?.id);
      refreshUsers();
      showToast(`Вопрос по ТЗ отправлен менеджерам`);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleAnswerSpecQuestion = async (questionId: string, answer: string) => {
    if (!activeProject) return;
    try {
      await apiRequest(`/projects/${activeProject.id}/spec/questions/${questionId}/answer`, {
        method: 'PUT',
        body: JSON.stringify({ answer }),
      }).catch(() => null);
      engine.answerSpecQuestion(currentUser, activeProject.id, questionId, answer);
      refreshUsers();
      showToast(`Ответ на вопрос опубликован`);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleAddProjectDocument = async (docData: any) => {
    if (!activeProject) return;
    try {
      const createdDoc = await apiRequest(`/projects/${docData.projectId}/documents`, {
        method: 'POST',
        body: JSON.stringify(docData),
      }).catch(() => null);

      engine.addProjectDocument(currentUser, docData, createdDoc);
      refreshUsers();
      showToast(`Документ '${docData.title}' добавлен в проект`);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteProjectDocument = async (docId: string) => {
    if (!activeProject) return;
    try {
      await apiRequest(`/projects/${activeProject.id}/documents/${docId}`, {
        method: 'DELETE',
      }).catch(() => null);

      engine.deleteProjectDocument(currentUser, activeProject.id, docId);
      refreshUsers();
      showToast(`Документ был удален`);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleCreateProject = async (data: { name: string; key: string; description: string; deadline?: string; color?: string; memberIds?: string[] }) => {
    try {
      const created = await apiRequest('/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      }).catch(() => null);
      const proj = engine.createProject(currentUser, data);
      if (created && created.id) {
        proj.id = created.id;
      }
      refreshUsers();
      setCurrentProjectId(proj.id);
      showToast(`Проект '${proj.name}' успешно создан!`);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateProject = async (projectId: string, updates: any) => {
    try {
      await apiRequest(`/projects/${projectId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }).catch(() => null);
      const proj = engine.updateProject(currentUser, projectId, updates);
      refreshUsers();
      showToast(`Проект '${proj.name}' обновлен!`);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleRestoreProject = async (projectId: string) => {
    try {
      await apiRequest(`/projects/${projectId}/restore`, { method: 'PUT' }).catch(() => null);
      const proj = engine.restoreProject(currentUser, projectId);
      refreshUsers();
      showToast(`Проект '${proj.name}' восстановлен из архива`);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleArchiveProject = async (projectId: string) => {
    try {
      await apiRequest(`/projects/${projectId}/archive`, { method: 'PUT' }).catch(() => null);
      const proj = engine.archiveProject(currentUser, projectId);
      if (currentProjectId === projectId) {
        setCurrentProjectId('');
      }
      refreshUsers();
      showToast(`Проект '${proj.name}' перенесен в архив (Завершен)`);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await apiRequest(`/projects/${projectId}`, { method: 'DELETE' });
      engine.deleteProject(currentUser, projectId);
      if (currentProjectId === projectId) {
        setCurrentProjectId('');
      }
      refreshUsers();
      showToast('Проект безвозвратно удален');
    } catch (err: any) {
      showToast(err.message || 'Ошибка при удалении проекта', 'error');
    }
  };

  // User Management Handlers (For Admin & PM)
  const handleCreateUser = async (data: { name: string; email: string; role: UserRole; password?: string }) => {
    try {
      const created = await apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }).catch(() => null);
      const newUser = engine.createUser(currentUser, data);
      if (created && created.id) {
        newUser.id = created.id;
      }
      refreshUsers();
      showToast(`Сотрудник ${newUser.name} создан!`);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await apiRequest(`/users/${userId}`, { method: 'DELETE' }).catch(() => null);
      engine.deleteUser(currentUser, userId);
      refreshUsers();
      showToast('Сотрудник удален из команды');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      await apiRequest(`/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole }),
      }).catch(() => null);
      engine.updateUserRole(currentUser, userId, newRole);
      refreshUsers();
      showToast(`Роль сотрудника обновлена на ${newRole.toUpperCase()}`);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateUserPassword = async (userId: string, newPassword: string) => {
    try {
      await apiRequest(`/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ password: newPassword }),
      }).catch(() => null);
      engine.updateUserPassword(currentUser, userId, newPassword);
      refreshUsers();
      showToast(`Пароль для входа зашифрован и обновлен`);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleToggleUserActive = (userId: string, currentActive: boolean) => {
    try {
      if (currentActive) {
        engine.deactivateUser(currentUser, userId);
      } else {
        engine.activateUser(currentUser, userId);
      }
      refreshUsers();
      showToast(`Статус учетной записи изменен`);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateUserAvatar = async (newAvatarUrl: string) => {
    try {
      const res = await apiRequest<{ avatar: string }>(`/users/${currentUser.id}/avatar`, {
        method: 'PUT',
        body: JSON.stringify({ avatar: newAvatarUrl }),
      }).catch(() => null);

      const avatarToSet = res?.avatar || newAvatarUrl;
      const updatedUser = engine.updateUserAvatar(currentUser.id, avatarToSet);
      setCurrentUser({ ...updatedUser });
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedUser));
      refreshUsers();
      showToast('Аватарка профиля успешно обновлена');
    } catch (err: any) {
      showToast(err.message || 'Ошибка обновления аватара', 'error');
    }
  };

  return (
    <>
      <Routes>
        {/* Login Route */}
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/board" replace /> : <LoginPage users={allUsers} onLogin={handleLogin} />
          }
        />

        {/* Authenticated Application Layout */}
        {isAuthenticated ? (
          <Route
            element={
              <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text-main)' }}>
                {/* Sidebar */}
                <Sidebar
                  currentUser={currentUser}
                  onLogout={handleLogout}
                />

                {/* Main Content Container */}
                <main style={{ marginLeft: 'var(--sidebar-width)', minHeight: '100vh' }}>
                  <Outlet />
                </main>
              </div>
            }
          >
            <Route path="/" element={<Navigate to="/projects" replace />} />

            <Route
              path="/board"
              element={
                activeProject ? (
                  <>
                    <Header
                      project={activeProject}
                      taskCount={projectTasks.length}
                      members={projectMembers}
                      currentUser={currentUser}
                      onOpenDocuments={() => setIsDocumentsOpen(true)}
                      onOpenNewTask={() => {
                        setNewTaskInitialStatus('todo');
                        setIsNewTaskOpen(true);
                      }}
                    />
                    <KanbanBoard
                      tasks={projectTasks}
                      users={allUsers}
                      currentUser={currentUser}
                      onSelectTask={task => setSelectedTask(task)}
                      onMoveTask={handleMoveTask}
                      onOpenNewTaskModal={status => {
                        setNewTaskInitialStatus(status || 'todo');
                        setIsNewTaskOpen(true);
                      }}
                    />
                  </>
                ) : (
                  <ProjectSelectPlaceholder
                    projects={userProjects}
                    currentUser={currentUser}
                    onSelectProject={id => setCurrentProjectId(id)}
                    onCreateProject={() => navigate('/projects')}
                  />
                )
              }
            />

            <Route
              path="/projects"
              element={
                <ProjectsView
                  key={userListVersion}
                  projects={userProjects}
                  users={allUsers}
                  currentUser={currentUser}
                  onSelectProject={id => {
                    setCurrentProjectId(id);
                    navigate('/board');
                  }}
                  onCreateProject={handleCreateProject}
                  onUpdateProject={handleUpdateProject}
                  onRestoreProject={handleRestoreProject}
                  onArchiveProject={handleArchiveProject}
                  onDeleteProject={handleDeleteProject}
                />
              }
            />

            <Route
              path="/tasks"
              element={
                <MyTasksView
                  tasks={projectTasks}
                  currentUser={currentUser}
                  onSelectTask={task => setSelectedTask(task)}
                  onNavigateBoard={() => navigate('/board')}
                  onNavigateProjects={() => navigate('/projects')}
                />
              }
            />

            <Route
              path="/team"
              element={
                canManageTeam ? (
                  <TeamManagementView
                    key={userListVersion}
                    users={engine.getUsers(currentUser)}
                    currentUser={currentUser}
                    onCreateUser={handleCreateUser}
                    onDeleteUser={handleDeleteUser}
                    onUpdateRole={handleUpdateUserRole}
                    onUpdatePassword={handleUpdateUserPassword}
                    onToggleActive={handleToggleUserActive}
                  />
                ) : (
                  <Navigate to="/board" replace />
                )
              }
            />

            <Route
              path="/settings"
              element={
                <SettingsView
                  currentUser={currentUser}
                  theme={theme}
                  onToggleTheme={handleToggleTheme}
                  onUpdateAvatar={handleUpdateUserAvatar}
                />
              }
            />

            <Route path="/logs" element={<Navigate to="/board" replace />} />
            <Route path="*" element={<Navigate to="/board" replace />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>

      {/* Global Modals & Drawers */}
      {isAuthenticated && (
        <>
          {toast && (
            <div className="toast-container">
              <div
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  boxShadow: 'var(--shadow-hover)',
                  minWidth: '280px',
                  maxWidth: '420px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: toast.type === 'error' ? 'var(--danger-soft)' : 'var(--success-soft)',
                    color: toast.type === 'error' ? 'var(--danger-text)' : 'var(--success-text)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                </div>

                <div style={{ flex: 1, fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', lineHeight: '1.4' }}>
                  {toast.message}
                </div>

                <button
                  onClick={() => setToast(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-faint)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                    transition: 'color 0.15s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-main)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-faint)')}
                >
                  <X size={16} />
                </button>

                {/* Animated Timer Line at Bottom */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    height: '3px',
                    backgroundColor: toast.type === 'error' ? 'var(--danger)' : 'var(--primary)',
                    animation: 'toastProgress 2s linear forwards',
                  }}
                />
              </div>
            </div>
          )}

          {selectedTask && activeProject && (
            <TaskDetailModal
              task={projectTasks.find(t => t.id === selectedTask.id) || selectedTask}
              project={activeProject}
              users={allUsers}
              currentUser={currentUser}
              onClose={() => setSelectedTask(null)}
              onMoveTask={handleMoveTask}
              onToggleChecklist={handleToggleChecklist}
              onAddComment={handleAddComment}
              onDeleteComment={handleDeleteTaskComment}
              onAttachFile={handleAttachFile}
              onDeleteAttachment={handleDeleteTaskAttachment}
              onAskSpecQuestion={handleAskSpecQuestion}
              onAnswerSpecQuestion={handleAnswerSpecQuestion}
              onDeleteTask={handleDeleteTask}
            />
          )}

          {isNewTaskOpen && activeProject && (
            <NewTaskModal
              project={activeProject}
              users={allUsers}
              initialStatus={newTaskInitialStatus}
              onClose={() => setIsNewTaskOpen(false)}
              onCreateTask={handleCreateTask}
            />
          )}

          {isTechSpecOpen && activeProject && (
            <TechSpecModal
              project={activeProject}
              currentUser={currentUser}
              onClose={() => setIsTechSpecOpen(false)}
              onAddSpecVersion={handleAddSpecVersion}
              onAskQuestion={handleAskSpecQuestion}
              onAnswerQuestion={handleAnswerSpecQuestion}
            />
          )}

          {isDocumentsOpen && activeProject && (
            <ProjectDocumentsModal
              project={activeProject}
              currentUser={currentUser}
              onClose={() => setIsDocumentsOpen(false)}
              onAddDocument={handleAddProjectDocument}
              onDeleteDocument={handleDeleteProjectDocument}
            />
          )}
        </>
      )}
    </>
  );
};
