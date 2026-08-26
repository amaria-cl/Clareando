/* =============================================
   CLAREANDO v3 — Sidebar HTML inject
   ============================================= */

function injectSidebar() {
  const html = `
  <div class="sidebar-overlay" id="sidebar-overlay"></div>
  <aside class="sidebar" id="sidebar">
    <a class="sidebar-logo" href="index.html">
      <div class="sidebar-logo-icon">🌿</div>
      <div>
        <div class="sidebar-logo-text">Clareando</div>
        <div class="sidebar-logo-tag">Organize com leveza</div>
      </div>
    </a>

    <nav class="sidebar-nav">
      <div class="nav-section-label">Principal</div>

      <a class="nav-item" href="index.html" data-page="index.html">
        <div class="nav-item-icon">🏠</div>
        Início
      </a>
      <a class="nav-item" href="agenda.html" data-page="agenda.html">
        <div class="nav-item-icon">📅</div>
        Agenda
      </a>
      <a class="nav-item" href="estudos.html" data-page="estudos.html">
        <div class="nav-item-icon">📚</div>
        Estudos
      </a>
      <a class="nav-item" href="trabalho.html" data-page="trabalho.html">
        <div class="nav-item-icon">💼</div>
        Trabalho
      </a>
      <a class="nav-item" href="financeiro.html" data-page="financeiro.html">
        <div class="nav-item-icon">💰</div>
        Financeiro
      </a>
    </nav>

    <div class="sidebar-bottom">
      <button class="theme-toggle" id="theme-toggle">
        <span class="theme-icon nav-item-icon" style="width:32px;height:32px;border-radius:8px;background:var(--bg-2);display:flex;align-items:center;justify-content:center;font-size:.9rem;flex-shrink:0;">🌙</span>
        <span class="theme-label" style="font-size:.88rem;font-weight:500;color:var(--text-2);">Modo Escuro</span>
      </button>
      <div class="firebase-badge" id="fb-badge">
        <div class="firebase-dot" id="fb-dot"></div>
        <span id="fb-label" style="font-size:.74rem;">Conectando…</span>
      </div>
    </div>
  </aside>`;

  document.body.insertAdjacentHTML('afterbegin', html);
}

document.addEventListener('DOMContentLoaded', injectSidebar);
