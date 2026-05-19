/* =============================================
   CLAREANDO v3 — Trabalho / Kanban (Firebase)
   ============================================= */

const COLS = ['afazer', 'andamento', 'concluido'];
let demandas = [];

function iniciar() {
  db.collection('demandas').orderBy('criadoEm').onSnapshot(snap => {
    demandas = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderBoard();
  }, err => console.error('Erro demandas:', err));
}

/* ── Render ──────────────────────────────────── */
function renderBoard() {
  COLS.forEach(col => {
    const items = demandas.filter(d => d.coluna === col);
    const el    = document.getElementById(`col-${col}`);
    const badge = document.getElementById(`badge-${col}`);
    const cnt   = document.getElementById(`cnt-${col}`);
    if (badge) badge.textContent = items.length;
    if (cnt)   cnt.textContent   = items.length;
    if (!el) return;

    if (items.length === 0) {
      emptyState(el, '—', 'Vazio', '');
      return;
    }

    el.innerHTML = '';
    items.forEach(dem => {
      const card = document.createElement('div');
      card.classList.add('kanban-card-item');

      const prioTag = {
        alta:  '<span class="tag tag-red">🔴 Alta</span>',
        media: '<span class="tag tag-amber">🟡 Média</span>',
        baixa: '<span class="tag tag-green">🟢 Baixa</span>',
      }[dem.prioridade] || '';

      const prazoTxt = dem.prazo ? `<div class="kanban-card-meta">📅 até ${formatarDataCurta(dem.prazo)}</div>` : '';
      const descTxt  = dem.descricao ? `<div class="kanban-card-meta" style="margin-top:2px;">${dem.descricao}</div>` : '';

      const btnAvancar = dem.coluna !== 'concluido'
        ? `<button class="btn btn-primary btn-xs" data-av="${dem.id}">${dem.coluna === 'afazer' ? '▶ Iniciar' : '✓ Concluir'}</button>`
        : `<button class="btn btn-secondary btn-xs" data-volta="${dem.id}">↩ Reabrir</button>`;

      card.innerHTML = `
        <div class="kanban-card-text">${dem.nome}</div>
        ${prazoTxt}${descTxt}
        <div class="kanban-card-foot">
          ${prioTag}
          <div style="display:flex;gap:6px;align-items:center;">
            ${btnAvancar}
            <button class="btn-icon" data-del="${dem.id}">✕</button>
          </div>
        </div>`;

      card.querySelector('[data-del]').addEventListener('click', () => deletar(dem.id));
      card.querySelector('[data-av]')?.addEventListener('click', () => avancar(dem.id));
      card.querySelector('[data-volta]')?.addEventListener('click', () => voltar(dem.id));

      el.appendChild(card);
    });
  });
}

/* ── CRUD ────────────────────────────────────── */
async function salvar() {
  const nome = document.getElementById('dem-nome').value.trim();
  const prio = document.getElementById('dem-prio').value;
  const prazo = document.getElementById('dem-prazo').value;
  const desc = document.getElementById('dem-desc').value.trim();
  if (!nome) { toast('Informe o nome da demanda.', 'erro'); return; }

  const btn = document.getElementById('btn-salvar-dem');
  btn.disabled = true; btn.textContent = 'Salvando…';
  try {
    await db.collection('demandas').add({
      nome, prioridade: prio, coluna: 'afazer',
      prazo: prazo || null, descricao: desc || null,
      criadoEm: new Date().toISOString()
    });
    document.getElementById('dem-nome').value  = '';
    document.getElementById('dem-prazo').value = '';
    document.getElementById('dem-desc').value  = '';
    fecharModal();
    toast('Demanda adicionada ✓');
  } catch(e) {
    toast('Erro: ' + e.message, 'erro'); console.error(e);
  } finally {
    btn.disabled = false; btn.textContent = '+ Adicionar';
  }
}

async function avancar(id) {
  const d = demandas.find(x => x.id === id);
  if (!d) return;
  const idx  = COLS.indexOf(d.coluna);
  const next = COLS[Math.min(idx + 1, COLS.length - 1)];
  try { await db.collection('demandas').doc(id).update({ coluna: next }); }
  catch(e) { toast('Erro: ' + e.message, 'erro'); }
}

async function voltar(id) {
  try { await db.collection('demandas').doc(id).update({ coluna: 'andamento' }); }
  catch(e) { toast('Erro: ' + e.message, 'erro'); }
}

async function deletar(id) {
  if (!confirm('Remover esta demanda?')) return;
  try { await db.collection('demandas').doc(id).delete(); toast('Removida.'); }
  catch(e) { toast('Erro: ' + e.message, 'erro'); }
}

/* ── Modal ───────────────────────────────────── */
function abrirModal() {
  document.getElementById('modal-demanda').classList.add('open');
  setTimeout(() => document.getElementById('dem-nome').focus(), 100);
}
function fecharModal() {
  document.getElementById('modal-demanda').classList.remove('open');
}

/* ── Init ────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-nova-demanda').addEventListener('click', abrirModal);
  document.getElementById('modal-dem-close').addEventListener('click', fecharModal);
  document.getElementById('modal-demanda').addEventListener('click', e => { if (e.target === e.currentTarget) fecharModal(); });
  document.getElementById('btn-salvar-dem').addEventListener('click', salvar);
  document.getElementById('dem-nome')?.addEventListener('keydown', e => { if (e.key === 'Enter') salvar(); });
  iniciar();
});
