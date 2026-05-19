/* =============================================
   CLAREANDO v3 — Financeiro (Firebase)
   ============================================= */

const CATS = [
  { nome:'Salário',             icon:'💰', cor:'#2057c7', bg:'#dbeafe' },
  { nome:'Moradia',             icon:'🏠', cor:'#3d7a52', bg:'#c8dbb0' },
  { nome:'Alimentação',         icon:'🛒', cor:'#c47f17', bg:'#fef3c7' },
  { nome:'Serviços domésticos', icon:'⚡', cor:'#6b35c7', bg:'#ede9fe' },
  { nome:'Mensalidades',        icon:'📱', cor:'#059669', bg:'#d1fae5' },
  { nome:'Gastos Pessoais',     icon:'👤', cor:'#b83232', bg:'#fee2e2' },
  { nome:'Assinaturas',         icon:'🎬', cor:'#9333ea', bg:'#f3e8ff' },
  { nome:'Transporte',          icon:'🚌', cor:'#0891b2', bg:'#cffafe' },
  { nome:'Saúde',               icon:'❤️', cor:'#e11d48', bg:'#ffe4e6' },
  { nome:'Lazer',               icon:'🎉', cor:'#d97706', bg:'#fef9c3' },
  { nome:'Outros',              icon:'📦', cor:'#6b7280', bg:'#f3f4f6' },
];
function getcat(nome) { return CATS.find(c => c.nome === nome) || CATS[CATS.length-1]; }

let lancamentos = [];
let fixas       = [];
let mes = new Date().getMonth();
let ano = new Date().getFullYear();

/* ── Tabs ─────────────────────────────────────── */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

/* ── Selects de categoria ─────────────────────── */
function preencherCats() {
  ['lanc-cat','fixa-cat','fil-cat'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const isFilter = id === 'fil-cat';
    el.innerHTML = (isFilter ? '<option value="">Todas as categorias</option>' : '') +
      CATS.map(c => `<option value="${c.nome}">${c.icon} ${c.nome}</option>`).join('');
  });
}

/* ── Seletor mês/ano ──────────────────────────── */
function initSeletorMes() {
  const sm = document.getElementById('sel-mes');
  const sa = document.getElementById('sel-ano');
  MESES.forEach((m,i) => { const o = document.createElement('option'); o.value=i; o.textContent=m; if(i===mes) o.selected=true; sm.appendChild(o); });
  for (let a = ano+1; a >= 2023; a--) { const o = document.createElement('option'); o.value=a; o.textContent=a; if(a===ano) o.selected=true; sa.appendChild(o); }
  sm.addEventListener('change', () => { mes = +sm.value; render(); });
  sa.addEventListener('change', () => { ano = +sa.value; render(); });
}

/* ── Firebase ─────────────────────────────────── */
function iniciar() {
  db.collection('lancamentos').orderBy('data','desc').onSnapshot(snap => {
    lancamentos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    render();
  }, err => console.error(err));
  db.collection('contas_fixas').orderBy('vencimento').onSnapshot(snap => {
    fixas = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderFixas();
  }, err => console.error(err));
}

function doMes() {
  return lancamentos.filter(l => {
    const d = new Date(l.data);
    return d.getMonth() === mes && d.getFullYear() === ano;
  });
}

/* ── Render geral ─────────────────────────────── */
function render() {
  const dm = doMes();
  renderKPIs(dm);
  renderChart(dm);
  renderBreakdown(dm);
  renderTabela(dm);
  document.getElementById('chart-label').textContent = `${MESES[mes]} ${ano}`;
}

/* ── KPIs ─────────────────────────────────────── */
function renderKPIs(dm) {
  const ent = dm.filter(l=>l.tipo==='entrada');
  const sai = dm.filter(l=>l.tipo==='saida');
  const te  = ent.reduce((s,l)=>s+l.valor,0);
  const ts  = sai.reduce((s,l)=>s+l.valor,0);
  const res = te - ts;
  document.getElementById('kpi-receita').textContent    = formatarBRL(te);
  document.getElementById('kpi-despesa').textContent    = formatarBRL(ts);
  document.getElementById('kpi-result').textContent     = formatarBRL(res);
  document.getElementById('kpi-receita-sub').textContent = `${ent.length} lançamento(s)`;
  document.getElementById('kpi-despesa-sub').textContent = `${sai.length} lançamento(s)`;
  document.getElementById('kpi-result').style.color = res >= 0 ? 'var(--green)' : 'var(--red)';
}

/* ── Gráfico barras ───────────────────────────── */
function renderChart(dm) {
  const el = document.getElementById('bar-chart');
  if (!el) return;
  const grupos = {};
  dm.forEach(l => { if (!grupos[l.categoria]) grupos[l.categoria] = 0; grupos[l.categoria] += l.valor; });
  const totEnt = dm.filter(l=>l.tipo==='entrada').reduce((s,l)=>s+l.valor,0);
  const barras = [
    { nome:'Receitas', total:totEnt, cat:{icon:'💰',cor:'#2057c7'}, isEnt:true },
    ...Object.entries(grupos).map(([n,v]) => ({ nome:n, total:v, cat:getcat(n), isEnt:false }))
  ].filter(b => b.total > 0);
  const max = Math.max(...barras.map(b=>b.total), 1);
  el.innerHTML = barras.map(b => {
    const pct = Math.max((b.total/max)*100, 3);
    return `<div class="bar-col">
      <div class="bar-fill-wrap">
        <div class="bar-fill" style="height:${pct}%;background:${b.cat.cor};">
          <div class="bar-tooltip">${formatarBRL(b.total)}</div>
        </div>
      </div>
      <div class="bar-icon">${b.cat.icon}</div>
      <div class="bar-label" title="${b.nome}">${b.nome}</div>
    </div>`;
  }).join('');
}

/* ── Breakdown ────────────────────────────────── */
function renderBreakdown(dm) {
  const el = document.getElementById('cat-breakdown');
  if (!el) return;
  const saidas = dm.filter(l=>l.tipo==='saida');
  if (!saidas.length) { emptyState(el, '📊', 'Sem despesas neste mês'); return; }
  const grupos = {};
  saidas.forEach(l => { grupos[l.categoria] = (grupos[l.categoria]||0) + l.valor; });
  const total  = Object.values(grupos).reduce((a,b)=>a+b,0);
  const sorted = Object.entries(grupos).sort(([,a],[,b])=>b-a);
  el.innerHTML = sorted.map(([nome,val]) => {
    const cat = getcat(nome);
    const pct = total > 0 ? ((val/total)*100).toFixed(1) : 0;
    return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);">
      <span style="font-size:.9rem;">${cat.icon}</span>
      <div style="flex:1;">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <span style="font-size:.84rem;font-weight:600;">${nome}</span>
          <span style="font-size:.84rem;color:var(--red);font-weight:700;">${formatarBRL(val)}</span>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${cat.cor};"></div></div>
      </div>
      <span style="font-size:.74rem;color:var(--muted);min-width:34px;text-align:right;">${pct}%</span>
    </div>`;
  }).join('');
}

/* ── Tabela ───────────────────────────────────── */
function renderTabela(dm) {
  const tbody = document.getElementById('tabela-lanc');
  if (!tbody) return;
  const ft = document.getElementById('fil-tipo').value;
  const fc = document.getElementById('fil-cat').value;
  let lista = [...dm];
  if (ft) lista = lista.filter(l=>l.tipo===ft);
  if (fc) lista = lista.filter(l=>l.categoria===fc);
  document.getElementById('fil-count').textContent = `${lista.length} item(s)`;
  if (!lista.length) { tbody.innerHTML = `<tr><td colspan="6" style="padding:28px;text-align:center;color:var(--muted);">Nenhum lançamento.</td></tr>`; return; }
  tbody.innerHTML = lista.map(l => {
    const cat = getcat(l.categoria);
    const isEnt = l.tipo==='entrada';
    return `<tr>
      <td><span style="font-weight:600;">${l.descricao}</span></td>
      <td class="${isEnt?'td-entrada':'td-saida'}">${isEnt?'+':'−'} ${formatarBRL(l.valor)}</td>
      <td><span class="tag ${isEnt?'tag-green':'tag-red'}">${isEnt?'↑ Entrada':'↓ Saída'}</span></td>
      <td><span class="cat-pill" style="background:${cat.bg};color:${cat.cor};">${cat.icon} ${l.categoria}</span></td>
      <td style="color:var(--muted);font-size:.8rem;">${formatarDataCurta(l.data)}</td>
      <td><button class="btn-icon" data-del="${l.id}">✕</button></td>
    </tr>`;
  }).join('');
  tbody.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => deletarLanc(b.dataset.del)));
}

/* ── Fixas ────────────────────────────────────── */
function renderFixas() {
  const tbody = document.getElementById('tabela-fixas');
  if (!tbody) return;
  if (!fixas.length) { tbody.innerHTML = `<tr><td colspan="5" style="padding:28px;text-align:center;color:var(--muted);">Nenhuma conta fixa.</td></tr>`; return; }
  tbody.innerHTML = fixas.map(f => {
    const cat = getcat(f.categoria);
    return `<tr>
      <td><span style="font-weight:600;">${f.descricao}</span></td>
      <td style="color:var(--red);font-weight:700;">${formatarBRL(f.valor)}</td>
      <td style="color:var(--muted);font-size:.83rem;">Dia ${f.vencimento}</td>
      <td><span class="cat-pill" style="background:${cat.bg};color:${cat.cor};">${cat.icon} ${f.categoria}</span></td>
      <td><button class="btn-icon" data-del-f="${f.id}">✕</button></td>
    </tr>`;
  }).join('');
  tbody.querySelectorAll('[data-del-f]').forEach(b => b.addEventListener('click', () => deletarFixa(b.dataset.delF)));
}

/* ── CRUD ─────────────────────────────────────── */
async function salvarLanc() {
  const desc  = document.getElementById('lanc-desc').value.trim();
  const valor = parseFloat(document.getElementById('lanc-valor').value);
  const tipo  = document.getElementById('lanc-tipo').value;
  const cat   = document.getElementById('lanc-cat').value;
  const data  = document.getElementById('lanc-data').value;
  const fixa  = document.getElementById('lanc-fixa').checked;
  if (!desc)  { toast('Informe a descrição.','erro'); return; }
  if (!valor||valor<=0) { toast('Informe um valor válido.','erro'); return; }
  if (!data)  { toast('Informe a data.','erro'); return; }
  const btn = document.getElementById('btn-salvar-lanc');
  btn.disabled=true; btn.textContent='Salvando…';
  try {
    await db.collection('lancamentos').add({ descricao:desc, valor, tipo, categoria:cat, data, criadoEm: new Date().toISOString() });
    if (fixa) {
      const dia = new Date(data+'T12:00').getDate();
      await db.collection('contas_fixas').add({ descricao:desc, valor, categoria:cat, vencimento:dia });
    }
    document.getElementById('lanc-desc').value ='';
    document.getElementById('lanc-valor').value='';
    document.getElementById('lanc-fixa').checked=false;
    fecharModal('modal-lanc');
    toast(`${tipo==='entrada'?'Entrada':'Saída'} salva ✓`);
  } catch(e) { toast('Erro: '+e.message,'erro'); } finally { btn.disabled=false; btn.textContent='+ Salvar'; }
}

async function salvarFixa() {
  const desc = document.getElementById('fixa-desc').value.trim();
  const valor= parseFloat(document.getElementById('fixa-valor').value);
  const venc = parseInt(document.getElementById('fixa-venc').value);
  const cat  = document.getElementById('fixa-cat').value;
  if (!desc||!valor||!venc) { toast('Preencha todos os campos.','erro'); return; }
  try {
    await db.collection('contas_fixas').add({ descricao:desc, valor, vencimento:venc, categoria:cat });
    fecharModal('modal-fixa');
    toast('Conta fixa salva ✓');
  } catch(e) { toast('Erro: '+e.message,'erro'); }
}

async function deletarLanc(id) {
  if (!confirm('Remover?')) return;
  try { await db.collection('lancamentos').doc(id).delete(); toast('Removido.'); } catch(e) { toast('Erro.','erro'); }
}
async function deletarFixa(id) {
  if (!confirm('Remover?')) return;
  try { await db.collection('contas_fixas').doc(id).delete(); toast('Removida.'); } catch(e) { toast('Erro.','erro'); }
}

async function replicarFixas() {
  if (!fixas.length) { toast('Nenhuma fixa cadastrada.','erro'); return; }
  if (!confirm(`Replicar ${fixas.length} conta(s) para ${MESES[mes]} ${ano}?`)) return;
  let count = 0;
  for (const f of fixas) {
    const dia = Math.min(f.vencimento, new Date(ano,mes+1,0).getDate());
    const data = `${ano}-${String(mes+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
    const existe = lancamentos.some(l => l.descricao===f.descricao && l.data.startsWith(`${ano}-${String(mes+1).padStart(2,'0')}`));
    if (existe) continue;
    await db.collection('lancamentos').add({ descricao:f.descricao, valor:f.valor, tipo:'saida', categoria:f.categoria, data, criadoEm: new Date().toISOString() });
    count++;
  }
  toast(`${count} conta(s) replicada(s) ✓`);
}

/* ── Modal helpers ────────────────────────────── */
function abrirModal(id) { document.getElementById(id).classList.add('open'); }
function fecharModal(id) { document.getElementById(id).classList.remove('open'); }

/* ── Init ─────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  preencherCats();
  initSeletorMes();
  document.getElementById('lanc-data').value = new Date().toISOString().split('T')[0];

  document.getElementById('btn-novo-lanc').addEventListener('click', () => abrirModal('modal-lanc'));
  document.getElementById('modal-lanc-close').addEventListener('click', () => fecharModal('modal-lanc'));
  document.getElementById('modal-lanc').addEventListener('click', e => { if(e.target===e.currentTarget) fecharModal('modal-lanc'); });
  document.getElementById('btn-salvar-lanc').addEventListener('click', salvarLanc);

  document.getElementById('btn-nova-fixa').addEventListener('click', () => abrirModal('modal-fixa'));
  document.getElementById('modal-fixa-close').addEventListener('click', () => fecharModal('modal-fixa'));
  document.getElementById('modal-fixa').addEventListener('click', e => { if(e.target===e.currentTarget) fecharModal('modal-fixa'); });
  document.getElementById('btn-salvar-fixa').addEventListener('click', salvarFixa);

  document.getElementById('btn-replicar').addEventListener('click', replicarFixas);
  document.getElementById('fil-tipo').addEventListener('change', () => renderTabela(doMes()));
  document.getElementById('fil-cat').addEventListener('change',  () => renderTabela(doMes()));

  iniciar();
});
