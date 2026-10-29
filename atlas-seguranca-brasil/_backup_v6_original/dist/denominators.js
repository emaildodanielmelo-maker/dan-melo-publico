/* Critérios separados de numerador / denominador: nunca combinar FBSP com SINESP. */
(function () {
  'use strict';
  const operational = new Set(['trafico','cocaina','maconha','armas','localizados','mandados','atendimento','salvamento','incendios','alvaras','vistorias']);
  const workforce = new Set(['morte_agente','suicidio_agente']);
  const exposureMissing = new Set(['roubo_carga','roubo_banco']);
  const vehicles = new Set(['roubo_veiculo','furto_veiculo']);
  const female = new Set(['feminicidio','tentativa_feminicidio']);

  function enrich(metric) {
    const m={...metric};
    if(vehicles.has(m.id))m.denominator='veículos registrados';
    if(female.has(m.id))m.denominator='mulheres';
    if(workforce.has(m.id))m.denominator='efetivo de segurança';
    if(exposureMissing.has(m.id))m.denominator='exposição específica';
    m.classification=operational.has(m.id)?'operacional':workforce.has(m.id)||exposureMissing.has(m.id)?'exposição indisponível':'vitimização';
    m.rateEnabled=m.classification==='vitimização';
    m.reading=operational.has(m.id)?'Volume de atividade/registro; maior quantidade não prova mais violência, nem melhor atuação.':
      workforce.has(m.id)?'O denominador de referência é o efetivo de profissionais, ainda indisponível no Atlas. Use apenas o número absoluto.':
      exposureMissing.has(m.id)?'A exposição específica (transportes/estabelecimentos) não está disponível. Use o número absoluto; evitar comparação de risco por habitantes.':
      vehicles.has(m.id)?'Taxa por 100 mil veículos registrados, usando frota SENATRAN/RENAVAM para SINESP.':
      female.has(m.id)?'Taxa por 100 mil mulheres, usando projeções IBGE para SINESP.':
      'Taxa por 100 mil habitantes, usando projeções IBGE para SINESP.';
    return m;
  }
  function base(pop,fleet,uf,year,denominator,cutoff=12) {
    if(denominator==='veículos registrados') {
      const key=year===2025&&cutoff<12?'2025_ytd':String(year);
      return fleet?.data?.[uf]?.[key]??null;
    }
    if(denominator==='habitantes'||denominator==='mulheres')
      return pop?.data?.[uf]?.[String(year)]?.[denominator]??null;
    return null;
  }
  function countMonths(data,metric,uf,year,cutoff=12) {
    const months=data?.[metric]?.[uf]?.[String(year)];
    return months?.length>=cutoff&&months.slice(0,cutoff).every(n=>n!=null)
      ?months.slice(0,cutoff).reduce((s,n)=>s+n,0):null;
  }
  function rate(count,baseCount){return count==null||!(baseCount>0)?null:count*100000/baseCount;}
  function normalizeSinesp(raw,fbsp,pop,fleet){
    const metrics=raw.metrics.map(enrich),result={sourceName:raw.source,sourceUrl:raw.sourceUrl,states:fbsp.states,paths:fbsp.paths,metrics,data:{}};
    for(const m of metrics) {
      result.data[m.id]={};
      for(const u of fbsp.states){
        const r={};
        for(const y of [2024,2025,2026]){
          const cutoff=y===2026?raw.max2026Month:12,code=String(y).slice(2);
          const n=countMonths(raw.data,m.id,u.uf,y,cutoff);
          const b=m.rateEnabled?base(pop,fleet,u.uf,y,m.denominator,cutoff):null;
          r['n'+code]=n;r['t'+code]=rate(n,b);
        }
        const ytd25=countMonths(raw.data,m.id,u.uf,2025,raw.max2026Month);
        r.ytd25=ytd25;
        r.ytd25rate=rate(ytd25,m.rateEnabled?base(pop,fleet,u.uf,2025,m.denominator,raw.max2026Month):null);
        r.var=r.t24!=null&&r.t24>0&&r.t25!=null?100*(r.t25/r.t24-1):null;
        r.var26=r.t26!=null&&r.ytd25rate>0?100*(r.t26/r.ytd25rate-1):null;
        result.data[m.id][u.uf]=r;
      }
      const national={};
      for(const [y,cutoff,key] of [[2024,12,'24'],[2025,12,'25'],[2026,raw.max2026Month,'26'],[2025,raw.max2026Month,'ytd25']]){
        let n=0,b=0,c=0;
        for(const u of fbsp.states){
          const r=result.data[m.id][u.uf],v=key==='ytd25'?r.ytd25:r['n'+key];
          if(v==null)continue;
          const localBase=m.rateEnabled?base(pop,fleet,u.uf,y,m.denominator,cutoff):null;
          if(m.rateEnabled&&localBase==null)continue;
          n+=v;if(localBase!=null)b+=localBase;c++;
        }
        if(key==='ytd25'){national.ytd25=c?n:null;national.ytd25rate=rate(c?n:null,b);}
        else{national['n'+key]=c?n:null;national['t'+key]=rate(c?n:null,b);}
        national['coverage'+key]=c;
      }
      national.var=national.coverage24===27&&national.coverage25===27&&national.t24>0&&national.t25!=null
        ?100*(national.t25/national.t24-1):null;
      national.var26=national.coverage26===27&&national.coverageytd25===27&&national.t26!=null&&national.ytd25rate>0
        ?100*(national.t26/national.ytd25rate-1):null;
      result.data[m.id].BR=national;
      m.coverage=national.coverage25;
    }
    return result;
  }
  window.AtlasDenominators={enrich,base,countMonths,rate,normalizeSinesp};
})();
