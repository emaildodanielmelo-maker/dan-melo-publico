// Auditoria de agregações anuais/YTD e denominadores, sem misturar fontes.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const read=f=>JSON.parse(fs.readFileSync(path.join(__dirname,'dist',f),'utf8'));
const fbsp=read('dados.json'),raw=read('sinesp-oficial.json'),pop=read('pop-ibge.json'),fleet=read('frota-senatran.json');
const window={};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'dist/denominators.js'),'utf8'),{window});
const adapter=window.AtlasDenominators,official=adapter.normalizeSinesp(raw,fbsp,pop,fleet);
assert.equal(official.metrics.length,30);
assert.equal(fbsp.metrics.length,31);
const close=(a,b,msg)=>assert.ok(Math.abs(a-b)<1e-8,msg+': '+a+' vs. '+b);
for(const year of ['2024','2025','2025_ytd','2026']){
  assert.equal(Object.keys(fleet.data).length,27);
  assert.equal(Object.values(fleet.data).reduce((sum,states)=>sum+states[year],0),fleet.periods[year].br);
}
for(const m of official.metrics){
  for(const state of fbsp.states) {
    const row=official.data[m.id][state.uf];
    for(const year of [2024,2025,2026]){
      const months=year===2026?raw.max2026Month:12;
      const value=adapter.countMonths(raw.data,m.id,state.uf,year,months),got=row['n'+String(year).slice(2)];
      assert.equal(got,value,m.id+' '+state.uf+' '+year);
      const base=m.rateEnabled?adapter.base(pop,fleet,state.uf,year,m.denominator,months):null;
      const expected=adapter.rate(got,base),actual=row['t'+String(year).slice(2)];
      if(expected==null)assert.equal(actual,null,m.id+' unavailable rate');
      else close(expected,actual,m.id+' '+state.uf+' rate');
    }
  }
}
const cei=official.data.roubo_veiculo.CE;
close(cei.t25,cei.n25/fleet.data.CE['2025']*100000,'Taxa veículo CE / SENATRAN');
close(cei.t26,cei.n26/fleet.data.CE['2026']*100000,'Taxa veículo CE YTD / SENATRAN');
close(cei.ytd25rate,cei.ytd25/fleet.data.CE['2025_ytd']*100000,'Taxa veículo CE YTD 2025 / SENATRAN');
const fem=official.data.feminicidio.CE;
close(fem.t25,fem.n25/pop.data.CE['2025'].mulheres*100000,'Taxa feminicídio por mulheres');
const homicide=official.data.homicidio.CE;
close(homicide.t25,homicide.n25/pop.data.CE['2025'].habitantes*100000,'Taxa homicídio / habitantes');
for(const mid of ['trafico','armas','cocaina','mandados','localizados','morte_agente','suicidio_agente','roubo_carga','roubo_banco']){
  assert.equal(official.data[mid].CE.t25,null,mid+' NÃO deve ter taxa substituta');
}
const aggregate=(id,year,field,cutoff)=>fbsp.states.reduce((s,u)=>{
  const v=adapter.countMonths(raw.data,id,u.uf,year,cutoff);
  return s+(v==null?0:v);
},0);
assert.equal(official.data.homicidio.BR.n25,aggregate('homicidio',2025,'total_vitima',12));
assert.equal(official.data.homicidio.BR.n26,aggregate('homicidio',2026,'total_vitima',9));
assert.equal(official.data.armas.BR.t25,null);
assert.equal(official.data.roubo_veiculo.BR.var26===null,false);
console.log('OK: 30 indicadores × 27 UFs × 3 anos, 2025 YTD, IBGE, SENATRAN, volume operacional e composição nacional.');
