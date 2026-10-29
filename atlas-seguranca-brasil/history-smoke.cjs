// Testes de regressão: fontes criminais independentes, 2015–2026 e abas.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=__dirname;
const read=file=>fs.readFileSync(path.join(root,'dist',file),'utf8');
const html=read('index.html');
const latest=JSON.parse(read('dados.json'));
const hist=JSON.parse(read('historico.json'));
const gov=JSON.parse(read('sinesp-oficial.json'));
const population=JSON.parse(read('pop-ibge.json'));
const fleet=JSON.parse(read('frota-senatran.json'));
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
assert.equal(ids.length,new Set(ids).size,'IDs HTML duplicados');
assert.equal(gov.metrics.length,30,'30 categorias SINESP nativas');
assert.equal(latest.metrics.length,31,'31 categorias FBSP');
assert.deepEqual(gov.years,Array.from({length:12},(_,i)=>2015+i));
assert.equal(gov.max2026Month,9);
assert.equal(population.data.CE['2025'].habitantes,9268836);
assert.ok(gov.data.homicidio.CE['2026'][9]===null);
assert.ok(gov.data.feminicidio.CE['2026'][9]===null);
assert.equal(hist.data.mvi.BR['2025'].n,40775);
assert.equal(hist.data.mvi.BR['2012'].n,54694);

const el={};
for(const id of ids)el[id]={innerHTML:'',textContent:'',value:'',disabled:false,hidden:false,
  querySelectorAll(){return []},scrollIntoView(){},setAttribute(){},options:[{textContent:''},{textContent:''}]};
el['history-open-ytd']={};
const makeButton=(name,value)=>({dataset:{[name]:value},classList:{toggle(){}},setAttribute(){},hidden:false});
const measures=['rate','count'].map(v=>makeButton('historyMeasure',v));
const modes=['annual','ytd'].map(v=>makeButton('historyMode',v));
let exported;
const document={
  getElementById(id){assert.ok(el[id],`Elemento HTML ausente ${id}`);return el[id];},
  querySelectorAll(query){return query==='[data-history-measure]'?measures:query==='[data-history-mode]'?modes:[];},
  querySelector(query){return query==='[data-history-measure="rate"]'?measures[0]:null;},
  createElement(){return {click(){},remove(){},set href(v){},set download(v){}};},
  body:{appendChild(){}}
};
const handlers={};
const window={addEventListener(type,fn){handlers[type]=fn;},dispatchEvent(ev){handlers[ev.type]?.(ev);}};
const context={document,console,Intl,Blob,setTimeout,clearTimeout,window,
  CustomEvent:class {constructor(type,details){this.type=type;this.detail=details.detail;}},
  URL:{createObjectURL(blob){exported=blob;return 'blob:test';},revokeObjectURL(){}},
  fetch:async u=>({ok:true,json:async()=>u.includes('historico')?hist:u.includes('sinesp-oficial')?gov:u.includes('pop-ibge')?population:u.includes('frota-senatran')?fleet:latest})};
const rows=()=>((el['history-table'].innerHTML.match(/<tr/g))||[]).length;
const matrix=()=>((el['history-matrix'].innerHTML.match(/<tr/g))||[]).length;

(async()=>{
  vm.runInNewContext(read('denominators.js'),context,{filename:'denominators.js'});
  context.AtlasDenominators=window.AtlasDenominators;
  vm.runInNewContext(read('history.js'),context,{filename:'history.js'});
  await new Promise(r=>setTimeout(r,0));
  el['history-source'].onchange({target:{value:'sinesp'}});
  assert.equal(el['history-source'].value,'sinesp');
  assert.equal(matrix(),30);
  assert.equal(rows(),11,'2015 a 2025 completos');
  assert.ok(el['history-partial'].innerHTML.includes('2026 PARCIAL'));
  assert.ok(el['history-intro-caption'].textContent.includes('SINESP'));
  assert.ok(el['history-chart-foot'].textContent.includes('não são interpoladas'));
  assert.ok(el['history-mode-note'].innerHTML.includes('SINESP'));

  // Homicídio e feminicídio NÃO são agregados, ao contrário do esquema FBSP.
  const hom2025=Object.values(gov.data.homicidio).reduce((a,uf)=>a+uf['2025'].reduce((b,v)=>b+(v||0),0),0);
  const fem2025=Object.values(gov.data.feminicidio).reduce((a,uf)=>a+uf['2025'].reduce((b,v)=>b+(v||0),0),0);
  assert.ok(hom2025>0&&fem2025>0);
  assert.ok(hom2025+fem2025>hom2025);

  modes[1].onclick();
  assert.equal(rows(),12,'YTD 2015 a 2026');
  assert.ok(el['history-table'].innerHTML.includes('2026 · parcial'));
  assert.ok(el['history-chart-caption'].textContent.includes('jan–set'));
  assert.ok(el['history-mode-note'].innerHTML.includes('SINESP'));
  el['history-cutoff'].onchange({target:{value:'6'}});
  assert.ok(el['history-chart-caption'].textContent.includes('jan–jun'));
  el['history-level'].onchange({target:{value:'REG'}});
  el['history-geo'].onchange({target:{value:'REG:Nordeste'}});
  el['history-overlay'].onchange({target:{value:'GROUP:3REG'}});
  assert.ok(el['history-chart-legend'].innerHTML.includes('Centro-Oeste'));
  el['history-level'].onchange({target:{value:'UF'}});
  assert.equal(el['history-geo'].value,'CE');
  el['history-export'].onclick();
  assert.ok((await exported.text()).includes('SINESP-VDE'));

  // Mudança de fonte substitui todos os conceitos e a totalidade dos dados.
  el['history-source'].onchange({target:{value:'fbsp'}});
  assert.equal(el['history-source'].value,'fbsp');
  assert.equal(matrix(),31);
  assert.equal(rows(),5);
  assert.equal(el['history-mode-ytd'].hidden,true);
  assert.ok(el['history-source-note-inline'].innerHTML.includes('Anuário FBSP'));
  el['history-level'].onchange({target:{value:'BR'}});
  el['history-period'].onchange({target:{value:'all'}});
  assert.equal(rows(),14,'MVI desde 2012 no FBSP');
  assert.equal(el['history-partial'].hidden,true,'Sem 2026 do SINESP na aba FBSP');
  el['history-metric'].onchange({target:{value:'estelionato'}});
  assert.ok(el['history-kpis'].innerHTML.includes('1.059,4'));
  el['history-export'].onclick();
  const csv=await exported.text();
  assert.ok(csv.includes('Estelionato'));
  assert.ok(!csv.includes('SINESP-VDE'));

  for(const level of ['BR','REG','UF']){
    el['history-level'].onchange({target:{value:level}});
    for(const m of latest.metrics){el['history-metric'].onchange({target:{value:m.id}});assert.equal(matrix(),31);}
  }

  el['history-source'].onchange({target:{value:'sinesp'}});
  assert.equal(matrix(),30);
  assert.equal(rows(),11);
  console.log('OK: SINESP 2015–2026, FBSP independente, YTD, IBGE, 30/31 indicadores, três níveis e CSV.');
})().catch(err=>{console.error(err);process.exitCode=1;});
