/* =============================================
   CLAREANDO v3 — Estudos
   Firebase-first, sem bugs de timing
   ============================================= */

const CORES_MAT = [
  '#3d7a52','#2057c7','#c47f17','#b83232',
  '#6b35c7','#0891b2','#e11d48','#059669',
  '#9333ea','#d97706','#6b7280','#b05c2e',
];

let materias   = [];
let atividades = [];
let editMateriaId = null;

/* ── Color picker ────────────────────────────── */
function renderColorPicker(corAtiva) {
  const el = document.getElementById('color-picker');
  if (!el) return;
  el.innerHTML = CORES_MAT.map(c => `
    <div data-cor="${c}" class="cor-dot ${c === corAtiva ? 'sel' : ''}"
      style="width:26px;height:26px;border-radius:50%;background:${c};
             cursor:pointer;border:3px solid ${c === corAtiva ? 'var(--text)' : 'transparent'};
             transition:border-color .15s;flex-shrink:0;">
    </div>`).join('');
  el.querySelectorAll('.cor-dot').forEach(d => {
    d.addEventListener('click', () => {
      el.querySelectorAll('.cor-dot').forEach(x => { x.style.borderColor = 'transparent'; x.classList.remove('sel'); });
      d.style.borderColor = 'var(--text)';
      d.classList.add('sel');
    });
  });
}

function getCorAtiva() {
  const sel = document.querySelector('.cor-dot.sel');
  return sel ? sel.dataset.cor : CORES_MAT[0];
}

/* ── Firebase ────────────────────────────────── */
function iniciar() {
  // Carrega matérias
  db.collection('materias').orderBy('criadoEm').onSnapshot(snap => {
    materias = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    atualizarStats();
    renderLista();
  }, err => console.error('Erro materias:', err));

  // Carrega atividades
  db.collection('atividades').orderBy('criadoEm').onSnapshot(snap => {
    atividades = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    atualizarStats();
    renderLista();
  }, err => console.error('Erro atividades:', err));
}

/* ── Stats ───────────────────────────────────── */
function atualizarStats() {
  const total   = atividades.length;
  const concl   = atividades.filter(a => a.concluida).length;
  const pct     = total > 0 ? Math.round((concl / total) * 100) : 0;
  document.getElementById('stat-materias').textContent   = materias.length;
  document.getElementById('stat-atividades').textContent = total;
  document.getElementById('stat-concluidas').textContent = concl;
  document.getElementById('pct-geral').textContent       = pct + '%';
  document.getElementById('prog-geral').style.width      = pct + '%';
}

/* ── Render lista ────────────────────────────── */
function renderLista() {
  const el = document.getElementById('lista-materias');
  if (!el) return;

  if (materias.length === 0) {
    emptyState(el, '📚', 'Nenhuma matéria ainda', 'Clique em "+ Nova matéria" para começar');
    return;
  }

  el.innerHTML = '';
  materias.forEach(mat => {
    const atvMat  = atividades.filter(a => a.materiaId === mat.id);
    const concl   = atvMat.filter(a => a.concluida).length;
    const pct     = atvMat.length > 0 ? Math.round((concl / atvMat.length) * 100) : 0;

    const card = document.createElement('div');
    card.classList.add('materia-card');

    card.innerHTML = `
      <div class="materia-header">
        <div class="materia-dot" style="background:${mat.cor};"></div>
        <span class="materia-name">${mat.nome}</span>
        <div class="materia-meta">
          <div class="materia-prog-bar">
            <div class="materia-prog-fill" style="width:${pct}%;background:${mat.cor};"></div>
          </div>
          <span class="materia-prog-txt">${concl}/${atvMat.length}</span>
        </div>
        <button class="btn-icon" data-edit="${mat.id}" style="font-size:.8rem;" title="Editar">✏️</button>
        <button class="btn-icon" data-del="${mat.id}" title="Remover">✕</button>
        <span class="materia-chevron">▾</span>
      </div>
      <div class="materia-body">
        <div class="materia-body-inner" id="body-${mat.id}">
          ${renderAtividades(mat, atvMat)}
          ${renderFormAtv(mat.id)}
        </div>
      </div>`;

    // Toggle
    card.querySelector('.materia-header').addEventListener('click', e => {
      if (e.target.closest('.btn-icon')) return;
      card.classList.toggle('open');
    });

    // Editar matéria
    card.querySelector(`[data-edit="${mat.id}"]`).addEventListener('click', e => {
      e.stopPropagation();
      abrirModalEditar(mat);
    });

    // Remover matéria
    card.querySelector(`[data-del="${mat.id}"]`).addEventListener('click', e => {
      e.stopPropagation();
      deletarMateria(mat.id);
    });

    el.appendChild(card);

    // Após inserir no DOM, vincular eventos internos
    const inner = card.querySelector(`#body-${mat.id}`);

    // Checkboxes
    inner.querySelectorAll('[data-toggle]').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); toggleAtv(btn.dataset.toggle); });
    });
    inner.querySelectorAll('[data-del-atv]').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); deletarAtv(btn.dataset.delAtv); });
    });

    // Botão adicionar atividade
    inner.querySelector(`[data-add-atv="${mat.id}"]`)?.addEventListener('click', () => {
      adicionarAtv(mat.id, inner);
    });
    // Enter no input
    inner.querySelector(`#atv-input-${mat.id}`)?.addEventListener('keydown', e => {
      if (e.key === 'Enter') adicionarAtv(mat.id, inner);
    });
  });
}

function renderAtividades(mat, atvMat) {
  if (atvMat.length === 0) {
    return `<p style="font-size:.83rem;color:var(--muted);padding:6px 0;text-align:center;">Nenhuma atividade ainda.</p>`;
  }
  const sorted = [...atvMat].sort((a, b) => Number(a.concluida) - Number(b.concluida));
  return sorted.map(atv => {
    const prazo = atv.prazo ? `<span class="atv-prazo">até ${formatarDataCurta(atv.prazo)}</span>` : '';
    const prio  = { alta: `<span class="tag tag-red">Alta</span>`, media: `<span class="tag tag-amber">Média</span>`, baixa: `<span class="tag tag-muted">Baixa</span>` }[atv.prioridade] || '';
    return `
      <div class="atv-item ${atv.concluida ? 'done' : ''}">
        <div class="atv-check" data-toggle="${atv.id}" style="border-color:${mat.cor};">
          ${atv.concluida ? '✓' : ''}
        </div>
        <span class="atv-name">${atv.nome}</span>
        ${prazo}${prio}
        <button class="btn-icon" data-del-atv="${atv.id}">✕</button>
      </div>`;
  }).join('');
}

function renderFormAtv(matId) {
  return `
    <div class="add-atv-row">
      <input type="text" id="atv-input-${matId}" placeholder="Nova atividade…" style="flex:2;min-width:120px;">
      <select id="atv-prio-${matId}" style="flex:1;min-width:80px;">
        <option value="baixa">Baixa</option>
        <option value="media" selected>Média</option>
        <option value="alta">Alta</option>
      </select>
      <input type="date" id="atv-prazo-${matId}" style="flex:1;min-width:120px;">
      <button class="btn btn-primary btn-sm" data-add-atv="${matId}">+ Add</button>
    </div>`;
}

/* ── CRUD Matérias ───────────────────────────── */
async function salvarMateria() {
  const nome = document.getElementById('mat-nome').value.trim();
  const cor  = getCorAtiva();
  if (!nome) { toast('Informe o nome da matéria.', 'erro'); return; }

  const btn = document.getElementById('btn-salvar-materia');
  btn.disabled = true; btn.textContent = 'Salvando…';
  try {
    if (editMateriaId) {
      await db.collection('materias').doc(editMateriaId).update({ nome, cor });
      toast('Matéria atualizada ✓');
    } else {
      await db.collection('materias').add({ nome, cor, criadoEm: new Date().toISOString() });
      toast('Matéria criada ✓');
    }
    fecharModal();
  } catch(e) {
    toast('Erro ao salvar: ' + e.message, 'erro');
    console.error(e);
  } finally {
    btn.disabled = false;
    btn.textContent = editMateriaId ? 'Salvar' : 'Criar matéria';
  }
}

async function deletarMateria(id) {
  const atvs = atividades.filter(a => a.materiaId === id);
  if (!confirm(`Remover matéria e ${atvs.length} atividade(s)?`)) return;
  try {
    await db.collection('materias').doc(id).delete();
    const batch = db.batch();
    atvs.forEach(a => batch.delete(db.collection('atividades').doc(a.id)));
    if (atvs.length) await batch.commit();
    toast('Matéria removida.');
  } catch(e) { toast('Erro: ' + e.message, 'erro'); }
}

/* ── CRUD Atividades ─────────────────────────── */
async function adicionarAtv(matId, inner) {
  const nomeEl  = inner.querySelector(`#atv-input-${matId}`);
  const prioEl  = inner.querySelector(`#atv-prio-${matId}`);
  const prazoEl = inner.querySelector(`#atv-prazo-${matId}`);
  const nome    = nomeEl?.value.trim();
  if (!nome) { toast('Informe o nome da atividade.', 'erro'); return; }
  try {
    await db.collection('atividades').add({
      materiaId: matId, nome,
      prioridade: prioEl?.value || 'media',
      prazo: prazoEl?.value || '',
      concluida: false,
      criadoEm: new Date().toISOString()
    });
    if (nomeEl)  nomeEl.value  = '';
    if (prazoEl) prazoEl.value = '';
    toast('Atividade adicionada ✓');
  } catch(e) { toast('Erro: ' + e.message, 'erro'); console.error(e); }
}

async function toggleAtv(id) {
  const a = atividades.find(x => x.id === id);
  if (!a) return;
  try { await db.collection('atividades').doc(id).update({ concluida: !a.concluida }); }
  catch(e) { toast('Erro ao atualizar.', 'erro'); }
}

async function deletarAtv(id) {
  if (!confirm('Remover esta atividade?')) return;
  try { await db.collection('atividades').doc(id).delete(); toast('Removida.'); }
  catch(e) { toast('Erro: ' + e.message, 'erro'); }
}

/* ── Modal ───────────────────────────────────── */
function abrirModalNova() {
  editMateriaId = null;
  document.getElementById('modal-mat-titulo').textContent = 'Nova matéria';
  document.getElementById('mat-nome').value = '';
  document.getElementById('btn-salvar-materia').textContent = 'Criar matéria';
  renderColorPicker(CORES_MAT[0]);
  document.getElementById('modal-materia').classList.add('open');
  setTimeout(() => document.getElementById('mat-nome').focus(), 100);
}

function abrirModalEditar(mat) {
  editMateriaId = mat.id;
  document.getElementById('modal-mat-titulo').textContent = 'Editar matéria';
  document.getElementById('mat-nome').value = mat.nome;
  document.getElementById('btn-salvar-materia').textContent = 'Salvar';
  renderColorPicker(mat.cor);
  document.getElementById('modal-materia').classList.add('open');
}

function fecharModal() {
  document.getElementById('modal-materia').classList.remove('open');
}

/* ── Init ────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-nova-materia').addEventListener('click', abrirModalNova);
  document.getElementById('modal-mat-close').addEventListener('click', fecharModal);
  document.getElementById('modal-materia').addEventListener('click', e => { if (e.target === e.currentTarget) fecharModal(); });
  document.getElementById('btn-salvar-materia').addEventListener('click', salvarMateria);
  document.getElementById('mat-nome')?.addEventListener('keydown', e => { if (e.key === 'Enter') salvarMateria(); });

  // db está garantido porque firebase-config.js roda antes e é síncrono
  iniciar();
});
