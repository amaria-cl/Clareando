/* =============================================
   CLAREANDO v3 — Agenda (Firebase)
   ============================================= */

let eventos      = [];
let mesAtual     = new Date().getMonth();
let anoAtual     = new Date().getFullYear();
let anoVisual    = new Date().getFullYear();
let diaSel       = null;

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

/* ── Firebase ────────────────────────────────── */
function iniciar() {
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
      html += `
        <div class="ev-dia-pill ${ev.categoria || 'pessoal'}">
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
        html += `
          <div class="ev-block ${ev.categoria || 'pessoal'}">
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

  const CAT_COR = { pessoal: 'var(--green)', importante: 'var(--amber)', urgente: 'var(--red)', faculdade: 'var(--blue)' };

  if (prox.length === 0) { emptyState(el, '📅', 'Nenhum evento futuro'); return; }
  el.innerHTML = '';
  prox.forEach(ev => {
    const cor   = CAT_COR[ev.categoria] || 'var(--green)';
    const hora  = ev.diaTodo ? 'Dia todo' : (ev.horaInicio || '');
    const div   = document.createElement('div');
    div.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);';
    div.innerHTML = `
      <div style="width:8px;height:8px;border-radius:50%;background:${cor};flex-shrink:0;"></div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:.86rem;font-weight:600;">${ev.titulo}</div>
        <div style="font-size:.74rem;color:var(--muted);">${formatarDataCurta(ev.data)}${hora ? ' · ' + hora : ''}</div>
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

/* ── CRUD ────────────────────────────────────── */
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

/* ── Modal ───────────────────────────────────── */
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

  document.getElementById('ev-data').value = new Date().toISOString().split('T')[0];
  renderCal();
  iniciar();
});
