import React, { useState } from 'react';
import { ZizLogo } from './ZizLogo';
import { User } from '../types/rbac';
import { apiRequest, setAuthToken } from '../api/client';
import { Eye, EyeOff } from 'lucide-react';

interface LoginPageProps {
  users?: User[];
  onLogin: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('abylai@ziz.kz');
  const [password, setPassword] = useState('123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await apiRequest<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (res.token) {
        setAuthToken(res.token);
      }
      onLogin(res.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка авторизации на сервере');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: 'var(--bg)',
        fontFamily: 'var(--font-family)',
      }}
    >
      {/* Left Column (Dark Side) */}
      <div
        style={{
          width: '42%',
          backgroundColor: '#1B2130',
          padding: '40px 48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: '#FFFFFF',
          position: 'relative',
        }}
      >
        {/* Top Brand Logo */}
        <div>
          <ZizLogo lightText={true} />
        </div>

        {/* Hero Content */}
        <div style={{ maxWidth: '440px' }}>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 800,
              lineHeight: '1.25',
              marginBottom: '32px',
              color: '#FFFFFF',
              letterSpacing: '-0.5px',
            }}
          >
            Задачи, доска <br />и ТЗ проекта — <br />в одном месте.
          </h1>

          {/* Mini Card Wireframe Visual Graphic */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <div
              style={{
                width: '110px',
                height: '70px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '10px',
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '4px',
                  borderRadius: '2px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  marginBottom: '8px',
                }}
              />
              <div
                style={{
                  width: '80px',
                  height: '6px',
                  borderRadius: '3px',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  marginBottom: '12px',
                }}
              />
              <div
                style={{
                  width: '50px',
                  height: '6px',
                  borderRadius: '3px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                }}
              />
            </div>

            <div
              style={{
                width: '110px',
                height: '70px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(39, 84, 255, 0.15)',
                border: '1.5px solid var(--primary)',
                padding: '10px',
                boxShadow: '0 0 16px rgba(39, 84, 255, 0.2)',
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '4px',
                  borderRadius: '2px',
                  backgroundColor: 'var(--primary)',
                  marginBottom: '8px',
                }}
              />
              <div
                style={{
                  width: '70px',
                  height: '6px',
                  borderRadius: '3px',
                  backgroundColor: '#FFFFFF',
                  marginBottom: '12px',
                }}
              />
              <div
                style={{
                  width: '40px',
                  height: '6px',
                  borderRadius: '3px',
                  backgroundColor: 'rgba(255, 255, 255, 0.4)',
                }}
              />
            </div>

            <div
              style={{
                width: '110px',
                height: '70px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '10px',
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '4px',
                  borderRadius: '2px',
                  backgroundColor: '#12A594',
                  marginBottom: '8px',
                }}
              />
              <div
                style={{
                  width: '60px',
                  height: '6px',
                  borderRadius: '3px',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  marginBottom: '12px',
                }}
              />
              <div
                style={{
                  width: '30px',
                  height: '6px',
                  borderRadius: '3px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer Copyright */}
        <div style={{ fontSize: '11px', color: '#566175', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>© 2026 ZIZ INC.</span>
          <span style={{ color: '#2754FF', fontSize: '10px', fontWeight: 600 }}>by @daurenswrld</span>
        </div>
      </div>

      {/* Right Column (Form Container) */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          backgroundColor: '#F6F7F9',
        }}
      >
        <div style={{ width: '100%', maxWidth: '380px' }}>
          {/* Header */}
          <div style={{ marginBottom: '24px' }}>
            <h2
              style={{
                fontSize: '28px',
                fontWeight: 800,
                color: '#242B39',
                marginBottom: '8px',
              }}
            >
              Вход
            </h2>
            <p
              style={{
                fontSize: '13px',
                color: '#6B7486',
                lineHeight: '1.5',
              }}
            >
              Аккаунты создаёт администратор.
            </p>
          </div>

          {/* Form Card */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-xl)',
              padding: '32px',
              boxShadow: '0 8px 32px rgba(36, 43, 57, 0.06)',
              border: '1px solid #E8EBF0',
            }}
          >
            {errorMsg && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--danger-soft)',
                  color: 'var(--danger-text)',
                  fontSize: '12px',
                  fontWeight: 600,
                  marginBottom: '16px',
                }}
              >
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Email Input */}
              <div>
                <label
                  className="text-label"
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#8E97AB',
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.8px',
                  }}
                >
                  EMAIL
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-field"
                  style={{
                    border: '1.5px solid #2754FF',
                    boxShadow: 'var(--focus-ring)',
                    padding: '12px 14px',
                    fontSize: '14px',
                  }}
                />
              </div>

              {/* Password Input */}
              <div>
                <label
                  className="text-label"
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#8E97AB',
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.8px',
                  }}
                >
                  ПАРОЛЬ
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input-field"
                    style={{
                      backgroundColor: '#FAFBFC',
                      padding: '12px 40px 12px 14px',
                      fontSize: '14px',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#8E97AB',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '13px',
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    color: '#4A5468',
                    fontWeight: 500,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    style={{
                      accentColor: '#2754FF',
                      width: '16px',
                      height: '16px',
                      borderRadius: '4px',
                    }}
                  />
                  <span>Запомнить меня</span>
                </label>

                <a
                  href="#forgot"
                  onClick={e => {
                    e.preventDefault();
                    alert('Для сброса пароля обратитесь к Администратору.');
                  }}
                  style={{
                    color: '#2754FF',
                    fontWeight: 700,
                    fontSize: '13px',
                  }}
                >
                  Забыли пароль?
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#2754FF',
                  boxShadow: '0 4px 12px rgba(39, 84, 255, 0.25)',
                }}
              >
                {loading ? 'Вход...' : 'Войти'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
