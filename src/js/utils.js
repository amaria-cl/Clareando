/* =============================================
   CLAREANDO v3 — Utils + Shell
   ============================================= */

/* ── Utilitários ─────────────────────────────── */
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MESES_CURTOS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }

function toast(msg, tipo = 'ok') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.style.background = tipo === 'erro' ? 'var(--red)' : 'var(--text)';
  el.style.color = tipo === 'erro' ? '#fff' : 'var(--bg)';
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2800);
}

function formatarBRL(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarDataCurta(iso) {
  if (!iso) return '';
  const d = iso.length === 10 ? new Date(iso + 'T12:00') : new Date(iso);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function emptyState(el, icon = '📭', title = 'Nada aqui ainda', sub = '') {
  el.innerHTML = `<div class="empty-state">
    <span class="empty-state-icon">${icon}</span>
    <div class="empty-state-title">${title}</div>
    ${sub ? `<div style="font-size:.82rem;color:var(--muted);margin-top:4px;">${sub}</div>` : ''}
  </div>`;
}

function loadingState(el, txt = 'Carregando…') {
  el.innerHTML = `<div class="loading-state"><div class="spinner"></div>${txt}</div>`;
}

/* ── Tema dark/light ─────────────────────────── */
function initTheme() {
  const saved = localStorage.getItem('clareando-theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeBtn(saved);
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme') || 'light';
  const next = cur === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('clareando-theme', next);
  updateThemeBtn(next);
}

function updateThemeBtn(theme) {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  btn.querySelector('.theme-icon').textContent = theme === 'dark' ? '☀️' : '🌙';
  btn.querySelector('.theme-label').textContent = theme === 'dark' ? 'Modo Claro' : 'Modo Escuro';
}

/* ── Sidebar mobile ──────────────────────────── */
function initSidebar() {
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('sidebar-overlay');
  const hamburger = document.getElementById('hamburger');

  if (!sidebar) return;

  hamburger?.addEventListener('click', () => {
    sidebar.classList.toggle('mobile-open');
    overlay.classList.toggle('show');
  });
  overlay?.addEventListener('click', () => {
    sidebar.classList.remove('mobile-open');
    overlay.classList.remove('show');
  });
}

/* ── Active nav item ─────────────────────────── */
function setActiveNav() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-item[data-page]').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });
}

/* ── Data de hoje no topbar ──────────────────── */
function setTopbarDate() {
  const el = document.getElementById('topbar-date');
  if (!el) return;
  const hoje = new Date();
  el.textContent = hoje.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
}

/* ── Init geral ──────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initSidebar();
  setActiveNav();
  setTopbarDate();
  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
});
