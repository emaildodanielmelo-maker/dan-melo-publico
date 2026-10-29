/* Duas séries criminais INDEPENDENTES: SINESP-VDE nativo e FBSP anual. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const brInt = new Intl.NumberFormat('pt-BR',{maximumFractionDigits:0});
  const brRate = new Intl.NumberFormat('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1});
  const allRegions = ['Norte','Nordeste','Centro-Oeste','Sudeste','Sul'];
  const months=['','janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const st = {source:'fbsp',metric:'mvi',level:'BR',geo:'BR',period:'5',measure:'rate',overlay:'none',theme:'all',mode:'annual',cutoff:9};
  let latest,hist,sinesp,pop,fleet,metrics,states;

  function esc(s) {return String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');}
  function rate(n) {return n==null?'—':brRate.format(n);}
  function count(n,mid=st.metric) {return n==null?'—':official()&&def(mid)?.numberType==='kg apreendidos'?brRate.format(n):brInt.format(n);}
  function percent(n) {return n==null||!Number.isFinite(n)?'—':`${n>0?'+':''}${brRate.format(n)}%`;}
  function def(mid=st.metric) {return metrics.find(m=>m.id===mid);}
  function geoName(key=st.geo) {
    if(key==='BR')return 'Brasil';
    if(key==='GROUP:3REG')return 'Sul + Sudeste + Centro-Oeste';
    if(key.startsWith('REG:'))return key.slice(4);
    const uf=states.find(u=>u.uf===key);return uf?`${uf.name} (${uf.uf})`:key;
  }
  const official=()=>st.source==='sinesp';
  function yearsFor(mid=st.metric,period=st.period) {
    if(official()){
      const start=period==='all'?2015:period==='3'?2023:2021;
      return Array.from({length:2025-start+1},(_,i)=>start+i);
    }
    const start=period==='all'&&mid==='mvi'?2012:period==='3'?2023:2021;
    return Array.from({length:2025-start+1},(_,i)=>start+i);
  }
  function points(mid,geo,years) {
    const src=hist.data[mid]?.[geo]||{};
    return years.map(y=>({year:y,...(src[String(y)]||{n:null,t:null,c:null,total:null,src:null})}));
  }
  function isYtd(){return official()&&st.mode==='ytd';}
  function ytdYears(period=st.period){const start=period==='all'?2015:period==='3'?2024:2022;return Array.from({length:2027-start},(_,i)=>start+i);}
  function monthLabel(){return `jan–${months[st.cutoff].slice(0,3)}`;}
  function geographicMembers(geo=st.geo){
    if(geo==='BR')return states.map(s=>s.uf);
    if(geo==='GROUP:3REG')return states.filter(s=>['Sul','Sudeste','Centro-Oeste'].includes(s.region)).map(s=>s.uf);
    if(geo.startsWith('REG:'))return states.filter(s=>s.region===geo.slice(4)).map(s=>s.uf);
    return states.some(s=>s.uf===geo)?[geo]:[];
  }
  function officialPoints(mid,geo,years,cutoff=12){
    const members=geographicMembers(geo);
    return years.map(year=>{
      if(!sinesp?.data[mid])return {year,n:null,t:null,c:null,total:members.length,src:'SINESP-VDE'};
      let n=0,base=0,c=0,allBases=true;
      for(const uf of members){
        const monthly=sinesp.data[mid]?.[uf]?.[String(year)];
        if(!monthly||monthly.slice(0,cutoff).length!==cutoff||monthly.slice(0,cutoff).some(v=>v==null))continue;
        const metric=def(mid),denominator=metric?.rateEnabled===false?null:AtlasDenominators.base(pop,fleet,uf,year,metric.denominator,cutoff);
        n+=monthly.slice(0,cutoff).reduce((a,b)=>a+b,0);
        c++;
        if(denominator)base+=denominator;
        else allBases=false;
      }
      return {year,n:c?n:null,t:c&&allBases&&base>0?100000*n/base:null,c,total:members.length,src:'SINESP-VDE'};
    });
  }
  function activePoints(mid=st.metric,geo=st.geo,period=st.period){
    return official()?officialPoints(mid,geo,isYtd()?ytdYears(period):yearsFor(mid,period),isYtd()?st.cutoff:12):points(mid,geo,yearsFor(mid,period));
  }
  function change(a,b) {return a!=null&&b!=null&&b>0 ? (a/b-1)*100 : null;}
  function isComplete(p,field='t') {return p[field]!=null&&p.c!=null&&p.total!=null&&p.c===p.total;}
  function coverageText(p) {return p.c==null?'Sem dados':`${p.c}/${p.total}${p.c<p.total?' · parcial':''}`;}
  function comparableSuffix(pts,field='t') {
    let first=pts.length-1;
    if(first<0||!isComplete(pts[first],field))return [];
    while(first>0&&isComplete(pts[first-1],field)&&pts[first-1].year===pts[first].year-1)first--;
    return pts.slice(first);
  }
  function trendOf(pts,field='t') {
    const kindLabel=field==='t'?'taxa':'volume';
    const valid=comparableSuffix(pts,field);
    if(!valid.length)return {kind:'partial',label:'Cobertura parcial',note:'A localidade não está inteiramente coberta no último ano; não é seguro estimar uma tendência territorial comparável.',annual:null,r2:null};
    if(valid.length<4)return {kind:'short',label:'Série comparável curta',note:'São necessários pelo menos quatro anos consecutivos com todas as UFs do recorte informadas. Anos anteriores com cobertura incompleta não são usados para estimar tendência.',annual:null,r2:null};
    const from=valid[0].year,to=valid[valid.length-1].year;
    const prefix=valid.length<pts.length?`Tendência estimada somente sobre ${from}–${to}, janela consecutiva de cobertura completa. Anos anteriores, com cobertura inferior, aparecem na tabela e no gráfico, mas não entram na regressão. `:'';
    const finish=r=>({...r,from,to,note:prefix+r.note});
    if(valid.reduce((sum,p)=>sum+(p.n||0),0)<30) {
      return finish({kind:'small',label:'Base pequena',note:`O número de registros é baixo; pequenas oscilações podem produzir grandes mudanças na leitura de ${kindLabel}.`,annual:null,r2:null});
    }
    const ys=valid.map(p=>p[field]),xs=valid.map(p=>p.year),n=valid.length,
      avgY=ys.reduce((a,b)=>a+b,0)/n,avgX=xs.reduce((a,b)=>a+b,0)/n;
    const sxx=xs.reduce((s,x)=>s+(x-avgX)**2,0),sxy=xs.reduce((s,x,i)=>s+(x-avgX)*(ys[i]-avgY),0);
    const slope=sxx?sxy/sxx:0;
    const sst=ys.reduce((s,y)=>s+(y-avgY)**2,0);
    const sse=ys.reduce((s,y,i)=>s+(y-(avgY+slope*(xs[i]-avgX)))**2,0);
    const r2=sst>0?Math.max(0,1-sse/sst):1;
    const annual=avgY>0?slope/avgY*100:0;
    if(Math.abs(annual)<3) {
      if(avgY>0&&(Math.max(...ys)-Math.min(...ys))/avgY>.15)
        return finish({kind:'mixed',label:'Oscilante',note:`A inclinação média foi pequena, mas a amplitude das oscilações anuais superou 15% do ${kindLabel} médio.`,annual,r2});
      return finish({kind:'flat',label:'Estável',note:`A inclinação média do ${kindLabel} ficou dentro da faixa de ±3% ao ano, sem grandes oscilações relativas na janela analisada.`,annual,r2});
    }
    if(r2<.5)return finish({kind:'mixed',label:'Oscilante',note:'Os dados variaram de forma irregular; a reta de tendência explica menos da metade da variação anual.',annual,r2});
    return finish({kind:annual>0?'up':'down',label:field==='n'?(annual>0?'Volume em alta':'Volume em queda'):(annual>0?'Tendência de alta':'Tendência de queda'),note:`A inclinação média estimada foi de ${percent(annual)} do ${kindLabel} por ano, com ajuste linear de ${(r2*100).toFixed(0)}%. É uma descrição do passado, não uma previsão.`,annual,r2});
  }

  function choices() {
    const byTheme=[...new Set(metrics.map(m=>m.theme))];
    $('history-metric').innerHTML=byTheme.map(t=>`<optgroup label="${esc(t)}">${metrics.filter(m=>m.theme===t).map(m=>`<option value="${m.id}">${esc(m.name)}</option>`).join('')}</optgroup>`).join('');
    $('history-metric').value=st.metric;
    $('history-theme-filter').innerHTML='<option value="all">Todas as dimensões</option>'+byTheme.map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join('');
    setGeos();
  }
  function setGeos() {
    const el=$('history-geo');
    if(st.level==='BR') {
      el.innerHTML='<option value="BR">Brasil inteiro</option>';el.disabled=true;st.geo='BR';
    } else if(st.level==='REG') {
      el.disabled=false;
      el.innerHTML=allRegions.map(r=>`<option value="REG:${r}">${r}</option>`).join('')+'<option value="GROUP:3REG">Sul + Sudeste + Centro-Oeste (juntos)</option>';
      st.geo=st.geo.startsWith('REG:')||st.geo==='GROUP:3REG'?st.geo:'REG:Nordeste';
    } else {
      el.disabled=false;
      el.innerHTML=states.slice().sort((a,b)=>a.name.localeCompare(b.name,'pt')).map(s=>`<option value="${s.uf}">${esc(s.name)} (${s.uf})</option>`).join('');
      st.geo=states.some(s=>s.uf===st.geo)?st.geo:'CE';
    }
    el.value=st.geo;
  }

  function renderCards(pts,t) {
    const current=pts[pts.length-1],prior=pts[pts.length-2],field=st.measure==='rate'?'t':'n',first=comparableSuffix(pts,field)[0];
    const coverageOk=([a,b])=>a&&b&&isComplete(a,field)&&isComplete(b,field);
    const yoy=coverageOk([current,prior])?change(current?.[field],prior?.[field]):null;
    const long=coverageOk([current,first])?change(current?.[field],first?.[field]):null;
    const isPartial=isYtd(),unit=isPartial?'registros em meses equivalentes':field==='t'?'taxas':'registros absolutos';
    const cards=[
      {label:isPartial?`${field==='t'?'Taxa':'Acumulado'} ${monthLabel()} de ${current.year}`:`${field==='t'?'Taxa':'Total'} em ${current.year}`,value:field==='t'?rate(current?.t):count(current?.n),detail:`${count(current?.n)} ${def().numberType} · ${coverageText(current)} UFs · ${field==='t'?'por 100 mil '+def().denominator:'total do indicador'}`,tone:'teal'},
      {label:'Mudança em um ano',value:percent(yoy),detail:`Variação ${field==='t'?'da taxa':'do volume'} entre ${prior.year} e ${current.year}${isPartial?' · mesmo mês':''}`,tone:def().classification==='operacional'?'neutral':yoy>0?'warn':yoy<0?'good':'neutral'},
      {label:'Tendência no período',value:t.label,detail:`Estimada a partir ${field==='t'?'das taxas':'dos totais'} ${isPartial?'YTD de meses equivalentes':'anuais'}`,tone:t.kind},
      {label:'Variação acumulada',value:percent(long),detail:first?`De ${first.year} até ${current.year} · ${unit}`:'Sem comparação disponível',tone:def().classification==='operacional'?'neutral':long>0?'warn':long<0?'good':'neutral'}
    ];
    $('history-kpis').innerHTML=cards.map(c=>`<article class="history-kpi tone-${c.tone}"><span>${esc(c.label)}</span><strong>${esc(c.value)}</strong><small>${esc(c.detail)}</small></article>`).join('');
    $('history-diagnosis-title').textContent=t.label;
    $('history-diagnosis-title').className='history-status-'+t.kind;
    $('history-diagnosis-text').textContent=`${geoName()}: ${def().name.toLowerCase()} · ${pts[0].year}–${pts[pts.length-1].year}${isPartial?', '+monthLabel()+' de cada ano':''}. ${t.note}`;
    $('history-trend-method').innerHTML=`<strong>Critério:</strong> regressão linear descritiva sobre ${field==='t'?'taxas':'totais'} ${isPartial?'acumulados até o mesmo mês':'anuais'}, somente com cobertura territorial completa e quatro anos consecutivos. Oscilações inferiores a 3% ao ano podem ser estáveis. ${def().classification==='operacional'?'Para apreensões/atividades, alta e queda descrevem volume registrado, não piora ou melhora da segurança.':''} Não é previsão.`;
  }

  function renderPartial(){
    const area=$('history-partial');
    if(!official()||isYtd()){area.hidden=true;area.innerHTML='';return;}
    area.hidden=false;
    const p25=officialPoints(st.metric,st.geo,[2025],st.cutoff)[0],p26=officialPoints(st.metric,st.geo,[2026],st.cutoff)[0];
    if(!sinesp?.data[st.metric]||p26.n==null){
      area.className='history-partial history-partial-unavailable';
      area.innerHTML=`<div class="history-partial-main"><span class="panel-eyebrow">2026 · SINESP-VDE</span><h3>Parcial indisponível</h3><p>O indicador ${esc(def().name.toLowerCase())} não possui cobertura para todos os meses escolhidos em 2026.</p></div>`;
      return;
    }
    area.className='history-partial';
    const comparable=isComplete(p25,'n')&&isComplete(p26,'n');
    const delta=comparable?change(p26.n,p25.n):null;
    area.innerHTML=`<div class="history-partial-main"><span class="panel-eyebrow">2026 PARCIAL · SINESP-VDE</span><h3>${esc(geoName())} · ${esc(monthLabel())} de 2026</h3><p>${comparable?'Comparação com o mesmo período de 2025, sempre dentro do SINESP.':'Cobertura territorial incompleta: a variação percentual fica indisponível.'} O ano parcial permanece separado do histórico anual.</p></div><div class="history-partial-values"><div><small>Registros 2026</small><strong>${count(p26.n)}</strong></div><div><small>∆ vs 2025 YTD</small><strong>${percent(delta)}</strong></div><div><small>UFs reportadas</small><strong>${coverageText(p26)}</strong></div></div><button type="button" id="history-open-ytd">Abrir comparação YTD →</button>`;
    $('history-open-ytd').onclick=()=>{st.mode='ytd';st.measure='count';setMode();render();};
  }

  function chart(pts,other) {
    const measure=st.measure==='rate'?'t':'n';
    const numbers=[...pts,...(other||[])].map(p=>p[measure]).filter(v=>v!=null&&Number.isFinite(v));
    const svg=$('history-chart');
    if(!numbers.length) {svg.innerHTML='<text x="490" y="180" text-anchor="middle" fill="#86999d">Não há dados disponíveis neste recorte.</text>';$('history-chart-foot').textContent='Consulte a fonte, o indicador e a cobertura. Sem dados não há tendência estimada.';return;}
    const width=980,height=390,left=70,right=20,top=28,bottom=58;
    const min=Math.min(...numbers),max=Math.max(...numbers),span=Math.max(max-min,Math.max(max*.07,1));
    const lo=Math.max(0,min-span*.28),hi=max+span*.26;
    const xPos=y=>left+(y-pts[0].year)/(pts[pts.length-1].year-pts[0].year)*(width-left-right);
    const yPos=v=>top+(hi-v)/(hi-lo)*(height-top-bottom);
    const yLabel=v=>measure==='t'?rate(v):count(v);
    let out='';
    for(let i=0;i<=4;i++) {
      const y=top+(height-top-bottom)*i/4,v=hi-(hi-lo)*i/4;
      out+=`<line x1="${left}" y1="${y}" x2="${width-right}" y2="${y}" stroke="#e4eded" stroke-dasharray="3 5"/><text x="${left-12}" y="${y+4}" text-anchor="end" fill="#81959a" font-size="11">${yLabel(v)}</text>`;
    }
    for(const p of pts) {
      if(pts.length>9&&p.year%2===1&&p.year!==2025)continue;
      out+=`<text x="${xPos(p.year)}" y="${height-bottom+25}" text-anchor="middle" fill="#879b9e" font-size="11">${p.year}</text>`;
    }
    function drawSeries(series,color,dash='',name='') {
      let d='',started=false;
      for(const p of series) {
        if(p[measure]==null){started=false;continue;}
        d+=`${started?' L':' M'}${xPos(p.year).toFixed(2)},${yPos(p[measure]).toFixed(2)}`;started=true;
      }
      const title=esc(name);
      out+=`<path d="${d}" fill="none" stroke="${color}" stroke-width="${dash?2.5:3.6}" ${dash?'stroke-dasharray="8 6"':''} stroke-linejoin="round" stroke-linecap="round"/>`;
      for(const p of series) {
        if(p[measure]==null)continue;
        out+=`<circle cx="${xPos(p.year)}" cy="${yPos(p[measure])}" r="${dash?4:5}" fill="${color}" stroke="white" stroke-width="2" tabindex="0" role="img" aria-label="${title}, ${p.year}: ${yLabel(p[measure])}"><title>${title} · ${p.year}: ${yLabel(p[measure])} · cobertura ${coverageText(p)}</title></circle>`;
      }
    }
    if(other)drawSeries(other,'#c99572','dash',geoName(st.overlay));
    drawSeries(pts,'#226b72','',geoName());
    svg.innerHTML=out;
    $('history-chart-foot').textContent=`Eixo vertical em ${measure==='t'?`taxa por 100 mil ${def().denominator}`:`total de ${def().numberType}`}. ${official()&&measure==='t'?`Denominadores: IBGE para pessoas e mulheres; SENATRAN para veículos quando há base disponível. `:''}${isYtd()?`Cada ponto usa apenas ${monthLabel()} de seu ano (SINESP-VDE), inclusive 2026 parcial. `:''}${lo>0?'O eixo começa acima de zero para mostrar as variações; consulte a tabela para os valores exatos.':'O eixo começa em zero.'} Lacunas não são interpoladas.`;
  }

  function renderHistoryTable(pts) {
    $('history-table-caption').textContent=`${geoName()} · ${def().name} · ${isYtd()?monthLabel()+' de cada ano':official()?'série anual SINESP':'série anual FBSP'} · ${pts[0].year}–${pts[pts.length-1].year}`;
    $('history-data-delta').textContent=st.measure==='rate'?'∆ taxa':'∆ volume';
    $('history-table').innerHTML=pts.slice().reverse().map(p=>{
      const prior=pts.find(q=>q.year===p.year-1),field=st.measure==='rate'?'t':'n',comparable=prior&&isComplete(p,field)&&isComplete(prior,field);
      const delta=comparable?change(p[field],prior?.[field]):null;
      return `<tr><td><strong>${p.year}${isYtd()&&p.year===2026?' · parcial':''}</strong><small class="history-source-year">${isYtd()?`SINESP · ${monthLabel()}`:official()?'SINESP · ano completo':`Anuário ${p.src||'—'}`}</small></td><td class="right">${rate(p.t)}</td><td class="right">${count(p.n)}</td><td class="right"><span class="${delta>0?'is-up':delta<0?'is-down':''}">${percent(delta)}</span></td><td class="right ${p.c!=null&&p.c<p.total?'coverage-warning':''}">${coverageText(p)}</td></tr>`;
    }).join('');
  }

  function renderMatrix() {
    const entries=metrics.filter(m=>st.theme==='all'||m.theme===st.theme);
    const ytdMode=isYtd();
    $('history-matrix-head').innerHTML=`<th>Indicador</th><th class="right">${ytdMode?`Valor ${monthLabel()} 2026`:'Indicador 2025'}</th><th class="right">Variação comparável</th><th>Tendência</th><th>Cobertura</th>`;
    $('history-matrix').innerHTML=entries.map(m=>{
      const pts=activePoints(m.id,st.geo,'all'),field=ytdMode||m.rateEnabled===false?'n':'t',t=trendOf(pts,field),last=pts[pts.length-1],first=comparableSuffix(pts,field)[0];
      const overall=last&&first&&isComplete(last,field)&&isComplete(first,field)?change(last[field],first[field]):null;
      const warnings=pts.some(p=>p.c!=null&&p.c<p.total);
      const known=pts.filter(p=>p[field]!=null).length;
      return `<tr class="history-matrix-row ${st.metric===m.id?'is-current':''}" data-metric="${m.id}" tabindex="0" title="Abrir histórico de ${esc(m.name)}"><td><strong>${esc(m.name)}</strong><small>${esc(m.theme)} · ${field==='t'?'por 100 mil '+esc(m.denominator):'volume absoluto'+(m.classification==='operacional'?' · atividade':'')}</small></td><td class="right">${field==='n'?count(last.n,m.id):rate(last.t)}</td><td class="right">${percent(overall)}</td><td><span class="history-trend-pill ${t.kind}">${esc(t.label)}</span></td><td class="history-coverage">${t.from?`${t.from}–${t.to} · `:''}${ytdMode?coverageText(last):`${known}/${pts.length} anos${warnings?' · registros parciais':''}`}</td></tr>`;
    }).join('');
    $('history-matrix').querySelectorAll('.history-matrix-row').forEach(row=>{
      function choose(){st.metric=row.dataset.metric;$('history-metric').value=st.metric;render();$('historico').scrollIntoView({behavior:'smooth',block:'start'});}
      row.onclick=choose;row.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose();}};
    });
  }

  function render() {
    if(official()&&def()?.rateEnabled===false)st.measure='count';
    const pts=activePoints(),comparison=st.overlay!=='none'&&st.overlay!==st.geo?activePoints(st.metric,st.overlay):null;
    const t=trendOf(pts,st.measure==='rate'?'t':'n'),m=def();
    $('history-theme').textContent=m.theme.toUpperCase();
    $('history-title').textContent=m.name;
    $('history-subtitle').textContent=isYtd()?`${geoName()} · acumulado ${monthLabel()} de cada ano · SINESP-VDE`:`${geoName()} · ${m.numberType} · ${official()?'SINESP-VDE':'FBSP'} · ${st.measure==='rate'?'taxa por 100 mil '+m.denominator:'volume absoluto'}`;
    $('history-period-label').textContent=`${pts[0].year}–${pts[pts.length-1].year}${isYtd()?' · YTD':''}`;
    $('history-chart-caption').textContent=(isYtd()?`${monthLabel()} de cada ano · `:'')+(st.measure==='rate'?`Taxa por 100 mil ${m.denominator}`:`Total de ${m.numberType}`);
    $('history-chart-legend').innerHTML=`<span><i class="history-legend-dot primary"></i>${esc(geoName())}</span>`+(comparison?`<span><i class="history-legend-dot secondary"></i>${esc(geoName(st.overlay))}</span>`:'');
    $('history-metric').value=st.metric;
    $('history-period').value=st.period;
    $('history-level').value=st.level;
    $('history-overlay').value=st.overlay;
    $('history-source').value=st.source;
    setMode();
    document.querySelectorAll('[data-history-measure]').forEach(b=>{const active=b.dataset.historyMeasure===st.measure;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
    const rateButton=document.querySelector('[data-history-measure="rate"]');
    rateButton.disabled=official()&&m.rateEnabled===false;
    rateButton.title=rateButton.disabled?'Sem denominador defensável nesta base: disponível apenas volume absoluto.':'Alternar para taxa por exposição';
    renderCards(pts,t);renderPartial();chart(pts,comparison);renderHistoryTable(pts);renderMatrix();
  }

  function setMode(){
    document.querySelectorAll('[data-history-mode]').forEach(b=>{const active=b.dataset.historyMode===st.mode;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
    $('history-cutoff').disabled=!official();
    $('history-mode-ytd').hidden=!official();
    $('history-period').options[0].textContent=isYtd()?'Últimos 5 YTD':'Últimos 5 anos';
    $('history-period').options[1].textContent=official()?(isYtd()?'2015–2026 · mesmo mês':'2015–2025 · completos'):'Todo o histórico FBSP';
    $('history-source-note-inline').innerHTML=official()?'<strong>Fonte selecionada: SINESP-VDE · MJSP.</strong> Indicadores originais e separados do FBSP. Taxas por habitantes/mulheres: IBGE. Roubos e furtos de veículos: SENATRAN (taxas apenas nos anos com frota validada, a partir de 2024). Indicadores operacionais: total absoluto, sem interpretação automática de risco.':'<strong>Fonte selecionada: Anuário FBSP.</strong> Os 31 indicadores e seus conceitos permanecem exclusivamente nesta fonte. Não utilizamos números do SINESP para completar anos.';
    $('history-intro-years').textContent=official()?'2015–2026':st.metric==='mvi'?'2012–2025':'2021–2025';
    $('history-intro-metrics').textContent=String(metrics.length);
    $('history-intro-caption').textContent=official()?'Eventos originais do SINESP, incluindo ocorrências criminais e atividades operacionais. Ano de 2026 disponível somente até setembro; anos anteriores têm janela completa.':'31 indicadores do Anuário FBSP; 2025 é o último ano completo. Esta visão não incorpora números mensais de outra fonte.';
    const note=$('history-mode-note');
    note.className='history-mode-note';
    if(!official())note.innerHTML='<strong>Histórico FBSP:</strong> anos completos até 2025, com conceitos próprios do Anuário. 2026 só será incorporado nesta série quando a próxima edição consolidada for publicada.';
    else if(st.mode==='annual')note.innerHTML=`<strong>Série anual SINESP 2015–2025:</strong> anos fechados da mesma base. 2026 aparece separadamente como parcial (${monthLabel()}); não entra na tendência anual. <strong>Limite:</strong> taxas por frota de veículos apenas em 2024–2025; anos anteriores aparecem em totais absolutos.`;
    else note.innerHTML=`<strong>YTD SINESP:</strong> comparação de janeiro até ${months[st.cutoff]} em cada ano de 2015 a 2026. Todos os pontos usam a mesma fonte governamental, com 2026 ainda sujeito a revisão.`;
  }

  function exportHistory() {
    const columns=['Localidade','Indicador','Dimensão','Série / metodologia','Unidade da taxa','Ano','Mês final do período','Total','Taxa','Estados informantes','Estados no grupo','Fonte'];
    const rows=[columns];
    for(const m of metrics){
      const yearList=official()?(isYtd()?ytdYears('all'):yearsFor(m.id,'all')):yearsFor(m.id,'all');
      const series=official()?officialPoints(m.id,st.geo,yearList,isYtd()?st.cutoff:12):points(m.id,st.geo,yearList);
      for(const p of series)rows.push([geoName(),m.name,m.theme,official()?(isYtd()?'SINESP-VDE · YTD':'SINESP-VDE · anual'):'FBSP · ano fechado',m.rateEnabled===false?'volume absoluto':'por 100 mil '+m.denominator,p.year,isYtd()?st.cutoff:12,p.n??'',p.t??'',p.c??'',p.total??'',official()?'SINESP-VDE/MJSP, extração 19/10/2026':p.src?'Anuário FBSP '+p.src:'']);
    }
    const csv=rows.map(row=>row.map(v=>'"'+String(v).replaceAll('"','""').replace('.',',')+'"').join(';')).join('\r\n');
    const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=`atlas_${st.source}_${st.mode}_${st.geo.replaceAll(':','-')}.csv`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  function bind() {
    function setHistorySource(next,emit=true){
      if(st.source===next)return;
      st.source=next;
      metrics=official()?sinesp.metrics:latest.metrics;
      st.metric=official()?'homicidio':'mvi';st.mode='annual';st.measure='rate';st.period=official()?'all':'5';st.theme='all';
      choices();render();
      if(emit)window.dispatchEvent(new CustomEvent('atlas-source-change',{detail:{source:next}}));
    }
    $('history-source').onchange=e=>setHistorySource(e.target.value);
    window.addEventListener('atlas-source-change',e=>{if(e.detail?.source&&e.detail.source!==st.source)setHistorySource(e.detail.source,false);});
    $('history-metric').onchange=e=>{st.metric=e.target.value;render();};
    $('history-level').onchange=e=>{st.level=e.target.value;st.geo='';setGeos();render();};
    $('history-geo').onchange=e=>{st.geo=e.target.value;render();};
    $('history-period').onchange=e=>{st.period=e.target.value;render();};
    $('history-overlay').onchange=e=>{st.overlay=e.target.value;render();};
    $('history-theme-filter').onchange=e=>{st.theme=e.target.value;renderMatrix();};
    document.querySelectorAll('[data-history-mode]').forEach(b=>b.onclick=()=>{if(b.dataset.historyMode==='ytd'&&!official())return;st.mode=b.dataset.historyMode;st.measure=st.mode==='ytd'?'count':'rate';render();});
    $('history-cutoff').onchange=e=>{st.cutoff=Number(e.target.value);render();};
    document.querySelectorAll('[data-history-measure]').forEach(b=>b.onclick=()=>{if(b.dataset.historyMeasure==='rate'&&official()&&def()?.rateEnabled===false)return;st.measure=b.dataset.historyMeasure;render();});
    $('history-export').onclick=exportHistory;
  }

  async function start() {
    try {
      const [a,b,c,d,e]=await Promise.all([fetch('./dados.json'),fetch('./historico.json'),fetch('./sinesp-oficial.json'),fetch('./pop-ibge.json'),fetch('./frota-senatran.json')]);
      if(!a.ok||!b.ok||!c.ok||!d.ok||!e.ok)throw new Error('Dados indisponíveis');
      [latest,hist,sinesp,pop,fleet]=await Promise.all([a.json(),b.json(),c.json(),d.json(),e.json()]);
      sinesp.metrics=sinesp.metrics.map(AtlasDenominators.enrich);
      metrics=latest.metrics;states=latest.states;
      st.cutoff=sinesp.max2026Month;
      $('history-cutoff').innerHTML=months.slice(1,st.cutoff+1).map((m,i)=>`<option value="${i+1}">${m[0].toUpperCase()+m.slice(1)} (${i+1}/2026)</option>`).join('');
      $('history-cutoff').value=String(st.cutoff);
      choices();bind();render();
    } catch(error) {
      console.error('Falha no histórico:',error);
      $('history-kpis').innerHTML='<p class="empty">Não foi possível carregar as séries históricas. Recarregue a página.</p>';
    }
  }
  start();
})();
