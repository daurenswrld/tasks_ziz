import {
  Project,
  ProjectDocument,
  SpecContentType,
  Task,
  TaskPriority,
  TaskStatus,
  User,
  UserRole,
} from '../types/rbac';
import { RBACGuard } from './guard';
import { ActivityLogger, globalLogger } from './logger';
import { INITIAL_PROJECTS, INITIAL_TASKS, INITIAL_USERS } from './mockData';

import { apiRequest } from '../api/client';

export class RBACEngine {
  private users: User[] = [...INITIAL_USERS];
  private projects: Project[] = [...INITIAL_PROJECTS];
  private tasks: Task[] = [...INITIAL_TASKS];
  private logger: ActivityLogger = globalLogger;

  public async syncWithBackend(): Promise<void> {
    try {
      const [fetchedUsers, fetchedProjects, fetchedTasks] = await Promise.all([
        apiRequest<User[]>('/users').catch(() => null),
        apiRequest<Project[]>('/projects').catch(() => null),
        apiRequest<Task[]>('/tasks').catch(() => null),
      ]);

      if (fetchedUsers && Array.isArray(fetchedUsers) && fetchedUsers.length > 0) {
        this.users = fetchedUsers;
      }
      if (fetchedProjects && Array.isArray(fetchedProjects)) {
        this.projects = fetchedProjects;
      }
      if (fetchedTasks && Array.isArray(fetchedTasks)) {
        this.tasks = fetchedTasks;
      }
    } catch (err) {
      console.warn('Sync with backend failed:', err);
    }
  }

  // --- QUERY APIs (Filtered according to user role) ---

  public getUsers(actor: User): User[] {
    if (!RBACGuard.canManageUsers(actor)) return [];
    return [...this.users];
  }

  public getAllUsersForSelection(): User[] {
    return this.users.filter(u => u.isActive);
  }

  public getProjectsForUser(actor: User): Project[] {
    if (!RBACGuard.isUserActive(actor)) return [];
    
    const rawProjects = actor.role === 'admin'
      ? this.projects
      : this.projects.filter(p => p.memberIds.includes(actor.id));

    return rawProjects.map(p => {
      const projTasks = this.tasks.filter(t => t.projectId === p.id);
      const completed = projTasks.filter(t => t.status === 'done').length;
      const total = projTasks.length;
      return {
        ...p,
        totalTasksCount: total,
        completedTasksCount: completed,
      };
    });
  }

  public getTasksForProject(actor: User, projectId: string): Task[] {
    const project = this.projects.find(p => p.id === projectId);
    if (!project) return [];

    if (!RBACGuard.canViewProject(actor, project)) {
      return [];
    }
    return this.tasks.filter(t => t.projectId === projectId);
  }

  public getLogs() {
    return this.logger.getLogs();
  }

  // --- USER MANAGEMENT (Admin Only) ---

  public createUser(
    actor: User,
    data: { name: string; email: string; role: UserRole; password?: string; avatar?: string }
  ): User {
    RBACGuard.assertCanManageUsers(actor);

    const newUser: User = {
      id: `u_${Date.now()}`,
      name: data.name,
      email: data.email,
      password: data.password || '123456',
      role: data.role,
      isActive: true,
      avatar: data.avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`,
      createdAt: new Date().toISOString(),
    };

    this.users.push(newUser);

    this.logger.logAction(
      actor,
      'Пользователь создан',
      `Создан новый пользователь '${newUser.name}' с ролью '${newUser.role}'`,
      'user',
      newUser.id
    );

    return newUser;
  }

  public deleteUser(actor: User, targetUserId: string): void {
    RBACGuard.assertCanManageUsers(actor);

    const index = this.users.findIndex(u => u.id === targetUserId);
    if (index === -1) throw new Error('Пользователь не найден');

    const targetName = this.users[index].name;
    this.users.splice(index, 1);

    this.logger.logAction(
      actor,
      'Пользователь удален',
      `Удален пользователь '${targetName}' из состава команды`,
      'user',
      targetUserId
    );
  }

  public updateUserPassword(actor: User, targetUserId: string, newPassword: string): User {
    RBACGuard.assertCanManageUsers(actor);

    const user = this.users.find(u => u.id === targetUserId);
    if (!user) throw new Error('Пользователь не найден');

    user.password = newPassword;

    this.logger.logAction(
      actor,
      'Пароль изменен',
      `Обновлен пароль для входа пользователя '${user.name}'`,
      'user',
      user.id
    );

    return user;
  }

  public updateUserAvatar(userId: string, avatarUrl: string): User {
    const user = this.users.find(u => u.id === userId);
    if (!user) throw new Error('Пользователь не найден');
    user.avatar = avatarUrl;
    return user;
  }

  public deactivateUser(actor: User, targetUserId: string): User {
    RBACGuard.assertCanManageUsers(actor);

    const user = this.users.find(u => u.id === targetUserId);
    if (!user) throw new Error('Пользователь не найден');

    user.isActive = false;

    this.logger.logAction(
      actor,
      'Пользователь деактивирован',
      `Деактивирована учетная запись '${user.name}'`,
      'user',
      user.id
    );

    return user;
  }

  public createProject(
    actor: User,
    data: { name: string; key: string; description: string; deadline?: string; color?: string; memberIds?: string[] }
  ): Project {
    RBACGuard.assertCanCreateProject(actor);

    const todayFormatted = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

    const newProject: Project = {
      id: `proj_${Date.now()}`,
      name: data.name,
      key: data.key,
      description: data.description,
      deadline: data.deadline,
      color: data.color || '#2754FF',
      memberIds: Array.from(new Set([actor.id, ...(data.memberIds || [])])),
      completedTasksCount: 0,
      totalTasksCount: 0,
      spec: { currentVersionId: '', versions: [], questions: [] },
      documents: [],
      updatedAtText: `Создан ${todayFormatted}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.projects.push(newProject);

    this.logger.logAction(
      actor,
      'Проект создан',
      `Создан новый проект '${newProject.name}' [${newProject.key}]`,
      'project',
      newProject.id
    );

    return newProject;
  }

  public restoreProject(actor: User, projectId: string): Project {
    RBACGuard.assertCanCreateProject(actor);

    const project = this.projects.find(p => p.id === projectId);
    if (!project) throw new Error('Проект не найден');

    const todayFormatted = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

    project.isArchived = false;
    project.statusBadge = undefined;
    project.updatedAt = new Date().toISOString();
    project.updatedAtText = `Восстановлен ${todayFormatted}`;

    this.logger.logAction(
      actor,
      'Проект восстановлен из архива',
      `Восстановлен проект '${project.name}'`,
      'project',
      project.id
    );

    return project;
  }

  public archiveProject(actor: User, projectId: string): Project {
    RBACGuard.assertCanCreateProject(actor);

    const project = this.projects.find(p => p.id === projectId);
    if (!project) throw new Error('Проект не найден');

    const todayFormatted = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

    project.isArchived = true;
    project.statusBadge = 'Завершён';
    project.updatedAt = new Date().toISOString();
    project.updatedAtText = `Завершён ${todayFormatted}`;

    this.logger.logAction(
      actor,
      'Проект перенесен в архив',
      `Заархивирован проект '${project.name}'`,
      'project',
      project.id
    );

    return project;
  }

  public addProjectDocument(
    actor: User,
    docData: Omit<ProjectDocument, 'id' | 'uploadedAt'>
  ): ProjectDocument {
    const project = this.projects.find(p => p.id === docData.projectId);
    if (!project) throw new Error('Проект не найден');

    if (!project.documents) {
      project.documents = [];
    }

    const newDoc: ProjectDocument = {
      id: `doc_${Date.now()}`,
      ...docData,
      uploadedAt: new Date().toISOString(),
    };

    project.documents.push(newDoc);
    project.updatedAt = new Date().toISOString();

    this.logger.logAction(
      actor,
      'Документ прикреплен к проекту',
      `Загружен новый документ '${newDoc.title}' (${newDoc.category.toUpperCase()}) в проект '${project.name}'`,
      'project',
      project.id
    );

    return newDoc;
  }

  public deleteProjectDocument(actor: User, projectId: string, docId: string): void {
    RBACGuard.assertCanManageUsers(actor);

    const project = this.projects.find(p => p.id === projectId);
    if (!project || !project.documents) throw new Error('Документ не найден');

    const index = project.documents.findIndex(d => d.id === docId);
    if (index === -1) throw new Error('Документ не найден');

    const title = project.documents[index].title;
    project.documents.splice(index, 1);
    project.updatedAt = new Date().toISOString();

    this.logger.logAction(
      actor,
      'Документ проекта удален',
      `Удален документ '${title}' из проекта '${project.name}'`,
      'project',
      project.id
    );
  }

  public activateUser(actor: User, targetUserId: string): User {
    RBACGuard.assertCanManageUsers(actor);

    const user = this.users.find(u => u.id === targetUserId);
    if (!user) throw new Error('Пользователь не найден');

    user.isActive = true;

    this.logger.logAction(
      actor,
      'Пользователь активирован',
      `Активирована учетная запись '${user.name}'`,
      'user',
      user.id
    );

    return user;
  }

  public updateUserRole(actor: User, targetUserId: string, newRole: UserRole): User {
    RBACGuard.assertCanManageUsers(actor);

    const user = this.users.find(u => u.id === targetUserId);
    if (!user) throw new Error('Пользователь не найден');

    const oldRole = user.role;
    user.role = newRole;

    this.logger.logAction(
      actor,
      'Изменение роли',
      `Изменена роль пользователя '${user.name}' с '${oldRole}' на '${newRole}'`,
      'user',
      user.id
    );

    return user;
  }

  // --- PROJECT MANAGEMENT ---

  public deleteProject(actor: User, projectId: string): void {
    RBACGuard.assertCanDeleteProject(actor);

    const index = this.projects.findIndex(p => p.id === projectId);
    if (index === -1) throw new Error('Проект не найден');

    const projName = this.projects[index].name;
    this.projects.splice(index, 1);
    this.tasks = this.tasks.filter(t => t.projectId !== projectId);

    this.logger.logAction(
      actor,
      'Удаление проекта',
      `Проект '${projName}' удален безвозвратно`,
      'project',
      projectId
    );
  }

  // --- SPEC MANAGEMENT ---

  public addSpecVersion(
    actor: User,
    projectId: string,
    data: { title: string; type: SpecContentType; content: string; changelog?: string }
  ): Project {
    RBACGuard.assertCanEditSpec(actor);

    const project = this.projects.find(p => p.id === projectId);
    if (!project) throw new Error('Проект не найден');

    const nextVerNumber = project.spec.versions.length + 1;
    const newVersionId = `ver_v${nextVerNumber}_${Date.now()}`;

    project.spec.versions.unshift({
      id: newVersionId,
      versionNumber: nextVerNumber,
      type: data.type,
      title: data.title,
      content: data.content,
      changelog: data.changelog || 'Без описания изменений',
      createdBy: actor.id,
      createdAt: new Date().toISOString(),
    });

    project.spec.currentVersionId = newVersionId;
    project.updatedAt = new Date().toISOString();

    this.logger.logAction(
      actor,
      'Смена версии ТЗ',
      `Добавлена новая версия ТЗ v${nextVerNumber}: "${data.title}"`,
      'spec',
      projectId
    );

    return project;
  }

  public askSpecQuestion(
    actor: User,
    projectId: string,
    questionText: string,
    taskId?: string
  ): Project {
    const project = this.projects.find(p => p.id === projectId);
    if (!project) throw new Error('Проект не найден');

    if (!RBACGuard.canViewProject(actor, project)) {
      throw new Error('Доступ к проекту запрещен');
    }

    const newQuestion = {
      id: `q_${Date.now()}`,
      projectId,
      taskId,
      question: questionText,
      askedBy: actor.id,
      askedAt: new Date().toISOString(),
      status: 'open' as const,
    };

    project.spec.questions.unshift(newQuestion);

    this.logger.logAction(
      actor,
      'Вопрос по ТЗ',
      `Задан вопрос по ТЗ: "${questionText}"`,
      'spec_question',
      newQuestion.id
    );

    return project;
  }

  public answerSpecQuestion(
    actor: User,
    projectId: string,
    questionId: string,
    answerText: string
  ): Project {
    RBACGuard.assertCanAnswerSpecQuestion(actor);

    const project = this.projects.find(p => p.id === projectId);
    if (!project) throw new Error('Проект не найден');

    const question = project.spec.questions.find(q => q.id === questionId);
    if (!question) throw new Error('Вопрос не найден');

    question.answer = answerText;
    question.answeredBy = actor.id;
    question.answeredAt = new Date().toISOString();
    question.status = 'resolved';

    this.logger.logAction(
      actor,
      'Ответ на вопрос по ТЗ',
      `Ответ на вопрос "${question.question}": "${answerText}"`,
      'spec_question',
      questionId
    );

    return project;
  }

  // --- TASK MANAGEMENT ---

  public createTask(
    actor: User,
    data: {
      projectId: string;
      title: string;
      description: string;
      priority: TaskPriority;
      deadline?: string;
      assigneeId?: string;
    }
  ): Task {
    RBACGuard.assertCanCreateTask(actor);

    const project = this.projects.find(p => p.id === data.projectId);
    if (!project) throw new Error('Проект не найден');

    const newTask: Task = {
      id: `task_${Date.now()}`,
      projectId: data.projectId,
      title: data.title,
      description: data.description,
      status: 'todo',
      priority: data.priority,
      deadline: data.deadline,
      assigneeId: data.assigneeId,
      createdById: actor.id,
      checklist: [],
      comments: [],
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.tasks.push(newTask);

    this.logger.logAction(
      actor,
      'Создание задачи',
      `Создана задача '${newTask.title}' в проекте '${project.name}'`,
      'task',
      newTask.id
    );

    return newTask;
  }

  public moveTask(actor: User, taskId: string, newStatus: TaskStatus): Task {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) throw new Error('Задача не найдена');

    const project = this.projects.find(p => p.id === task.projectId);

    // Enforce strict backend permission check
    RBACGuard.assertCanMoveTask(actor, task, project);

    const oldStatus = task.status;
    task.status = newStatus;
    task.updatedAt = new Date().toISOString();

    const statusLabels: Record<TaskStatus, string> = {
      todo: 'To Do',
      doing: 'Doing',
      done: 'Done',
    };

    this.logger.logAction(
      actor,
      'Перенос задачи',
      `Перемещена задача '${task.title}' из '${statusLabels[oldStatus]}' в '${statusLabels[newStatus]}'`,
      'task',
      task.id
    );

    return task;
  }

  public updateTaskMetadata(
    actor: User,
    taskId: string,
    updates: Partial<Pick<Task, 'description' | 'priority' | 'deadline' | 'assigneeId' | 'title'>>
  ): Task {
    RBACGuard.assertCanManageTaskMetadata(actor);

    const task = this.tasks.find(t => t.id === taskId);
    if (!task) throw new Error('Задача не найдена');

    Object.assign(task, updates);
    task.updatedAt = new Date().toISOString();

    this.logger.logAction(
      actor,
      'Обновление параметров задачи',
      `Обновлены метаданные задачи '${task.title}'`,
      'task',
      task.id
    );

    return task;
  }

  public deleteTask(actor: User, taskId: string): void {
    RBACGuard.assertCanManageTaskMetadata(actor);

    const index = this.tasks.findIndex(t => t.id === taskId);
    if (index === -1) throw new Error('Задача не найдена');

    const title = this.tasks[index].title;
    this.tasks.splice(index, 1);

    this.logger.logAction(
      actor,
      'Удаление задачи',
      `Задача '${title}' была удалена`,
      'task',
      taskId
    );
  }

  public toggleChecklistItem(actor: User, taskId: string, itemId: string): Task {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) throw new Error('Задача не найдена');

    const item = task.checklist.find(c => c.id === itemId);
    if (!item) throw new Error('Элемент чек-листа не найден');

    item.completed = !item.completed;
    item.completedBy = item.completed ? actor.name : undefined;
    item.completedAt = item.completed ? new Date().toISOString() : undefined;

    this.logger.logAction(
      actor,
      'Чек-лист обновлен',
      `Отметка в чек-листе "${item.title}" задачи '${task.title}' set to ${item.completed}`,
      'task',
      task.id
    );

    return task;
  }

  public addComment(actor: User, taskId: string, content: string): Task {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) throw new Error('Задача не найдена');

    const comment = {
      id: `cm_${Date.now()}`,
      taskId,
      authorId: actor.id,
      authorName: actor.name,
      content,
      createdAt: new Date().toISOString(),
    };

    task.comments.push(comment);

    this.logger.logAction(
      actor,
      'Добавлен комментарий',
      `Комментарий к задаче '${task.title}': "${content}"`,
      'task',
      task.id
    );

    return task;
  }

  public attachFile(
    actor: User,
    taskId: string,
    fileData: { fileName: string; fileUrl: string; fileSize: number }
  ): Task {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) throw new Error('Задача не найдена');

    if (!RBACGuard.canAttachFileToTask(actor, task)) {
      throw new Error('Разработчик может прикреплять файлы только к своим задачам.');
    }

    const attachment = {
      id: `att_${Date.now()}`,
      taskId,
      fileName: fileData.fileName,
      fileUrl: fileData.fileUrl,
      fileSize: fileData.fileSize,
      uploadedBy: actor.name,
      uploadedAt: new Date().toISOString(),
    };

    task.attachments.push(attachment);

    this.logger.logAction(
      actor,
      'Прикреплен файл',
      `К задаче '${task.title}' прикреплен файл ${fileData.fileName}`,
      'task',
      task.id
    );

    return task;
  }

  public deleteTaskAttachment(actor: User, taskId: string, attachmentId: string): Task {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) throw new Error('Задача не найдена');

    const index = task.attachments.findIndex(a => a.id === attachmentId);
    if (index === -1) throw new Error('Вложение не найдено');

    const fileName = task.attachments[index].fileName;
    task.attachments.splice(index, 1);
    task.updatedAt = new Date().toISOString();

    this.logger.logAction(
      actor,
      'Удалено вложение задачи',
      `Удален файл '${fileName}' из задачи '${task.title}'`,
      'task',
      task.id
    );

    return task;
  }
}
