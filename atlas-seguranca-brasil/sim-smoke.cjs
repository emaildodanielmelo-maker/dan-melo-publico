// Verifica a camada de simulação: bases brutas intactas e números-chave reproduzíveis.
const fs=require('fs'),crypto=require('crypto'),p=f=>__dirname+'/dist/'+f;
const O=JSON.parse(fs.readFileSync(p('simulacao.json'),'utf8'));
const ok=(c,m)=>{if(!c){console.error('FALHA: '+m);process.exit(1)}};
for(const [f,h] of Object.entries(O.basesBrutasSha256))ok(crypto.createHash('sha256').update(fs.readFileSync(p(f))).digest('hex')===h,`base bruta alterada após a geração: ${f}`);
const g=n=>O.letalidade.find(r=>r.grupo===n),c=(n,id)=>g(n).cenarios.find(x=>x.id===id);
ok(Math.abs(c('Nordeste','oficial').varYtd- -18.3)<0.05,'NE oficial YTD');
ok(Math.abs(c('Nordeste sem Ceará','oficial').varYtd- -11.2)<0.05,'NE sem CE');
ok(Math.abs(c('Brasil','oficial').varYtd- -13.3)<0.05,'BR oficial YTD');
const d=O.decomposicaoNordeste;ok(d.ufs.reduce((s,u)=>s+u.delta,0)===d.delta,'cascata não fecha');
ok(Math.abs(d.ufs.reduce((s,u)=>s+u.pesoNaVariacao,0)-100)<0.5,'pesos da cascata não somam 100%');
const ne=O.mulheres.linhas.find(m=>m.grupo==='Nordeste');ok(ne.homicidiosMulheres===1321&&ne.feminicidios===425,'mulheres NE (Tabela 21)');
ok(O.alertasQuebraSerie.some(q=>q.uf==='PE'&&q.ano===2026),'alerta PE 2026 ausente');
console.log('OK: simulação reproduzível, cascata fecha em '+d.delta+', bases brutas com hash idêntico.');
