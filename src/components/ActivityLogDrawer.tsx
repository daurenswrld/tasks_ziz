import React from 'react';
import { ActivityLog } from '../types/rbac';
import { X, Activity } from 'lucide-react';

interface ActivityLogDrawerProps {
  logs: ActivityLog[];
  onClose: () => void;
}

export const ActivityLogDrawer: React.FC<ActivityLogDrawerProps> = ({ logs, onClose }) => {
  const getBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'badge-tag';
      case 'pm':
        return 'badge-new';
      default:
        return 'badge-success';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(36, 43, 57, 0.4)',
        backdropFilter: 'blur(3px)',
        zIndex: 50,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          height: '100vh',
          backgroundColor: 'var(--surface)',
          boxShadow: 'var(--shadow-modal)',
          borderLeft: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={20} color="var(--primary)" />
            <h2 className="h2-title" style={{ fontSize: '18px', color: 'var(--text-main)' }}>
              Журнал действий (Audit Logs)
            </h2>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Logs list */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {logs.length === 0 ? (
            <div className="text-secondary" style={{ textAlign: 'center', marginTop: '40px' }}>
              Логи пока отсутствуют. Выполните любое действие!
            </div>
          ) : (
            logs.map(log => (
              <div
                key={log.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700 }}>{log.actorName}</span>
                    <span className={`badge ${getBadgeColor(log.actorRole)}`} style={{ fontSize: '10px' }}>
                      {log.actorRole}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                    {log.timestamp.slice(11, 19)}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--primary-text)',
                    marginBottom: '2px',
                  }}
                >
                  {log.action}
                </div>

                <div style={{ fontSize: '13px', color: 'var(--text-body-color)' }}>
                  {log.details}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
