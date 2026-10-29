/* Aba Simulações: lê apenas dist/simulacao.json (camada derivada). Não toca nas bases brutas. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const nf = (v, d = 1) => v == null ? '—' : Number(v).toLocaleString('pt-BR', {minimumFractionDigits: d, maximumFractionDigits: d});
  const ni = v => v == null ? '—' : Math.round(v).toLocaleString('pt-BR');
  const pct = v => v == null ? '—' : (v > 0 ? '+' : '') + nf(v) + '%';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  function waterfall(dec) {
    const ufs = dec.ufs.filter(u => u.delta !== 0);
    const steps = [{label: '2025', value: dec.total2025, kind: 'total'}]
      .concat(ufs.map(u => ({label: u.uf, value: u.delta, kind: u.delta < 0 ? 'down' : 'up', peso: u.pesoNaVariacao, varPct: u.varPct})))
      .concat([{label: '2026', value: dec.total2026, kind: 'total'}]);
    const W = 760, H = 320, L = 50, R = 12, T = 34, B = 52;
    const lo = Math.floor(Math.min(dec.total2026, dec.total2025) * 0.85 / 500) * 500, hi = Math.ceil(dec.total2025 * 1.02 / 500) * 500;
    const y = v => T + (H - T - B) * (1 - (v - lo) / (hi - lo));
    const bw = (W - L - R) / steps.length;
    let run = dec.total2025, svg = '';
    for (let t = lo; t <= hi; t += 1000) svg += `<line x1="${L}" x2="${W-R}" y1="${y(t)}" y2="${y(t)}" stroke="#e3eaeb"/><text x="${L-6}" y="${y(t)+4}" font-size="10" text-anchor="end" fill="#8a9aa1">${ni(t)}</text>`;
    steps.forEach((s, i) => {
      const x = L + i * bw + bw * 0.14, w = bw * 0.72;
      let top, bot, fill, lab, sub = '';
      if (s.kind === 'total') { top = y(s.value); bot = y(lo); fill = '#175b62'; lab = ni(s.value); }
      else { const a = run, b = run + s.value; top = y(Math.max(a, b)); bot = y(Math.min(a, b)); fill = s.kind === 'down' ? '#5fa58d' : '#cc5b4c'; lab = (s.value > 0 ? '+' : '−') + ni(Math.abs(s.value)); sub = nf(s.peso) + '%'; run = b; }
      svg += `<rect x="${x}" y="${top}" width="${w}" height="${Math.max(bot - top, 1.5)}" rx="3" fill="${fill}"><title>${esc(s.label)}: ${lab}${sub ? ' · ' + sub + ' da variação' : ''}</title></rect>`;
      svg += `<text x="${x + w/2}" y="${top - 6}" font-size="10.5" font-weight="700" text-anchor="middle" fill="#172b34">${lab}</text>`;
      if (sub) svg += `<text x="${x + w/2}" y="${H - B + 30}" font-size="9.5" text-anchor="middle" fill="${s.kind==='down'?'#3f7f6a':'#a8402f'}">${sub}</text>`;
      svg += `<text x="${x + w/2}" y="${H - B + 16}" font-size="10.5" font-weight="700" text-anchor="middle" fill="#3a4f57">${esc(s.label)}</text>`;
      if (i < steps.length - 1 && s.kind !== 'total' || i === 0) { const nx = L + (i+1) * bw + bw * 0.14; svg += `<line x1="${x + w}" x2="${nx}" y1="${y(run)}" y2="${y(run)}" stroke="#9fb0b6" stroke-dasharray="2 2"/>`; }
    });
    return `<svg class="sim-wf" viewBox="0 0 ${W} ${H}" role="img" aria-label="Cascata da variação de homicídios no Nordeste por UF">${svg}<text x="${L}" y="14" font-size="10.5" fill="#6f8088">Vítimas de homicídio doloso, jan–set · SINESP · eixo começa em 7.500 · rótulo inferior = peso de cada UF na variação total</text></svg>`;
  }

  function render(O) {
    const dec = O.decomposicaoNordeste, ce = dec.ufs.find(u => u.uf === 'CE');
    $('sim-hashes').innerHTML = Object.entries(O.basesBrutasSha256).map(([f, h]) => `${esc(f)}: ${h}`).join('<br>');
    $('sim-generated').textContent = O.geradoEm;

    $('sim-wf-lead').innerHTML = `De ${ni(dec.total2025)} para ${ni(dec.total2026)} vítimas (${ni(dec.delta)}). O Ceará responde por <strong>${nf(ce.pesoNaVariacao)}%</strong> da queda; o Rio Grande do Norte foi na direção contrária.`;
    $('sim-wf').innerHTML = waterfall(dec);

    const pick = ['Brasil', 'Nordeste', 'Nordeste sem Ceará', 'Sul + Sudeste + Centro-Oeste', 'Ceará (CE)', 'Bahia (BA)', 'Pernambuco (PE)', 'Rio Grande do Norte (RN)'];
    const rows = O.letalidade.filter(r => pick.includes(r.grupo)).sort((a, b) => pick.indexOf(a.grupo) - pick.indexOf(b.grupo));
    $('sim-let-head').innerHTML = '<th>Recorte</th>' + rows[0].cenarios.map(c => `<th class="right" title="${esc(c.nome)}">${esc({oficial:'Homicídio oficial',cvli:'CVLI',cvli_interv:'CVLI + intervenção',ipea41:'+ 41% a esclarecer',teto:'+ 100% a esclarecer'}[c.id])}</th>`).join('');
    $('sim-let-body').innerHTML = rows.map(r => `<tr class="${r.grupo==='Nordeste'||r.grupo==='Brasil'?'sim-highlight':''}"><td>${esc(r.grupo)}</td>` + r.cenarios.map(c => `<td class="right">${pct(c.varYtd)}<small>${nf(c.ytd2025.taxa)} → ${nf(c.ytd2026.taxa)}</small></td>`).join('') + '</tr>').join('');

    $('sim-breaks').innerHTML = O.alertasQuebraSerie.filter(q => q.ano >= 2024).map(q => `<tr><td><span class="sim-pill warn">${q.ano}</span></td><td>${esc(q.nome)}</td><td class="right">${ni(q.esclarecerAnterior)} → ${ni(q.esclarecerAtual)}</td><td class="right">${ni(q.homicidioAnterior)} → ${ni(q.homicidioAtual)}</td></tr>`).join('');

    const TL = O.tendenciaLonga;
    $('sim-long').innerHTML = Object.entries(TL.var2017a2025).sort((a, b) => a[1] - b[1]).map(([g, v]) => { const s = TL.series[g]; return `<tr class="${g==='Nordeste'||g==='Brasil'?'sim-highlight':''}"><td>${esc(g)}</td><td class="right">${nf(s[TL.anos.indexOf(2017)])}</td><td class="right">${nf(s[s.length-1])}</td><td class="right">${pct(v)}</td></tr>`; }).join('');
    const rz = TL.razaoNordesteSul;
    $('sim-ratio').textContent = `A razão entre as taxas do Nordeste e do Sul foi de ${nf(rz[TL.anos.indexOf(2017)], 2)} em 2017 para ${nf(rz[rz.length-1], 2)} em 2025: as duas caíram, mas o Sul caiu mais.`;

    const mul = O.mulheres.linhas.filter(m => !m.grupo.includes('('));
    $('sim-women').innerHTML = mul.map(m => `<tr class="${m.grupo==='Nordeste'?'sim-highlight':''}"><td>${esc(m.grupo)}</td><td class="right">${nf(m.taxaHomicidioMulheres, 2)}<small>${ni(m.homicidiosMulheres)} vítimas</small></td><td class="right">${nf(m.taxaFeminicidio, 2)}<small>${ni(m.feminicidios)} vítimas</small></td><td class="right">${nf(m.proporcaoClassificada)}%</td><td class="right">${nf(m.taxaFeminicidioPadronizada, 2)}</td></tr>`).join('');
    const ufw = O.mulheres.linhas.filter(m => m.grupo.includes('(')).sort((a, b) => a.proporcaoClassificada - b.proporcaoClassificada);
    $('sim-women-uf').innerHTML = ufw.map(m => `<tr><td>${esc(m.grupo)}</td><td class="right">${nf(m.taxaHomicidioMulheres, 2)}</td><td class="right">${nf(m.taxaFeminicidio, 2)}</td><td class="right">${nf(m.proporcaoClassificada)}%</td><td class="right">${nf(m.taxaFeminicidioPadronizada, 2)}</td></tr>`).join('');
    $('sim-fem-ytd').innerHTML = O.feminicidioYtd.map(f => `<tr><td>${esc(f.grupo)}</td><td class="right">${ni(f.n2025)} → ${ni(f.n2026)}</td><td class="right">${f.diferenca > 0 ? '+' : ''}${ni(f.diferenca)}</td><td class="right">${pct(f.var)}</td><td>${f.basePequena ? '<span class="sim-pill warn">base pequena</span>' : '<span class="sim-pill ok">base adequada</span>'}</td></tr>`).join('');

    const VD = O.violenciaDomestica;
    $('sim-vd').innerHTML = VD.linhas.map(v => `<tr class="${v.grupo==='Nordeste'?'sim-highlight':''}"><td>${esc(v.grupo)}</td><td class="right">${ni(v.registros)}</td><td class="right">${nf(v.taxa)}</td><td class="right">${v.taxaImputada != null ? nf(v.taxaImputada) : '—'}</td></tr>`).join('');
    $('sim-vd-atip').textContent = VD.ufsRegistroAtipico.map(u => `${u.nome} (${nf(u.taxa)})`).join(' e ') + ` registram menos de 25% da taxa nacional (${nf(VD.taxaBrasil)}).`;

    $('sim-sub').innerHTML = O.subnotificacaoNacional.map(s => s.tema === 'Estupro'
      ? `<div class="sim-card"><span class="sim-pill">Ordem de grandeza</span><h4>${esc(s.tema)}</h4><div class="big">~${ni(s.estimativaOrdemGrandeza / 1000)} mil</div><p>${ni(s.registrado2025)} registros em 2025 ÷ ${nf(s.parametro * 100)}% de registro policial estimado pelo Ipea. ${esc(s.ressalva)}</p></div>`
      : `<div class="sim-card"><span class="sim-pill">Distância registro × ocorrência</span><h4>${esc(s.tema)}</h4><div class="big">${nf(s.razaoRegistroPorVitima)}%</div><p>${ni(s.registrado2025)} registros de lesão em violência doméstica para ~${ni(s.vitimasPesquisa / 1e6)} milhões de mulheres que relataram agressão física na pesquisa. ${esc(s.ressalva)}</p></div>`).join('');
  }

  fetch('./simulacao.json').then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }).then(render)
    .catch(e => { const el = $('sim-error'); if (el) { el.hidden = false; el.textContent = 'Não foi possível carregar simulacao.json (' + e.message + '). Rode python scripts/build_simulation.py.'; } });
})();
