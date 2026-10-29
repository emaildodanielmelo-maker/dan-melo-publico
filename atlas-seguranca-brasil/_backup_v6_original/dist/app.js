/* Atlas da Segurança Pública — interface de exploração de dados públicos. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const intFmt = new Intl.NumberFormat('pt-BR', {maximumFractionDigits: 0});
  const rateFmt = new Intl.NumberFormat('pt-BR', {minimumFractionDigits: 1,maximumFractionDigits: 1});
  const ratioFmt = new Intl.NumberFormat('pt-BR', {minimumFractionDigits: 1,maximumFractionDigits: 1});
  const themes = ['Letalidade','Patrimônio','Fraudes','Violência sexual','Violência contra mulheres','Outros indicadores'];
  const themesShort = {'Letalidade':'Letalidade','Patrimônio':'Patrimônio','Fraudes':'Fraudes','Violência sexual':'Violência sexual','Violência contra mulheres':'Contra mulheres','Outros indicadores':'Outros'};
  let primary = ['mvi','roubo-total','roubo-furto-celular','estelionato','estupro-total','feminicidio'];
  let compareMetrics = ['mvi','homicidio','roubo-total','roubo-furto-celular','estelionato','estupro-total','feminicidio','lesao-domestica'];
  const regionNames = ['Norte','Nordeste','Centro-Oeste','Sudeste','Sul'];
  const comparisonRegions = ['Sul','Sudeste','Centro-Oeste'];
  const regional = {metric:'mvi',year:2025,measure:'rate',selected:null};
  // Denominadores da própria base oficial, reconstituídos com indicadores de grande volume.
  const denominatorMetrics = {'habitantes':'roubo-total','mulheres':'ameaca-mulheres','veículos registrados':'roubo-furto-veiculo'};
  const state = {metric:'mvi',region:'all',year:2025,compareYear:2025,measure:'rate',search:'',selected:null,compareA:'BA',compareB:'SP'};
  let source, metas, ufs, toastTimer, fbsp, officialSource, pop, fleet, sourceMode='fbsp';
  const official=()=>sourceMode==='sinesp';
  const years=()=>official()?[2024,2025,2026]:[2024,2025];
  const isRate=(m)=>m?.rateEnabled!==false;
  const isVolume=(m)=>!isRate(m);
  const infoYear=(year)=>official()&&year===2026?'2026 · jan–set (parcial)':String(year);
  const changePeriod=(year)=>official()&&year===2026?'jan–set/2025':'2024';
  function changeFor(mid,uf,year){const r=val(mid,uf);return year===2026?r?.var26:year===2025?r?.var:null;}
  function supportsRate(mid=state.metric){return isRate(metas.find(m=>m.id===mid));}

  function fmtN(n) { return n == null ? '—' : (Number.isInteger(n)?intFmt:rateFmt).format(n); }
  function fmtR(n) { return n == null ? '—' : rateFmt.format(n); }
  function fmtV(n) { return n == null ? '—' : `${n>0?'+':''}${rateFmt.format(n)}%`; }
  function fmtRatio(n) { return n == null || !Number.isFinite(n) ? '—' : ratioFmt.format(n)+'×'; }
  function normalize(s) { return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim(); }
  function val(mid, uf) { return source.data[mid]?.[uf] ?? null; }
  function yearRate(mid, uf) { return val(mid,uf)?.['t'+String(state.year).slice(2)] ?? null; }
  function yearCount(mid, uf) { return val(mid,uf)?.['n'+String(state.year).slice(2)] ?? null; }
  function ratio(mid,uf, year=state.year) {
    const suffix=String(year).slice(2),measure=supportsRate(mid)?'t':'n';
    const a=val(mid,uf)?.[measure+suffix],b=val(mid,'BR')?.[measure+suffix];
    if(a==null||b==null||b<=0)return null;
    const informed=supportsRate(mid)?27:ufs.filter(u=>val(mid,u.uf)?.['n'+suffix]!=null).length;
    return supportsRate(mid)?a/b:informed?a/(b/informed):null; // Volumes: média por UF informante, NUNCA taxa de risco.
  }
  function metricDef() { return metas.find(m=>m.id===state.metric); }
  function selectedStates() {
    const search = normalize(state.search);
    return ufs.filter(u=>(state.region==='all'||u.region===state.region) && (!search || normalize(u.name+' '+u.uf).includes(search)));
  }
  function orderStates() {
    return selectedStates().sort((a,b)=>{
      const key=state.measure==='rate' ? 't'+String(state.year).slice(2) : 'n'+String(state.year).slice(2);
      const va=val(state.metric,a.uf)?.[key],vb=val(state.metric,b.uf)?.[key];
      if(va==null) return vb==null ? a.name.localeCompare(b.name,'pt') : 1;
      if(vb==null) return -1;
      return vb-va || a.name.localeCompare(b.name,'pt');
    });
  }
  function rateUnit(m) {return isRate(m)?`por 100 mil ${m.denominator}`:'em números absolutos';}
  function rateLabel(m){return isRate(m)?'Taxa':'Volume';}
  function formatMeasure(m,n){return isRate(m)?fmtR(n):fmtN(n);}
  function showToast(s) { const n=$('toast');n.textContent=s;n.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>n.classList.remove('visible'),2600); }
  function esc(s) {return String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');}

  function drawHero() {
    const svg=$('hero-outline'); svg.setAttribute('viewBox','0 0 720 610');
    svg.innerHTML=ufs.map(u=>`<path d="${source.paths[u.uf]}" fill="${['#6c9993','#90bcb0','#c4dacf','#37666b'][ufs.indexOf(u)%4]}" stroke="#163943" stroke-width="1.2" opacity=".92"/>`).join('');
  }
  function renderKpis() {
    const list=official()?[
      {id:'homicidio',label:'Homicídios dolosos',icon:'†'},
      {id:'roubo_veiculo',label:'Roubos de veículos',icon:'↘'},
      {id:'estupro',label:'Estupros registrados',icon:'◈'},
      {id:'feminicidio',label:'Feminicídios',icon:'◎'}
    ]:[
      {id:'mvi',label:'Mortes violentas intencionais',icon:'†'},
      {id:'roubo-total',label:'Registros de roubo',icon:'↘'},
      {id:'estupro-total',label:'Estupros registrados',icon:'◈'},
      {id:'estelionato',label:'Registros de estelionato',icon:'◎'}
    ];
    const yr=state.year,sfx=String(yr).slice(2);
    $('headline-kpis').innerHTML=list.map(k=>{const v=val(k.id,'BR'),m=metas.find(x=>x.id===k.id),c=changeFor(k.id,'BR',yr),coverage=official()?` · ${v?.['coverage'+sfx]??0}/27 UFs`:'';return `<article class="kpi"><div class="kpi-top"><span class="kpi-label">${k.label}</span><span class="kpi-icon" aria-hidden="true">${k.icon}</span></div><div class="kpi-value">${fmtN(v?.['n'+sfx])}</div><div class="kpi-bottom"><span class="trend ${c>0?'positive':c<0?'negative':'neutral'}">${yr===2024?'Ano-base':fmtV(c)}</span><span>${yr===2024?'sem comparação anterior':`na taxa vs. ${changePeriod(yr)}`}${coverage}</span></div></article>`;}).join('');
    if(official()) {
      $('national-insight').textContent=`${infoYear(yr)}: os indicadores federais são registrados pelos estados no SINESP-VDE. Compare crimes por habitantes, mulheres ou frota, conforme o indicador. Apreensões e atividades policiais são volumes operacionais; ${yr===2026?'comparações de 2026 consideram somente jan–set dos dois anos.':'não devem ser confundidos com índices de violência.'}`;
    } else {
      $('national-insight').textContent=`Em ${yr}, o Brasil registrou ${fmtN(val('mvi','BR')?.['n'+sfx])} mortes violentas intencionais e ${fmtN(val('estelionato','BR')?.['n'+sfx])} estelionatos. Para compreender a evolução, compare as taxas do mesmo indicador ao longo do tempo.`;
    }
  }

  function fillByRatio(r) {
    if(r==null) return '#e4e9e9';
    if(r<.65) return '#d9eeee';
    if(r<1) return '#9cc6bc';
    if(r<1.35) return '#edc085';
    return '#c86558';
  }
  function fillByVolume(r) {
    if(r==null)return '#e4e9e9';
    if(r<.65)return '#e0eef7';
    if(r<1)return '#b1d3e7';
    if(r<1.35)return '#79a4c4';
    return '#386b95';
  }
  function textByRatio(r) {return r>=1.35?'#ffffff':'#23404a';}
  function renderHeatmap() {
    const r=$('matrix-region').value;
    const list=ufs.filter(u=>r==='all'||u.region===r).sort((a,b)=>(ratio(primary[0],b.uf,state.year)??-1)-(ratio(primary[0],a.uf,state.year)??-1));
    const columns=official()?[['homicidio','Homicídio'],['roubo_veiculo','Roubo veículo'],['furto_veiculo','Furto veículo'],['estupro','Estupro'],['feminicidio','Feminicídio'],['desaparecidos','Desaparecidos']]:
      [['mvi','Mortes violentas'],['roubo-total','Roubos'],['roubo-furto-celular','Celulares'],['estelionato','Golpes'],['estupro-total','Estupros'],['feminicidio','Feminicídios']];
    const head=`<tr><th>UF · ordem por ${official()?'homicídios':'MVI'}</th>`+columns.map(c=>`<th title="${c[1]}">${c[1]}</th>`).join('')+'</tr>';
    const body=list.map(u=>'<tr><td>'+esc(u.name)+'</td>'+columns.map(([id,label])=>{const r=ratio(id,u.uf,state.year);return `<td><button type="button" class="cell" data-metric="${id}" data-uf="${u.uf}" title="${esc(u.name)} · ${label}: ${fmtRatio(r)} da taxa brasileira" style="background:${fillByRatio(r)};color:${textByRatio(r)}">${fmtRatio(r)}</button></td>`;}).join('')+'</tr>').join('');
    $('heatmap').innerHTML=`<table class="heatmap"><thead>${head}</thead><tbody>${body}</tbody></table>`;
    $('heatmap').querySelectorAll('button.cell').forEach(b=>b.addEventListener('click',()=>{
      state.metric=b.dataset.metric;state.selected=b.dataset.uf;state.region='all';state.search='';syncControls();renderExplorer();window.atlasSelectTab?.('explorador');
    }));
  }
  function populateSelects() {
    const select=$('filter-indicator');
    const metricOptions=[...new Set(metas.map(m=>m.theme))].map(theme=>`<optgroup label="${esc(theme)}">${metas.filter(m=>m.theme===theme).map(m=>`<option value="${m.id}">${esc(m.name)}</option>`).join('')}</optgroup>`).join('');
    select.innerHTML=metricOptions;
    $('regional-indicator').innerHTML=metricOptions;
    $('regional-indicator').value=regional.metric;
    const options=ufs.slice().sort((a,b)=>a.name.localeCompare(b.name,'pt')).map(u=>`<option value="${u.uf}">${u.name} (${u.uf})</option>`).join('');
    $('compare-a').innerHTML=options;$('compare-b').innerHTML=options;
    $('compare-a').value=state.compareA;$('compare-b').value=state.compareB;
    syncControls();
  }
  function syncControls() {
    $('filter-indicator').value=state.metric;$('filter-region').value=state.region;$('filter-year').value=String(state.year);$('filter-measure').value=state.measure;$('filter-search').value=state.search;
    $('regional-indicator').value=regional.metric;$('regional-year').value=String(regional.year);$('regional-measure').value=regional.measure;
    $('compare-year').value=String(state.compareYear);$('atlas-year').value=String(state.year);
    $('filter-measure').querySelector('option[value="rate"]').disabled=!supportsRate(state.metric);
    $('regional-measure').querySelector('option[value="rate"]').disabled=!supportsRate(regional.metric);
  }

  function updateSourceCaptions(){
    const label=official()?'SINESP-VDE · MJSP':'FBSP · ANUÁRIO',count=metas.length;
    $('atlas-source').value=sourceMode;
    $('hero-source').textContent=official()?`Base: SINESP-VDE · Ministério da Justiça · 27 UFs · ${count} indicadores · até set/2026`:
      `Base: 20º Anuário Brasileiro de Segurança Pública · 27 UFs · ${count} indicadores`;
    $('hero-period-eyebrow').innerHTML=`<span class="eyebrow-dot"></span> ${official()?infoYear(state.year).toUpperCase()+' · SINESP-VDE':`DADOS ${state.year} · ANUÁRIO 2026`}`;
    $('panorama-source-label').textContent=`01 / PANORAMA · ${label}`;
    $('explorer-source-label').textContent=`02 / EXPLORADOR · ${label}`;
    $('regional-source-label').textContent=`03 / VISÃO REGIONAL · ${label}`;
    $('compare-source-label').textContent=`05 / COMPARAR · ${label}`;
    $('panorama-source-subtitle').textContent=`Indicadores de ${official()?'ocorrências e operações registradas no SINESP-VDE':'segurança pública publicados pelo FBSP'}; cada um preserva sua definição e unidade.`;
    $('explorer-source-subtitle').textContent=`${count} indicadores da fonte selecionada, com mapa, ranking, tabela e exportação. Operações sem taxa válida são mostradas em números absolutos.`;
    $('regional-source-subtitle').textContent=official()?'Cinco regiões agregadas por população IBGE, população feminina ou frota SENATRAN; atividades operacionais aparecem em volume.':'Cinco regiões consolidadas com as taxas publicadas no Anuário FBSP.';
    $('compare-source-subtitle').textContent=`Compare os estados usando somente dados ${official()?'do governo federal (SINESP-VDE)':'do FBSP'} e o denominador de cada indicador.`;
    $('panorama-period-label').textContent=`Brasil · ${infoYear(state.year)}`;
    document.querySelectorAll('option[data-sinesp-only]').forEach(o=>{o.disabled=!official();o.hidden=!official();});
    $('hero-outline')?.parentElement?.querySelector('.hero-visual-caption strong')?.replaceChildren(document.createTextNode(String(state.year)));
    $('filter-measure').options[0].textContent='Taxa / exposição';
    $('regional-measure').options[0].textContent='Taxa / exposição';
  }

  function applyMeasureConstraints(){
    if(!supportsRate(state.metric))state.measure='count';
    if(!supportsRate(regional.metric))regional.measure='count';
  }

  function renderAll(){
    applyMeasureConstraints();updateSourceCaptions();
    populateSelects();renderKpis();renderHeatmap();renderExplorer();renderRegional();renderCompare();
  }

  function setSource(next,emit=true){
    if(next!=='fbsp'&&next!=='sinesp'||!fbsp||!officialSource)return;
    const changed=sourceMode!==next;
    sourceMode=next;source=official()?officialSource:fbsp;metas=source.metrics;ufs=source.states;
    if(changed){
      state.metric=official()?'homicidio':'mvi';
      regional.metric=state.metric;
      primary=official()?['homicidio','roubo_veiculo','furto_veiculo','estupro','feminicidio','desaparecidos']:
        ['mvi','roubo-total','roubo-furto-celular','estelionato','estupro-total','feminicidio'];
      compareMetrics=official()?['homicidio','feminicidio','latrocinio','intervencao','tentativa_homicidio','estupro','estupro_vulneravel','roubo_veiculo','furto_veiculo','desaparecidos']:
        ['mvi','homicidio','roubo-total','roubo-furto-celular','estelionato','estupro-total','feminicidio','lesao-domestica'];
      state.measure='rate';regional.measure='rate';state.selected=null;regional.selected=null;
    }
    if(!official()&&state.year===2026)state.year=2025;
    if(!official()&&regional.year===2026)regional.year=2025;
    if(!official()&&state.compareYear===2026)state.compareYear=2025;
    renderAll();
    if(emit)window.dispatchEvent(new CustomEvent('atlas-source-change',{detail:{source:next}}));
  }

  function setGlobalYear(year){
    if(!years().includes(year))return;
    state.year=year;regional.year=year;state.compareYear=year;
    renderAll();
  }

  function mapFill(uf) {
    const rec=val(state.metric,uf), n=state.measure==='rate' ? yearRate(state.metric,uf):yearCount(state.metric,uf);
    if(n==null) return '#dfe5e5';
    const r=ratio(state.metric,uf);
    return supportsRate()?fillByRatio(r):fillByVolume(r);
  }
  function renderMap() {
    const allowed=new Set(selectedStates().map(u=>u.uf));
    const svg=$('brazil-map');
    const m=metricDef();
    svg.innerHTML=ufs.map(u=>`<path class="map-state ${state.selected===u.uf?'active':''}" data-uf="${u.uf}" d="${source.paths[u.uf]}" fill="${mapFill(u.uf)}" fill-rule="evenodd" opacity="${allowed.has(u.uf)?1:.27}" tabindex="0" role="button" aria-label="${esc(u.name)}: ${isRate(m)?fmtR(yearRate(state.metric,u.uf)):fmtN(yearCount(state.metric,u.uf))} ${rateUnit(m)}"/>`).join('');
    svg.querySelectorAll('.map-state').forEach(path=>{
      const uf=path.dataset.uf;
      path.addEventListener('mouseenter',e=>moveTip(e,uf));
      path.addEventListener('mousemove',e=>moveTip(e,uf));
      path.addEventListener('mouseleave',()=>{$('map-tooltip').hidden=true;});
      path.addEventListener('click',()=>selectUF(uf));
      path.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectUF(uf);}});
      path.addEventListener('focus',()=>{const u=ufs.find(x=>x.uf===uf);$('map-subtitle').textContent=`${u.name}: ${isRate(m)?fmtR(yearRate(state.metric,uf)):fmtN(yearCount(state.metric,uf))} ${rateUnit(m)}`;});
      path.addEventListener('blur',()=>{setMapSubtitle();});
    });
    $('map-legend').innerHTML=isRate(m)?'<span>Menor taxa vs. Brasil</span><div class="gradient-bar"></div><span>Maior taxa vs. Brasil</span>':'<span>Menor volume por UF</span><div class="gradient-bar"></div><span>Maior volume por UF</span>';
    $('map-year-label').textContent=infoYear(state.year);
    setMapSubtitle();
  }
  function setMapSubtitle() { $('map-subtitle').textContent=supportsRate()?'A cor mostra a taxa em relação à média nacional.':'A cor mostra o volume relativo ao volume médio por UF. Não representa o risco de violência.'; }
  function moveTip(e,uf) {
    const u=ufs.find(x=>x.uf===uf),tooltip=$('map-tooltip'),rect=$('brazil-map').parentElement.getBoundingClientRect();
    tooltip.innerHTML=`<strong>${esc(u.name)} (${uf})</strong><span>${supportsRate()?'Taxa: '+fmtR(yearRate(state.metric,uf))+'<br>':''}Total: ${fmtN(yearCount(state.metric,uf))}<br>${supportsRate()?'Vs. taxa Brasil':'Vs. volume médio UF'}: ${fmtRatio(ratio(state.metric,uf))}</span>`;
    tooltip.hidden=false; const left=Math.max(0,Math.min(rect.width-160,e.clientX-rect.left+12));const top=Math.max(0,Math.min(rect.height-85,e.clientY-rect.top-15));
    tooltip.style.left=left+'px';tooltip.style.top=top+'px';
  }
  function selectUF(uf) {state.selected=uf;renderMap();renderStateDetail();}

  function renderRanking() {
    const arr=orderStates().filter(u=>(state.measure==='rate'?yearRate(state.metric,u.uf):yearCount(state.metric,u.uf))!=null).slice(0,10);
    const max=Math.max(...arr.map(u=>state.measure==='rate'?yearRate(state.metric,u.uf):yearCount(state.metric,u.uf)),1);
    $('rank-caption').textContent=state.measure==='rate'?`Taxa ${rateUnit(metricDef())}`:`Maior volume registrado · ${metricDef().numberType}${supportsRate()?'':' · não é ranking de risco'}`;
    $('ranking-bars').innerHTML=arr.length?arr.map((u,i)=>{const v=state.measure==='rate'?yearRate(state.metric,u.uf):yearCount(state.metric,u.uf);return `<div class="rank-row" data-uf="${u.uf}" role="button" tabindex="0" title="Selecionar ${esc(u.name)}"><span class="rank-pos">${String(i+1).padStart(2,'0')}</span><span class="rank-name">${esc(u.name)}</span><div class="rank-track"><div class="rank-bar" style="width:${Math.max(1,v/max*100)}%"></div></div><span class="rank-value">${state.measure==='rate'?fmtR(v):fmtN(v)}</span></div>`;}).join(''):'<p class="empty">Não há valores disponíveis para o recorte.</p>';
    $('ranking-bars').querySelectorAll('.rank-row').forEach(row=>{row.onclick=()=>selectUF(row.dataset.uf);row.onkeydown=e=>{if(e.key==='Enter'){selectUF(row.dataset.uf);}};});
  }

  function renderTable() {
    const sorted=orderStates(),br=yearRate(state.metric,'BR');
    $('ranking-table').innerHTML=sorted.map((u,i)=>{
      const r=val(state.metric,u.uf),t=yearRate(state.metric,u.uf),n=yearCount(state.metric,u.uf),v=changeFor(state.metric,u.uf,state.year),rel=ratio(state.metric,u.uf);
      const change=v==null?'—':`<span class="${v>0?'is-up':v<0?'is-down':''}">${fmtV(v)}</span>`;
      return `<tr tabindex="0" data-uf="${u.uf}" title="Abrir ${esc(u.name)}"><td class="position">${i+1}</td><td class="uf-name">${esc(u.name)}<span class="uf-sub">${u.uf}</span></td><td class="right">${fmtR(t)}</td><td class="right">${fmtN(n)}</td><td class="right">${change}</td><td class="right">${fmtRatio(rel)}</td></tr>`;
    }).join('');
    $('ranking-table').querySelectorAll('tr').forEach(row=>{row.onclick=()=>selectUF(row.dataset.uf);row.onkeydown=e=>{if(e.key==='Enter'){selectUF(row.dataset.uf);}};});
    const m=metricDef();
    $('table-subtitle').textContent=`${sorted.length} UFs · ${m.name} · ${infoYear(state.year)} · ordenação por ${state.measure==='rate'?'taxa':'total'}`;
    $('table-note').textContent=`${official()?'Fonte: SINESP-VDE/MJSP, projeção IBGE/SENATRAN conforme indicador.':'Fonte: FBSP, Anuário 2026, '+m.sheet+'.'} ${isRate(m)?'Taxa '+rateUnit(m)+'.':'Sem taxa proporcional defensável para este indicador; mostrado apenas em volume.'} ∆: ${state.year===2026?'jan–set/2026 vs. jan–set/2025 (mesmo período)':'taxa 2025 vs. 2024'}. “—” significa indisponível, não zero. ${m.reading||m.note||''}`;
  }

  function renderStateDetail() {
    const container=$('state-detail');
    if(!state.selected){container.innerHTML='<div class="state-detail-empty">Selecione um estado no mapa, ranking ou tabela para ver seu detalhe.</div>';return;}
    const u=ufs.find(x=>x.uf===state.selected);if(!u)return;
    const t=yearRate(state.metric,u.uf),n=yearCount(state.metric,u.uf),br=yearRate(state.metric,'BR'),r=ratio(state.metric,u.uf);
    container.innerHTML=`<div class="state-detail-inner"><div><span class="panel-eyebrow">ESTADO SELECIONADO · ${esc(u.region.toUpperCase())}</span><h3>${esc(u.name)}</h3><p>${esc(metricDef().name)} · ${infoYear(state.year)}</p></div><div class="state-stat"><strong>${isRate(metricDef())?fmtR(t):fmtN(n)}</strong><small>${rateLabel(metricDef())} ${rateUnit(metricDef())}</small></div><div class="state-stat"><strong>${fmtRatio(r)}</strong><small>${isRate(metricDef())?'Da taxa brasileira ('+fmtR(br)+')':'Do volume médio por UF'}</small></div><button type="button" id="clear-state" aria-label="Limpar estado selecionado">✕</button></div>`;
    $('clear-state').onclick=()=>{state.selected=null;renderMap();renderStateDetail();};
  }
  function renderExplorer() {
    const m=metricDef(),br=yearRate(m.id,'BR');
    $('explorador').classList.toggle('is-operational',isVolume(m));
    $('selected-theme').textContent=m.theme.toUpperCase();$('selected-title').textContent=m.name;
    const n=yearCount(m.id,'BR');
    const cov=official()?val(m.id,'BR')?.['coverage'+String(state.year).slice(2)]:m.coverage;
    $('selected-explainer').textContent=`${m.numberType[0].toUpperCase()+m.numberType.slice(1)} · ${isRate(m)?'taxa '+rateUnit(m):'volume absoluto, sem classificação de risco'} · ${cov}/27 UFs informantes em ${infoYear(state.year)}. ${m.reading||m.note||''}`;
    $('selected-br-rate').textContent=isRate(m)?fmtR(br):fmtN(n);$('selected-br-unit').textContent=`Brasil · ${rateUnit(m)} · ${infoYear(state.year)}`;
    syncControls();
    renderMap();renderRanking();renderTable();renderStateDetail();
  }

  function referenceDenominator(uf,year,denominator,cutoff=12) {
    if(official())return AtlasDenominators.base(pop,fleet,uf,year,denominator,cutoff);
    const rec=val(denominatorMetrics[denominator],uf),suffix=String(year).slice(2);
    const count=rec?.['n'+suffix],rate=rec?.['t'+suffix];
    return count!=null && rate>0 ? count*100000/rate : null;
  }
  function aggregateRegion(mid,members,year,cutoff=year===2026?9:12) {
    const m=metas.find(item=>item.id===mid),suffix=String(year).slice(2);
    let count=0,denominator=0,coverage=0;
    for(const u of members) {
      const rec=val(mid,u.uf),n=year===2025&&cutoff<12?rec?.ytd25:rec?.['n'+suffix];
      const base=isRate(m)?referenceDenominator(u.uf,year,m.denominator,cutoff):null;
      if(n==null || isRate(m)&&base==null)continue;
      count+=n;if(base!=null)denominator+=base;coverage++;
    }
    return {rate:denominator>0 ? count*100000/denominator:null,
      count:coverage>0?count:null,denominator,coverage,total:members.length,
      complete:coverage===members.length};
  }
  function getRegionMembers(region) {return ufs.filter(u=>u.region===region);}
  function getComparatorMembers() {return ufs.filter(u=>comparisonRegions.includes(u.region));}
  function groupChange(now,prior) {const key=now.rate!=null?'rate':'count';return now[key]!=null&&prior[key]>0 ? (now[key]/prior[key]-1)*100:null;}
  function compareDiff(a,b) {return a.rate!=null&&b.rate>0 ? (a.rate/b.rate-1)*100:null;}
  function changeLabel(n) {return n==null?'—':`${n>0?'+':''}${fmtR(n)}%`;}
  function coverageLabel(r) {return `${r.coverage}/${r.total} UFs${r.complete?'':' · parcial'}`;}
  function selectRegion(region) {regional.selected=regional.selected===region?null:region;renderRegional();}

  function renderRegional() {
    const mid=regional.metric,yr=regional.year,m=metas.find(item=>item.id===mid),
      br=val(mid,'BR')?.[isRate(m)?'t'+String(yr).slice(2):'n'+String(yr).slice(2)],
      groups=regionNames.map(name=>{
        const members=getRegionMembers(name),current=aggregateRegion(mid,members,yr),prior=aggregateRegion(mid,members,yr===2026?2025:2024,yr===2026?9:12),now=aggregateRegion(mid,members,yr===2026?2026:2025);
        const reported=val(mid,'BR')?.['coverage'+String(yr).slice(2)]||ufs.filter(u=>val(mid,u.uf)?.['n'+String(yr).slice(2)]!=null).length;
        const relative=isRate(m)?current.rate!=null&&br>0?current.rate/br:null:
          current.count!=null&&br>0&&current.coverage>0?current.count/current.coverage/(br/reported):null;
        return {name,members,current,prior,now,change:prior.complete&&now.complete?groupChange(now,prior):null,relative};
      });
    $('regioes').classList.toggle('is-operational',isVolume(m));
    $('regional-map-legend').innerHTML=isRate(m)?'<span>Taxa menor vs. Brasil</span><div class="gradient-bar"></div><span>Taxa maior vs. Brasil</span>':'<span>Menor volume por UF</span><div class="gradient-bar"></div><span>Maior volume por UF</span>';
    $('regional-map').setAttribute('aria-label',isRate(m)?'Mapa das taxas ponderadas por região':'Mapa dos volumes operacionais por região, sem interpretação de risco');
    const sorted=groups.slice().sort((a,b)=>{
      const key=regional.measure==='rate'?'rate':'count';return (b.current[key]??-1)-(a.current[key]??-1);
    });
    const max=Math.max(1,...sorted.map(g=>g.current[regional.measure]??0));
    $('regional-map-year').textContent=infoYear(yr);
    $('regional-matrix-year').textContent=infoYear(yr);
    $('regional-rank-caption').textContent=regional.measure==='rate'?`Taxa ${rateUnit(m)}`:`Total de ${m.numberType}`;
    $('regional-map-caption').textContent=`${m.name} · ${infoYear(yr)} · ${isRate(m)?'cor pela taxa regional em relação à brasileira':'cor pelo volume por UF, sem interpretar como risco'}.`;

    const lookup=Object.fromEntries(groups.map(g=>[g.name,g]));
    $('regional-map').innerHTML=ufs.map(u=>{
      const g=lookup[u.region],color=isRate(m)?fillByRatio(g.relative):fillByVolume(g.relative),selected=regional.selected===u.region;
      return `<path class="regional-map-state ${selected?'is-selected':''}" d="${source.paths[u.uf]}" fill="${color}" data-region="${esc(u.region)}" tabindex="0" role="button" aria-label="${esc(u.name)} · região ${esc(u.region)}: ${isRate(m)?fmtR(g.current.rate):fmtN(g.current.count)}"><title>${esc(u.region)} · ${isRate(m)?fmtR(g.current.rate):fmtN(g.current.count)} ${rateUnit(m)} · ${coverageLabel(g.current)}</title></path>`;
    }).join('');
    $('regional-map').querySelectorAll('.regional-map-state').forEach(path=>{
      path.onclick=()=>selectRegion(path.dataset.region);
      path.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectRegion(path.dataset.region);}};
    });
    const focused=groups.find(g=>g.name===regional.selected);
    $('regional-selected').innerHTML=focused?
      `<strong>${esc(focused.name)}</strong><span><b>${isRate(m)?fmtR(focused.current.rate):fmtN(focused.current.count)}</b> ${rateUnit(m)} · ${fmtN(focused.current.count)} registros · ${coverageLabel(focused.current)}</span>`:
      '<span>Toque em uma região para destacar a leitura dela. Todas as cinco regiões estão no mapa.</span>';

    $('regional-bars').innerHTML=sorted.map((g,i)=>{
      const v=g.current[regional.measure],partial=g.current.complete?'':`<small class="partial-tag">${coverageLabel(g.current)}</small>`;
      return `<button type="button" class="region-rank-row ${regional.selected===g.name?'is-selected':''}" data-region="${esc(g.name)}"><span class="region-rank-top"><span><em>${String(i+1).padStart(2,'0')}</em> ${esc(g.name)} ${partial}</span><strong>${regional.measure==='rate'?fmtR(v):fmtN(v)}</strong></span><span class="region-rank-track"><span style="width:${v==null?0:Math.max(1,v/max*100)}%"></span></span><span class="region-rank-bottom">${fmtN(g.current.count)} registros <span>${coverageLabel(g.current)}</span></span></button>`;
    }).join('');
    $('regional-bars').querySelectorAll('button').forEach(b=>b.onclick=()=>selectRegion(b.dataset.region));

    $('regional-table-body').innerHTML=sorted.map(g=>{
      const c=g.current,p=g.prior,n=g.now;
      return `<tr data-region="${esc(g.name)}" class="${regional.selected===g.name?'regional-active-row':''}" tabindex="0" title="Destacar ${esc(g.name)}"><td class="uf-name">${esc(g.name)}</td><td class="right">${fmtR(n.rate)}</td><td class="right">${fmtR(p.rate)}</td><td class="right">${fmtN(c.count)}</td><td class="right"><span class="${g.change>0?'is-up':g.change<0?'is-down':''}">${changeLabel(g.change)}</span></td><td class="right">${fmtRatio(g.relative)}</td><td class="right ${c.complete?'':'coverage-warning'}">${coverageLabel(c)}</td></tr>`;
    }).join('');
    $('regional-table-body').querySelectorAll('tr').forEach(row=>{
      row.onclick=()=>selectRegion(row.dataset.region);
      row.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectRegion(row.dataset.region);}};
    });
    const partialGroups=groups.filter(g=>!g.current.complete).map(g=>g.name);
    $('regional-table-note').textContent=`${isRate(m)?'Taxas '+rateUnit(m):'Volumes absolutos, não são taxas de risco'}. O total corresponde a ${infoYear(yr)}. ∆ é a mudança ${isRate(m)?'da taxa':'do volume'} ${yr===2026?'entre jan–set/2025 e jan–set/2026':'entre 2024 e 2025'}. ${partialGroups.length?'Cobertura parcial em '+partialGroups.join(', ')+': só as UFs com dados publicados participam.':'Todas as 27 UFs possuem dados para este indicador no ano selecionado.'} Fonte: ${official()?'SINESP-VDE/MJSP; IBGE/SENATRAN.':'FBSP, Anuário 2026, '+m.sheet+'.'}`;
    const regionalHeads=document.querySelectorAll('.regional-table thead th');
    regionalHeads[1].textContent=isRate(m)?`Taxa ${yr===2026?'jan–set/26':'2025'}`:'Taxa indisponível';
    regionalHeads[2].textContent=isRate(m)?`Taxa ${yr===2026?'jan–set/25':'2024'}`:'Taxa indisponível';
    regionalHeads[4].textContent=`∆ ${isRate(m)?'taxa':'volume'}`;
    regionalHeads[5].textContent=isRate(m)?'Vs. Brasil':'Vs. volume médio por UF';
    $('regional-method-note').innerHTML=official()?'<strong>Como calculamos (SINESP):</strong> para crimes, ocorrências ÷ soma da população IBGE correspondente × 100 mil. Para feminicídios, mulheres; para roubos/furtos de veículos, frota SENATRAN (dezembro ou setembro no YTD). Em atividade policial/apreensões, apresentamos volume absoluto, não índice de violência. Grupos com UFs faltantes são indicados como parciais.':'<strong>Como calculamos (FBSP):</strong> somamos ocorrências e dividimos pela população de referência reconstituída das taxas e totais estaduais do Anuário. Diferenças de arredondamento e cobertura são sinalizadas.';
    renderRegionalDuel(mid,yr,m);
    renderRegionalMatrix(yr);
  }

  function renderRegionalDuel(mid,year,m) {
    const neMembers=getRegionMembers('Nordeste'),otherMembers=getComparatorMembers();
    const ne=aggregateRegion(mid,neMembers,year),other=aggregateRegion(mid,otherMembers,year);
    const diff=compareDiff(ne,other),valid=ne.complete&&other.complete&&diff!=null;
    const sides=[{name:'Nordeste',detail:'9 estados',value:ne,side:'ne'},
      {name:'Sul + Sudeste + Centro-Oeste',detail:'11 unidades da federação',value:other,side:'others'}];
    $('regional-duel').innerHTML=sides.map(g=>`<article class="duel-card ${g.side}"><span class="duel-label">${g.detail.toUpperCase()}</span><h4>${g.name}</h4><div class="duel-rate"><strong>${isRate(m)?fmtR(g.value.rate):fmtN(g.value.count)}</strong><small>${isRate(m)?'registros '+rateUnit(m):'registros absolutos · sem taxa de risco'}</small></div><div class="duel-meta"><span>${fmtN(g.value.count)} ocorrências</span><span>${coverageLabel(g.value)}</span></div></article>`).join('');
    let verdict='';
    if(!isRate(m)) {
      verdict=`<span class="insight-status neutral">Indicador operacional ou sem exposição disponível</span><p>O Nordeste registrou <strong>${fmtN(ne.count)}</strong> e o conjunto Sul + Sudeste + Centro-Oeste, <strong>${fmtN(other.count)}</strong>, em ${infoYear(year)}. Esses totais não são comparáveis como risco: os grupos têm tamanhos e estruturas diferentes. Maior apreensão, fiscalização ou atividade pode refletir mais operações, não mais criminalidade.</p>`;
    } else if(!valid) {
      verdict=`<span class="insight-status caution">Dados incompletos</span><p>Não é possível tirar uma conclusão consistente do contraste para <strong>${esc(m.name.toLowerCase())}</strong>: uma ou mais UFs não informaram dados. Os números acima usam apenas a população das UFs com informações disponíveis.</p>`;
    } else if(Math.abs(diff)<.05) {
      verdict=`<span class="insight-status neutral">Taxas praticamente iguais</span><p>Em <strong>${year}</strong>, as taxas de <strong>${esc(m.name.toLowerCase())}</strong> no Nordeste e no conjunto Sul + Sudeste + Centro-Oeste ficaram muito próximas.</p>`;
    } else {
      verdict=`<span class="insight-status ${diff>0?'caution':'calm'}">Taxa do Nordeste ${diff>0?'maior':'menor'}</span><p>Em <strong>${year}</strong>, a taxa registrada de <strong>${esc(m.name.toLowerCase())}</strong> no Nordeste foi <strong>${fmtR(Math.abs(diff))}% ${diff>0?'superior':'inferior'}</strong> à taxa conjunta do Sul, Sudeste e Centro-Oeste. Isso descreve <em>este indicador</em>, não a segurança pública como um todo.</p>`;
    }
    $('regional-insight').innerHTML=verdict+`<span class="insight-caveat">${isRate(m)?'Comparação de taxas agregadas ('+rateUnit(m)+').':'Volumes absolutos apenas; não interpretar a diferença como risco.'} O Norte, com suas 7 UFs, está integralmente fora dos dois grupos. Diferenças no registro e na notificação dos crimes também influenciam os resultados.</span>`;
  }

  function renderRegionalMatrix(year) {
    const ne=getRegionMembers('Nordeste'),other=getComparatorMembers();
    $('regional-matrix-body').innerHTML=primary.filter(mid=>supportsRate(mid)).map(mid=>{
      const m=metas.find(item=>item.id===mid),a=aggregateRegion(mid,ne,year),b=aggregateRegion(mid,other,year);
      const diff=compareDiff(a,b),valid=a.complete&&b.complete&&diff!=null;
      const label=valid?(Math.abs(diff)<.05?'Taxas próximas':`${fmtR(Math.abs(diff))}% ${diff>0?'maior':'menor'} no NE`):'Cobertura parcial';
      return `<tr class="matrix-region-row ${regional.metric===mid?'selected-matrix-row':''}" data-metric="${mid}" tabindex="0" title="Detalhar ${esc(m.name)}"><td><strong>${esc(m.name)}</strong><small>${rateUnit(m)}</small></td><td class="right">${fmtR(a.rate)}</td><td class="right">${fmtR(b.rate)}</td><td class="right"><span class="diff-pill ${!valid?'missing':diff>0?'higher':diff<0?'lower':'even'}">${label} ↗</span></td></tr>`;
    }).join('');
    $('regional-matrix-body').querySelectorAll('tr').forEach(row=>{
      const set=()=>{regional.metric=row.dataset.metric;$('regional-indicator').value=regional.metric;renderRegional();$('regioes').scrollIntoView({behavior:'smooth',block:'start'});};
      row.onclick=set;row.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();set();}};
    });
  }

  function exportRegionalCSV() {
    const mid=regional.metric,m=metas.find(item=>item.id===mid);
    const groups=[...regionNames.map(name=>({name,members:getRegionMembers(name),type:'Região'})),
      {name:'Nordeste',members:getRegionMembers('Nordeste'),type:'Comparativo NE × 3 regiões'},
      {name:'Sul + Sudeste + Centro-Oeste',members:getComparatorMembers(),type:'Comparativo NE × 3 regiões'}];
    const first=regional.year===2026?{year:2025,cutoff:9,label:'jan–set/2025'}:{year:2024,cutoff:12,label:'2024'};
    const last=regional.year===2026?{year:2026,cutoff:9,label:'jan–set/2026'}:{year:2025,cutoff:12,label:'2025'};
    const rows=[['Fonte','Grupo','Tipo','Indicador','Unidade',`Total ${first.label}`,`Taxa ${first.label}`,'Cobertura',`Total ${last.label}`,`Taxa ${last.label}`,'Cobertura','Variação (%)'],...groups.map(g=>{
      const a=aggregateRegion(mid,g.members,first.year,first.cutoff),b=aggregateRegion(mid,g.members,last.year,last.cutoff),change=a.complete&&b.complete?groupChange(b,a):null;
      return [official()?'SINESP-VDE':'FBSP',g.name,g.type,m.name,rateUnit(m),a.count??'',a.rate??'',coverageLabel(a),b.count??'',b.rate??'',coverageLabel(b),change??''];
    })];
    const csv=rows.map(cols=>cols.map(v=>'"'+String(v).replaceAll('"','""').replace('.',',')+'"').join(';')).join('\r\n');
    const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download=`atlas_regioes_${sourceMode}_${mid}_${regional.year}.csv`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);showToast('CSV regional exportado.');
  }

  function renderCompare() {
    const a=ufs.find(u=>u.uf===state.compareA),b=ufs.find(u=>u.uf===state.compareB);
    if(!a||!b)return;
    const yr=state.compareYear,sfx=String(yr).slice(2);
    $('compare-body').innerHTML=`<div class="comp-header"><strong>${esc(a.name)}</strong><span>Taxa ${infoYear(yr)} · vs. Brasil</span><strong>${esc(b.name)}</strong></div>`+
      compareMetrics.map(id=>{
        const m=metas.find(m=>m.id===id),va=val(id,a.uf)?.['t'+sfx],vb=val(id,b.uf)?.['t'+sfx],ra=ratio(id,a.uf,yr),rb=ratio(id,b.uf,yr);
        return `<div class="comp-row"><div class="comp-number"><strong>${fmtR(va)}</strong><small>${fmtRatio(ra)} BR</small></div><div class="comp-topic"><strong>${esc(m.name)}</strong><span>${rateUnit(m)}</span><div class="comp-track"><div class="bar-a" style="width:${Math.min(100,(ra??0)/3*100)}%"></div></div><div class="comp-track"><div class="bar-b" style="width:${Math.min(100,(rb??0)/3*100)}%"></div></div></div><div class="comp-number right"><small>${fmtRatio(rb)} BR</small><strong>${fmtR(vb)}</strong></div></div>`;
      }).join('');
    $('compare-method-note').textContent=`Fonte: ${official()?'SINESP-VDE/MJSP':'FBSP (Anuário 2026)'} · ${infoYear(yr)}. Cada barra representa múltiplos da taxa nacional daquele indicador (habitantes, mulheres ou veículos conforme o caso). São categorias distintas, não um índice geral de violência.`;
  }

  function exportCSV() {
    const m=metricDef(), rows=orderStates(),yr=state.year,sfx=String(yr).slice(2),head=['Fonte','UF','Estado','Região','Indicador','Unidade','Período','Total','Taxa','Variação (%)','Cobertura'];
    const csv=[head,...rows.map(u=>{const r=val(m.id,u.uf);return [official()?'SINESP-VDE':'FBSP',u.uf,u.name,u.region,m.name,rateUnit(m),infoYear(yr),r?.['n'+sfx]??'',r?.['t'+sfx]??'',changeFor(m.id,u.uf,yr)??'',r?.['n'+sfx]==null?'não informado':'informado'];})].map(cols=>cols.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(';')).join('\r\n');
    const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download=`atlas_seguranca_${sourceMode}_${m.id}_${yr}.csv`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);showToast('CSV exportado com os filtros atuais.');
  }

  function bindEvents() {
    $('matrix-region').onchange=renderHeatmap;
    $('filter-indicator').onchange=e=>{state.metric=e.target.value;applyMeasureConstraints();renderExplorer();};
    $('filter-region').onchange=e=>{state.region=e.target.value;renderExplorer();};
    $('filter-year').onchange=e=>setGlobalYear(Number(e.target.value));
    $('filter-measure').onchange=e=>{state.measure=e.target.value;renderExplorer();};
    $('filter-search').oninput=e=>{state.search=e.target.value;renderExplorer();};
    $('download-csv').onclick=exportCSV;
    $('regional-indicator').onchange=e=>{regional.metric=e.target.value;applyMeasureConstraints();renderRegional();syncControls();};
    $('regional-year').onchange=e=>setGlobalYear(Number(e.target.value));
    $('regional-measure').onchange=e=>{regional.measure=e.target.value;renderRegional();};
    $('regional-download').onclick=exportRegionalCSV;
    $('compare-a').onchange=e=>{state.compareA=e.target.value;renderCompare();};
    $('compare-b').onchange=e=>{state.compareB=e.target.value;renderCompare();};
    $('compare-year').onchange=e=>setGlobalYear(Number(e.target.value));
    $('atlas-source').onchange=e=>setSource(e.target.value);
    $('atlas-year').onchange=e=>setGlobalYear(Number(e.target.value));
    window.addEventListener('atlas-source-change',e=>{
      if(e.detail?.source&&e.detail.source!==sourceMode)setSource(e.detail.source,false);
    });
  }

  async function start() {
    try {
      const responses=await Promise.all(['./dados.json','./sinesp-oficial.json','./pop-ibge.json','./frota-senatran.json'].map(path=>fetch(path)));
      responses.forEach((res,i)=>{if(!res.ok)throw new Error(`Falha em ${i}: HTTP ${res.status}`);});
      const [f,s,p,fro]=await Promise.all(responses.map(res=>res.json()));
      fbsp=f;pop=p;fleet=fro;
      officialSource=AtlasDenominators.normalizeSinesp(s,fbsp,pop,fleet);
      source=fbsp;metas=source.metrics;ufs=source.states;
      drawHero();renderAll();bindEvents();
    } catch(err) {
      console.error('Falha na leitura da base:',err);
      const el=$('headline-kpis');el.innerHTML='<div class="empty">Não foi possível carregar os dados. Recarregue a página.</div>';
    }
  }
  start();
})();
