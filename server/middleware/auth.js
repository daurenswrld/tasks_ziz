const jwt = require('jsonwebtoken');
const { readDB } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'ziz_crm_super_secret_jwt_key_2026';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Токен авторизации отсутствует' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Недействительный или истекший токен' });
    }

    const db = readDB();
    const user = db.users.find(u => u.id === decoded.userId);

    if (!user || !user.isActive) {
      return res.status(403).json({ error: 'Пользователь не найден или деактивирован' });
    }

    req.user = user;
    next();
  });
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'У вас недостаточно прав для этого действия' });
    }
    next();
  };
}

module.exports = {
  JWT_SECRET,
  authenticateToken,
  requireRole,
};
