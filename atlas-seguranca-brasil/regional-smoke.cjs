// Smoke test local, sem navegador externo: carrega a UI com uma implementação
// mínima de DOM e verifica todos os 31 indicadores nas duas séries anuais.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');

const root = __dirname;
const html = fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
const code = fs.readFileSync(path.join(root,'dist/app.js'),'utf8');
const data = JSON.parse(fs.readFileSync(path.join(root,'dist/dados.json'),'utf8'));
const official=JSON.parse(fs.readFileSync(path.join(root,'dist/sinesp-oficial.json'),'utf8'));
const pop=JSON.parse(fs.readFileSync(path.join(root,'dist/pop-ibge.json'),'utf8'));
const fleet=JSON.parse(fs.readFileSync(path.join(root,'dist/frota-senatran.json'),'utf8'));
const idMatches = [...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
const elements = Object.fromEntries(idMatches.map(id=>[id,{
  innerHTML:'',textContent:'',value:id==='matrix-region'?'all':'',
  options:[{textContent:''},{textContent:''}],
  classList:{toggle(){}},
  setAttribute(){},querySelectorAll(){return [];},querySelector(){return {disabled:false}},scrollIntoView(){}
}]));
elements['clear-state'] = {onclick:null}; // botão gerado dinamicamente
const headers=Array.from({length:7},()=>({textContent:''}));
const document={
  getElementById(id){assert.ok(elements[id],`ID ausente: ${id}`);return elements[id];},
  querySelectorAll(query){return query==='.regional-table thead th'?headers:[];},
  createTextNode(value){return {textContent:value};}
};
const handlers={};
const window={
  addEventListener(type,fn){handlers[type]=fn;},
  dispatchEvent(ev){handlers[ev.type]?.(ev);}
};
const context = {
  console,Intl,Blob,URL,setTimeout,clearTimeout,document,window,
  CustomEvent:class {constructor(type,details){this.type=type;this.detail=details.detail;}},
  fetch: async(u)=>({ok:true,json:async()=>u.includes('sinesp-oficial')?official:u.includes('pop-ibge')?pop:u.includes('frota-senatran')?fleet:data})
};

(async()=>{
  vm.runInNewContext(fs.readFileSync(path.join(root,'dist/denominators.js'),'utf8'),context,{filename:'denominators.js'});
  context.AtlasDenominators=window.AtlasDenominators;
  vm.runInNewContext(code,context,{filename:'app.js'});
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal((elements['regional-map'].innerHTML.match(/<path/g)||[]).length,27);
  assert.equal((elements['regional-table-body'].innerHTML.match(/<tr/g)||[]).length,5);
  assert.equal((elements['regional-matrix-body'].innerHTML.match(/<tr/g)||[]).length,6);
  assert.ok(elements['regional-duel'].innerHTML.includes('18.117 ocorrências'));
  assert.ok(elements['regional-duel'].innerHTML.includes('17.904 ocorrências'));
  assert.ok(!elements['regional-duel'].innerHTML.includes('Norte</h4>'));

  for(const year of [2024,2025]) {
    elements['regional-year'].onchange({target:{value:String(year)}});
    for(const m of data.metrics) {
      elements['regional-indicator'].onchange({target:{value:m.id}});
      assert.equal((elements['regional-table-body'].innerHTML.match(/<tr/g)||[]).length,5,`${m.id}, ${year}`);
      assert.equal((elements['regional-duel'].innerHTML.match(/<article/g)||[]).length,2,`${m.id}, ${year}`);
      assert.equal((elements['regional-map'].innerHTML.match(/<path/g)||[]).length,27,`${m.id}, ${year}`);
    }
  }
  elements['regional-indicator'].onchange({target:{value:'estelionato-eletronico'}});
  assert.ok(elements['regional-insight'].innerHTML.includes('Dados incompletos'));
  elements['regional-measure'].onchange({target:{value:'count'}});
  assert.ok(elements['regional-rank-caption'].textContent.startsWith('Total'));
  elements['atlas-source'].onchange({target:{value:'sinesp'}});
  assert.equal(elements['atlas-source'].value,'sinesp');
  assert.equal((elements['regional-matrix-body'].innerHTML.match(/<tr/g)||[]).length,6);
  elements['regional-indicator'].onchange({target:{value:'armas'}});
  assert.ok(elements['regional-insight'].innerHTML.includes('Indicador operacional'));
  assert.ok(elements['regional-table-note'].textContent.includes('Volumes absolutos'));
  elements['filter-indicator'].onchange({target:{value:'roubo_veiculo'}});
  elements['filter-year'].onchange({target:{value:'2026'}});
  assert.ok(elements['selected-br-unit'].textContent.includes('veículos registrados'));
  assert.ok(elements['panorama-period-label'].textContent.includes('2026'));
  assert.ok(elements['regional-table-note'].textContent.includes('jan–set/2026'));
  assert.ok(elements['compare-body'].innerHTML.includes('2026'));
  elements['atlas-source'].onchange({target:{value:'fbsp'}});
  assert.equal(elements['atlas-year'].value,'2025');
  console.log('OK: 31 indicadores × 2 anos, cinco regiões, confronto sem Norte, cobertura e ordenação.');
})().catch(error=>{console.error(error);process.exitCode=1;});
