import { Project, Task, User } from '../types/rbac';
import { hasPermission } from './permissions';

export class PermissionDeniedError extends Error {
  public code: string;
  public actorId: string;
  public requiredPermission: string;

  constructor(actor: User, permission: string, reason?: string) {
    const message = `[RBAC Error] User '${actor.name}' (${actor.role}) is denied permission '${permission}'. ${reason ? `Reason: ${reason}` : ''}`;
    super(message);
    this.name = 'PermissionDeniedError';
    this.code = 'PERMISSION_DENIED';
    this.actorId = actor.id;
    this.requiredPermission = permission;
  }
}

export interface SecurityContext {
  project?: Project;
  task?: Task;
  targetUser?: User;
}

export class RBACGuard {
  /**
   * Helper method to check if a user is active.
   */
  public static isUserActive(user: User): boolean {
    return user && user.isActive;
  }

  /**
   * Evaluates if a user can view a given project.
   * Admin: sees all projects.
   * PM / Developer: sees projects where they are in project.memberIds.
   */
  public static canViewProject(user: User, project: Project): boolean {
    if (!this.isUserActive(user)) return false;
    if (user.role === 'admin') return true;
    return project.memberIds.includes(user.id);
  }

  /**
   * Evaluates if a user can move a specific task.
   * Admin & PM: can move ANY task in project.
   * Developer: can ONLY move tasks where task.assigneeId === user.id.
   */
  public static canMoveTask(user: User, task: Task, project?: Project): boolean {
    if (!this.isUserActive(user)) return false;
    
    // Check if user has access to project
    if (project && !this.canViewProject(user, project)) return false;

    if (hasPermission(user.role, 'task:move_any')) return true;

    if (hasPermission(user.role, 'task:move_own')) {
      return task.assigneeId === user.id;
    }

    return false;
  }

  /**
   * Evaluates if a user can create tasks.
   * All active roles (Admin, PM, Developer) allowed.
   */
  public static canCreateTask(user: User): boolean {
    if (!this.isUserActive(user)) return false;
    return hasPermission(user.role, 'task:create');
  }

  /**
   * Evaluates if a user can create/delete tasks or edit task metadata (priority, deadline, assignee).
   * Admin & PM only.
   */
  public static canManageTaskMetadata(user: User): boolean {
    if (!this.isUserActive(user)) return false;
    return hasPermission(user.role, 'task:edit_metadata');
  }

  /**
   * Evaluates if a user can attach/delete files on a task.
   * Admin and PM allowed. Developers can view only.
   */
  public static canAttachFileToTask(user: User, _task?: Task): boolean {
    if (!this.isUserActive(user)) return false;
    return hasPermission(user.role, 'task:attach_file');
  }

  /**
   * Evaluates if a user can answer or close a spec question.
   * PM & Admin only.
   */
  public static canAnswerSpecQuestion(user: User): boolean {
    if (!this.isUserActive(user)) return false;
    return hasPermission(user.role, 'task:answer_spec_question');
  }

  /**
   * Evaluates if a user can edit Project Spec or release new spec versions.
   * PM & Admin only.
   */
  public static canEditProjectSpec(user: User): boolean {
    if (!this.isUserActive(user)) return false;
    return hasPermission(user.role, 'project:edit_spec');
  }

  /**
   * Evaluates if a user can create a project.
   * Admin and PM allowed.
   */
  public static canCreateProject(user: User): boolean {
    if (!this.isUserActive(user)) return false;
    return hasPermission(user.role, 'project:create');
  }

  /**
   * Evaluates if a user can delete a project.
   * Admin ONLY.
   */
  public static canDeleteProject(user: User): boolean {
    if (!this.isUserActive(user)) return false;
    return hasPermission(user.role, 'project:delete');
  }

  /**
   * Evaluates if a user can manage other users (create, deactivate, change role, change password).
   * Admin and PM allowed.
   */
  public static canManageUsers(user: User): boolean {
    if (!this.isUserActive(user)) return false;
    return hasPermission(user.role, 'user:create');
  }

  /**
   * Backend Assertion: Enforces permission check and throws error if unauthorized.
   */
  public static assertCanMoveTask(user: User, task: Task, project?: Project): void {
    if (!this.canMoveTask(user, task, project)) {
      if (user.role === 'developer' && task.assigneeId !== user.id) {
        throw new PermissionDeniedError(
          user,
          'task:move_own',
          'Developers can only move tasks assigned to themselves.'
        );
      }
      throw new PermissionDeniedError(user, 'task:move', 'Insufficient permissions to move task.');
    }
  }

  public static assertCanCreateProject(user: User): void {
    if (!this.canCreateProject(user)) {
      throw new PermissionDeniedError(
        user,
        'project:create',
        'Only Administrators and Project Managers can create projects.'
      );
    }
  }

  public static assertCanDeleteProject(user: User): void {
    if (!this.canDeleteProject(user)) {
      throw new PermissionDeniedError(
        user,
        'project:delete',
        'Only Administrators are allowed to delete projects.'
      );
    }
  }

  public static assertCanManageUsers(user: User): void {
    if (!this.canManageUsers(user)) {
      throw new PermissionDeniedError(
        user,
        'user:manage',
        'Only Administrators and Project Managers can create/deactivate users or modify passwords and roles.'
      );
    }
  }

  public static assertCanEditSpec(user: User): void {
    if (!this.canEditProjectSpec(user)) {
      throw new PermissionDeniedError(
        user,
        'project:edit_spec',
        'Developers cannot edit project specifications.'
      );
    }
  }

  public static assertCanCreateTask(user: User): void {
    if (!this.canCreateTask(user)) {
      throw new PermissionDeniedError(
        user,
        'task:create',
        'User is not allowed to create tasks.'
      );
    }
  }

  public static assertCanManageTaskMetadata(user: User): void {
    if (!this.canManageTaskMetadata(user)) {
      throw new PermissionDeniedError(
        user,
        'task:edit_metadata',
        'Developers cannot create/delete tasks or modify task deadline, priority, or assignees.'
      );
    }
  }

  public static assertCanAnswerSpecQuestion(user: User): void {
    if (!this.canAnswerSpecQuestion(user)) {
      throw new PermissionDeniedError(
        user,
        'task:answer_spec_question',
        'Only PM and Admin can answer or resolve questions regarding the project spec.'
      );
    }
  }
}
