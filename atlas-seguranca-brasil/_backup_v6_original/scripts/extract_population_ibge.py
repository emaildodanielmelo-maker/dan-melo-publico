"""Prepara denominadores da projeção IBGE 2024, versão única 2015–2026.

Download oficial: https://ftp.ibge.gov.br/Projecao_da_Populacao/
Projecao_da_Populacao_2024/projecoes_2024_tab1_idade_simples.xlsx
Entrada: /tmp/atlas-pop-projecoes-2024.xlsx
"""
import json
from collections import defaultdict
from pathlib import Path

import openpyxl

root=Path(__file__).resolve().parents[1]
valid={s['uf'] for s in json.loads((root/'dist/dados.json').read_text())['states']}
workbook=openpyxl.load_workbook('/tmp/atlas-pop-projecoes-2024.xlsx',read_only=True,data_only=True)
rows=workbook.active.iter_rows(values_only=True)
header=next(r for i,r in enumerate(rows,1) if i==6)
cols={year:header.index(year) for year in range(2015,2027)}
values=defaultdict(int)
for row in rows:
    age,sex,uf=row[0],row[1],row[3]
    if not isinstance(age,int) or sex not in ('Ambos','Mulheres') or uf not in valid:
        continue
    for year,col in cols.items():
        count=row[col]
        if not isinstance(count,(int,float)) or count<0:
            raise ValueError(f'População ausente: {uf}, {sex}, {year}, {age}')
        values[(uf,year,sex)]+=int(count)
workbook.close()
out={'source':'IBGE — Projeções da População, Revisão 2024 (sexo e idade simples)',
     'sourceUrl':'https://ftp.ibge.gov.br/Projecao_da_Populacao/Projecao_da_Populacao_2024/projecoes_2024_tab1_idade_simples.xlsx',
     'years':list(cols),'data':{uf:{str(year):{'habitantes':values[(uf,year,'Ambos')],'mulheres':values[(uf,year,'Mulheres')]} for year in cols} for uf in sorted(valid)}}
for uf in valid:
    for y in cols:
        assert 100_000<out['data'][uf][str(y)]['habitantes']<50_000_000
        assert 0<out['data'][uf][str(y)]['mulheres']<out['data'][uf][str(y)]['habitantes']
path=root/'dist/pop-ibge.json'
path.write_text(json.dumps(out,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print(f'Gerado {path}: {path.stat().st_size:,} bytes, {len(valid)} UFs × {len(cols)} anos')
