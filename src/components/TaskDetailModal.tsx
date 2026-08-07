import React, { useState, useRef } from 'react';
import { Project, Task, TaskStatus, User } from '../types/rbac';
import { RBACGuard } from '../rbac/guard';
import { formatDeadlineDate } from '../utils/date';
import {
  X,
  MessageSquare,
  Trash2,
  Send,
  Image as ImageIcon,
  Paperclip,
  Upload,
  ZoomIn,
} from 'lucide-react';

interface TaskDetailModalProps {
  task: Task;
  project: Project;
  users: User[];
  currentUser: User;
  onClose: () => void;
  onMoveTask: (taskId: string, newStatus: TaskStatus) => void;
  onToggleChecklist?: (taskId: string, itemId: string) => void;
  onAddComment: (taskId: string, content: string) => void;
  onDeleteComment?: (taskId: string, commentId: string) => void;
  onAttachFile?: (taskId: string, fileData: { fileName: string; fileUrl: string; fileSize: number } | string) => void;
  onDeleteAttachment?: (taskId: string, attachmentId: string) => void;
  onAskSpecQuestion?: (question: string) => void;
  onAnswerSpecQuestion?: (questionId: string, answer: string) => void;
  onDeleteTask: (taskId: string) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  users,
  currentUser,
  onClose,
  onMoveTask,
  onAddComment,
  onDeleteComment,
  onAttachFile,
  onDeleteAttachment,
  onDeleteTask,
}) => {
  const [commentText, setCommentText] = useState('');
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const assignee = users.find(u => u.id === task.assigneeId);
  const canMove = RBACGuard.canMoveTask(currentUser, task);
  const canEditMetadata = RBACGuard.canManageTaskMetadata(currentUser);
  const canAttach = RBACGuard.canAttachFileToTask(currentUser, task);

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(task.id, commentText);
    setCommentText('');
  };

  const compressToWebP = (file: File): Promise<{ fileName: string; fileUrl: string; fileSize: number }> => {
    return new Promise(resolve => {
      if (!file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = e => {
          resolve({
            fileName: file.name,
            fileUrl: (e.target?.result as string) || '',
            fileSize: file.size,
          });
        };
        reader.onerror = () => {
          resolve({ fileName: file.name, fileUrl: '', fileSize: file.size });
        };
        reader.readAsDataURL(file);
        return;
      }

      const img = new Image();
      const reader = new FileReader();

      reader.onload = e => {
        img.src = e.target?.result as string;
      };

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        const maxDim = 1920;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const fileUrl = URL.createObjectURL(file);
          resolve({ fileName: file.name, fileUrl, fileSize: file.size });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP format with high quality (0.82)
        const webpDataUrl = canvas.toDataURL('image/webp', 0.82);
        const base64Head = 'data:image/webp;base64,';
        const base64Data = webpDataUrl.replace(base64Head, '');
        const compressedSize = Math.round((base64Data.length * 3) / 4);

        const newFileName = file.name.replace(/\.[^/.]+$/, '') + '.webp';

        resolve({
          fileName: newFileName,
          fileUrl: webpDataUrl,
          fileSize: compressedSize,
        });
      };

      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    for (const file of files) {
      try {
        const compressed = await compressToWebP(file);
        if (onAttachFile) {
          onAttachFile(task.id, compressed);
        }
      } catch (err) {
        console.error('File compression error:', err);
      }
    }
    e.target.value = '';
  };

  const isImageFile = (url: string, name: string) => {
    return (
      url.startsWith('data:image') ||
      url.startsWith('blob:') ||
      /\.(jpg|jpeg|png|gif|webp|svg)/i.test(url) ||
      /\.(jpg|jpeg|png|gif|webp|svg)/i.test(name)
    );
  };

  return (
    <div
      className="modal-backdrop task-detail-backdrop"
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
      onClick={onClose}
    >
      <div
        className="modal-container task-detail-container"
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-modal)',
          border: '1px solid var(--border)',
          padding: '28px',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="task-detail-header"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '20px',
          }}
        >
          <div className="task-detail-header-main">
            <div className="task-detail-meta" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="badge badge-tag task-detail-tag">Задача #{task.id.slice(-4)}</span>
              <span className={`priority-dot ${task.priority}`} />
              <span className="text-secondary task-detail-priority-text" style={{ textTransform: 'capitalize' }}>
                Приоритет: {task.priority}
              </span>
            </div>
            <h2 className="h2-title task-detail-title" style={{ color: 'var(--text-main)' }}>
              {task.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost task-detail-close-btn"
            style={{ padding: '8px', borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Status bar & Assignee Info */}
        <div
          className="task-detail-status-bar"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '12px 16px',
            backgroundColor: 'var(--bg)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '24px',
          }}
        >
          <div className="task-detail-status-group">
            <div className="text-secondary task-detail-status-label" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
              Статус:
            </div>
            {canMove ? (
              <select
                value={task.status}
                onChange={e => onMoveTask(task.id, e.target.value as TaskStatus)}
                className="task-detail-status-select"
                style={{
                  background: 'none',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '14px',
                  color: 'var(--primary-text)',
                  cursor: 'pointer',
                }}
              >
                <option value="todo">To Do</option>
                <option value="doing">Doing</option>
                <option value="done">Done</option>
              </select>
            ) : (
              <span className="task-detail-status-val" style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase' }}>
                {task.status}
              </span>
            )}
          </div>

          <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border)' }} />

          <div className="task-detail-assignee-group">
            <div className="text-secondary task-detail-assignee-label" style={{ fontSize: '11px' }}>
              Исполнитель:
            </div>
            <div className="task-detail-assignee-name" style={{ fontSize: '14px', fontWeight: 600 }}>
              {assignee ? assignee.name : 'Не назначен'}
            </div>
          </div>

          <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border)' }} />

          <div className="task-detail-deadline-group">
            <div className="text-secondary task-detail-deadline-label" style={{ fontSize: '11px' }}>
              Дедлайн:
            </div>
            <div className="task-detail-deadline-val" style={{ fontSize: '14px', fontWeight: 600 }}>
              {formatDeadlineDate(task.deadline)}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="task-detail-section task-detail-description" style={{ marginBottom: '24px' }}>
          <h4 className="card-title task-detail-section-title" style={{ marginBottom: '8px' }}>
            Описание
          </h4>
          <p className="text-body task-detail-description-text" style={{ color: 'var(--text-body-color)' }}>
            {task.description || 'Описание не заполнено.'}
          </p>
        </div>

        {/* Photos & Attachments Section */}
        <div className="task-detail-section task-detail-photos" style={{ marginBottom: '24px' }}>
          <div
            className="task-photos-header"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}
          >
            <div className="task-photos-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ImageIcon size={16} color="var(--primary)" />
              <h4 className="card-title">Прикрепленные фото и файлы ({task.attachments.length})</h4>
            </div>

            {canAttach && (
              <div className="task-photos-actions">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,.pdf,.doc,.docx"
                  multiple
                  style={{ display: 'none' }}
                  className="task-photos-file-input"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-secondary btn-sm task-photos-upload-btn"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
                >
                  <Upload size={13} /> Прикрепить фото
                </button>
              </div>
            )}
          </div>

          {task.attachments.length === 0 ? (
            <div
              className="task-photos-empty-dropzone"
              onClick={() => canAttach && fileInputRef.current?.click()}
              style={{
                border: '1.5px dashed var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                textAlign: 'center',
                backgroundColor: 'var(--surface-subtle, rgba(0,0,0,0.01))',
                cursor: canAttach ? 'pointer' : 'default',
                transition: 'all 0.15s ease',
              }}
            >
              <ImageIcon size={26} style={{ color: 'var(--text-faint)', marginBottom: '6px' }} />
              <div className="task-photos-empty-text" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                {canAttach ? 'Нажмите, чтобы загрузить фотографии к задаче' : 'Нет прикрепленных фотографий'}
              </div>
            </div>
          ) : (
            <div
              className="task-photos-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                gap: '10px',
              }}
            >
              {task.attachments.map(att => {
                const isImg = isImageFile(att.fileUrl, att.fileName);
                return (
                  <div
                    key={att.id}
                    className="task-photo-card"
                    style={{
                      position: 'relative',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg)',
                      aspectRatio: '1',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isImg ? (
                      <div
                        className="task-photo-wrapper"
                        onClick={() => setPreviewImageUrl(att.fileUrl)}
                        style={{
                          width: '100%',
                          height: '100%',
                          cursor: 'pointer',
                          position: 'relative',
                        }}
                      >
                        <img
                          src={att.fileUrl}
                          alt={att.fileName}
                          className="task-photo-img"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                        <div
                          className="task-photo-overlay"
                          style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.3)',
                            opacity: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'opacity 0.15s ease',
                            color: '#fff',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                          onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                        >
                          <ZoomIn size={18} />
                        </div>
                      </div>
                    ) : (
                      <div
                        className="task-file-badge"
                        style={{
                          padding: '8px',
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Paperclip size={18} color="var(--primary)" />
                        <span
                          className="task-file-name"
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            wordBreak: 'break-all',
                            color: 'var(--text-main)',
                          }}
                        >
                          {att.fileName}
                        </span>
                      </div>
                    )}

                    {/* Delete Attachment Button */}
                    {onDeleteAttachment && (canAttach || att.uploadedBy === currentUser.name || currentUser.role === 'admin' || currentUser.role === 'pm') && (
                      <button
                        type="button"
                        className="task-photo-delete-btn"
                        onClick={e => {
                          e.stopPropagation();
                          onDeleteAttachment(task.id, att.id);
                        }}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(239, 68, 68, 0.9)',
                          color: '#fff',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                        }}
                        title="Удалить файл"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Comments Section */}
        <div className="task-detail-section task-detail-comments" style={{ marginBottom: '24px' }}>
          <div
            className="task-comments-header"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px',
            }}
          >
            <MessageSquare size={16} color="var(--primary)" />
            <h4 className="card-title">Обсуждение ({task.comments.length})</h4>
          </div>

          <div
            className="task-comments-list"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              marginBottom: '14px',
            }}
          >
            {task.comments.map(c => {
              const canDeleteComment = c.authorId === currentUser.id || currentUser.role === 'admin' || currentUser.role === 'pm';
              return (
                <div
                  key={c.id}
                  className="task-comment-card"
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div
                    className="task-comment-meta"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '4px',
                    }}
                  >
                    <span className="task-comment-author" style={{ fontSize: '13px', fontWeight: 700 }}>{c.authorName}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="task-comment-date" style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                        {c.createdAt.slice(11, 16)}
                      </span>
                      {onDeleteComment && canDeleteComment && (
                        <button
                          type="button"
                          onClick={() => onDeleteComment(task.id, c.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--danger)',
                            cursor: 'pointer',
                            padding: '2px',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title="Удалить комментарий"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="task-comment-text" style={{ fontSize: '13px', color: 'var(--text-body-color)' }}>
                    {c.content}
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleSendComment} className="task-comment-form" style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Напишите комментарий к задаче..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              className="input-field task-comment-input"
            />
            <button type="submit" className="btn btn-primary task-comment-submit-btn">
              <Send size={14} />
            </button>
          </form>
        </div>

        {/* Footer with Delete Task option (Admin & PM only under RBAC rules) */}
        {canEditMetadata && (
          <div
            className="task-detail-footer"
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              borderTop: '1px solid var(--border)',
              paddingTop: '16px',
            }}
          >
            <button
              onClick={() => {
                onDeleteTask(task.id);
                onClose();
              }}
              className="btn btn-danger task-delete-btn"
            >
              <Trash2 size={14} /> Удалить задачу
            </button>
          </div>
        )}

        {/* Lightbox Image Preview Modal */}
        {previewImageUrl && (
          <div
            className="task-photo-lightbox-backdrop"
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(8px)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
            }}
            onClick={() => setPreviewImageUrl(null)}
          >
            <button
              onClick={() => setPreviewImageUrl(null)}
              className="task-photo-lightbox-close-btn"
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: '#fff',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={20} />
            </button>
            <img
              src={previewImageUrl}
              alt="Увеличенное фото"
              className="task-photo-lightbox-img"
              style={{
                maxWidth: '90vw',
                maxHeight: '85vh',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
                objectFit: 'contain',
              }}
              onClick={e => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    </div>
  );
};
