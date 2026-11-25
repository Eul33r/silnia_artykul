import { supabase } from './js/supabase.js';
import { requireAuth, logout } from './js/auth.js';

const grid = document.querySelector('#calendarGrid');
const statusMessage = document.querySelector('#statusMessage');
const userName = document.querySelector('#userName');
const logoutButton = document.querySelector('#logoutButton');
const progressLabel = document.querySelector('#progressLabel');
const progressFill = document.querySelector('#progressFill');
const progressBar = document.querySelector('#progressBar');
const pointsLabel = document.querySelector('#pointsLabel');
const editionLabel = document.querySelector('#editionLabel');

const dialog = document.querySelector('#dayDialog');
const dialogClose = document.querySelector('#dialogClose');
const dialogTitle = document.querySelector('#dialogTitle');
const dialogDescription = document.querySelector('#dialogDescription');
const dialogMeta = document.querySelector('#dialogMeta');

let calendarDays = [];

logoutButton.addEventListener('click', logout);
dialogClose.addEventListener('click', () => dialog.close());

dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle('is-error', isError);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  })[char]);
}

function renderCalendar(days) {
  grid.innerHTML = '';

  const completedCount = days.filter(day => day.progress?.is_completed).length;
  const totalPoints = days.reduce((sum, day) => sum + (Number(day.progress?.best_points) || 0), 0);

  progressLabel.textContent = `${completedCount} / 24 ukończone`;
  progressFill.style.width = `${Math.min(100, (completedCount / 24) * 100)}%`;
  progressBar.setAttribute('aria-valuenow', String(completedCount));
  pointsLabel.textContent = `⭐ ${totalPoints} punktów`;

  for (const day of days) {
    const isOpen = day.is_open === true;
    const isDone = day.progress?.is_completed === true;
    const stateClass = isDone ? 'day-card--done' : isOpen ? 'day-card--open' : 'day-card--locked';
    const stateText = isDone ? 'Ukończone' : isOpen ? 'Otwarte' : 'Zamknięte';
    const symbol = isDone ? '✓' : isOpen ? '✧' : '⌑';
    const title = isOpen && day.title ? `<span class="day-card__title">${escapeHtml(day.title)}</span>` : '';

    const card = document.createElement(isOpen ? 'button' : 'div');
    card.className = `day-card ${stateClass}`;
    if (isOpen) {
      card.type = 'button';
      card.setAttribute('aria-label', `Dzień ${day.day_number}, ${stateText}. Otwórz szczegóły.`);
      card.addEventListener('click', () => showDay(day));
    } else {
      card.setAttribute('aria-label', `Dzień ${day.day_number}, zamknięte`);
      card.setAttribute('aria-disabled', 'true');
    }

    card.innerHTML = `
      <span class="day-card__symbol" aria-hidden="true">${symbol}</span>
      <span class="day-card__number">${day.day_number}</span>
      <span class="day-card__state">${stateText}</span>
      ${title}
    `;
    grid.append(card);
  }
}

function showDay(day) {
  dialogTitle.textContent = day.title || `Dzień ${day.day_number}`;
  dialogDescription.textContent = day.progress?.is_completed
    ? 'Gratulacje! To wyzwanie masz już ukończone.'
    : 'To okienko jest już odblokowane. Możesz przystąpić do matematycznego wyzwania.';
  dialogMeta.innerHTML = '';

  const details = [];
  if (day.category) details.push(day.category);
  if (day.difficulty) details.push(`Poziom trudności: ${day.difficulty}/5`);
  if (day.points) details.push(`${day.points} pkt`);

  for (const detail of details) {
    const pill = document.createElement('span');
    pill.className = 'meta-pill';
    pill.textContent = detail;
    dialogMeta.append(pill);
  }

  dialog.showModal();
}

async function loadCalendar() {
  setStatus('Pobieranie kalendarza…');

  const account = await requireAuth();
  if (!account) return;

  userName.textContent = account.profile.display_name || account.user.email || 'Użytkownik';

  const { data, error } = await supabase.functions.invoke('get-calendar-ts');

  if (error) {
    console.error('Błąd get-calendar-ts:', error);
    setStatus(`Nie udało się pobrać kalendarza: ${error.message}`, true);
    return;
  }

  if (!data || !Array.isArray(data.days)) {
    console.error('Nieoczekiwany format odpowiedzi:', data);
    setStatus('Backend zwrócił nieoczekiwany format danych.', true);
    return;
  }

  calendarDays = data.days;
  if (data.edition?.year) editionLabel.textContent = `Edycja ${data.edition.year}`;

  renderCalendar(calendarDays);
  setStatus('');
}

loadCalendar().catch((error) => {
  console.error('Błąd inicjalizacji kalendarza:', error);
  setStatus('Wystąpił nieoczekiwany błąd podczas ładowania kalendarza.', true);
});
