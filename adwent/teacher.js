import { supabase } from './js/supabase.js';
import { requireTeacher, logout } from './js/auth.js';

let currentAccount = null;
let currentEdition = null;
let allTasks = [];

// Wywołanie Edge Function z czytelnym komunikatem błędu z backendu
async function callFunction(name, body) {
  const { data, error } = await supabase.functions.invoke(name, { body });

  if (error) {
    let message = error.message;
    try {
      const details = await error.context?.json();
      if (details?.error) message = details.error;
    } catch (_) { /* brak JSON w odpowiedzi */ }
    throw new Error(message);
  }

  return data;
}

async function fetchTasks() {
  const data = await callFunction('manage-tasks-ts', { action: 'list' });
  currentEdition = data?.edition || null;
  allTasks = data?.tasks || [];
}

// ============================================================
// INITIALIZATION
// ============================================================

async function init() {
  currentAccount = await requireTeacher();
  if (!currentAccount) return;

  updateUserInfo();
  setupTabNavigation();
  setupFormHandlers();

  try {
    await fetchTasks();
  } catch (error) {
    console.error('Błąd ładowania zadań:', error);
    showToast('Błąd ładowania zadań: ' + error.message, 'error');
  }

  await loadDashboard();
  await loadTasks();
  await loadStudents();
  await loadSolutions();
}

function updateUserInfo() {
  const userName = document.getElementById('userName');
  userName.textContent = currentAccount.profile.display_name;
  
  document.getElementById('logoutButton').addEventListener('click', logout);
}

// ============================================================
// TAB NAVIGATION
// ============================================================

function setupTabNavigation() {
  const navTabs = document.querySelectorAll('.nav-tab');

  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      switchTab(tabName);
    });
  });
}

function switchTab(tabName) {
  // Update nav buttons
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.setAttribute('aria-selected', tab.dataset.tab === tabName);
  });

  // Hide all panels
  document.querySelectorAll('.panel').forEach(panel => {
    panel.classList.remove('panel--active');
  });

  // Show selected panel
  const panel = document.getElementById(`${tabName}-panel`);
  if (panel) {
    panel.classList.add('panel--active');
  }
}

// ============================================================
// DASHBOARD
// ============================================================

async function loadDashboard() {
  if (!currentEdition) return;

  try {
    document.getElementById('stat-tasks-created').textContent = allTasks.length;
    document.getElementById('stat-tasks-published').textContent =
      allTasks.filter(t => t.is_published).length;

    const stats = await callFunction('manage-tasks-ts', { action: 'dashboard' });

    document.getElementById('stat-active-students').textContent = stats.active_students;
    document.getElementById('stat-last-activity').textContent = stats.last_attempt_at
      ? formatTime(new Date(stats.last_attempt_at))
      : 'Brak aktywności';

    renderRecentAttempts(stats.recent_attempts || []);
    loadSolutionsChart();
  } catch (error) {
    console.error('Błąd ładowania pulpitu:', error);
  }
}

function renderRecentAttempts(attempts) {
  const container = document.getElementById('recent-attempts');
  container.innerHTML = '';

  if (attempts.length === 0) {
    container.innerHTML = '<p class="loading-text">Brak odpowiedzi</p>';
    return;
  }

  attempts.forEach(attempt => {
    const item = document.createElement('div');
    item.className = 'attempt-item';
    item.innerHTML = `
      <strong>${attempt.is_correct ? '✓' : '✗'}</strong>
      <span class="student"></span> → <span class="task"></span>
      <div class="time">${formatTime(new Date(attempt.attempted_at))}</div>
    `;
    item.querySelector('.student').textContent = attempt.student_name;
    item.querySelector('.task').textContent = attempt.task_title;
    container.appendChild(item);
  });
}

function loadSolutionsChart() {
  const chart = document.getElementById('solutions-chart');
  chart.innerHTML = `
    <div style="text-align: center; padding: 20px;">
      <div style="font-size: 48px; margin-bottom: 10px;">📊</div>
      <p>Wykres statystyk będzie dostępny wkrótce</p>
      <p style="font-size: 12px; color: var(--muted);">Implementacja: przygotowanie danych do wizualizacji</p>
    </div>
  `;
}

// ============================================================
// TASKS MANAGEMENT
// ============================================================

async function loadTasks() {
  if (!currentEdition) return;

  try {
    const tasks = allTasks;
    const calendar = document.getElementById('tasks-calendar');
    calendar.innerHTML = '';

    // Create all 24 day cards
    for (let day = 1; day <= 24; day++) {
      const task = tasks.find(t => t.day_number === day);
      
      const card = document.createElement('div');
      card.className = 'task-day-card';
      if (task) {
        card.classList.add('has-content');
        if (task.is_published) card.classList.add('published');
      }
      card.dataset.taskId = task?.id || '';
      card.dataset.day = day;

      let statusHtml = '';
      if (task) {
        statusHtml = task.is_published 
          ? '<div class="task-day-status published">📢 Opublikowane</div>'
          : '<div class="task-day-status">📝 Szkic</div>';
      }

      const cardContent = document.createElement('div');
      cardContent.style.flex = '1';
      cardContent.innerHTML = `
        <div class="task-day-number">Dzień ${day}</div>
        <div class="task-day-title">${task?.title || 'Brak zadania'}</div>
        ${statusHtml}
      `;
      card.appendChild(cardContent);

      if (task) {
        const actionsDiv = document.createElement('div');
        actionsDiv.style.display = 'flex';
        actionsDiv.style.gap = '6px';
        actionsDiv.style.marginTop = '8px';
        actionsDiv.onclick = (e) => e.stopPropagation();

        const editBtn = document.createElement('button');
        editBtn.className = 'button button--small';
        editBtn.textContent = '✏️';
        editBtn.title = 'Edytuj';
        editBtn.onclick = () => openTaskModal(task, day);

        const publishBtn = document.createElement('button');
        publishBtn.className = 'button button--small';
        publishBtn.textContent = task.is_published ? '🔒' : '🔓';
        publishBtn.title = task.is_published ? 'Wycofaj publikację' : 'Opublikuj';
        publishBtn.onclick = () => toggleTaskPublish(task);

        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(publishBtn);
        card.appendChild(actionsDiv);
      }

      card.addEventListener('click', () => openTaskModal(task, day));
      calendar.appendChild(card);
    }
  } catch (error) {
    console.error('Błąd ładowania zadań:', error);
    showToast('Błąd ładowania zadań', 'error');
  }
}

// Payload zapisu zadania na podstawie istniejącego zadania (z rozwiązaniem)
function buildPayload(task, overrides = {}) {
  const solution = task.solution || {};
  return {
    task_id: task.id,
    edition_id: currentEdition.id,
    day_number: task.day_number,
    unlock_at: task.unlock_at,
    title: task.title,
    category: task.category,
    difficulty: task.difficulty,
    points: task.points,
    is_published: task.is_published,
    content: task.content,
    correct_answer: Number(solution.correct_answer),
    tolerance: solution.tolerance ?? null,
    hint: solution.hint ?? null,
    explanation: solution.explanation ?? null,
    ...overrides,
  };
}

async function toggleTaskPublish(task) {
  try {
    if (task.solution?.correct_answer == null) {
      showToast('Najpierw ustaw poprawną odpowiedź (edycja zadania)', 'error');
      return;
    }

    await callFunction('manage-tasks-ts', {
      action: 'save',
      payload: buildPayload(task, { is_published: !task.is_published }),
    });

    showToast(task.is_published ? 'Wycofano publikację' : 'Opublikowano', 'success');
    await fetchTasks();
    await loadTasks();
    await loadSolutions();
  } catch (error) {
    console.error('Błąd publikacji zadania:', error);
    showToast('Błąd publikacji: ' + error.message, 'error');
  }
}

function setupFormHandlers() {
  // Task modal
  const taskModal = document.getElementById('task-modal');
  const taskForm = document.getElementById('task-form');
  const addTaskBtn = document.getElementById('add-task-btn');
  const closeModalBtn = document.getElementById('close-modal-btn');

  addTaskBtn?.addEventListener('click', () => openTaskModal());
  
  closeModalBtn?.addEventListener('click', () => taskModal.close());
  document.querySelector('.modal-close')?.addEventListener('click', () => taskModal.close());

  taskForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveTask(taskForm);
  });

  // Student modal
  const studentModal = document.getElementById('student-modal');
  const studentForm = document.getElementById('student-form');
  const addStudentBtn = document.getElementById('add-student-btn');
  const closeStudentModalBtn = document.getElementById('close-student-modal-btn');
  const generatePasswordBtn = document.getElementById('generate-password-btn');

  addStudentBtn?.addEventListener('click', () => openStudentModal());
  closeStudentModalBtn?.addEventListener('click', () => studentModal.close());
  
  studentForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveStudent(studentForm);
  });

  generatePasswordBtn?.addEventListener('click', () => {
    const password = generatePassword();
    document.getElementById('student-password').value = password;
  });

  // Solutions form
  const solutionForm = document.getElementById('solution-form');
  solutionForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveSolution(solutionForm);
  });

  // Solution task selector
  const solutionSelect = document.getElementById('solution-task-select');
  solutionSelect?.addEventListener('change', async (e) => {
    if (e.target.value) {
      await loadSolutionForm(e.target.value);
    } else {
      document.getElementById('solution-editor').hidden = true;
    }
  });

  // Students tabs
  document.querySelectorAll('.students-tab').forEach(tab => {
    tab.addEventListener('click', () => switchStudentTab(tab.dataset.studentTab));
  });

  // Bulk import
  const importBulkBtn = document.getElementById('import-bulk-btn');
  importBulkBtn?.addEventListener('click', async () => {
    const csv = document.getElementById('bulk-csv').value;
    await importBulkStudents(csv);
  });

  // Student search and filter
  document.getElementById('student-search')?.addEventListener('input', filterStudents);
  document.getElementById('student-class-filter')?.addEventListener('change', filterStudents);
}

async function openTaskModal(task = null, day = null) {
  const modal = document.getElementById('task-modal');
  const form = document.getElementById('task-form');
  const title = document.getElementById('modal-title');

  if (task) {
    title.textContent = `Edycja zadania - Dzień ${task.day_number}`;
    form.dataset.taskId = task.id;
    document.getElementById('task-day').value = task.day_number;
    document.getElementById('task-day').disabled = true;
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-category').value = task.category;
    document.getElementById('task-difficulty').value = task.difficulty;
    document.getElementById('task-points').value = task.points;
    
    // Convert UTC to local Warsaw time for display
    if (task.unlock_at) {
      document.getElementById('task-unlock-at').value = utcToLocal(task.unlock_at);
    }
    
    const solution = task.solution || {};
    document.getElementById('task-content').value = task.content?.prompt || '';
    document.getElementById('task-correct-answer').value = solution.correct_answer ?? '';
    document.getElementById('task-tolerance').value = solution.tolerance ?? '';
    document.getElementById('task-hint').value = solution.hint?.text || '';
    document.getElementById('task-explanation').value = solution.explanation?.text || '';
    document.getElementById('task-published').checked = !!task.is_published;
  } else {
    title.textContent = 'Nowe zadanie';
    form.dataset.taskId = '';
    document.getElementById('task-day').disabled = false;
    form.reset();
    if (day) {
      document.getElementById('task-day').value = day;
    }

    // Domyślnie: 1 grudnia 2026 + numer dnia, godz. 06:00 (czas warszawski)
    const d = Number(day) || 1;
    document.getElementById('task-unlock-at').value =
      `2026-12-${String(d).padStart(2, '0')}T06:00`;
  }

  modal.showModal();
}

async function saveTask(form) {
  const taskId = form.dataset.taskId;

  try {
    if (!currentEdition?.id) {
      showToast('Brak aktywnej edycji w bazie (advent_editions.is_active)', 'error');
      return;
    }

    const correctAnswer = parseFloat(form.elements['correct_answer'].value);
    if (!Number.isFinite(correctAnswer)) {
      showToast('Poprawna odpowiedź musi być liczbą', 'error');
      return;
    }

    const toleranceRaw = form.elements['tolerance'].value;
    const tolerance = toleranceRaw === '' ? null : parseFloat(toleranceRaw);
    if (tolerance !== null && (!Number.isFinite(tolerance) || tolerance < 0)) {
      showToast('Tolerancja musi być liczbą nieujemną', 'error');
      return;
    }

    const hint = form.elements['hint'].value.trim();
    const explanation = form.elements['explanation'].value.trim();

    const payload = {
      task_id: taskId || null,
      edition_id: currentEdition.id,
      day_number: parseInt(form.elements['day_number'].value, 10),
      unlock_at: warsawLocalToUTC(form.elements['unlock_at'].value),
      title: form.elements['title'].value.trim(),
      category: form.elements['category'].value,
      difficulty: parseInt(form.elements['difficulty'].value, 10),
      points: parseInt(form.elements['points'].value, 10),
      is_published: form.elements['is_published'].checked,
      content: { prompt: form.elements['content'].value },
      correct_answer: correctAnswer,
      tolerance,
      hint: hint ? { text: hint } : null,
      explanation: explanation ? { text: explanation } : null,
    };

    const data = await callFunction('manage-tasks-ts', { action: 'save', payload });

    if (!data?.success) {
      throw new Error('Nieoczekiwana odpowiedź serwera');
    }

    showToast(taskId ? 'Zadanie zaktualizowane' : 'Zadanie dodane', 'success');
    document.getElementById('task-modal').close();
    await fetchTasks();
    await loadTasks();
    await loadSolutions();
    await loadDashboard();
  } catch (error) {
    console.error('Błąd zapisywania zadania:', error);
    showToast('Błąd zapisywania zadania: ' + error.message, 'error');
  }
}

// ============================================================
// SOLUTIONS MANAGEMENT
// ============================================================

async function loadSolutions() {
  if (!currentEdition) return;

  try {
    const select = document.getElementById('solution-task-select');
    select.innerHTML = '<option value="">-- Wybierz zadanie --</option>';

    allTasks.forEach((task) => {
      const option = document.createElement('option');
      option.value = task.id;
      option.textContent = `Dzień ${task.day_number}: ${task.title}`;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Błąd ładowania rozwiązań:', error);
  }
}

async function loadSolutionForm(taskId) {
  try {
    const task = allTasks.find((t) => t.id === taskId);
    const solution = task?.solution;

    const editor = document.getElementById('solution-editor');
    document.getElementById('solution-task-id').value = taskId;

    if (solution) {
      document.getElementById('solution-answer').value = solution.correct_answer ?? '';
      document.getElementById('solution-tolerance').value = solution.tolerance ?? '';
      document.getElementById('solution-explanation').value = solution.explanation?.text || '';
      document.getElementById('solution-hint').value = solution.hint?.text || '';
    } else {
      document.getElementById('solution-form').reset();
    }

    editor.hidden = false;
  } catch (error) {
    console.error('Błąd ładowania rozwiązania:', error);
    const editor = document.getElementById('solution-editor');
    document.getElementById('solution-task-id').value = taskId;
    document.getElementById('solution-form').reset();
    editor.hidden = false;
  }
}

async function saveSolution(form) {
  const taskId = document.getElementById('solution-task-id').value;
  
  if (!taskId) {
    showToast('Wybierz zadanie', 'error');
    return;
  }

  try {
    const task = allTasks.find((t) => t.id === taskId);
    if (!task) {
      showToast('Zadanie nie znalezione', 'error');
      return;
    }

    const correctAnswer = parseFloat(form.elements['correct_answer'].value);
    const toleranceRaw = form.elements['tolerance'].value;
    const tolerance = toleranceRaw === '' ? null : parseFloat(toleranceRaw);
    const explanationText = form.elements['explanation'].value.trim();
    const hintText = form.elements['hint'].value.trim();

    if (!Number.isFinite(correctAnswer)) {
      showToast('Odpowiedź musi być liczbą', 'error');
      return;
    }

    if (tolerance !== null && (!Number.isFinite(tolerance) || tolerance < 0)) {
      showToast('Tolerancja musi być liczbą nieujemną', 'error');
      return;
    }

    await callFunction('manage-tasks-ts', {
      action: 'save',
      payload: buildPayload(task, {
        correct_answer: correctAnswer,
        tolerance,
        hint: hintText ? { text: hintText } : null,
        explanation: explanationText ? { text: explanationText } : null,
      }),
    });

    showToast('Rozwiązanie zapisane', 'success');
    await fetchTasks();
    await loadTasks();
  } catch (error) {
    console.error('Błąd zapisywania rozwiązania:', error);
    showToast('Błąd zapisywania rozwiązania: ' + error.message, 'error');
  }
}

// ============================================================
// STUDENTS MANAGEMENT
// ============================================================

async function loadStudents() {
  try {
    const { students } = await callFunction('manage-tasks-ts', { action: 'students' });

    const tbody = document.getElementById('students-tbody');
    tbody.innerHTML = '';

    if (!students || students.length === 0) {
      tbody.innerHTML = '<tr class="loading-row"><td colspan="5" class="loading-text">Brak uczniów</td></tr>';
      return;
    }

    // Build class filter options
    const classes = [...new Set(students.map(s => s.class_name).filter(Boolean))];
    const classSelect = document.getElementById('student-class-filter');
    classSelect.innerHTML = '<option value="">Wszystkie klasy</option>';
    classes.forEach(className => {
      const option = document.createElement('option');
      option.value = className;
      option.textContent = className;
      classSelect.appendChild(option);
    });

    // Render students
    for (const student of students) {
      const completed = student.completed_count || 0;
      const lastActivity = student.last_activity
        ? formatTime(new Date(student.last_activity))
        : 'Brak aktywności';

      const tr = document.createElement('tr');
      tr.dataset.studentId = student.id;
      tr.dataset.studentClass = student.class_name || '';
      tr.innerHTML = `
        <td></td>
        <td></td>
        <td>${lastActivity}</td>
        <td>${completed}/24</td>
        <td>
          <button class="button button--small" data-action="edit" data-id="${student.id}">Edytuj</button>
          <button class="button button--small" data-action="reset" data-id="${student.id}">Reset hasła</button>
        </td>
      `;
      tr.cells[0].textContent = student.display_name;
      tr.cells[1].textContent = student.class_name || '-';

      tr.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', (e) => handleStudentAction(e, student));
      });

      tbody.appendChild(tr);
    }
  } catch (error) {
    console.error('Błąd ładowania uczniów:', error);
  }
}

function switchStudentTab(tabName) {
  document.querySelectorAll('.students-tab').forEach(tab => {
    tab.setAttribute('aria-selected', tab.dataset.studentTab === tabName);
  });

  document.querySelectorAll('.student-panel').forEach(panel => {
    panel.hidden = !panel.id.includes(tabName);
  });
}

async function openStudentModal(student = null) {
  const modal = document.getElementById('student-modal');
  const form = document.getElementById('student-form');
  const title = document.getElementById('student-modal-title');
  const passwordGroup = document.getElementById('password-group');

  if (student) {
    title.textContent = `Edycja ucznia`;
    form.dataset.studentId = student.id;
    document.getElementById('student-edit-id').value = student.id;
    document.getElementById('student-name').value = student.display_name;
    document.getElementById('student-email').value = student.email || '';
    document.getElementById('student-class').value = student.class_name || '';
    passwordGroup.style.display = 'none';
  } else {
    title.textContent = `Nowy uczeń`;
    form.dataset.studentId = '';
    form.reset();
    passwordGroup.style.display = 'flex';
    document.getElementById('student-password').value = generatePassword();
  }

  modal.showModal();
}

async function saveStudent(form) {
  try {
    const isNew = !form.dataset.studentId;
    const displayName = form.elements['display_name'].value;
    const className = form.elements['class_name'].value;

    if (isNew) {
      const email = form.elements['email'].value;
      const password = form.elements['password'].value;

      // Use Edge Function to create student account securely
      const data = await callFunction('create-student', {
        email: email,
        password: password,
        display_name: displayName,
        class_name: className,
      });

      if (data?.success) {
        showToast('Uczeń dodany - email: ' + email, 'success');
      } else {
        throw new Error(data?.error || 'Unknown error creating student');
      }
    } else {
      // Update existing student profile
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          class_name: className,
        })
        .eq('id', form.dataset.studentId);

      if (error) throw error;
      showToast('Uczeń zaktualizowany', 'success');
    }

    document.getElementById('student-modal').close();
    await loadStudents();
  } catch (error) {
    console.error('Błąd zapisywania ucznia:', error);
    showToast('Błąd: ' + error.message, 'error');
  }
}

async function handleStudentAction(e, student) {
  const action = e.target.dataset.action;

  if (action === 'edit') {
    await openStudentModal(student);
  } else if (action === 'reset') {
    const newPassword = generatePassword();
    try {
      // Note: Password reset would require proper Supabase admin API
      showToast(`Nowe hasło: ${newPassword}`, 'success');
    } catch (error) {
      showToast('Błąd resetowania hasła', 'error');
    }
  }
}

async function importBulkStudents(csv) {
  if (!csv.trim()) {
    showToast('Wklej dane CSV', 'error');
    return;
  }

  const lines = csv.trim().split('\n');
  let imported = 0;

  for (const line of lines) {
    const [firstName, lastName, className] = line.split(',').map(s => s.trim());
    
    if (!firstName || !lastName) continue;

    const displayName = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
    const password = generatePassword();

    try {
      // Use Edge Function to create student account securely
      const { data, error } = await supabase.functions.invoke('create-student', {
        body: {
          email: email,
          password: password,
          display_name: displayName,
          class_name: className || '',
        },
      });

      if (!error && data?.success) {
        imported++;
      } else {
        console.error('Import error for', displayName, ':', error || data?.error);
      }
    } catch (error) {
      console.error('Błąd importu:', error);
    }
  }

  showToast(`Zaimportowano ${imported} uczniów`, 'success');
  document.getElementById('bulk-csv').value = '';
  await loadStudents();
}

function filterStudents() {
  const search = document.getElementById('student-search').value.toLowerCase();
  const classFilter = document.getElementById('student-class-filter').value;

  document.querySelectorAll('#students-tbody tr').forEach(row => {
    const name = row.cells[0]?.textContent.toLowerCase() || '';
    const className = row.dataset.studentClass || '';

    const matchesSearch = name.includes(search);
    const matchesClass = !classFilter || className === classFilter;

    row.style.display = matchesSearch && matchesClass ? '' : 'none';
  });
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

// Przesunięcie Europe/Warsaw względem UTC (ms) w danym momencie
function warsawOffsetMs(utcMs) {
  const p = {};
  new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Warsaw',
    hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date(utcMs)).forEach(x => { p[x.type] = x.value; });

  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return asUtc - Math.floor(utcMs / 1000) * 1000;
}

// 'YYYY-MM-DDTHH:mm' (czas warszawski) -> ISO UTC, niezależnie od strefy przeglądarki
function warsawLocalToUTC(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value || '');
  if (!m) return null;

  const wall = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  // Dwa przebiegi poprawnie obsługują okolice zmiany czasu
  let utc = wall - warsawOffsetMs(wall);
  utc = wall - warsawOffsetMs(utc);
  return new Date(utc).toISOString();
}

// ISO UTC -> 'YYYY-MM-DDTHH:mm' w czasie warszawskim (dla datetime-local)
function utcToLocal(isoString) {
  if (!isoString) return '';

  const ms = new Date(isoString).getTime();
  const d = new Date(ms + warsawOffsetMs(ms));
  return d.toISOString().slice(0, 16);
}

function formatTime(date) {
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'teraz';
  if (minutes < 60) return `${minutes}m temu`;
  if (hours < 24) return `${hours}h temu`;
  if (days < 7) return `${days}d temu`;

  return date.toLocaleDateString('pl-PL');
}

function generatePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ============================================================
// ENTRY POINT
// ============================================================

init();
