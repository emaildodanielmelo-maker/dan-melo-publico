/* Correções estimadas por indicador (aba Histórico).
   Nunca altera dados: recebe as séries oficiais já calculadas e devolve uma série paralela, marcada como estimativa.
   Parâmetros com fonte: simulacao.json (scripts/simulacao_parametros.json). */
window.AtlasCorrections = (() => {
  'use strict';
  const P = {k: 0.4116, estupro: 0.085, vdLim: 0.25};
  fetch('./simulacao.json').then(r => r.ok ? r.json() : null).then(o => {
    if (!o) return; const p = o.parametros;
    P.k = p.ipea_parcela_mvci_homicidio.valor; P.estupro = p.ipea_estupro_taxa_registro_policial.valor; P.vdLim = (p.limiar_registro_atipico || {}).valor || P.vdLim;
  }).catch(() => {});
  const f1 = new Intl.NumberFormat('pt-BR', {minimumFractionDigits: 1, maximumFractionDigits: 1});
  const f0 = new Intl.NumberFormat('pt-BR', {maximumFractionDigits: 0});
  const pc = v => v == null || !isFinite(v) ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '') + f1.format(Math.abs(v)) + '%';
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const L = {
    sinesp: '<a href="https://www.gov.br/mj/pt-br/assuntos/sua-seguranca/seguranca-publica/estatistica/download/dnsp-base-de-dados" target="_blank" rel="noreferrer">SINESP-VDE/MJSP</a>',
    atlas: '<a href="https://www.ipea.gov.br/portal/categorias/45-todas-as-noticias/noticias/16394-atlas-da-violencia-brasil-registrou-42-590-homicidios-em-2024-menor-resultado-da-serie-historica-mas-subnotificacao-preocupa" target="_blank" rel="noreferrer">Ipea/FBSP, Atlas da Violência 2026</a>',
    met: '<a href="https://repositorio.ipea.gov.br/bitstream/11058/14031/5/AtlasViolencia2024_Retrato_dos_municipios_brasileros.pdf" target="_blank" rel="noreferrer">método dos homicídios ocultos</a>',
    fbsp: '<a href="https://forumseguranca.org.br/wp-content/uploads/2026/07/anuario-2026.xlsx" target="_blank" rel="noreferrer">FBSP, Anuários 2023–2026</a>',
    td: '<a href="https://repositorio.ipea.gov.br/bitstream/11058/11814/4/TD_2880_web.pdf" target="_blank" rel="noreferrer">Ipea, Texto para Discussão 2880</a>'
  };
  const RULES = {
    'sinesp:homicidio': {kind: 'esclarecer', title: 'Homicídios ocultos'},
    'sinesp:estupro': {kind: 'estupro', title: 'Estupros que não chegam à polícia'},
    'sinesp:estupro_vulneravel': {kind: 'estupro', title: 'Estupros que não chegam à polícia'},
    'fbsp:estupro-total': {kind: 'estupro', title: 'Estupros que não chegam à polícia'},
    'fbsp:estupro': {kind: 'estupro', title: 'Estupros que não chegam à polícia'},
    'fbsp:estupro-vulneravel': {kind: 'estupro', title: 'Estupros que não chegam à polícia'},
    'fbsp:feminicidio': {kind: 'fem', title: 'Feminicídio com classificação padronizada'},
    'fbsp:lesao-domestica': {kind: 'vd', title: 'Registro atípico de violência doméstica'},
    'sinesp:feminicidio': {kind: 'other', target: ['fbsp', 'feminicidio'], title: 'Feminicídio com classificação padronizada',
      why: 'O SINESP não separa os homicídios dolosos pelo sexo da vítima. Sem o total de mulheres assassinadas, não dá para padronizar a classificação de feminicídio. O Anuário do FBSP traz esse número.'},
    'fbsp:homicidio': {kind: 'other', target: ['sinesp', 'homicidio'], title: 'Homicídios ocultos',
      why: 'O Anuário do FBSP não publica a categoria “mortes a esclarecer”, necessária para a correção. Ela está disponível na série do SINESP.'},
    'fbsp:mvi': {kind: 'other', target: ['sinesp', 'homicidio'], title: 'Homicídios ocultos',
      why: 'O Anuário do FBSP não publica a categoria “mortes a esclarecer”, necessária para a correção. Ela está disponível na série do SINESP.'}
  };
  const rule = (s, m) => RULES[s + ':' + m];
  const has = (s, m) => !!rule(s, m);
  const available = (s, m) => { const r = rule(s, m); return !!r && r.kind !== 'other'; };
  const median = a => { const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length ? (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) : null; };
  const box = (title, rows, extra = '', est = true) => `<div class="history-corr-head"><span class="sim-pill${est ? '' : ' ok'}">${est ? 'Estimativa · não é dado oficial' : 'Correção indisponível neste recorte'}</span><h3>${esc(title)}</h3></div>${extra}` + rows.map(([t, h]) => `<div class="sim-explain-row"><strong>${t}</strong><p>${h}</p></div>`).join('');

  function summary(off, cor, field, unit) {
    const idx = off.map((p, i) => p[field] != null && cor[i] && cor[i][field] != null ? i : -1).filter(i => i >= 0);
    if (idx.length < 1) return '';
    const b = idx[idx.length - 1], a = idx[idx.length - 2], fmt = v => field === 't' ? f1.format(v) : f0.format(v);
    const vo = a != null && off[a][field] ? (off[b][field] / off[a][field] - 1) * 100 : null, vc = a != null && cor[a][field] ? (cor[b][field] / cor[a][field] - 1) * 100 : null;
    return `<div class="history-corr-summary"><div><small>Oficial · ${off[b].year}</small><strong>${fmt(off[b][field])}</strong></div><div class="is-est"><small>Corrigido · ${off[b].year}</small><strong>${fmt(cor[b][field])}</strong></div>` +
      (a != null ? `<div><small>Variação oficial ${off[a].year}→${off[b].year}</small><strong>${pc(vo)}</strong></div><div class="is-est"><small>Variação corrigida</small><strong>${pc(vc)}</strong></div>` : '') + `<p>${esc(unit)}</p></div>`;
  }

  function compute(ctx) {
    const r = rule(ctx.source, ctx.metric); if (!r) return null;
    const field = ctx.measure, unit = field === 't' ? 'Taxa por 100 mil ' + ctx.denominator : 'Total de ' + ctx.numberType;
    if (r.kind === 'other') return {status: 'other', html: box(r.title + ' · disponível em outra fonte', [['Por que não aqui', r.why]],
      `<button type="button" class="history-corr-action" data-corr-switch="${r.target.join(':')}">Abrir correção na fonte ${r.target[0] === 'fbsp' ? 'FBSP (Anuário)' : 'SINESP'} →</button>`, false)};
    const off = ctx.get(ctx.metric);
    if (r.kind === 'esclarecer') {
      const k = ctx.param === 'teto' ? 1 : P.k, e = ctx.get('morte_esclarecer');
      const series = off.map((p, i) => { const q = e[i]; if (p.n == null || !q || q.n == null || p.c !== q.c) return {year: p.year, n: null, t: null};
        const n = p.n + k * q.n; return {year: p.year, n, t: p.t != null && p.n > 0 ? p.t * n / p.n : null, c: p.c, total: p.total}; });
      const kTxt = ctx.param === 'teto' ? '<strong>Teto: 100%</strong> das mortes a esclarecer contadas como homicídio. É um limite deliberadamente exagerado, não uma estimativa.'
        : `<strong>${f1.format(k * 100)}%</strong> é a parcela que o Ipea e o FBSP estimaram no Atlas da Violência 2026: um modelo de aprendizado de máquina, treinado com cerca de 3 milhões de mortes violentas do Sistema de Informações sobre Mortalidade (Ministério da Saúde), comparou cada morte de causa indeterminada ao perfil de homicídios, suicídios e acidentes e classificou 7.083 de 17.207 mortes de 2024 como homicídios ocultos.`;
      return {status: 'ok', series, html: box(r.title, [
        ['O que mede', `Homicídios dolosos registrados mais ${ctx.param === 'teto' ? 'todas as' : f1.format(k * 100) + '% das'} mortes que a polícia registrou como “a esclarecer (sem indício de crime)” no mesmo recorte e período.`],
        ['Como é estimado', `Corrigido = homicídio doloso + parcela × mortes a esclarecer, somados por estado com a mesma cobertura. ${kTxt}`],
        ['Ressalvas', 'O percentual do Ipea foi medido nos dados de saúde, não na categoria do SINESP, que é parecida mas não idêntica. É um teste de sensibilidade: mostra se a leitura da série resiste, não quantos homicídios houve de fato. Anos em que a categoria salta de repente (ex.: Pernambuco em 2026) indicam mudança de registro e merecem checagem.'],
        ['Fontes', `${L.sinesp} · ${L.atlas} e ${L.met}.`]
      ], `<div class="sim-presets history-corr-params"><button type="button" data-corr-param="ipea" class="${ctx.param !== 'teto' ? 'active' : ''}">${f1.format(P.k * 100)}% · estimativa Ipea</button><button type="button" data-corr-param="teto" class="${ctx.param === 'teto' ? 'active' : ''}">100% · teto</button></div>`) + summary(off, series, field, unit)};
    }
    if (r.kind === 'estupro') {
      if (ctx.geo !== 'BR') return {status: 'na', html: box(r.title + ' · só para o Brasil', [['Por que não aqui', 'A parcela de estupros que chega à polícia (8,5%) foi estimada pelo Ipea apenas para o Brasil inteiro. Aplicá-la a uma região ou estado criaria uma precisão que não existe.']],
        '<button type="button" class="history-corr-action" data-corr-brasil="1">Ver a correção para o Brasil →</button>', false)};
      const series = off.map(p => ({year: p.year, n: p.n == null ? null : p.n / P.estupro, t: p.t == null ? null : p.t / P.estupro, c: p.c, total: p.total}));
      return {status: 'ok', series, html: box(r.title, [
        ['O que mede', 'Uma ordem de grandeza de quantos casos acontecem, contando os que nunca chegam a uma delegacia.'],
        ['Como é estimado', `Corrigido = registros ÷ ${f1.format(P.estupro * 100)}%. O Ipea comparou o que adultos relataram na Pesquisa Nacional de Saúde 2019 (IBGE) com as notificações do sistema de saúde (Sinan) e com os registros policiais, e estimou cerca de 822 mil estupros por ano, dos quais só 8,5% chegam à polícia.`],
        ['Ressalvas', 'Parcela medida com dados de 2019 e aplicada igual a todos os anos; vale só para o Brasil. Estupro de vulnerável (crianças) tem dinâmica de denúncia própria. Use como ordem de grandeza, nunca como contagem.'],
        ['Fontes', `${ctx.source === 'fbsp' ? L.fbsp : L.sinesp} (registros) · ${L.td} (parcela).`]
      ]) + summary(off, series, field, unit)};
    }
    if (r.kind === 'fem') {
      const H = ctx.hist.data, hm = ctx.get('homicidio-mulheres');
      const share = y => { const a = H.feminicidio && H.feminicidio.BR && H.feminicidio.BR[y], b = H['homicidio-mulheres'] && H['homicidio-mulheres'].BR && H['homicidio-mulheres'].BR[y]; return a && b && b.n ? a.n / b.n : null; };
      const series = hm.map(p => { const s = share(p.year); return {year: p.year, n: p.n == null || s == null ? null : p.n * s, t: p.t == null || s == null ? null : p.t * s, c: p.c, total: p.total, s}; });
      const last = series.filter(p => p.s != null).pop();
      return {status: 'ok', series, html: box(r.title, [
        ['O que mede', 'Quantos feminicídios o recorte teria se suas polícias classificassem os assassinatos de mulheres na mesma proporção que o Brasil no mesmo ano. Não é contagem de casos.'],
        ['Como é estimado', `Corrigido = homicídios de mulheres registrados × proporção nacional classificada como feminicídio no ano${last ? ` (${f1.format(last.s * 100)}% em ${last.year})` : ''}. Essa proporção varia muito entre estados (em 2025, de 15,8% no Ceará a 68,2% em Sergipe), e a padronização neutraliza a diferença de tipificação.`],
        ['Ressalvas', 'Supõe que a parcela real de feminicídios é igual em todo lugar. O indicador mais robusto para comparar recortes é o próprio homicídio de mulheres, que não depende da classificação. O FBSP aponta subclassificação histórica no Ceará.'],
        ['Fontes', `${L.fbsp}: homicídios de mulheres, feminicídios e proporção de feminicídios (Tabelas 21 e 28 do Anuário 2026).`]
      ]) + summary(off, series, field, unit)};
    }
    if (r.kind === 'vd') {
      const H = ctx.hist.data['lesao-domestica'], all = ctx.states.map(s => s.uf), reg = Object.fromEntries(ctx.states.map(s => [s.uf, s.region])), members = ctx.members(ctx.geo);
      const atipByYear = {};
      const series = off.map(p => {
        const y = String(p.year), R = {};
        for (const u of all) { const x = H[u] && H[u][y]; if (x && x.n != null && x.t > 0) R[u] = {n: x.n, pop: x.n / x.t * 1e5, t: x.t}; }
        if (members.some(u => !R[u])) return {year: p.year, n: null, t: null};
        const nB = all.reduce((s, u) => s + (R[u] ? R[u].n : 0), 0), pB = all.reduce((s, u) => s + (R[u] ? R[u].pop : 0), 0), lim = nB / pB * 1e5 * P.vdLim;
        const atip = all.filter(u => R[u] && R[u].t < lim); atipByYear[p.year] = members.filter(u => atip.includes(u));
        let n = 0, pop = 0;
        for (const u of members) { pop += R[u].pop; if (!atip.includes(u)) { n += R[u].n; continue; }
          const peers = all.filter(v => v !== u && R[v] && !atip.includes(v) && reg[v] === reg[u]).map(v => R[v].t); n += (median(peers) || 0) * R[u].pop / 1e5; }
        return {year: p.year, n, t: n / pop * 1e5, c: p.c, total: p.total};
      });
      const lastY = off[off.length - 1].year, at = (atipByYear[lastY] || []).map(u => (ctx.states.find(s => s.uf === u) || {}).name || u);
      return {status: 'ok', series, html: box(r.title, [
        ['O que mede', `Quanto a taxa mudaria se os estados com registro muito abaixo do país registrassem como seus vizinhos. ${at.length ? `Neste recorte, em ${lastY}: ${esc(at.join(', '))}.` : 'Neste recorte não há estado com registro atípico no último ano: a linha corrigida coincide com a oficial.'}`],
        ['Como é estimado', `Um estado é atípico quando sua taxa fica abaixo de ${f0.format(P.vdLim * 100)}% da taxa nacional do mesmo ano. Ele recebe a mediana das taxas dos demais estados da sua região; os outros estados ficam com o número registrado.`],
        ['Ressalvas', 'Não estima a violência real. Taxa baixa pode ser menos violência, mais barreira para denunciar ou outra forma de classificar. A pesquisa que mede a violência não registrada (Visível e Invisível) só tem resultado nacional, então não há correção regional oficial.'],
        ['Fontes', `${L.fbsp}: lesão corporal dolosa em violência doméstica, vítimas mulheres (Tabela 24 do Anuário 2026).`]
      ]) + summary(off, series, field, unit)};
    }
    return null;
  }
  return {has, available, compute};
})();
