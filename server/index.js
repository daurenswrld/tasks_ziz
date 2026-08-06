const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { readDB, writeDB } = require('./db');
const { JWT_SECRET, authenticateToken, requireRole } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Rate Limiter for Login Endpoint (Prevent Brute Force Attacks)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 login requests per 15 minutes
  message: { error: 'Слишком много попыток входа. Пожалуйста, повторите через 15 минут.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Helper to sanitize user object (remove password)
function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
}

// --- AUTH ROUTES ---

// POST /api/auth/login (With Bcrypt Verification & Rate Limiting)
app.post('/api/auth/login', loginLimiter, (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Заполните e-mail и пароль' });
  }

  const db = readDB();
  const user = db.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());

  if (!user) {
    return res.status(401).json({ error: 'Неверный e-mail или пароль' });
  }

  if (!user.isActive) {
    return res.status(403).json({ error: 'Ваш аккаунт заблокирован или деактивирован' });
  }

  // Verify password using Bcrypt
  const isMatch = bcrypt.compareSync(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ error: 'Неверный e-mail или пароль' });
  }

  // Issue JWT Token
  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    token,
    user: sanitizeUser(user),
  });
});

// GET /api/auth/me
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
});

// --- USERS ROUTES ---

// GET /api/users
app.get('/api/users', authenticateToken, (req, res) => {
  const db = readDB();
  const safeUsers = db.users.map(u => sanitizeUser(u));
  res.json(safeUsers);
});

// PUT /api/users/:id/avatar (Update User Avatar WebP)
app.put('/api/users/:id/avatar', authenticateToken, (req, res) => {
  const { avatar } = req.body;
  const { id } = req.params;

  if (req.user.id !== id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Вы не можете менять аватар другого пользователя' });
  }

  const db = readDB();
  const user = db.users.find(u => u.id === id);

  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }

  user.avatar = avatar;
  writeDB(db);

  res.json({ message: 'Аватар успешно обновлен', avatar: user.avatar, user: sanitizeUser(user) });
});

// POST /api/users (Admin Create User with Hashed Password)
app.post('/api/users', authenticateToken, requireRole(['admin']), (req, res) => {
  const { name, email, role, password, avatar } = req.body;
  const db = readDB();

  if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
  }

  const plainPassword = password || '123456';
  const hashedPassword = bcrypt.hashSync(plainPassword, 10);

  const newUser = {
    id: `u_${Date.now()}`,
    name,
    email,
    password: hashedPassword,
    role,
    isActive: true,
    avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  writeDB(db);

  res.status(201).json(sanitizeUser(newUser));
});

// --- PROJECTS ROUTES ---

// GET /api/projects
app.get('/api/projects', authenticateToken, (req, res) => {
  const db = readDB();
  const actor = req.user;

  let projects = actor.role === 'admin'
    ? db.projects
    : db.projects.filter(p => p.memberIds && p.memberIds.includes(actor.id));

  // Compute dynamic task counts
  projects = projects.map(p => {
    const projTasks = db.tasks.filter(t => t.projectId === p.id);
    const completed = projTasks.filter(t => t.status === 'done').length;
    return {
      ...p,
      totalTasksCount: projTasks.length,
      completedTasksCount: completed,
    };
  });

  res.json(projects);
});

// POST /api/projects (Admin / PM Create Project)
app.post('/api/projects', authenticateToken, requireRole(['admin', 'pm']), (req, res) => {
  const { name, key, description, memberIds, deadline, color } = req.body;
  const db = readDB();

  const newProject = {
    id: `proj_${Date.now()}`,
    name,
    key: key ? key.toUpperCase() : 'PRJ',
    description: description || '',
    memberIds: Array.isArray(memberIds) ? memberIds : [req.user.id],
    deadline: deadline || '',
    color: color || '#2754FF',
    completedTasksCount: 0,
    totalTasksCount: 0,
    isArchived: false,
    spec: { currentVersionId: '', versions: [], questions: [] },
    documents: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.projects.push(newProject);
  writeDB(db);

  res.status(201).json(newProject);
});

// PUT /api/projects/:id/archive (Archive Project)
app.put('/api/projects/:id/archive', authenticateToken, requireRole(['admin', 'pm']), (req, res) => {
  const db = readDB();
  const project = db.projects.find(p => p.id === req.params.id);

  if (!project) {
    return res.status(404).json({ error: 'Проект не найден' });
  }

  project.isArchived = true;
  project.updatedAt = new Date().toISOString();
  writeDB(db);

  res.json(project);
});

// PUT /api/projects/:id/restore (Restore Project)
app.put('/api/projects/:id/restore', authenticateToken, requireRole(['admin', 'pm']), (req, res) => {
  const db = readDB();
  const project = db.projects.find(p => p.id === req.params.id);

  if (!project) {
    return res.status(404).json({ error: 'Проект не найден' });
  }

  project.isArchived = false;
  project.updatedAt = new Date().toISOString();
  writeDB(db);

  res.json(project);
});

// DELETE /api/projects/:id (Delete Project)
app.delete('/api/projects/:id', authenticateToken, requireRole(['admin', 'pm']), (req, res) => {
  const db = readDB();
  const projIndex = db.projects.findIndex(p => p.id === req.params.id);

  if (projIndex === -1) {
    return res.status(404).json({ error: 'Проект не найден' });
  }

  const deletedProject = db.projects[projIndex];
  db.projects.splice(projIndex, 1);

  // Remove tasks belonging to this project
  db.tasks = db.tasks.filter(t => t.projectId !== req.params.id);

  writeDB(db);

  res.json({ message: `Проект '${deletedProject.name}' безвозвратно удален`, id: req.params.id });
});

// --- TASKS ROUTES ---

// GET /api/tasks
app.get('/api/tasks', authenticateToken, (req, res) => {
  const { projectId } = req.query;
  const db = readDB();

  let tasks = db.tasks;
  if (projectId) {
    tasks = tasks.filter(t => t.projectId === projectId);
  }

  res.json(tasks);
});

// POST /api/tasks (Create Task)
app.post('/api/tasks', authenticateToken, (req, res) => {
  const { projectId, title, description, status, priority, deadline, assigneeId, checklist, attachments } = req.body;
  const db = readDB();

  const newTask = {
    id: `task_${Date.now()}`,
    projectId,
    title,
    description: description || '',
    status: status || 'todo',
    priority: priority || 'medium',
    deadline: deadline || '',
    assigneeId: assigneeId || req.user.id,
    createdById: req.user.id,
    checklist: Array.isArray(checklist) ? checklist : [],
    comments: [],
    attachments: Array.isArray(attachments) ? attachments : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.tasks.push(newTask);
  writeDB(db);

  res.status(201).json(newTask);
});

// PUT /api/tasks/:id/status (Move Task)
app.put('/api/tasks/:id/status', authenticateToken, (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  const db = readDB();

  const task = db.tasks.find(t => t.id === id);
  if (!task) {
    return res.status(404).json({ error: 'Задача не найдена' });
  }

  // Developer security check: developer can only move their assigned tasks
  if (req.user.role === 'developer' && task.assigneeId !== req.user.id) {
    return res.status(403).json({ error: 'Разработчик может передвигать только свои задачи' });
  }

  task.status = status;
  task.updatedAt = new Date().toISOString();
  writeDB(db);

  res.json(task);
});

// POST /api/tasks/:id/comments (Add Comment)
app.post('/api/tasks/:id/comments', authenticateToken, (req, res) => {
  const { content } = req.body;
  const { id } = req.params;
  const db = readDB();

  const task = db.tasks.find(t => t.id === id);
  if (!task) {
    return res.status(404).json({ error: 'Задача не найдена' });
  }

  const newComment = {
    id: `cm_${Date.now()}`,
    taskId: id,
    authorId: req.user.id,
    authorName: req.user.name,
    content,
    createdAt: new Date().toISOString(),
  };

  if (!task.comments) task.comments = [];
  task.comments.push(newComment);
  task.updatedAt = new Date().toISOString();
  writeDB(db);

  res.status(201).json(newComment);
});
app.delete('/api/tasks/:id', authenticateToken, requireRole(['admin', 'pm']), (req, res) => {
  const { id } = req.params;
  const db = readDB();

  const taskIndex = db.tasks.findIndex(t => t.id === id);
  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Задача не найдена' });
  }

  const deletedTask = db.tasks[taskIndex];
  db.tasks.splice(taskIndex, 1);
  writeDB(db);

  res.json({ message: `Задача '${deletedTask.title}' удалена`, id });
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`🚀 Secure Ziz Inc CRM Backend Server running at http://localhost:${PORT}`);
});
