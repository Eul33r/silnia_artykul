const sidebar = document.querySelector('.sidenav');
const main = document.querySelector('.main');
const toggle = document.querySelector('.sidenav-toggle');

if (sidebar && main && toggle) {
  const setCollapsed = (collapsed) => {
    sidebar.classList.toggle('collapsed', collapsed);
    main.classList.toggle('sidebar-collapsed', collapsed);
    toggle.textContent = collapsed ? '>' : '<';
    toggle.setAttribute('aria-label', collapsed ? 'Rozwiń menu' : 'Zwiń menu');
  };

  const collapsed = localStorage.getItem('sidebar-collapsed') === 'true';
  setCollapsed(collapsed);

  toggle.addEventListener('click', () => {
    const nextState = !sidebar.classList.contains('collapsed');
    setCollapsed(nextState);
    localStorage.setItem('sidebar-collapsed', nextState);
  });
}