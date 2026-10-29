/* Aba Simulações — explorador interativo.
   Lê as bases brutas SOMENTE para leitura e calcula os cenários no navegador; nada é gravado.
   Parâmetros com fonte e hashes de integridade: simulacao.json (scripts/build_simulation.py). */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const fmt = (v, d = 1) => v == null || !isFinite(v) ? '—' : Number(v).toLocaleString('pt-BR', {minimumFractionDigits: d, maximumFractionDigits: d});
  const int = v => v == null || !isFinite(v) ? '—' : Math.round(v).toLocaleString('pt-BR');
  const pct = v => v == null || !isFinite(v) ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '') + fmt(Math.abs(v)) + '%';
  const pp = v => v == null || !isFinite(v) ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '') + fmt(Math.abs(v)) + ' p.p.';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const range = (a, b) => Array.from({length: b - a + 1}, (_, i) => a + i);
  const median = a => { const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length ? (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) : null; };
  const varp = (a, b) => a ? (b / a - 1) * 100 : null;
  const MES = ['', 'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const COL = {of: '#175b62', sim: '#d9822b', cmp: '#7f9198', cmpSim: '#b7c3c7', down: '#5fa58d', up: '#cc5b4c', total: '#175b62'};
  const REGIOES = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'];
  const TABLE_GROUPS = ['BR', 'R:Norte', 'R:Nordeste', 'R:Centro-Oeste', 'R:Sudeste', 'R:Sul', 'X:NEsemCE', 'X:3REG'];
  let S, P, H, O, MAXM = 9, KIPEA = 41;
  const REG = {}, NAME = {}, GROUPS = {};
  const st = {mode: 'let', geo: 'R:Nordeste', cmp: 'BR', base: 'cvli_interv', k: 41, period: 'ytd', cut: 9, casc: 'uf',
    year: 2025, femMode: 'year', femP: 44.4, vdLim: 25, vdImp: 'regional', subTema: 'estupro', subRate: 8.5, subPrev: 16.9};
  const NUM = new Set(['k', 'cut', 'year', 'femP', 'vdLim', 'subRate', 'subPrev']);
  const SRC = {
    sinesp: '<a href="https://www.gov.br/mj/pt-br/assuntos/sua-seguranca/seguranca-publica/estatistica/download/dnsp-base-de-dados" target="_blank" rel="noreferrer">SINESP-VDE/MJSP</a>',
    ibge: '<a href="https://ftp.ibge.gov.br/Projecao_da_Populacao/Projecao_da_Populacao_2024/" target="_blank" rel="noreferrer">IBGE, projeções 2024</a>',
    atlas: '<a href="https://www.ipea.gov.br/portal/categorias/45-todas-as-noticias/noticias/16394-atlas-da-violencia-brasil-registrou-42-590-homicidios-em-2024-menor-resultado-da-serie-historica-mas-subnotificacao-preocupa" target="_blank" rel="noreferrer">Ipea/FBSP, Atlas da Violência 2026</a>',
    atlasMet: '<a href="https://repositorio.ipea.gov.br/bitstream/11058/14031/5/AtlasViolencia2024_Retrato_dos_municipios_brasileros.pdf" target="_blank" rel="noreferrer">método dos homicídios ocultos (Atlas 2024)</a>',
    fbsp: '<a href="https://forumseguranca.org.br/wp-content/uploads/2026/07/anuario-2026.xlsx" target="_blank" rel="noreferrer">FBSP, Anuários 2023–2026</a>',
    td: '<a href="https://repositorio.ipea.gov.br/bitstream/11058/11814/4/TD_2880_web.pdf" target="_blank" rel="noreferrer">Ipea, Texto para Discussão 2880</a>',
    vv: '<a href="https://forumseguranca.org.br/wp-content/uploads/2025/03/sumario-executivo-visivel-e-invisivel-5ed-2025.pdf" target="_blank" rel="noreferrer">FBSP/Datafolha, Visível e Invisível 2025</a>'
  };

  /* ---------- grupos ---------- */
  function buildGroups(states) {
    states.forEach(s => { REG[s.uf] = s.region; NAME[s.uf] = s.name; });
    const all = Object.keys(REG);
    GROUPS.BR = {label: 'Brasil', ufs: all};
    REGIOES.forEach(r => GROUPS['R:' + r] = {label: r, ufs: all.filter(u => REG[u] === r)});
    GROUPS['X:NEsemCE'] = {label: 'Nordeste sem Ceará', ufs: all.filter(u => REG[u] === 'Nordeste' && u !== 'CE')};
    GROUPS['X:3REG'] = {label: 'Sul + Sudeste + Centro-Oeste', ufs: all.filter(u => ['Sul', 'Sudeste', 'Centro-Oeste'].includes(REG[u]))};
    GROUPS['X:BRsemNE'] = {label: 'Brasil sem Nordeste', ufs: all.filter(u => REG[u] !== 'Nordeste')};
    all.slice().sort((a, b) => NAME[a].localeCompare(NAME[b], 'pt')).forEach(u => GROUPS['U:' + u] = {label: NAME[u], ufs: [u]});
  }
  const glabel = id => GROUPS[id] ? GROUPS[id].label : '';
  function regionOf(id) { const r = new Set(GROUPS[id].ufs.map(x => REG[x])); return r.size === 1 ? [...r][0] : null; }

  /* ---------- controles ---------- */
  const field = (label, inner, cls = '') => `<div class="field ${cls}"><label>${label}</label>${inner}</div>`;
  const sel = (k, opts, val, dis) => `<select data-k="${k}"${dis ? ' disabled' : ''}>` + opts.map(([v, l]) => `<option value="${v}"${String(v) === String(val) ? ' selected' : ''}>${esc(l)}</option>`).join('') + '</select>';
  function geoSel(k, val, none) {
    const ids = Object.keys(GROUPS);
    const grp = (lab, list) => `<optgroup label="${lab}">` + list.map(id => `<option value="${id}"${id === val ? ' selected' : ''}>${esc(GROUPS[id].label)}</option>`).join('') + '</optgroup>';
    return `<select data-k="${k}">` + (none ? `<option value="none"${val === 'none' ? ' selected' : ''}>Sem comparação</option>` : '') +
      grp('Brasil e regiões', ids.filter(i => i === 'BR' || i.startsWith('R:'))) + grp('Recortes especiais', ids.filter(i => i.startsWith('X:'))) + grp('Estados', ids.filter(i => i.startsWith('U:'))) + '</select>';
  }
  function slider(k, min, max, step, val, presets, dis, label) {
    return `<div class="sim-range"><input type="range" data-k="${k}" min="${min}" max="${max}" step="${step}" value="${val}" aria-label="${esc(label)}"${dis ? ' disabled' : ''}><output data-out="${k}">${fmt(val, step < 1 ? 1 : 0)}%</output></div>` +
      (presets ? '<div class="sim-presets">' + presets.map(([v, l]) => `<button type="button" data-preset="${k}" data-v="${v}" class="${Math.abs(+v - val) < 0.05 ? 'active' : ''}"${dis ? ' disabled' : ''}>${esc(l)}</button>`).join('') + '</div>' : '');
  }
  const yearOpts = () => range(2021, 2025).reverse().map(y => [y, String(y)]);
  function controls() {
    const geo = field('Localidade', geoSel('geo', st.geo)), cmp = field('Comparar com', geoSel('cmp', st.cmp, true));
    if (st.mode === 'let') return `<div class="sim-controls">${geo}${cmp}` +
      field('Base de mortes', sel('base', [['homicidio', 'Homicídio doloso (oficial)'], ['cvli', 'CVLI: + feminicídio, latrocínio, lesão seguida de morte'], ['cvli_interv', 'CVLI + mortes por intervenção policial']], st.base)) +
      field('Período', sel('period', [['ytd', 'Mesmo período de cada ano (inclui 2026)'], ['annual', 'Anos completos (2015–2025)']], st.period)) +
      field('Corte do ano', sel('cut', range(1, MAXM).map(m => [m, 'Janeiro a ' + MES[m]]), st.cut, st.period !== 'ytd')) + '</div>' +
      `<div class="sim-param">${field('Parte das “mortes a esclarecer” contada como homicídio', slider('k', 0, 100, 1, st.k, [[0, '0% · só registro oficial'], [KIPEA, KIPEA + '% · estimativa Ipea'], [100, '100% · teto']], false, 'Parcela das mortes a esclarecer'), 'wide')}</div>`;
    if (st.mode === 'fem') return `<div class="sim-controls">${geo}${cmp}` +
      field('Ano em destaque', sel('year', yearOpts(), st.year)) +
      field('Proporção aplicada', sel('femMode', [['year', 'Proporção nacional de cada ano'], ['fixed', 'Valor fixo escolhido']], st.femMode)) + '</div>' +
      `<div class="sim-param">${field('Proporção de homicídios de mulheres tratada como feminicídio', slider('femP', 10, 80, 0.1, st.femP, [[44.4, 'Brasil 2025 · 44,4%'], [32.2, 'Nordeste 2025 · 32,2%'], [58.1, 'Centro-Oeste 2025 · 58,1%']], st.femMode !== 'fixed', 'Proporção de feminicídio'), 'wide')}${st.femMode !== 'fixed' ? '<p class="sim-hint">Para mover o controle, escolha “Valor fixo escolhido” em Proporção aplicada.</p>' : ''}</div>`;
    if (st.mode === 'vd') return `<div class="sim-controls">${geo}${cmp}` +
      field('Ano em destaque', sel('year', yearOpts(), st.year)) +
      field('Estado com registro atípico recebe', sel('vdImp', [['regional', 'Mediana dos demais estados da região'], ['nacional', 'Mediana dos demais estados do país'], ['excluir', 'Nada: é retirado da conta']], st.vdImp)) + '</div>' +
      `<div class="sim-param">${field('Registro atípico: taxa abaixo de … da taxa nacional', slider('vdLim', 5, 50, 1, st.vdLim, [[25, '25% · padrão'], [10, '10%'], [50, '50%']], false, 'Limiar de registro atípico'), 'wide')}</div>`;
    return `<div class="sim-controls">` + field('Tema', sel('subTema', [['estupro', 'Estupro e estupro de vulnerável'], ['agressao', 'Agressão física contra mulheres']], st.subTema)) +
      field('Localidade', '<select disabled><option>Brasil (não há estimativa regional)</option></select>') + '</div>' +
      (st.subTema === 'estupro'
        ? `<div class="sim-param">${field('Parcela dos casos que chega à polícia', slider('subRate', 2, 30, 0.5, st.subRate, [[8.5, '8,5% · estimativa Ipea'], [5, '5%'], [15, '15%']], false, 'Taxa de registro policial'), 'wide')}</div>`
        : `<div class="sim-param">${field('Mulheres que relataram agressão física (margem da pesquisa: ±3 p.p.)', slider('subPrev', 13.9, 19.9, 0.1, st.subPrev, [[16.9, '16,9% · resultado'], [13.9, 'piso da margem'], [19.9, 'teto da margem']], false, 'Prevalência da pesquisa'), 'wide')}</div>`);
  }

  /* ---------- gráficos ---------- */
  function niceStep(x) { const p = Math.pow(10, Math.floor(Math.log10(x))), f = x / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p; }
  function lineChart(el, xs, series, o = {}) {
    const W = 980, Hh = 360, L = 62, R = 58, T = 22, B = 40;
    const vals = series.flatMap(s => s.pts.filter(v => v != null && isFinite(v)));
    if (!vals.length) { el.innerHTML = '<text x="490" y="180" text-anchor="middle" fill="#8a9aa1" font-size="13">Sem dados completos para este recorte.</text>'; return; }
    const step = niceStep(Math.max(...vals) / 5), hi = Math.ceil(Math.max(...vals) * 1.08 / step) * step;
    const x = i => L + (W - L - R) * (xs.length === 1 ? 0.5 : i / (xs.length - 1)), y = v => T + (Hh - T - B) * (1 - v / hi);
    const f = o.fmt || (v => fmt(v)), ends = [];
    let g = '';
    for (let t = 0; t <= hi + 1e-9; t += step) g += `<line x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}" stroke="#e8eeee"/><text x="${L - 8}" y="${y(t) + 4}" text-anchor="end" font-size="11" fill="#8a9aa1">${f(t)}</text>`;
    xs.forEach((v, i) => g += `<text x="${x(i)}" y="${Hh - B + 22}" text-anchor="middle" font-size="11.5" fill="#53666e">${esc(v)}</text>`);
    series.forEach(s => {
      let d = '', on = false;
      s.pts.forEach((v, i) => { if (v == null || !isFinite(v)) { on = false; return; } d += (on ? 'L' : 'M') + x(i) + ',' + y(v); on = true; });
      g += `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="${s.w || 2}" stroke-dasharray="${s.dash || ''}" stroke-linejoin="round" stroke-linecap="round"/>`;
      s.pts.forEach((v, i) => { if (v == null || !isFinite(v)) return; g += `<circle cx="${x(i)}" cy="${y(v)}" r="${s.w > 2 ? 4 : 3}" fill="#fff" stroke="${s.color}" stroke-width="2"><title>${esc(s.name)} · ${esc(xs[i])}: ${f(v)}${s.est ? ' (estimativa)' : ''}</title></circle>`; });
      const idx = s.pts.map((v, i) => v != null && isFinite(v) ? i : -1).filter(i => i >= 0), li = idx[idx.length - 1];
      if (li != null) ends.push({x: x(li) + 9, y: y(s.pts[li]) + 4, t: f(s.pts[li]), c: s.color});
    });
    ends.sort((a, b) => a.y - b.y);
    for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 14) ends[i].y = ends[i - 1].y + 14;
    ends.forEach(e => g += `<text x="${e.x}" y="${e.y}" font-size="11.5" font-weight="800" fill="${e.c}">${e.t}</text>`);
    el.innerHTML = g;
  }
  const legend = series => series.map(s => `<span class="sim-leg"><i style="border-top:3px ${s.dash ? 'dashed' : 'solid'} ${s.color}"></i>${esc(s.name)}${s.est ? ' <b class="sim-tag">estimativa</b>' : ''}</span>`).join('');
  function pairBars(rows, names, o = {}) {
    const W = 980, rh = 40, T = 8, L = 220, R = 80, Hh = T + rows.length * rh + 8;
    const mx = Math.max(...rows.flatMap(r => [r.a, r.b]).filter(v => v != null && isFinite(v)), 0.0001);
    const x = v => L + (W - L - R) * v / mx, f = o.fmt || (v => fmt(v));
    let g = '';
    rows.forEach((r, i) => {
      const y0 = T + i * rh;
      if (r.hl) g += `<rect x="4" y="${y0 + 1}" width="${W - 8}" height="${rh - 2}" rx="6" fill="#fff4ea"/>`;
      g += `<text x="${L - 10}" y="${y0 + 23}" text-anchor="end" font-size="12" font-weight="${r.hl ? 800 : 600}" fill="#24404a">${esc(r.label)}</text>`;
      [[r.a, COL.of, 0], [r.b, COL.sim, 1]].forEach(([v, c, k]) => { if (v == null || !isFinite(v)) return; const yy = y0 + 6 + k * 14;
        g += `<rect x="${L}" y="${yy}" width="${Math.max(x(v) - L, 1)}" height="12" rx="3" fill="${c}"><title>${esc(r.label)} · ${esc(names[k])}: ${f(v)}</title></rect><text x="${x(v) + 6}" y="${yy + 10}" font-size="11" font-weight="700" fill="${c}">${f(v)}</text>`; });
    });
    return `<svg viewBox="0 0 ${W} ${Hh}" class="sim-svg" role="img">${g}</svg>`;
  }
  function cascadeSvg(c) {
    const steps = [{label: c.la, v: c.start, t: 1}].concat(c.steps.map(s => ({label: s.label, v: s.delta}))).concat([{label: c.lb, v: c.end, t: 1}]);
    let r = c.start; const lv = [c.start, c.end]; c.steps.forEach(s => { r += s.delta; lv.push(r); });
    const mx = Math.max(...lv), mn = Math.min(...lv), stp = niceStep(Math.max(mx - mn, mx * 0.05) / 3);
    let lo = Math.max(0, Math.floor((mn - (mx - mn) * 0.9) / stp) * stp); if (lo < mx * 0.25) lo = 0;
    const hi = Math.ceil(mx * 1.04 / stp) * stp;
    const W = 980, Hh = 340, L = 64, R = 14, T = 30, B = 58, bw = (W - L - R) / steps.length;
    const y = v => T + (Hh - T - B) * (1 - (v - lo) / (hi - lo)), f = int, tot = c.end - c.start;
    let g = '', run = c.start;
    for (let t = lo; t <= hi + 1e-9; t += stp) g += `<line x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}" stroke="#e8eeee"/><text x="${L - 8}" y="${y(t) + 4}" text-anchor="end" font-size="11" fill="#8a9aa1">${f(t)}</text>`;
    steps.forEach((s, i) => {
      const x0 = L + i * bw + bw * 0.16, w = bw * 0.68; let top, bot, fill, lab, sub = '';
      if (s.t) { top = y(s.v); bot = y(lo); fill = COL.total; lab = f(s.v); }
      else { const a = run, b = run + s.v; top = y(Math.max(a, b)); bot = y(Math.min(a, b)); fill = s.v <= 0 ? COL.down : COL.up; lab = (s.v > 0 ? '+' : s.v < 0 ? '−' : '') + f(Math.abs(s.v)); sub = Math.abs(tot) > 0.5 ? fmt(s.v / tot * 100) + '%' : '—'; run = b; }
      g += `<rect x="${x0}" y="${top}" width="${w}" height="${Math.max(bot - top, 1.5)}" rx="3" fill="${fill}"><title>${esc(s.label)}: ${lab}${sub ? ' · ' + sub + ' da variação total' : ''}</title></rect>`;
      g += `<text x="${x0 + w / 2}" y="${top - 6}" text-anchor="middle" font-size="11" font-weight="800" fill="#172b34">${lab}</text>`;
      g += `<text x="${x0 + w / 2}" y="${Hh - B + 18}" text-anchor="middle" font-size="11" font-weight="700" fill="#3a4f57">${esc(s.label)}</text>`;
      if (sub) g += `<text x="${x0 + w / 2}" y="${Hh - B + 34}" text-anchor="middle" font-size="10.5" fill="${s.v <= 0 ? '#3f7f6a' : '#a8402f'}">${sub}</text>`;
      if (i < steps.length - 1) { const nx = L + (i + 1) * bw + bw * 0.16; g += `<line x1="${x0 + w}" x2="${nx}" y1="${y(run)}" y2="${y(run)}" stroke="#9fb0b6" stroke-dasharray="2 2"/>`; }
    });
    return {svg: `<svg viewBox="0 0 ${W} ${Hh}" class="sim-svg" role="img" aria-label="Gráfico de cascata">${g}</svg>`, lo};
  }

  /* ---------- blocos comuns ---------- */
  let CSV = [];
  function kpis(cards) { $('sim-kpis').innerHTML = cards.map(c => `<article class="history-kpi tone-${c.tone || 'neutral'}${c.est ? ' sim-kpi-est' : ''}"><span>${esc(c.label)}${c.est ? ' <b class="sim-tag">estimativa</b>' : ''}</span><strong>${esc(c.value)}</strong><small>${c.detail}</small></article>`).join(''); }
  function badge(isEst) { const b = $('sim-badge'); b.className = 'sim-pill' + (isEst ? '' : ' ok'); b.textContent = isEst ? 'Contém estimativa' : 'Dado oficial'; }
  function explain(isEst, parts) {
    const el = $('sim-explain'); el.className = 'panel sim-explain ' + (isEst ? 'is-est' : 'is-official');
    el.innerHTML = `<div class="sim-explain-head"><span class="sim-pill${isEst ? '' : ' ok'}">${isEst ? 'Estimativa · não é dado oficial' : 'Dado oficial'}</span><h3>O que este número significa</h3></div>` +
      parts.map(([t, h]) => `<div class="sim-explain-row"><strong>${t}</strong><p>${h}</p></div>`).join('');
  }
  function table(head, rows) { $('sim-table-head').innerHTML = head.map(h => `<th${h.r ? ' class="right"' : ''}>${h.t}</th>`).join(''); $('sim-table-body').innerHTML = rows.join(''); }
  function second(show, title, caption, html) { $('sim-second').hidden = !show; if (!show) return; $('sim-second-title').textContent = title; $('sim-second-caption').innerHTML = caption; $('sim-second-body').innerHTML = html; }
  function alerts(show, html) { $('sim-alerts').hidden = !show; if (show) $('sim-alerts-body').innerHTML = html; }
  const tableIds = () => TABLE_GROUPS.concat(TABLE_GROUPS.includes(st.geo) ? [] : [st.geo]);

  /* ---------- 1. LETALIDADE (SINESP) ---------- */
  const COMP = {homicidio: ['homicidio'], cvli: ['homicidio', 'feminicidio', 'latrocinio', 'lesao_morte'], cvli_interv: ['homicidio', 'feminicidio', 'latrocinio', 'lesao_morte', 'intervencao']};
  const BASENAME = {homicidio: 'homicídio doloso', cvli: 'homicídio doloso, feminicídio, latrocínio e lesão corporal seguida de morte (CVLI)', cvli_interv: 'CVLI e mortes por intervenção policial'};
  const SHORT = {homicidio: 'Homicídio', feminicidio: 'Feminicídio', latrocinio: 'Latrocínio', lesao_morte: 'Lesão s. morte', intervencao: 'Intervenção', morte_esclarecer: 'A esclarecer'};
  const letYears = () => st.period === 'ytd' ? range(2015, 2026) : range(2015, 2025);
  const months = () => st.period === 'ytd' ? st.cut : 12;
  const letSim = () => st.base !== 'homicidio' || st.k > 0;
  function sumUF(m, u, y, mo) { const a = S.data[m] && S.data[m][u] && S.data[m][u][y]; if (!a) return null; const v = a.slice(0, mo); if (v.length < mo || v.some(x => x == null)) return null; return v.reduce((s, x) => s + x, 0); }
  function letPoint(ufs, y) {
    const mo = months(), comps = {};
    for (const m of COMP.cvli_interv.concat(['morte_esclarecer'])) { let t = 0; for (const u of ufs) { const v = sumUF(m, u, y, mo); if (v == null) return null; t += v; } comps[m] = t; }
    const pop = ufs.reduce((s, u) => s + P[u][y].habitantes, 0);
    const sim = COMP[st.base].reduce((s, m) => s + comps[m], 0) + st.k / 100 * comps.morte_esclarecer;
    return {y, comps, of: comps.homicidio, sim, pop, tOf: comps.homicidio / pop * 1e5, tSim: sim / pop * 1e5};
  }
  const letSeries = id => letYears().map(y => letPoint(GROUPS[id].ufs, y));
  function lastPair(arr) { const idx = arr.map((p, i) => p ? i : -1).filter(i => i >= 0); return [arr[idx[idx.length - 2]], arr[idx[idx.length - 1]]]; }
  function renderLet() {
    const ys = letYears(), A = letSeries(st.geo), B = st.cmp !== 'none' && st.cmp !== st.geo ? letSeries(st.cmp) : null, isEst = letSim();
    const [pa, pb] = lastPair(A), per = st.period === 'ytd' ? `jan–${MES[st.cut].slice(0, 3)}` : 'ano completo';
    const vo = varp(pa.tOf, pb.tOf), vs = varp(pa.tSim, pb.tSim);
    $('sim-title').textContent = 'Letalidade · ' + glabel(st.geo);
    $('sim-subtitle').textContent = (st.period === 'ytd' ? `Janeiro a ${MES[st.cut]} de cada ano` : 'Anos completos') + ' · mortes por 100 mil habitantes · SINESP + IBGE';
    badge(isEst);
    kpis([
      {label: `Homicídio oficial · ${pb.y}`, value: fmt(pb.tOf), detail: `${int(pb.of)} vítimas registradas (${per})`},
      {label: `Letalidade simulada · ${pb.y}`, value: fmt(pb.tSim), detail: isEst ? `${int(pb.sim)} mortes no cenário escolhido` : 'Sem hipótese aplicada: igual ao oficial', est: isEst},
      {label: `Variação oficial ${pa.y}→${pb.y}`, value: pct(vo), detail: 'Taxa de homicídio doloso registrado', tone: vo < 0 ? 'good' : 'warn'},
      {label: `Variação simulada ${pa.y}→${pb.y}`, value: pct(vs), detail: isEst ? `Diferença para o oficial: ${pp(vs - vo)}` : 'Ative uma simulação acima', tone: vs < 0 ? 'good' : 'warn', est: isEst}
    ]);
    const series = [{name: 'Homicídio oficial · ' + glabel(st.geo), color: COL.of, w: 3, pts: A.map(p => p && p.tOf)}];
    if (isEst) series.push({name: 'Simulado · ' + glabel(st.geo), color: COL.sim, w: 3, dash: '8 6', pts: A.map(p => p && p.tSim), est: true});
    if (B) { series.push({name: 'Homicídio oficial · ' + glabel(st.cmp), color: COL.cmp, w: 2, pts: B.map(p => p && p.tOf)});
      if (isEst) series.push({name: 'Simulado · ' + glabel(st.cmp), color: COL.cmpSim, w: 2, dash: '6 5', pts: B.map(p => p && p.tSim), est: true}); }
    lineChart($('sim-chart'), ys, series);
    $('sim-legend').innerHTML = legend(series);
    $('sim-chart-caption').textContent = 'Taxa por 100 mil habitantes';
    $('sim-chart-foot').textContent = (st.period === 'ytd' ? `Cada ponto soma janeiro a ${MES[st.cut]}; 2026 é parcial e sujeito a revisão. ` : '') + 'Anos com algum estado sem dado ficam em branco (ex.: Espírito Santo em 2015). Eixo a partir de zero. Passe o mouse nos pontos para ver os valores.';
    const kTxt = Math.abs(st.k - KIPEA) < 1 ? `<strong>${st.k}% é a estimativa publicada</strong> pelo Ipea e pelo FBSP no Atlas da Violência 2026. Um modelo de aprendizado de máquina, treinado com cerca de 3 milhões de mortes violentas do Sistema de Informações sobre Mortalidade (Ministério da Saúde), comparou cada morte de causa indeterminada ao perfil de homicídios, suicídios e acidentes (idade, sexo, local, instrumento, data) e classificou 7.083 de 17.207 mortes de 2024 como “homicídios ocultos”.`
      : st.k === 100 ? '<strong>100% é um teto deliberadamente exagerado</strong>: supõe que toda morte a esclarecer foi homicídio. Serve como limite do teste, não como estimativa.'
      : st.k === 0 ? 'Nenhuma morte a esclarecer foi incluída.' : `<strong>${st.k}% é um valor escolhido por você</strong> para testar a sensibilidade; não corresponde a uma estimativa publicada. A referência publicada é ${KIPEA}% (Ipea).`;
    explain(isEst, isEst ? [
      ['O que mede', `Quantas mortes violentas haveria por 100 mil habitantes se contássemos ${BASENAME[st.base]}${st.k > 0 ? ` e mais ${st.k}% das mortes que a polícia registrou como “a esclarecer (sem indício de crime)”` : ''}.`],
      ['Como é estimado', `Somamos as categorias oficiais do SINESP escolhidas na base${st.k > 0 ? ` e acrescentamos ${st.k}% da categoria “mortes a esclarecer”` : ''}. ${kTxt}`],
      ['Ressalvas', 'O percentual do Ipea foi medido nos dados de saúde (SIM), não na categoria do SINESP, que é parecida mas não idêntica. Por isso é um teste de sensibilidade: mostra se uma conclusão resiste, não quantos homicídios houve de fato. Mortes por intervenção policial incluem casos legais e só entram quando escolhidas na base.'],
      ['Fontes', `${SRC.sinesp} (registros) · ${SRC.ibge} (população) · ${SRC.atlas} e ${SRC.atlasMet} (parcela de ${KIPEA}%).`]
    ] : [
      ['O que mede', 'Vítimas de homicídio doloso registradas pelas polícias estaduais no SINESP, divididas pela população estimada pelo IBGE, por 100 mil habitantes.'],
      ['Nenhuma hipótese aplicada', 'Este é o número oficial. Para testar outras definições, mude a base de mortes ou inclua parte das mortes a esclarecer.'],
      ['Fontes', `${SRC.sinesp} · ${SRC.ibge}.`]
    ]);
    // cascata
    const single = GROUPS[st.geo].ufs.length === 1, mode = single ? 'comp' : st.casc;
    const used = isEst ? COMP[st.base].concat(st.k > 0 ? ['morte_esclarecer'] : []) : ['homicidio'];
    const val = (p, m) => m === 'morte_esclarecer' ? p.comps[m] * st.k / 100 : p.comps[m];
    let steps;
    if (mode === 'comp') steps = used.map(m => ({label: SHORT[m], delta: val(pb, m) - val(pa, m)}));
    else {
      const per2 = GROUPS[st.geo].ufs.map(u => { const a = letPoint([u], pa.y), b = letPoint([u], pb.y); return {label: u, delta: isEst ? b.sim - a.sim : b.of - a.of}; });
      per2.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
      steps = per2.length > 9 ? per2.slice(0, 7).concat([{label: `Outros ${per2.length - 7}`, delta: per2.slice(7).reduce((s, x) => s + x.delta, 0)}]) : per2;
      steps.sort((a, b) => a.delta - b.delta);
    }
    const cz = cascadeSvg({start: isEst ? pa.sim : pa.of, end: isEst ? pb.sim : pb.of, steps, la: String(pa.y), lb: String(pb.y)});
    const toggle = single ? '' : `<div class="sim-seg" role="group" aria-label="Abrir variação por"><button type="button" data-casc="uf" class="${mode === 'uf' ? 'active' : ''}">Por estado</button><button type="button" data-casc="comp" class="${mode === 'comp' ? 'active' : ''}">Por tipo de morte</button></div>`;
    second(true, `De onde veio a variação ${pa.y}→${pb.y}`, `${isEst ? 'Mortes no cenário simulado' : 'Vítimas de homicídio doloso'} (${per}), em números absolutos. Embaixo de cada degrau: peso na variação total.${cz.lo > 0 ? ` O eixo começa em ${int(cz.lo)} para mostrar os degraus.` : ''}${isEst && st.k > 0 && mode === 'comp' ? ' O degrau “A esclarecer” já está multiplicado pela parcela escolhida.' : ''}`, toggle + cz.svg);
    // tabela
    CSV = [['Recorte', `Oficial ${pb.y}`, `Var. oficial ${pa.y}-${pb.y} (%)`, `Simulado ${pb.y} (estimativa)`, 'Var. simulada (%)', 'Diferença (p.p.)']];
    table([{t: 'Recorte'}, {t: `Oficial ${pb.y}`, r: 1}, {t: 'Var. oficial', r: 1}, {t: `Simulado ${pb.y} <b class="sim-tag">estimativa</b>`, r: 1}, {t: 'Var. simulada', r: 1}, {t: 'Diferença', r: 1}],
      tableIds().map(id => { const [a, b] = lastPair(letSeries(id)); const o1 = varp(a.tOf, b.tOf), s1 = varp(a.tSim, b.tSim);
        CSV.push([glabel(id), b.tOf.toFixed(2), o1.toFixed(1), b.tSim.toFixed(2), s1.toFixed(1), (s1 - o1).toFixed(1)]);
        return `<tr class="${id === st.geo ? 'sim-highlight' : ''}"><td>${esc(glabel(id))}</td><td class="right">${fmt(b.tOf)}</td><td class="right">${pct(o1)}</td><td class="right">${fmt(b.tSim)}</td><td class="right">${pct(s1)}</td><td class="right">${pp(s1 - o1)}</td></tr>`; }));
    $('sim-table-caption').textContent = `Taxas por 100 mil habitantes · ${per} · ${pa.y}→${pb.y}. A diferença mostra quanto a hipótese muda a variação oficial.`;
    // alertas de quebra de série
    const mo = months(), list = [];
    GROUPS[st.geo].ufs.forEach(u => ys.slice(1).forEach(y => { const a = sumUF('morte_esclarecer', u, y - 1, mo), b = sumUF('morte_esclarecer', u, y, mo); if (a == null || b == null) return;
      if (b - a >= 100 && (a === 0 || b / a >= 2)) list.push({u, y, a, b, ha: sumUF('homicidio', u, y - 1, mo), hb: sumUF('homicidio', u, y, mo)}); }));
    list.sort((p, q) => q.y - p.y || (q.b - q.a) - (p.b - p.a));
    alerts(true, list.length ? '<p>Nestes casos, as mortes a esclarecer mais que dobraram de um ano para o outro. Quando isso coincide com queda de homicídios, a queda precisa ser confirmada com a secretaria estadual antes de ser divulgada.</p><div class="table-scroll"><table class="data-table sim-table"><thead><tr><th>Ano</th><th>Estado</th><th class="right">Mortes a esclarecer</th><th class="right">Homicídios</th></tr></thead><tbody>' +
      list.slice(0, 12).map(q => `<tr><td><span class="sim-pill warn">${q.y}</span></td><td>${esc(NAME[q.u])}</td><td class="right">${int(q.a)} → ${int(q.b)}</td><td class="right">${int(q.ha)} → ${int(q.hb)}</td></tr>`).join('') + '</tbody></table></div>'
      : '<p>Nenhum estado deste recorte teve salto atípico nas mortes a esclarecer no período exibido.</p>');
  }

  /* ---------- 2. MULHERES (FBSP) ---------- */
  const FY = range(2021, 2025);
  const hv = (m, u, y) => { const r = H.data[m] && H.data[m][u] && H.data[m][u][y]; return r && r.n != null ? r : null; };
  function popF(u, y) { const r = hv('homicidio-mulheres', u, y); if (r && r.t > 0) return r.n / r.t * 1e5; return P[u] && P[u][y] ? P[u][y].mulheres : null; }
  const natShare = {};
  function nationalShare(y) { if (natShare[y] != null) return natShare[y]; let h = 0, f = 0; Object.keys(REG).forEach(u => { const a = hv('homicidio-mulheres', u, y), b = hv('feminicidio', u, y); if (a && b) { h += a.n; f += b.n; } }); return (natShare[y] = f / h); }
  const femP = y => st.femMode === 'year' ? nationalShare(y) : st.femP / 100;
  function femPoint(ufs, y) {
    let hm = 0, fe = 0, pop = 0;
    for (const u of ufs) { const a = hv('homicidio-mulheres', u, y), b = hv('feminicidio', u, y), p = popF(u, y); if (!a || !b || !p) return null; hm += a.n; fe += b.n; pop += p; }
    const p = femP(y);
    return {y, hm, fe, pop, tHm: hm / pop * 1e5, tFe: fe / pop * 1e5, share: fe / hm * 100, tStd: hm * p / pop * 1e5, p: p * 100};
  }
  const femSeries = id => FY.map(y => femPoint(GROUPS[id].ufs, y));
  const subIds = () => { const reg = regionOf(st.geo); return reg && st.geo !== 'BR' ? {reg, ids: GROUPS['R:' + reg].ufs.map(u => 'U:' + u)} : {reg: null, ids: REGIOES.map(r => 'R:' + r).concat(['BR'])}; };
  function renderFem() {
    const A = femSeries(st.geo), B = st.cmp !== 'none' && st.cmp !== st.geo ? femSeries(st.cmp) : null, cur = A[FY.indexOf(st.year)], br = femPoint(GROUPS.BR.ufs, st.year);
    $('sim-title').textContent = 'Mulheres assassinadas e feminicídio · ' + glabel(st.geo);
    $('sim-subtitle').textContent = 'Vítimas por 100 mil mulheres · FBSP, Anuários 2023–2026 · 2021–2025';
    badge(true);
    kpis([
      {label: `Homicídio de mulheres · ${st.year}`, value: fmt(cur.tHm, 2), detail: `${int(cur.hm)} mulheres assassinadas (inclui feminicídios) · Brasil: ${fmt(br.tHm, 2)}`},
      {label: `Feminicídio registrado · ${st.year}`, value: fmt(cur.tFe, 2), detail: `${int(cur.fe)} casos classificados pela polícia · Brasil: ${fmt(br.tFe, 2)}`},
      {label: `Parcela classificada · ${st.year}`, value: fmt(cur.share) + '%', detail: `dos assassinatos de mulheres viraram feminicídio · Brasil: ${fmt(br.share)}%`, tone: cur.share < br.share - 5 ? 'warn' : 'neutral'},
      {label: `Feminicídio padronizado · ${st.year}`, value: fmt(cur.tStd, 2), detail: `se ${fmt(cur.p)}% dos assassinatos fossem classificados como feminicídio`, est: true}
    ]);
    const series = [{name: 'Homicídio de mulheres · ' + glabel(st.geo), color: '#9db8bc', w: 2, pts: A.map(p => p && p.tHm)},
      {name: 'Feminicídio registrado · ' + glabel(st.geo), color: COL.of, w: 3, pts: A.map(p => p && p.tFe)},
      {name: 'Feminicídio padronizado · ' + glabel(st.geo), color: COL.sim, w: 3, dash: '8 6', pts: A.map(p => p && p.tStd), est: true}];
    if (B) series.push({name: 'Feminicídio registrado · ' + glabel(st.cmp), color: COL.cmp, w: 2, pts: B.map(p => p && p.tFe)}, {name: 'Feminicídio padronizado · ' + glabel(st.cmp), color: COL.cmpSim, w: 2, dash: '6 5', pts: B.map(p => p && p.tStd), est: true});
    lineChart($('sim-chart'), FY, series, {fmt: v => fmt(v, 2)});
    $('sim-legend').innerHTML = legend(series);
    $('sim-chart-caption').textContent = 'Taxa por 100 mil mulheres';
    $('sim-chart-foot').textContent = '2021 vem do Anuário 2023; 2022 do Anuário 2024; 2023 do Anuário 2025; 2024 e 2025 do Anuário 2026. Populações reconstituídas das taxas publicadas pelo próprio Anuário. Eixo a partir de zero.';
    const pTxt = st.femMode === 'year' ? `a proporção nacional do próprio ano (em ${st.year}, ${fmt(nationalShare(st.year) * 100)}% dos assassinatos de mulheres no Brasil foram classificados como feminicídio)` : `uma proporção fixa de ${fmt(st.femP)}%, escolhida por você`;
    explain(true, [
      ['O que mede', 'Quantos feminicídios por 100 mil mulheres a localidade teria se suas polícias classificassem os assassinatos de mulheres na mesma proporção que a referência escolhida. Não é contagem de casos e não diz quais mortes foram feminicídio.'],
      ['Como é estimado', `Feminicídio padronizado = homicídios de mulheres registrados × ${pTxt}. Feminicídio depende de a polícia reconhecer a motivação de gênero, e essa decisão varia muito entre estados (em 2025, de 15,8% no Ceará a 68,2% em Sergipe). A padronização neutraliza essa diferença.`],
      ['Ressalvas', 'Supõe que a parcela real de feminicídios é igual em todo lugar, o que pode não ser verdade. Por isso, o indicador mais robusto para comparar regiões é o homicídio de mulheres, que não depende da classificação; com a proporção nacional, o padronizado segue o mesmo ranking. O FBSP aponta subclassificação histórica no Ceará.'],
      ['Fontes', `${SRC.fbsp}: homicídios de mulheres e feminicídios; proporção de feminicídios (Tabelas 21 e 28 do Anuário 2026).`]
    ]);
    const {reg, ids} = subIds();
    const rows = ids.map(id => { const p = femPoint(GROUPS[id].ufs, st.year); return {label: glabel(id), a: p && p.tFe, b: p && p.tStd, hl: id === st.geo}; }).sort((a, b) => b.b - a.b);
    second(true, `Registrado × padronizado em ${st.year}`, `<span class="sim-leg"><i style="border-top:3px solid ${COL.of}"></i>Feminicídio registrado</span> <span class="sim-leg"><i style="border-top:3px solid ${COL.sim}"></i>Feminicídio padronizado <b class="sim-tag">estimativa</b></span> · ${reg ? 'Estados da região ' + reg : 'Regiões e Brasil'}, ordenados pelo padronizado. Por 100 mil mulheres.`,
      pairBars(rows, ['Feminicídio registrado', 'Feminicídio padronizado'], {fmt: v => fmt(v, 2)}));
    CSV = [['Recorte', 'Homicídio de mulheres', 'Feminicídio registrado', '% classificado', 'Feminicídio padronizado (estimativa)']];
    table([{t: 'Recorte'}, {t: 'Homicídio de mulheres', r: 1}, {t: 'Feminicídio registrado', r: 1}, {t: '% classificado', r: 1}, {t: 'Padronizado <b class="sim-tag">estimativa</b>', r: 1}],
      tableIds().map(id => { const p = femPoint(GROUPS[id].ufs, st.year); CSV.push([glabel(id), p.tHm.toFixed(2), p.tFe.toFixed(2), p.share.toFixed(1), p.tStd.toFixed(2)]);
        return `<tr class="${id === st.geo ? 'sim-highlight' : ''}"><td>${esc(glabel(id))}</td><td class="right">${fmt(p.tHm, 2)}<small>${int(p.hm)} vítimas</small></td><td class="right">${fmt(p.tFe, 2)}<small>${int(p.fe)} vítimas</small></td><td class="right">${fmt(p.share)}%</td><td class="right">${fmt(p.tStd, 2)}</td></tr>`; }));
    $('sim-table-caption').textContent = `Por 100 mil mulheres · ${st.year}.`;
    alerts(false);
  }

  /* ---------- 3. VIOLÊNCIA DOMÉSTICA (FBSP) ---------- */
  function vdRates(y) { const out = {}; Object.keys(REG).forEach(u => { const r = hv('lesao-domestica', u, y), p = popF(u, y); out[u] = r && p ? {n: r.n, pop: p, t: r.n / p * 1e5} : null; }); return out; }
  function vdPoint(ufs, y) {
    const R = vdRates(y), all = Object.keys(REG); if (ufs.some(u => !R[u])) return null;
    const nBR = all.reduce((s, u) => s + (R[u] ? R[u].n : 0), 0), pBR = all.reduce((s, u) => s + (R[u] ? R[u].pop : 0), 0), tBR = nBR / pBR * 1e5;
    const lim = tBR * st.vdLim / 100, atip = all.filter(u => R[u] && R[u].t < lim);
    let n = 0, pop = 0, nAdj = 0, popAdj = 0;
    ufs.forEach(u => { const r = R[u]; n += r.n; pop += r.pop;
      if (!atip.includes(u)) { nAdj += r.n; popAdj += r.pop; return; }
      if (st.vdImp === 'excluir') return;
      const peers = all.filter(v => v !== u && R[v] && !atip.includes(v) && (st.vdImp === 'nacional' || REG[v] === REG[u])).map(v => R[v].t);
      nAdj += (median(peers) || 0) * r.pop / 1e5; popAdj += r.pop; });
    return {y, n, pop, t: n / pop * 1e5, tAdj: popAdj ? nAdj / popAdj * 1e5 : null, atip: ufs.filter(u => atip.includes(u)), tBR, R};
  }
  const vdSeries = id => FY.map(y => vdPoint(GROUPS[id].ufs, y));
  function renderVd() {
    const A = vdSeries(st.geo), B = st.cmp !== 'none' && st.cmp !== st.geo ? vdSeries(st.cmp) : null, cur = A[FY.indexOf(st.year)];
    $('sim-title').textContent = 'Violência doméstica registrada · ' + glabel(st.geo);
    $('sim-subtitle').textContent = 'Lesão corporal dolosa em violência doméstica, vítimas mulheres · por 100 mil mulheres · FBSP 2021–2025';
    badge(true);
    kpis([
      {label: `Taxa registrada · ${st.year}`, value: fmt(cur.t), detail: `${int(cur.n)} registros · Brasil: ${fmt(cur.tBR)}`},
      {label: `Taxa com ajuste · ${st.year}`, value: fmt(cur.tAdj), detail: cur.atip.length ? 'com os estados de registro atípico ajustados' : 'nenhum estado atípico neste recorte: igual ao registrado', est: true},
      {label: 'Estados com registro atípico', value: String(cur.atip.length), detail: cur.atip.length ? cur.atip.map(u => `${NAME[u]} (${fmt(cur.R[u].t)})`).join(', ') : `abaixo de ${st.vdLim}% da taxa nacional (${fmt(cur.tBR * st.vdLim / 100)})`, tone: cur.atip.length ? 'warn' : 'neutral'},
      {label: 'Efeito do ajuste', value: pct(varp(cur.t, cur.tAdj)), detail: 'quanto o registro atípico puxa a média do recorte', est: true}
    ]);
    const series = [{name: 'Registrado · ' + glabel(st.geo), color: COL.of, w: 3, pts: A.map(p => p && p.t)}, {name: 'Com ajuste · ' + glabel(st.geo), color: COL.sim, w: 3, dash: '8 6', pts: A.map(p => p && p.tAdj), est: true}];
    if (B) series.push({name: 'Registrado · ' + glabel(st.cmp), color: COL.cmp, w: 2, pts: B.map(p => p && p.t)}, {name: 'Com ajuste · ' + glabel(st.cmp), color: COL.cmpSim, w: 2, dash: '6 5', pts: B.map(p => p && p.tAdj), est: true});
    lineChart($('sim-chart'), FY, series, {fmt: v => fmt(v, 0)});
    $('sim-legend').innerHTML = legend(series);
    $('sim-chart-caption').textContent = 'Registros por 100 mil mulheres';
    $('sim-chart-foot').textContent = 'O limiar de registro atípico é recalculado a cada ano em relação à taxa nacional daquele ano. Eixo a partir de zero.';
    const imp = {regional: 'a mediana das taxas dos demais estados da mesma região (sem contar outros atípicos)', nacional: 'a mediana das taxas dos demais estados do país (sem contar outros atípicos)', excluir: 'nada: o estado é retirado do numerador e do denominador'}[st.vdImp];
    explain(true, [
      ['O que mede', 'Quanto a taxa do recorte mudaria se os estados com registro muito abaixo do resto do país registrassem como seus vizinhos. Mostra o peso de um registro atípico na média; não estima a violência real.'],
      ['Como é estimado', `Um estado é atípico quando sua taxa registrada fica abaixo de ${st.vdLim}% da taxa nacional do mesmo ano. No ajuste, ele recebe ${imp}. Os demais estados ficam com o número registrado.`],
      ['Ressalvas', 'Taxa baixa pode ser menos violência, mais barreira para denunciar ou outra forma de classificar; os dados não separam essas causas. A pesquisa que mede a violência que não vira registro (Visível e Invisível) só tem resultado nacional, então não existe correção regional oficial. Mesmo ajustado, o Nordeste segue bem abaixo do Sul: a diferença não se explica só por um estado.'],
      ['Fontes', `${SRC.fbsp}: lesão corporal dolosa em violência doméstica, vítimas mulheres (Tabela 24 do Anuário 2026).`]
    ]);
    const {reg, ids} = subIds();
    const rows = ids.map(id => { const p = vdPoint(GROUPS[id].ufs, st.year); return {label: glabel(id) + (p && p.atip.length && id.startsWith('U:') ? ' ⚠' : ''), a: p && p.t, b: p && p.tAdj, hl: id === st.geo}; }).sort((a, b) => b.b - a.b);
    second(true, `Registrado × ajustado em ${st.year}`, `<span class="sim-leg"><i style="border-top:3px solid ${COL.of}"></i>Registrado</span> <span class="sim-leg"><i style="border-top:3px solid ${COL.sim}"></i>Com ajuste <b class="sim-tag">estimativa</b></span> · ${reg ? 'Estados da região ' + reg + ' (⚠ = registro atípico)' : 'Regiões e Brasil'}. Por 100 mil mulheres.`,
      pairBars(rows, ['Registrado', 'Com ajuste'], {fmt: v => fmt(v, 0)}));
    CSV = [['Recorte', 'Registros', 'Taxa registrada', 'Taxa com ajuste (estimativa)', 'Estados atípicos']];
    table([{t: 'Recorte'}, {t: 'Registros', r: 1}, {t: 'Taxa registrada', r: 1}, {t: 'Com ajuste <b class="sim-tag">estimativa</b>', r: 1}, {t: 'Estados atípicos'}],
      tableIds().map(id => { const p = vdPoint(GROUPS[id].ufs, st.year); CSV.push([glabel(id), p.n, p.t.toFixed(1), p.tAdj == null ? '' : p.tAdj.toFixed(1), p.atip.join(' ')]);
        return `<tr class="${id === st.geo ? 'sim-highlight' : ''}"><td>${esc(glabel(id))}</td><td class="right">${int(p.n)}</td><td class="right">${fmt(p.t)}</td><td class="right">${fmt(p.tAdj)}</td><td>${p.atip.map(u => NAME[u]).join(', ') || '—'}</td></tr>`; }));
    $('sim-table-caption').textContent = `Por 100 mil mulheres · ${st.year} · limiar: ${st.vdLim}% da taxa nacional.`;
    alerts(false);
  }

  /* ---------- 4. SUBNOTIFICAÇÃO NACIONAL ---------- */
  function renderSub() {
    badge(true);
    const fmtM = v => v >= 1e6 ? fmt(v / 1e6, 2) + ' mi' : int(v / 1000) + ' mil';
    if (st.subTema === 'estupro') {
      const reg = FY.map(y => hv('estupro-total', 'BR', y)), est = reg.map(r => r ? r.n / (st.subRate / 100) : null), last = reg[reg.length - 1], isRef = Math.abs(st.subRate - 8.5) < 0.01;
      $('sim-title').textContent = 'Estupro: registrado × estimado · Brasil';
      $('sim-subtitle').textContent = 'Estupro e estupro de vulnerável · casos por ano · registros FBSP + parâmetro do Ipea';
      kpis([
        {label: 'Registros policiais · 2025', value: int(last.n), detail: 'estupro e estupro de vulnerável (FBSP)'},
        {label: 'Parcela que chega à polícia', value: fmt(st.subRate) + '%', detail: isRef ? 'estimativa do Ipea, com dados de 2019' : 'valor escolhido por você · referência Ipea: 8,5%', est: true},
        {label: 'Casos estimados · 2025', value: fmtM(est[est.length - 1]), detail: 'registros ÷ parcela que chega à polícia', est: true},
        {label: 'Para cada registro', value: '~' + fmt(100 / st.subRate, 0), detail: 'casos estimados no total', est: true}
      ]);
      const series = [{name: 'Registrado (FBSP)', color: COL.of, w: 3, pts: reg.map(r => r && r.n)}, {name: 'Estimado: registros ÷ parcela', color: COL.sim, w: 3, dash: '8 6', pts: est, est: true}];
      lineChart($('sim-chart'), FY, series, {fmt: v => v >= 1e6 ? fmt(v / 1e6, 1) + ' mi' : int(v / 1000) + ' mil'});
      $('sim-legend').innerHTML = legend(series);
      $('sim-chart-caption').textContent = 'Casos por ano, Brasil';
      $('sim-chart-foot').textContent = 'A estimativa aplica a mesma parcela a todos os anos, supondo que a disposição de denunciar não mudou desde 2019. Eixo a partir de zero.';
      explain(true, [
        ['O que mede', 'Uma ordem de grandeza de quantos estupros acontecem no Brasil, contando os que nunca chegam a uma delegacia.'],
        ['Como é estimado', `Estimativa = registros policiais ÷ parcela que chega à polícia${isRef ? '' : ` (aqui, ${fmt(st.subRate)}%, valor escolhido por você)`}. O Ipea (Texto para Discussão 2880, 2023) comparou o que adultos relataram na Pesquisa Nacional de Saúde 2019, do IBGE, com as notificações do sistema de saúde (Sinan) e com os registros policiais. Concluiu que cerca de 822 mil estupros ocorrem por ano e que só 8,5% chegam ao conhecimento da polícia (4,2% são identificados pela saúde). Os próprios autores chamam a estimativa de conservadora.`],
        ['Ressalvas', 'A parcela foi medida com dados de 2019 e só existe para o Brasil inteiro; não pode ser aplicada por região. Estupro de vulnerável (crianças) tem dinâmica de denúncia diferente da de adultos. Use como ordem de grandeza, nunca como contagem.'],
        ['Fontes', `${SRC.fbsp} (registros) · ${SRC.td} (parcela de 8,5%).`]
      ]);
      CSV = [['Ano', 'Registrado', 'Parcela aplicada (%)', 'Estimado (estimativa)']];
      table([{t: 'Ano'}, {t: 'Registrado', r: 1}, {t: 'Parcela aplicada', r: 1}, {t: 'Estimado <b class="sim-tag">estimativa</b>', r: 1}],
        FY.map((y, i) => { CSV.push([y, reg[i].n, st.subRate, Math.round(est[i])]); return `<tr><td>${y}</td><td class="right">${int(reg[i].n)}</td><td class="right">${fmt(st.subRate)}%</td><td class="right">${int(est[i])}</td></tr>`; }).reverse());
      $('sim-table-caption').textContent = 'Brasil · casos por ano.';
    } else {
      const reg = hv('lesao-domestica', 'BR', 2025).n, base = O.parametros.vv_agressao_fisica_mulheres_2025, popM = base.valor / base.percentual, vit = popM * st.subPrev / 100, offi = O.parametros.vv_procurou_orgao_oficial.valor * 100;
      $('sim-title').textContent = 'Agressão física contra mulheres: relatado × registrado · Brasil';
      $('sim-subtitle').textContent = '2025 · pesquisa de vitimização (pessoas) × registros policiais (ocorrências)';
      kpis([
        {label: 'Mulheres que relataram agressão física', value: fmtM(vit), detail: `${fmt(st.subPrev)}% das mulheres de 16 anos ou mais, nos 12 meses anteriores`, est: true},
        {label: 'Registros de lesão em violência doméstica', value: int(reg), detail: 'vítimas mulheres, 2025 (FBSP)'},
        {label: 'Registros por 100 vítimas', value: '~' + fmt(reg / vit * 100, 1), detail: 'conceitos diferentes: ver ressalvas', est: true},
        {label: 'Vítimas que procuraram órgão oficial', value: fmt(offi) + '%', detail: 'delegacia, PM, Ligue 180 etc. (pesquisa)'}
      ]);
      const svg = pairBars([{label: 'Brasil, 2025', a: reg, b: vit}], ['Registros policiais', 'Relataram agressão física'], {fmt: fmtM});
      $('sim-chart').setAttribute('viewBox', '0 0 980 56');
      $('sim-chart').innerHTML = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
      $('sim-legend').innerHTML = `<span class="sim-leg"><i style="border-top:3px solid ${COL.of}"></i>Registros policiais</span><span class="sim-leg"><i style="border-top:3px solid ${COL.sim}"></i>Relataram agressão física <b class="sim-tag">estimativa</b></span>`;
      $('sim-chart-caption').textContent = 'Brasil, 2025';
      $('sim-chart-foot').textContent = 'Barras na mesma escala, a partir de zero.';
      explain(true, [
        ['O que mede', 'A distância entre a violência que as mulheres relatam e a que vira registro policial.'],
        ['Como é estimado', `O FBSP e o Datafolha entrevistaram mulheres de 16 anos ou mais em 126 municípios (fevereiro de 2025). As perguntas sobre violência são respondidas sozinhas, num tablet, para reduzir constrangimento. ${fmt(base.percentual * 100)}% relataram batida, empurrão ou chute nos 12 meses anteriores; aplicado à população feminina, isso dá cerca de ${fmtM(base.valor)}. O controle permite variar dentro da margem de erro de 3 pontos.`],
        ['Ressalvas', 'A pesquisa conta pessoas e qualquer agressor; o registro conta ocorrências de violência doméstica. A razão serve para dimensionar a distância, não como taxa exata de subnotificação. Amostra de 793 mulheres no módulo de violência, sem resultado regional publicado.'],
        ['Fontes', `${SRC.vv} (pesquisa) · ${SRC.fbsp} (registros, Tabela 24).`]
      ]);
      CSV = [['Medida', 'Valor'], ['Relataram agressão física (estimativa)', Math.round(vit)], ['Registros policiais', reg]];
      table([{t: 'Medida'}, {t: 'Valor', r: 1}, {t: 'Natureza'}], [`<tr><td>Relataram agressão física</td><td class="right">${int(vit)}</td><td><b class="sim-tag">estimativa</b> pesquisa amostral</td></tr>`, `<tr><td>Registros de lesão em violência doméstica</td><td class="right">${int(reg)}</td><td>registro oficial</td></tr>`]);
      $('sim-table-caption').textContent = 'Brasil · 2025.';
    }
    second(false); alerts(false);
  }

  /* ---------- orquestração ---------- */
  function render(ctrl) {
    document.querySelectorAll('[data-sim-mode]').forEach(b => { const on = b.dataset.simMode === st.mode; b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on)); });
    if (ctrl) $('sim-controls').innerHTML = controls();
    $('sim-chart').setAttribute('viewBox', '0 0 980 360');
    try { ({let: renderLet, fem: renderFem, vd: renderVd, sub: renderSub})[st.mode](); }
    catch (e) { console.error(e); $('sim-kpis').innerHTML = '<p class="empty">Não foi possível calcular este cenário para o recorte escolhido.</p>'; }
  }
  function bind() {
    document.querySelectorAll('[data-sim-mode]').forEach(b => b.addEventListener('click', () => { st.mode = b.dataset.simMode; render(true); }));
    const box = $('sim-controls');
    box.addEventListener('input', e => { const k = e.target.dataset.k; if (!k || e.target.type !== 'range') return;
      st[k] = +e.target.value; const out = box.querySelector(`[data-out="${k}"]`); if (out) out.textContent = fmt(st[k], +e.target.step < 1 ? 1 : 0) + '%';
      box.querySelectorAll(`[data-preset="${k}"]`).forEach(p => p.classList.toggle('active', Math.abs(+p.dataset.v - st[k]) < 0.05)); render(false); });
    box.addEventListener('change', e => { const k = e.target.dataset.k; if (!k || e.target.type === 'range') return; st[k] = NUM.has(k) ? +e.target.value : e.target.value; render(true); });
    box.addEventListener('click', e => { const b = e.target.closest('[data-preset]'); if (!b || b.disabled) return; st[b.dataset.preset] = +b.dataset.v; render(true); });
    $('sim-second-body').addEventListener('click', e => { const b = e.target.closest('[data-casc]'); if (!b) return; st.casc = b.dataset.casc; render(false); });
    $('sim-export').addEventListener('click', () => {
      const csv = CSV.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], {type: 'text/csv;charset=utf-8'})); a.download = `simulacao-${st.mode}-${st.geo.replace(':', '-')}.csv`; document.body.appendChild(a); a.click(); a.remove(); });
  }
  const get = f => fetch('./' + f).then(r => { if (!r.ok) throw new Error(f + ' ' + r.status); return r.json(); });
  Promise.all([get('sinesp-oficial.json'), get('pop-ibge.json'), get('historico.json'), get('simulacao.json'), get('dados.json')]).then(([s, p, h, o, d]) => {
    S = s; P = p.data; H = h; O = o; MAXM = s.max2026Month || 9; st.cut = MAXM;
    KIPEA = Math.round(o.parametros.ipea_parcela_mvci_homicidio.valor * 100); st.k = KIPEA;
    buildGroups(d.states);
    $('sim-hashes').innerHTML = Object.entries(o.basesBrutasSha256).map(([f, x]) => `${esc(f)}: ${x}`).join('<br>');
    $('sim-generated').textContent = o.geradoEm;
    bind(); render(true);
    window.atlasSim = {state: st, render};
  }).catch(e => { const el = $('sim-error'); el.hidden = false; el.textContent = 'Não foi possível carregar os dados da simulação (' + e.message + '). Rode python scripts/build_simulation.py.'; });
})();
