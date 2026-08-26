/* =============================================
   CLAREANDO v3 — Agenda (Firebase)
   Categorias dinâmicas: cada pessoa define as suas
   ============================================= */

const CORES_CAT = [
  '#3d7a52','#2057c7','#c47f17','#b83232',
  '#6b35c7','#0891b2','#e11d48','#059669',
  '#9333ea','#d97706','#6b7280','#b05c2e',
];

/* Sugestões pra semear a agenda no primeiro uso — o usuário pode
   editar, remover ou adicionar outras livremente depois. */
const CATEGORIAS_SUGERIDAS = [
  { nome: 'Trabalho',  cor: '#2057c7' },
  { nome: 'Faculdade', cor: '#6b35c7' },
  { nome: 'Freelance', cor: '#c47f17' },
  { nome: 'Namorada',  cor: '#e11d48' },
  { nome: 'Forró',     cor: '#d97706' },
  { nome: 'Outro',     cor: '#6b7280' },
];

let eventos      = [];
let categorias   = [];
let mesAtual     = new Date().getMonth();
let anoAtual     = new Date().getFullYear();
let anoVisual    = new Date().getFullYear();
let diaSel       = null;
let catEditId    = null;

/* ── Tabs ────────────────────────────────────── */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    if (btn.dataset.tab === 'anual') renderAno();
  });
});

/* ── Categorias ──────────────────────────────── */
function getCat(nome) {
  return categorias.find(c => c.nome === nome) || { nome: nome || 'Outro', cor: '#6b7280' };
}

async function semearCategoriasPadrao() {
  const batch = db.batch();
  CATEGORIAS_SUGERIDAS.forEach(c => {
    const ref = db.collection('agenda_categorias').doc();
    batch.set(ref, { ...c, criadoEm: new Date().toISOString() });
  });
  await batch.commit();
}

function preencherSelectCategorias() {
  const sel = document.getElementById('ev-cat');
  if (!sel) return;
  const atual = sel.value;
  sel.innerHTML = categorias.map(c => `<option value="${c.nome}" style="color:${c.cor};">● ${c.nome}</option>`).join('');
  if (categorias.some(c => c.nome === atual)) sel.value = atual;
}

function renderListaCategorias() {
  const el = document.getElementById('lista-categorias');
  if (!el) return;
  if (!categorias.length) { emptyState(el, '🏷️', 'Nenhuma categoria ainda'); return; }
  el.innerHTML = categorias.map(c => `
    <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);">
      <div style="width:16px;height:16px;border-radius:50%;background:${c.cor};flex-shrink:0;"></div>
      <span style="flex:1;font-size:.86rem;font-weight:600;">${c.nome}</span>
      <button class="btn-icon" data-edit-cat="${c.id}" title="Editar">✏️</button>
      <button class="btn-icon" data-del-cat="${c.id}" title="Remover">✕</button>
    </div>`).join('');
  el.querySelectorAll('[data-edit-cat]').forEach(b => b.addEventListener('click', () => abrirEdicaoCategoria(b.dataset.editCat)));
  el.querySelectorAll('[data-del-cat]').forEach(b => b.addEventListener('click', () => deletarCategoria(b.dataset.delCat)));
}

function renderColorPickerCat(corAtiva) {
  const el = document.getElementById('cat-color-picker');
  if (!el) return;
  el.innerHTML = CORES_CAT.map(c => `
    <div data-cor="${c}" class="cor-dot ${c === corAtiva ? 'sel' : ''}"
      style="width:24px;height:24px;border-radius:50%;background:${c};
             cursor:pointer;border:3px solid ${c === corAtiva ? 'var(--text)' : 'transparent'};flex-shrink:0;">
    </div>`).join('');
  el.querySelectorAll('.cor-dot').forEach(d => {
    d.addEventListener('click', () => {
      el.querySelectorAll('.cor-dot').forEach(x => { x.style.borderColor = 'transparent'; x.classList.remove('sel'); });
      d.style.borderColor = 'var(--text)';
      d.classList.add('sel');
    });
  });
}
function getCorAtivaCat() {
  const sel = document.querySelector('#cat-color-picker .cor-dot.sel');
  return sel ? sel.dataset.cor : CORES_CAT[0];
}

function abrirModalCategorias() {
  catEditId = null;
  document.getElementById('cat-nome').value = '';
  document.getElementById('cat-form-titulo').textContent = 'Nova categoria';
  document.getElementById('btn-salvar-cat').textContent = '+ Adicionar';
  renderColorPickerCat(CORES_CAT[0]);
  renderListaCategorias();
  document.getElementById('modal-categorias').classList.add('open');
}
function fecharModalCategorias() { document.getElementById('modal-categorias').classList.remove('open'); }

function abrirEdicaoCategoria(id) {
  const c = categorias.find(x => x.id === id);
  if (!c) return;
  catEditId = id;
  document.getElementById('cat-nome').value = c.nome;
  document.getElementById('cat-form-titulo').textContent = 'Editar categoria';
  document.getElementById('btn-salvar-cat').textContent = 'Salvar';
  renderColorPickerCat(c.cor);
  document.getElementById('cat-nome').focus();
}

async function salvarCategoria() {
  const nome = document.getElementById('cat-nome').value.trim();
  const cor  = getCorAtivaCat();
  if (!nome) { toast('Informe o nome da categoria.', 'erro'); return; }
  try {
    if (catEditId) {
      const antigo = categorias.find(c => c.id === catEditId)?.nome;
      await db.collection('agenda_categorias').doc(catEditId).update({ nome, cor });
      // Mantém os eventos já existentes apontando pro nome novo
      if (antigo && antigo !== nome) {
        const afetados = eventos.filter(e => e.categoria === antigo);
        const batch = db.batch();
        afetados.forEach(e => batch.update(db.collection('eventos').doc(e.id), { categoria: nome }));
        if (afetados.length) await batch.commit();
      }
      toast('Categoria atualizada ✓');
    } else {
      await db.collection('agenda_categorias').add({ nome, cor, criadoEm: new Date().toISOString() });
      toast('Categoria criada ✓');
    }
    catEditId = null;
    document.getElementById('cat-nome').value = '';
    document.getElementById('cat-form-titulo').textContent = 'Nova categoria';
    document.getElementById('btn-salvar-cat').textContent = '+ Adicionar';
    renderColorPickerCat(CORES_CAT[0]);
  } catch(e) { toast('Erro: ' + e.message, 'erro'); }
}

async function deletarCategoria(id) {
  const c = categorias.find(x => x.id === id);
  if (!c) return;
  const emUso = eventos.filter(e => e.categoria === c.nome).length;
  const msg = emUso > 0
    ? `Essa categoria está em ${emUso} evento(s). Remover mesmo assim? (os eventos continuam existindo, só ficam sem categoria colorida)`
    : 'Remover esta categoria?';
  if (!confirm(msg)) return;
  try { await db.collection('agenda_categorias').doc(id).delete(); toast('Categoria removida.'); }
  catch(e) { toast('Erro: ' + e.message, 'erro'); }
}

/* ── Firebase ────────────────────────────────── */
function iniciar() {
  db.collection('agenda_categorias').orderBy('criadoEm').onSnapshot(async snap => {
    categorias = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (categorias.length === 0) { await semearCategoriasPadrao(); return; }
    preencherSelectCategorias();
    renderListaCategorias();
    renderCal(); renderProximos();
    if (diaSel) mostrarDia(diaSel);
  }, err => console.error('Erro categorias:', err));

  db.collection('eventos').orderBy('data').onSnapshot(snap => {
    eventos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderCal();
    renderProximos();
    if (diaSel) mostrarDia(diaSel);
  }, err => console.error('Erro eventos:', err));
}

/* ── Calendário ──────────────────────────────── */
function renderCal() {
  const grid = document.getElementById('cal-grid');
  document.getElementById('cal-mes-ano').textContent = `${MESES[mesAtual]} ${anoAtual}`;
  grid.innerHTML = '';

  const hoje = new Date();
  const first = new Date(anoAtual, mesAtual, 1).getDay();
  const last  = new Date(anoAtual, mesAtual + 1, 0).getDate();

  for (let i = 0; i < first; i++) {
    const d = document.createElement('div'); d.classList.add('cal-day','cal-empty'); grid.appendChild(d);
  }
  for (let dia = 1; dia <= last; dia++) {
    const ds   = `${anoAtual}-${String(mesAtual+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
    const el   = document.createElement('div');
    el.classList.add('cal-day');
    el.textContent = dia;
    if (dia === hoje.getDate() && mesAtual === hoje.getMonth() && anoAtual === hoje.getFullYear()) el.classList.add('today');
    if (eventos.some(e => e.data === ds)) el.classList.add('has-event');
    if (diaSel === ds) el.classList.add('selected');
    el.addEventListener('click', () => { diaSel = ds; renderCal(); mostrarDia(ds); document.getElementById('ev-data').value = ds; });
    grid.appendChild(el);
  }
}

/* ── Dia selecionado ─────────────────────────── */
function mostrarDia(ds) {
  const wrap  = document.getElementById('dia-wrap');
  const tit   = document.getElementById('dia-titulo');
  const cont  = document.getElementById('dia-content');
  wrap.style.display = 'block';

  const [a, m, d] = ds.split('-').map(Number);
  tit.textContent = `${d} de ${MESES[m-1]}`;

  const evsDia = [...eventos.filter(e => e.data === ds)]
    .sort((a, b) => (a.horaInicio || '00:00').localeCompare(b.horaInicio || '00:00'));

  if (evsDia.length === 0) {
    cont.innerHTML = `<p style="font-size:.83rem;color:var(--muted);padding:8px 0;text-align:center;">Nenhum evento neste dia.</p>`;
    return;
  }

  // Eventos "dia todo" (sem horário)
  const diaTodo = evsDia.filter(e => e.diaTodo || !e.horaInicio);
  const comHora = evsDia.filter(e => !e.diaTodo && e.horaInicio);

  let html = '';

  if (diaTodo.length > 0) {
    html += `<div class="ev-dia-todo">`;
    diaTodo.forEach(ev => {
      const cat = getCat(ev.categoria);
      html += `
        <div class="ev-dia-pill" style="background:${hexToRgba(cat.cor,.14)};color:${cat.cor};">
          <span style="flex:1;">${ev.titulo}</span>
          ${ev.obs ? `<span style="font-size:.74rem;opacity:.7;">${ev.obs}</span>` : ''}
          <button class="btn-icon" data-del="${ev.id}" style="color:inherit;opacity:.6;">✕</button>
        </div>`;
    });
    html += `</div>`;
  }

  if (comHora.length > 0) {
    html += `<div class="slot-list">`;
    for (let h = 6; h <= 23; h++) {
      const evsH = comHora.filter(e => e.horaInicio?.startsWith(String(h).padStart(2,'0') + ':'));
      const lbl  = String(h).padStart(2,'0') + ':00';
      html += `<div class="slot-hora">
        <div class="slot-label">${lbl}</div>
        <div class="slot-events">`;
      evsH.forEach(ev => {
        const fim = ev.horaFim ? ` → ${ev.horaFim}` : '';
        const cat = getCat(ev.categoria);
        html += `
          <div class="ev-block" style="background:${hexToRgba(cat.cor,.14)};border-left-color:${cat.cor};">
            <div class="ev-info">
              <strong>${ev.titulo}</strong>
              <span class="ev-time">${ev.horaInicio}${fim}${ev.obs ? ' · ' + ev.obs : ''}</span>
            </div>
            <button class="btn-icon" data-del="${ev.id}" style="color:inherit;opacity:.6;">✕</button>
          </div>`;
      });
      html += `</div></div>`;
    }
    html += `</div>`;
  }

  cont.innerHTML = html;
  cont.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', () => deletarEvento(btn.dataset.del));
  });
}

/* ── Próximos ────────────────────────────────── */
function renderProximos() {
  const el   = document.getElementById('lista-proximos');
  const hoje = new Date().toISOString().split('T')[0];
  const prox = eventos.filter(e => e.data >= hoje).slice(0, 10);

  if (prox.length === 0) { emptyState(el, '📅', 'Nenhum evento futuro'); return; }
  el.innerHTML = '';
  prox.forEach(ev => {
    const cat   = getCat(ev.categoria);
    const hora  = ev.diaTodo ? 'Dia todo' : (ev.horaInicio || '');
    const div   = document.createElement('div');
    div.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);';
    div.innerHTML = `
      <div style="width:8px;height:8px;border-radius:50%;background:${cat.cor};flex-shrink:0;"></div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:.86rem;font-weight:600;">${ev.titulo}</div>
        <div style="font-size:.74rem;color:var(--muted);">${formatarDataCurta(ev.data)}${hora ? ' · ' + hora : ''} · ${cat.nome}</div>
      </div>
      <button class="btn-icon" data-del="${ev.id}">✕</button>`;
    div.querySelector('[data-del]').addEventListener('click', () => deletarEvento(ev.id));
    el.appendChild(div);
  });
}

/* ── Visão anual ─────────────────────────────── */
function renderAno() {
  document.getElementById('ano-titulo').textContent = anoVisual;
  const grid = document.getElementById('ano-grid');
  grid.innerHTML = '';
  const hoje = new Date();

  for (let m = 0; m < 12; m++) {
    const card = document.createElement('div');
    card.classList.add('mes-mini-card');
    const first = new Date(anoVisual, m, 1).getDay();
    const last  = new Date(anoVisual, m+1, 0).getDate();

    let html = `<div class="mes-mini-title">${MESES_CURTOS[m]}</div><div class="mes-mini-grid">`;
    ['D','S','T','Q','Q','S','S'].forEach(d => html += `<div class="mmd-header">${d}</div>`);
    for (let i = 0; i < first; i++) html += '<div></div>';
    for (let dia = 1; dia <= last; dia++) {
      const ds    = `${anoVisual}-${String(m+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
      const isHj  = dia === hoje.getDate() && m === hoje.getMonth() && anoVisual === hoje.getFullYear();
      const hasEv = eventos.some(e => e.data === ds);
      let cls = 'mmd-day';
      if (isHj) cls += ' today'; else if (hasEv) cls += ' has-ev';
      html += `<div class="${cls}">${dia}</div>`;
    }
    html += '</div>';
    card.innerHTML = html;
    card.addEventListener('click', () => {
      mesAtual = m; anoAtual = anoVisual;
      document.querySelector('[data-tab="mensal"]').click();
    });
    grid.appendChild(card);
  }
}

/* ── CRUD Eventos ────────────────────────────── */
async function salvar() {
  const titulo  = document.getElementById('ev-titulo').value.trim();
  const data    = document.getElementById('ev-data').value;
  const cat     = document.getElementById('ev-cat').value;
  const diaTodo = document.getElementById('ev-dia-todo').checked;
  const inicio  = document.getElementById('ev-inicio').value;
  const fim     = document.getElementById('ev-fim').value;
  const obs     = document.getElementById('ev-obs').value.trim();

  if (!titulo) { toast('Informe o título.', 'erro'); return; }
  if (!data)   { toast('Informe a data.', 'erro'); return; }

  const btn = document.getElementById('btn-salvar-ev');
  btn.disabled = true; btn.textContent = 'Salvando…';
  try {
    await db.collection('eventos').add({
      titulo, data, categoria: cat,
      diaTodo,
      horaInicio: diaTodo ? null : (inicio || null),
      horaFim:    diaTodo ? null : (fim    || null),
      obs: obs || null,
      criadoEm: new Date().toISOString()
    });
    document.getElementById('ev-titulo').value = '';
    document.getElementById('ev-inicio').value = '';
    document.getElementById('ev-fim').value    = '';
    document.getElementById('ev-obs').value    = '';
    document.getElementById('ev-dia-todo').checked = false;
    document.getElementById('horario-fields').style.display = '';
    fecharModal();
    diaSel = data;
    toast('Evento salvo ✓');
  } catch(e) {
    toast('Erro: ' + e.message, 'erro'); console.error(e);
  } finally {
    btn.disabled = false; btn.textContent = '+ Salvar evento';
  }
}

async function deletarEvento(id) {
  if (!confirm('Remover este evento?')) return;
  try { await db.collection('eventos').doc(id).delete(); toast('Evento removido.'); }
  catch(e) { toast('Erro: ' + e.message, 'erro'); }
}

/* ── Modal evento ────────────────────────────── */
function abrirModal(ds) {
  if (ds) document.getElementById('ev-data').value = ds;
  document.getElementById('modal-evento').classList.add('open');
  setTimeout(() => document.getElementById('ev-titulo').focus(), 100);
}
function fecharModal() { document.getElementById('modal-evento').classList.remove('open'); }

/* ── Init ────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('mes-ant').addEventListener('click', () => {
    mesAtual--; if (mesAtual < 0) { mesAtual = 11; anoAtual--; }
    diaSel = null; document.getElementById('dia-wrap').style.display = 'none';
    renderCal();
  });
  document.getElementById('mes-prox').addEventListener('click', () => {
    mesAtual++; if (mesAtual > 11) { mesAtual = 0; anoAtual++; }
    diaSel = null; document.getElementById('dia-wrap').style.display = 'none';
    renderCal();
  });
  document.getElementById('ano-ant').addEventListener('click',  () => { anoVisual--; renderAno(); });
  document.getElementById('ano-prox').addEventListener('click', () => { anoVisual++; renderAno(); });

  document.getElementById('btn-novo-evento').addEventListener('click', () => abrirModal(diaSel));
  document.getElementById('btn-add-dia').addEventListener('click',    () => abrirModal(diaSel));
  document.getElementById('modal-ev-close').addEventListener('click', fecharModal);
  document.getElementById('modal-evento').addEventListener('click', e => { if (e.target === e.currentTarget) fecharModal(); });
  document.getElementById('btn-salvar-ev').addEventListener('click', salvar);
  document.getElementById('ev-titulo')?.addEventListener('keydown', e => { if (e.key === 'Enter') salvar(); });

  // Toggle horário quando dia-todo marcado
  document.getElementById('ev-dia-todo').addEventListener('change', e => {
    document.getElementById('horario-fields').style.display = e.target.checked ? 'none' : '';
  });

  // Categorias
  document.getElementById('btn-categorias').addEventListener('click', abrirModalCategorias);
  document.getElementById('modal-cat-close').addEventListener('click', fecharModalCategorias);
  document.getElementById('modal-categorias').addEventListener('click', e => { if (e.target === e.currentTarget) fecharModalCategorias(); });
  document.getElementById('btn-salvar-cat').addEventListener('click', salvarCategoria);
  document.getElementById('cat-nome').addEventListener('keydown', e => { if (e.key === 'Enter') salvarCategoria(); });

  document.getElementById('ev-data').value = new Date().toISOString().split('T')[0];
  renderCal();
  iniciar();
});
