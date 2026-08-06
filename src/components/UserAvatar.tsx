import React from 'react';
import { User } from '../types/rbac';
import { DEFAULT_ZIZ_AVATAR } from '../constants/avatar';

interface UserAvatarProps {
  user?: Partial<User> | null;
  src?: string | null;
  name?: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  src,
  name,
  size = 36,
  className = '',
  style = {},
}) => {
  const avatarSrc = src || user?.avatar || DEFAULT_ZIZ_AVATAR;
  const displayName = name || user?.name || 'Пользователь';

  return (
    <img
      src={avatarSrc}
      alt={displayName}
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        objectFit: 'cover',
        backgroundColor: '#FFFFFF',
        border: '1.5px solid var(--border)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        display: 'inline-block',
        flexShrink: 0,
        ...style,
      }}
    />
  );
};
