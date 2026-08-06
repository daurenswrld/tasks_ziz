import { ActivityLog, TargetType, User } from '../types/rbac';

export class ActivityLogger {
  private logs: ActivityLog[] = [];

  public logAction(
    actor: User,
    action: string,
    details: string,
    targetType: TargetType,
    targetId: string
  ): ActivityLog {
    const entry: ActivityLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action,
      details,
      targetType,
      targetId,
      timestamp: new Date().toISOString(),
    };

    this.logs.unshift(entry); // newest first
    return entry;
  }

  public getLogs(filter?: {
    actorId?: string;
    targetType?: TargetType;
    targetId?: string;
    limit?: number;
  }): ActivityLog[] {
    let result = [...this.logs];
    if (filter?.actorId) {
      result = result.filter(l => l.actorId === filter.actorId);
    }
    if (filter?.targetType) {
      result = result.filter(l => l.targetType === filter.targetType);
    }
    if (filter?.targetId) {
      result = result.filter(l => l.targetId === filter.targetId);
    }
    if (filter?.limit) {
      result = result.slice(0, filter.limit);
    }
    return result;
  }

  public clear(): void {
    this.logs = [];
  }
}

export const globalLogger = new ActivityLogger();
