import React, { useRef, useState } from 'react';
import { User } from '../types/rbac';
import { Moon, Sun, Paintbrush, Camera, Upload, Check } from 'lucide-react';

interface SettingsViewProps {
  currentUser: User;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onUpdateAvatar?: (newAvatarUrl: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  theme,
  onToggleTheme,
  onUpdateAvatar,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (!file.type.startsWith('image/')) return;

    const img = new Image();
    const reader = new FileReader();

    reader.onload = event => {
      img.src = event.target?.result as string;
    };

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 512;
      let width = img.width;
      let height = img.height;

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
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const webpDataUrl = canvas.toDataURL('image/webp', 0.85);
        if (onUpdateAvatar) {
          onUpdateAvatar(webpDataUrl);
          setUploadSuccess(true);
          setTimeout(() => setUploadSuccess(false), 3000);
        }
      }
    };

    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div
      className="settings-view-container"
      style={{
        padding: '32px',
        maxWidth: '960px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
      }}
    >
      {/* Header */}
      <div>
        <h1 className="h1-title" style={{ color: 'var(--text-main)', marginBottom: '6px' }}>
          Настройки
        </h1>
        <p className="text-body" style={{ color: 'var(--text-muted)' }}>
          Управление темой оформления, аватаркой профиля и настройками системы Ziz Tasks
        </p>
      </div>

      {/* Profile Avatar Section */}
      <section
        className="settings-section settings-avatar-section"
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
          padding: '24px',
          boxShadow: 'var(--shadow-rest)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Camera size={20} color="var(--primary)" />
          <div>
            <h3 className="card-title" style={{ fontSize: '16px', color: 'var(--text-main)' }}>
              Аватарка профиля
            </h3>
            <div className="text-secondary">Загрузите фотографию для вашего профиля.</div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg)',
            border: '1px solid var(--border)',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ position: 'relative' }}>
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="settings-avatar-img"
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--primary)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-main)' }}>
                {currentUser.name}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {currentUser.email}
              </div>
            </div>
          </div>

          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
              className="settings-avatar-file-input"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-primary settings-avatar-upload-btn"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}
            >
              {uploadSuccess ? <Check size={16} /> : <Upload size={16} />}
              {uploadSuccess ? 'Аватар обновлен!' : 'Изменить аватарку'}
            </button>
          </div>
        </div>
      </section>

      {/* Theme / Appearance Section */}
      <section
        className="settings-section settings-theme-section"
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
          padding: '24px',
          boxShadow: 'var(--shadow-rest)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Paintbrush size={20} color="var(--primary)" />
          <div>
            <h3 className="card-title" style={{ fontSize: '16px', color: 'var(--text-main)' }}>
              Внешний вид и тема
            </h3>
            <div className="text-secondary">Выберите предпочтительное цветовое оформление интерфейса</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {/* Light Theme Card Option */}
          <div
            onClick={() => {
              if (theme !== 'light') onToggleTheme();
            }}
            style={{
              padding: '20px',
              borderRadius: 'var(--radius-lg)',
              border: theme === 'light' ? '2px solid var(--primary)' : '1px solid var(--border)',
              backgroundColor: theme === 'light' ? 'var(--primary-soft)' : 'var(--bg)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E8EBF0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                }}
              >
                <Sun size={20} color="#F59E0B" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-main)' }}>
                  Светлая тема
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Классический светлый интерфейс
                </div>
              </div>
            </div>
            {theme === 'light' && (
              <span className="badge badge-tag" style={{ fontSize: '11px', fontWeight: 800 }}>
                АКТИВНО
              </span>
            )}
          </div>

          {/* Dark Theme Card Option */}
          <div
            onClick={() => {
              if (theme !== 'dark') onToggleTheme();
            }}
            style={{
              padding: '20px',
              borderRadius: 'var(--radius-lg)',
              border: theme === 'dark' ? '2px solid var(--primary)' : '1px solid var(--border)',
              backgroundColor: theme === 'dark' ? 'var(--primary-soft)' : 'var(--bg)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                }}
              >
                <Moon size={20} color="#38BDF8" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-main)' }}>
                  Тёмная (Ночная) тема
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Тёмный интерфейс
                </div>
              </div>
            </div>
            {theme === 'dark' && (
              <span className="badge badge-tag" style={{ fontSize: '11px', fontWeight: 800 }}>
                АКТИВНО
              </span>
            )}
          </div>
        </div>
      </section>

    </div>
  );
};
