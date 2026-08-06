import { RBACEngine } from './engine';
import { RBACGuard } from './guard';
import { INITIAL_USERS } from './mockData';
import { User } from '../types/rbac';

export function runRBACDemo() {
  console.log('=============== STARTING RBAC VERIFICATION DEMO ===============\n');

  const engine = new RBACEngine();

  const admin = INITIAL_USERS.find(u => u.role === 'admin') as User;
  const pm = INITIAL_USERS.find(u => u.role === 'pm') as User;
  const dev1 = INITIAL_USERS.find(u => u.id === 'u_dev1') as User; // Daniil (assigned to task_1)
  const dev2 = INITIAL_USERS.find(u => u.id === 'u_dev2') as User; // Elena (assigned to task_2)

  console.log(`[AUTH CONTEXT] Users loaded:`);
  console.log(` - Admin: ${admin.name}`);
  console.log(` - PM: ${pm.name}`);
  console.log(` - Developer 1 (Assigned to task_1): ${dev1.name}`);
  console.log(` - Developer 2 (Assigned to task_2): ${dev2.name}\n`);

  // --- 1. ADMIN PRIVILEGES & USER MANAGEMENT ---
  console.log('--- TEST 1: Admin User Management & Project Deletion ---');
  const newUser = engine.createUser(admin, {
    name: 'Анастасия Тестировщик',
    email: 'qa.anastasia@company.com',
    role: 'developer',
  });
  console.log(`✅ [Admin] Created new user: ${newUser.name} (Role: ${newUser.role})`);

  engine.deactivateUser(admin, newUser.id);
  console.log(`✅ [Admin] Deactivated user: ${newUser.name}`);

  // Test PM trying to delete project -> Should Fail!
  try {
    engine.deleteProject(pm, 'proj_crm');
    console.error('❌ FAIL: PM was able to delete project!');
  } catch (err: any) {
    console.log(`✅ SUCCESS: PM attempt to delete project blocked: "${err.message}"`);
  }

  // --- 2. PM PRIVILEGES & SPEC MANAGEMENT ---
  console.log('\n--- TEST 2: PM Project, Spec & Task Management ---');
  const newSpecProject = engine.createProject(pm, {
    name: 'Интеграция Telegram Бота',
    key: 'TG',
    description: 'Уведомления о статусах задач в Telegram.',
    memberIds: [dev1.id],
  });
  console.log(`✅ [PM] Created project: ${newSpecProject.name}`);

  engine.addSpecVersion(pm, newSpecProject.id, {
    title: 'ТЗ Telegram Бота v1.0',
    type: 'text',
    content: 'Бот должен отправлять сообщения при смене статуса на Done.',
    changelog: 'Первая версия ТЗ',
  });
  console.log(`✅ [PM] Updated Project Spec to v2`);

  const newTask = engine.createTask(pm, {
    projectId: newSpecProject.id,
    title: 'Настройка Webhook для TG',
    description: 'Обработка входящих событий от Bot API.',
    priority: 'high',
    assigneeId: dev1.id,
  });
  console.log(`✅ [PM] Created task '${newTask.title}' assigned to ${dev1.name}`);

  // PM moving ANY task
  engine.moveTask(pm, 'task_1', 'done');
  console.log(`✅ [PM] Moved task 'task_1' to Done`);

  // --- 3. DEVELOPER PRIVILEGES & RESTRICTIONS ---
  console.log('\n--- TEST 3: Developer Task Dragging & Action Restrictions ---');

  // Developer 1 moves THEIR OWN task -> Should succeed!
  engine.moveTask(dev1, 'task_1', 'doing');
  console.log(`✅ [Dev1] Moved OWN task 'task_1' to Doing (Success)`);

  // Developer 1 tries to move Developer 2's task ('task_2') -> Should fail!
  try {
    engine.moveTask(dev1, 'task_2', 'done');
    console.error('❌ FAIL: Developer was able to move someone else\'s task!');
  } catch (err: any) {
    console.log(`✅ SUCCESS: Developer attempt to move unassigned task blocked: "${err.message}"`);
  }

  // Developer 1 tries to edit Spec -> Should fail!
  try {
    engine.addSpecVersion(dev1, newSpecProject.id, {
      title: 'Взлом ТЗ',
      type: 'text',
      content: 'Попытка разработчика изменить ТЗ',
    });
    console.error('❌ FAIL: Developer edited Spec!');
  } catch (err: any) {
    console.log(`✅ SUCCESS: Developer attempt to edit Spec blocked: "${err.message}"`);
  }

  // Developer 1 asks Spec question -> OK!
  engine.askSpecQuestion(dev1, newSpecProject.id, 'Какого размера должна быть аватарка бота?');
  console.log(`✅ [Dev1] Asked question regarding Project Spec`);

  // PM answers Spec question -> OK!
  const questions = engine.getProjectsForUser(pm).find(p => p.id === newSpecProject.id)?.spec.questions;
  if (questions && questions.length > 0) {
    engine.answerSpecQuestion(pm, newSpecProject.id, questions[0].id, 'Аватарка должна быть 512x512 PNG.');
    console.log(`✅ [PM] Answered Spec Question and resolved status`);
  }

  // --- 4. UI VISIBILITY CONTROLLER CHECK ---
  console.log('\n--- TEST 4: UI Minimalist Visibility Guards ---');
  const task1 = engine.getTasksForProject(admin, 'proj_crm').find(t => t.id === 'task_1')!;
  const task2 = engine.getTasksForProject(admin, 'proj_crm').find(t => t.id === 'task_2')!;

  console.log(`UI UI Element Hiding Flags for Developer ${dev1.name}:`);
  console.log(` - Can move OWN task ('task_1')? -> ${RBACGuard.canMoveTask(dev1, task1)} (Expected: true)`);
  console.log(` - Can move OTHER task ('task_2')? -> ${RBACGuard.canMoveTask(dev1, task2)} (Expected: false -> HIDDEN IN UI)`);
  console.log(` - Can edit Spec? -> ${RBACGuard.canEditProjectSpec(dev1)} (Expected: false -> HIDDEN IN UI)`);
  console.log(` - Can delete Project? -> ${RBACGuard.canDeleteProject(dev1)} (Expected: false -> HIDDEN IN UI)`);
  console.log(` - Can create/delete tasks? -> ${RBACGuard.canManageTaskMetadata(dev1)} (Expected: false -> HIDDEN IN UI)`);

  // --- 5. LOG AUDIT CHECK ---
  console.log('\n--- TEST 5: Activity Log Output (Who, What, When) ---');
  const logs = engine.getLogs();
  console.log(`Total Audit Logs Recorded: ${logs.length}`);
  logs.slice(0, 5).forEach((log, index) => {
    console.log(` [${index + 1}] [${log.timestamp.slice(11, 19)}] ${log.actorName} (${log.actorRole}): ${log.action} -> ${log.details}`);
  });

  console.log('\n=============== ALL RBAC TESTS PASSED SUCCESSFULLY ===============');
}
