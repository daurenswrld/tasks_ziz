import { Permission, UserRole } from '../types/rbac';

export const ROLE_PERMISSIONS: Record<UserRole, Set<Permission>> = {
  admin: new Set<Permission>([
    // User management
    'user:create',
    'user:deactivate',
    'user:update_role',
    'user:update_password',
    'user:list_all',
    // Project management
    'project:view_all',
    'project:create',
    'project:delete', // Admin ONLY
    'project:edit_spec',
    'project:manage_spec_versions',
    // Task management
    'task:create',
    'task:delete',
    'task:edit_metadata',
    'task:move_any',
    'task:move_own',
    'task:add_comment',
    'task:toggle_checklist',
    'task:attach_file',
    'task:ask_spec_question',
    'task:answer_spec_question',
    'task:close_spec_question',
  ]),

  pm: new Set<Permission>([
    // User management (as requested for Aldiyar PM & Abylai Admin)
    'user:create',
    'user:deactivate',
    'user:update_role',
    'user:update_password',
    'user:list_all',
    // Project management
    'project:create',
    'project:delete',
    'project:edit_spec',
    'project:manage_spec_versions',
    // Task management
    'task:create',
    'task:delete',
    'task:edit_metadata',
    'task:move_any',
    'task:move_own',
    'task:add_comment',
    'task:toggle_checklist',
    'task:attach_file',
    'task:ask_spec_question',
    'task:answer_spec_question',
    'task:close_spec_question',
  ]),

  developer: new Set<Permission>([
    // Task actions permitted for developers
    'task:create',
    'task:move_own', // Can ONLY move tasks assigned to them
    'task:add_comment',
    'task:toggle_checklist',
    'task:ask_spec_question',
  ]),
};

/**
 * Checks if a role has a given raw permission token.
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions ? permissions.has(permission) : false;
}
