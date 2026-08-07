import React, { useState } from 'react';
import { Project, ProjectDocument, User } from '../types/rbac';
import { RBACGuard } from '../rbac/guard';
import {
  FileText,
  FolderOpen,
  Download,
  Trash2,
  X,
  Plus,
  UploadCloud,
} from 'lucide-react';

interface ProjectDocumentsModalProps {
  project: Project;
  currentUser: User;
  onClose: () => void;
  onAddDocument: (doc: Omit<ProjectDocument, 'id' | 'uploadedAt'>) => void;
  onDeleteDocument: (docId: string) => void;
}

export const ProjectDocumentsModal: React.FC<ProjectDocumentsModalProps> = ({
  project,
  currentUser,
  onClose,
  onAddDocument,
  onDeleteDocument,
}) => {
  const documents = project.documents || [];
  const canManage = RBACGuard.canManageUsers(currentUser);

  const [isUploading, setIsUploading] = useState(false);

  // Form State for adding doc
  const [newTitle, setNewTitle] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setNewFileName(file.name);
      if (!newTitle) {
        setNewTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    let fileUrl = `/documents/${newFileName || 'document.pdf'}`;
    if (selectedFile) {
      fileUrl = await new Promise<string>(resolve => {
        const reader = new FileReader();
        reader.onload = ev => resolve(ev.target?.result as string);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(selectedFile);
      });
    }

    onAddDocument({
      projectId: project.id,
      title: newTitle,
      category: 'other',
      fileName: newFileName || (selectedFile ? selectedFile.name : `${newTitle.toLowerCase().replace(/\s+/g, '_')}.pdf`),
      fileUrl,
      status: 'approved',
      uploadedBy: currentUser.name,
      notes: newNotes || undefined,
    });

    setIsUploading(false);
    setNewTitle('');
    setNewFileName('');
    setNewNotes('');
    setSelectedFile(null);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(36, 43, 57, 0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: '850px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-modal)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 28px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--surface-header)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary-soft)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FolderOpen size={22} />
            </div>
            <div>
              <h2 className="h2-title" style={{ fontSize: '20px', marginBottom: '2px' }}>
                Документы проекта ({documents.length})
              </h2>
              <p className="text-secondary" style={{ margin: 0 }}>
                {project.name}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {canManage && (
              <button
                onClick={() => setIsUploading(true)}
                className="btn btn-primary"
                style={{ gap: '8px', fontSize: '13px' }}
              >
                <Plus size={16} /> Добавить документ
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Documents List */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
          {documents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <FolderOpen size={48} style={{ marginBottom: '12px', opacity: 0.4 }} />
              <h3 className="card-title" style={{ fontSize: '16px', marginBottom: '4px' }}>
                Список документов пуст
              </h3>
              <p className="text-body" style={{ fontSize: '13px' }}>
                Нажмите кнопку «Добавить документ», чтобы загрузить первый файл.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {documents.map(doc => (
                <div
                  key={doc.id}
                  style={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    boxShadow: 'var(--shadow-rest)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                    <div
                      style={{
                        padding: '10px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg)',
                        border: '1px solid var(--border)',
                        color: 'var(--primary)',
                      }}
                    >
                      <FileText size={20} />
                    </div>

                    <div>
                      <h4 className="card-title" style={{ margin: 0, fontSize: '15px', marginBottom: '2px' }}>
                        {doc.title}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        <span>Файл: <b>{doc.fileName}</b></span>
                        <span>Загрузил: <b>{doc.uploadedBy}</b></span>
                        <span>Дата: <b>{new Date(doc.uploadedAt).toLocaleDateString('ru-RU')}</b></span>
                        {doc.notes && <span style={{ fontStyle: 'italic' }}>• {doc.notes}</span>}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <a
                      href={doc.fileUrl}
                      download={doc.fileName}
                      className="btn btn-secondary btn-sm"
                      style={{ gap: '6px' }}
                      onClick={e => {
                        e.preventDefault();
                        alert(`Скачивание файла ${doc.fileName}`);
                      }}
                    >
                      <Download size={14} /> 
                    </a>

                    {canManage && (
                      <button
                        onClick={() => onDeleteDocument(doc.id)}
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--danger)' }}
                        title="Удалить документ"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Document Modal */}
      {isUploading && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setIsUploading(false)}
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
              Добавить документ
            </h3>

            <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="text-label" style={{ display: 'block', marginBottom: '6px' }}>
                  Выберите файл с компьютера *
                </label>
                <label
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    border: '2px dashed var(--dashed)',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--bg)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <UploadCloud size={32} color="var(--primary)" style={{ marginBottom: '8px' }} />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                    {selectedFile ? selectedFile.name : 'Нажмите, чтобы выбрать файл'}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'Поддерживаются PDF, DOCX, XLSX, PNG, JPG'}
                  </span>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              <div>
                <label className="text-label" style={{ display: 'block', marginBottom: '6px' }}>
                  Название документа *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Например: Счёт на оплату №841"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="text-label" style={{ display: 'block', marginBottom: '6px' }}>
                  Имя прикрепляемого файла
                </label>
                <input
                  type="text"
                  placeholder="invoice_841.pdf"
                  value={newFileName}
                  onChange={e => setNewFileName(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="text-label" style={{ display: 'block', marginBottom: '6px' }}>
                  Примечание (необязательно)
                </label>
                <textarea
                  rows={2}
                  placeholder="Дополнительные примечания к файлу..."
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsUploading(false)}
                  className="btn btn-ghost"
                >
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary">
                  Загрузить документ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
