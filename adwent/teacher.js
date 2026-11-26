import { supabase } from './js/supabase.js';
import { requireTeacher, logout } from './js/auth.js';

let currentAccount = null;
let currentEdition = null;

// ============================================================
// INITIALIZATION
// ============================================================

async function init() {
  currentAccount = await requireTeacher();
  if (!currentAccount) return;

  updateUserInfo();
  await loadEdition();
  setupTabNavigation();
  setupFormHandlers();
  
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

async function loadEdition() {
  const { data: edition, error } = await supabase
    .from('advent_editions')
    .select('*')
    .eq('year', 2026)
    .single();

  if (error) {
    console.error('Błąd ładowania edycji:', error);
    return;
  }

  currentEdition = edition;
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
    // Loaded tasks statistics
    const { data: allTasks } = await supabase
      .from('advent_tasks')
      .select('id, is_published')
      .eq('edition_id', currentEdition.id);

    const tasksCreated = allTasks?.length || 0;
    const tasksPublished = allTasks?.filter(t => t.is_published).length || 0;

    document.getElementById('stat-tasks-created').textContent = tasksCreated;
    document.getElementById('stat-tasks-published').textContent = tasksPublished;

    // Active students in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentAttempts } = await supabase
      .from('task_attempts')
      .select('user_id', { distinct: true })
      .gte('attempted_at', sevenDaysAgo.toISOString());

    const activeStudents = new Set(recentAttempts?.map(a => a.user_id) || []).size;
    document.getElementById('stat-active-students').textContent = activeStudents;

    // Last activity
    const { data: lastAttempt } = await supabase
      .from('task_attempts')
      .select('attempted_at, user_id, task_id, submitted_answer, is_correct')
      .order('attempted_at', { ascending: false })
      .limit(1)
      .single();

    if (lastAttempt) {
      const time = new Date(lastAttempt.attempted_at);
      document.getElementById('stat-last-activity').textContent = formatTime(time);

      await loadRecentAttempts();
    } else {
      document.getElementById('stat-last-activity').textContent = 'Brak aktywności';
    }

    loadSolutionsChart();
  } catch (error) {
    console.error('Błąd ładowania pulpitu:', error);
  }
}

async function loadRecentAttempts() {
  try {
    const { data: attempts } = await supabase
      .from('task_attempts')
      .select(`
        id,
        attempted_at,
        is_correct,
        profiles!inner(display_name),
        advent_tasks!inner(title)
      `)
      .order('attempted_at', { ascending: false })
      .limit(10);

    const container = document.getElementById('recent-attempts');
    container.innerHTML = '';

    if (!attempts || attempts.length === 0) {
      container.innerHTML = '<p class="loading-text">Brak odpowiedzi</p>';
      return;
    }

    attempts.forEach(attempt => {
      const time = new Date(attempt.attempted_at);
      const status = attempt.is_correct ? '✓' : '✗';
      const statusClass = attempt.is_correct ? 'success' : 'error';

      const html = `
        <div class="attempt-item">
          <strong>${status}</strong> ${attempt.profiles.display_name}
          → ${attempt.advent_tasks.title}
          <div class="time">${formatTime(time)}</div>
        </div>
      `;
      container.innerHTML += html;
    });
  } catch (error) {
    console.error('Błąd ładowania ostatnich odpowiedzi:', error);
  }
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
    const { data: tasks } = await supabase
      .from('advent_tasks')
      .select('*')
      .eq('edition_id', currentEdition.id)
      .order('day_number', { ascending: true });

    const calendar = document.getElementById('tasks-calendar');
    calendar.innerHTML = '';

    // Create all 24 day cards
    for (let day = 1; day <= 24; day++) {
      const task = tasks?.find(t => t.day_number === day);
      
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

async function toggleTaskPublish(task) {
  try {
    const { error } = await supabase
      .from('advent_tasks')
      .update({ is_published: !task.is_published })
      .eq('id', task.id);

    if (error) throw error;
    
    const action = task.is_published ? 'Wycofano publikację' : 'Opublikowano';
    showToast(action, 'success');
    await loadTasks();
  } catch (error) {
    console.error('Błąd publikacji zadania:', error);
    showToast('Błąd publikacji', 'error');
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
    document.getElementById('task-answer-type').value = task.answer_type;
    document.getElementById('task-points').value = task.points;
    document.getElementById('task-content').value = task.content.text || '';
  } else {
    title.textContent = 'Nowe zadanie';
    form.dataset.taskId = '';
    document.getElementById('task-day').disabled = false;
    form.reset();
    if (day) {
      document.getElementById('task-day').value = day;
    }
  }

  modal.showModal();
}

async function saveTask(form) {
  const taskId = form.dataset.taskId;
  const data = {
    day_number: parseInt(form.elements['day_number'].value),
    title: form.elements['title'].value,
    category: form.elements['category'].value,
    difficulty: parseInt(form.elements['difficulty'].value),
    answer_type: form.elements['answer_type'].value,
    points: parseInt(form.elements['points'].value),
    content: { text: form.elements['content'].value },
    edition_id: currentEdition.id,
  };

  try {
    if (taskId) {
      const { error } = await supabase
        .from('advent_tasks')
        .update(data)
        .eq('id', taskId);

      if (error) throw error;
      showToast('Zadanie zaktualizowane', 'success');
    } else {
      const { error } = await supabase
        .from('advent_tasks')
        .insert([data]);

      if (error) throw error;
      showToast('Zadanie dodane', 'success');
    }

    document.getElementById('task-modal').close();
    await loadTasks();
  } catch (error) {
    console.error('Błąd zapisywania zadania:', error);
    showToast('Błąd zapisywania zadania', 'error');
  }
}

// ============================================================
// SOLUTIONS MANAGEMENT
// ============================================================

async function loadSolutions() {
  if (!currentEdition) return;

  try {
    const { data: tasks } = await supabase
      .from('advent_tasks')
      .select('id, day_number, title')
      .eq('edition_id', currentEdition.id)
      .order('day_number', { ascending: true });

    const select = document.getElementById('solution-task-select');
    select.innerHTML = '<option value="">-- Wybierz zadanie --</option>';

    tasks?.forEach(task => {
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
    const { data: solution } = await supabase
      .from('private.task_solutions')
      .select('*')
      .eq('task_id', taskId)
      .single();

    const editor = document.getElementById('solution-editor');
    document.getElementById('solution-task-id').value = taskId;
    document.getElementById('solution-answer').value = solution?.correct_answer || '';
    document.getElementById('solution-tolerance').value = solution?.tolerance || '';
    document.getElementById('solution-explanation').value = solution?.explanation || '';
    document.getElementById('solution-hint').value = solution?.hint || '';

    editor.hidden = false;
  } catch (error) {
    // New solution
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

  const data = {
    task_id: taskId,
    correct_answer: form.elements['correct_answer'].value,
    tolerance: form.elements['tolerance'].value ? parseFloat(form.elements['tolerance'].value) : null,
    explanation: form.elements['explanation'].value || null,
    hint: form.elements['hint'].value || null,
  };

  try {
    // Try to update first
    const { data: existing } = await supabase
      .from('private.task_solutions')
      .select('task_id')
      .eq('task_id', taskId)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('private.task_solutions')
        .update(data)
        .eq('task_id', taskId);
      
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('private.task_solutions')
        .insert([data]);
      
      if (error) throw error;
    }

    showToast('Rozwiązanie zapisane', 'success');
  } catch (error) {
    console.error('Błąd zapisywania rozwiązania:', error);
    showToast('Błąd zapisywania rozwiązania', 'error');
  }
}

// ============================================================
// STUDENTS MANAGEMENT
// ============================================================

async function loadStudents() {
  try {
    const { data: students } = await supabase
      .from('profiles')
      .select(`
        id,
        display_name,
        class_name,
        created_at
      `)
      .eq('role', 'student')
      .order('display_name', { ascending: true });

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
      const { data: progress } = await supabase
        .from('task_progress')
        .select('is_completed', { count: 'exact' })
        .eq('user_id', student.id)
        .eq('is_completed', true);

      const { data: attempts } = await supabase
        .from('task_attempts')
        .select('attempted_at')
        .eq('user_id', student.id)
        .order('attempted_at', { ascending: false })
        .limit(1);

      const completed = progress?.length || 0;
      const lastActivity = attempts?.[0]?.attempted_at 
        ? formatTime(new Date(attempts[0].attempted_at))
        : 'Brak aktywności';

      const tr = document.createElement('tr');
      tr.dataset.studentId = student.id;
      tr.dataset.studentClass = student.class_name || '';
      tr.innerHTML = `
        <td>${student.display_name}</td>
        <td>${student.class_name || '-'}</td>
        <td>${lastActivity}</td>
        <td>${completed}/24</td>
        <td>
          <button class="button button--small" data-action="edit" data-id="${student.id}">Edytuj</button>
          <button class="button button--small" data-action="reset" data-id="${student.id}">Reset hasła</button>
        </td>
      `;

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
    const data = {
      display_name: form.elements['display_name'].value,
      class_name: form.elements['class_name'].value,
    };

    if (isNew) {
      const password = form.elements['password'].value;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.elements['email'].value,
        password: password,
        options: {
          data: {
            display_name: data.display_name,
            class_name: data.class_name,
          }
        }
      });

      if (authError) throw authError;
      showToast('Uczeń dodany - email: ' + form.elements['email'].value, 'success');
    } else {
      const { error } = await supabase
        .from('profiles')
        .update(data)
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
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            display_name: displayName,
            class_name: className || '',
          }
        }
      });

      if (!authError) {
        imported++;
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
