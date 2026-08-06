import React, { useState } from 'react';
import { Project, SpecContentType, User } from '../types/rbac';
import { RBACGuard } from '../rbac/guard';
import { X, FileText, Plus, CheckCircle2 } from 'lucide-react';

interface TechSpecModalProps {
  project: Project;
  currentUser: User;
  onClose: () => void;
  onAddSpecVersion: (data: {
    title: string;
    type: SpecContentType;
    content: string;
    changelog?: string;
  }) => void;
  onAskQuestion: (question: string) => void;
  onAnswerQuestion: (questionId: string, answer: string) => void;
}

export const TechSpecModal: React.FC<TechSpecModalProps> = ({
  project,
  currentUser,
  onClose,
  onAddSpecVersion,
  onAskQuestion,
  onAnswerQuestion,
}) => {
  const [selectedVersionId, setSelectedVersionId] = useState<string>(
    project.spec.currentVersionId
  );
  const [isAddingVersion, setIsAddingVersion] = useState(false);

  // New Version form
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<SpecContentType>('text');
  const [newContent, setNewContent] = useState('');
  const [newChangelog, setNewChangelog] = useState('');

  // Ask question
  const [questionText, setQuestionText] = useState('');
  const [answeringQId, setAnsweringQId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');

  const canEditSpec = RBACGuard.canEditProjectSpec(currentUser);
  const canAnswerQuestion = RBACGuard.canAnswerSpecQuestion(currentUser);

  const currentVersion =
    project.spec.versions.find(v => v.id === selectedVersionId) || project.spec.versions[0];

  const handleCreateVersionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    onAddSpecVersion({
      title: newTitle,
      type: newType,
      content: newContent,
      changelog: newChangelog,
    });
    setIsAddingVersion(false);
    setNewTitle('');
    setNewContent('');
    setNewChangelog('');
  };

  const handleAskQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;
    onAskQuestion(questionText);
    setQuestionText('');
  };

  const handleAnswerSubmit = (qId: string) => {
    if (!answerText.trim()) return;
    onAnswerQuestion(qId, answerText);
    setAnsweringQId(null);
    setAnswerText('');
  };

  return (
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
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: '740px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-modal)',
          border: '1px solid var(--border)',
          padding: '28px',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FileText size={24} color="var(--primary)" />
            <div>
              <h2 className="h2-title" style={{ color: 'var(--text-main)' }}>
                ТЗ проекта: {project.name}
              </h2>
              <div className="text-secondary">Версия: v{currentVersion?.versionNumber}.0</div>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '8px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Version History Selector */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            backgroundColor: 'var(--bg)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="text-label" style={{ color: 'var(--text-muted)' }}>
              История версий:
            </span>
            <select
              value={selectedVersionId}
              onChange={e => setSelectedVersionId(e.target.value)}
              className="input-field"
              style={{ width: 'auto', padding: '6px 12px', fontSize: '13px' }}
            >
              {project.spec.versions.map(v => (
                <option key={v.id} value={v.id}>
                  v{v.versionNumber}.0 — {v.title} ({v.createdAt.slice(0, 10)})
                </option>
              ))}
            </select>
          </div>

          {/* Add Version Button (HIDDEN for Developers) */}
          {canEditSpec && !isAddingVersion && (
            <button
              onClick={() => setIsAddingVersion(true)}
              className="btn btn-secondary btn-sm"
            >
              <Plus size={14} /> Выпустить новую версию ТЗ
            </button>
          )}
        </div>

        {/* Create Version Form (PM / Admin only) */}
        {isAddingVersion && canEditSpec && (
          <form
            onSubmit={handleCreateVersionSubmit}
            style={{
              padding: '16px',
              border: '1.5px solid var(--primary-border)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--primary-soft)',
              marginBottom: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <h4 className="card-title">Релиз новой версии ТЗ (v{project.spec.versions.length + 1}.0)</h4>

            <input
              type="text"
              required
              placeholder="Заголовок новой версии ТЗ..."
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="input-field"
            />

            <select
              value={newType}
              onChange={e => setNewType(e.target.value as SpecContentType)}
              className="input-field"
            >
              <option value="text">Текстовая спецификация</option>
              <option value="link">Ссылка на документ / Figma</option>
              <option value="file">Ссылка на файл</option>
            </select>

            <textarea
              rows={4}
              required
              placeholder="Содержание спецификации или URL ссылки..."
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              className="input-field"
            />

            <input
              type="text"
              placeholder="Опишите список изменений (Changelog)..."
              value={newChangelog}
              onChange={e => setNewChangelog(e.target.value)}
              className="input-field"
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setIsAddingVersion(false)}
                className="btn btn-ghost btn-sm"
              >
                Отмена
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                Опубликовать ТЗ
              </button>
            </div>
          </form>
        )}

        {/* Current Version Content */}
        {currentVersion && (
          <div
            style={{
              padding: '20px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--surface)',
              marginBottom: '24px',
            }}
          >
            <h3 className="card-title" style={{ fontSize: '16px', marginBottom: '8px' }}>
              {currentVersion.title}
            </h3>

            {currentVersion.type === 'link' ? (
              <a
                href={currentVersion.content}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '14px', textDecoration: 'underline' }}
              >
                🔗 {currentVersion.content}
              </a>
            ) : (
              <p
                style={{
                  fontSize: '14px',
                  lineHeight: '1.65',
                  color: 'var(--text-body-color)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {currentVersion.content}
              </p>
            )}

            {currentVersion.changelog && (
              <div
                style={{
                  marginTop: '16px',
                  paddingTop: '12px',
                  borderTop: '1px dashed var(--dashed)',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                }}
              >
                <strong>Список изменений:</strong> {currentVersion.changelog}
              </div>
            )}
          </div>
        )}

        {/* Spec Questions Section */}
        <div>
          <h4 className="card-title" style={{ marginBottom: '12px' }}>
            Вопросы и ответы по ТЗ ({project.spec.questions.length})
          </h4>

          <form
            onSubmit={handleAskQuestionSubmit}
            style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}
          >
            <input
              type="text"
              placeholder="Задать вопрос по ТЗ..."
              value={questionText}
              onChange={e => setQuestionText(e.target.value)}
              className="input-field"
            />
            <button type="submit" className="btn btn-secondary">
              Задать вопрос
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {project.spec.questions.map(q => (
              <div
                key={q.id}
                style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '6px' }}>
                  ❓ {q.question}
                </div>

                {q.answer ? (
                  <div
                    style={{
                      fontSize: '13px',
                      color: 'var(--success-text)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginTop: '6px',
                    }}
                  >
                    <CheckCircle2 size={16} />
                    <span>Ответ: {q.answer}</span>
                  </div>
                ) : (
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--warn-text)', fontWeight: 600 }}>
                      Статус: В ожидании ответа
                    </span>
                    {canAnswerQuestion && (
                      <div style={{ marginTop: '8px' }}>
                        {answeringQId === q.id ? (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                              type="text"
                              placeholder="Введите ответ на вопрос..."
                              value={answerText}
                              onChange={e => setAnswerText(e.target.value)}
                              className="input-field"
                            />
                            <button
                              onClick={() => handleAnswerSubmit(q.id)}
                              className="btn btn-primary btn-sm"
                            >
                              Отправить
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAnsweringQId(q.id)}
                            className="btn btn-ghost btn-sm"
                          >
                            Ответить на вопрос
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
