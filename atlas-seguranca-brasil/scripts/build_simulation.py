"""Gera dist/simulacao.json: camada DERIVADA de simulação e alertas.

Regras:
- Lê as bases brutas apenas em modo leitura (sinesp-oficial.json, pop-ibge.json, dados.json, historico.json).
- Parâmetros externos vêm de scripts/simulacao_parametros.json, cada um com fonte.
- Grava o hash SHA-256 de cada base bruta no resultado, para provar que nada foi alterado.
- Nenhum número simulado é escrito de volta nas bases brutas.
Uso: python scripts/build_simulation.py  (na raiz do projeto)
"""
import hashlib, json, os, statistics, datetime
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, 'dist')
RAW = ['sinesp-oficial.json', 'pop-ibge.json', 'dados.json', 'historico.json']

def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()

hashes = {f: sha(os.path.join(DIST, f)) for f in RAW}
S = json.load(open(os.path.join(DIST, 'sinesp-oficial.json'), encoding='utf-8'))
P = json.load(open(os.path.join(DIST, 'pop-ibge.json'), encoding='utf-8'))['data']
D = json.load(open(os.path.join(DIST, 'dados.json'), encoding='utf-8'))
PAR = json.load(open(os.path.join(ROOT, 'scripts', 'simulacao_parametros.json'), encoding='utf-8'))

REG = {s['uf']: s['region'] for s in D['states']}
NAME = {s['uf']: s['name'] for s in D['states']}
REGIOES = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul']
NE = [u for u in REG if REG[u] == 'Nordeste']
GROUPS = {'Brasil': list(REG)}
for r in REGIOES:
    GROUPS[r] = [u for u in REG if REG[u] == r]
GROUPS['Nordeste sem Ceará'] = [u for u in NE if u != 'CE']
GROUPS['Brasil sem Ceará'] = [u for u in REG if u != 'CE']
GROUPS['Brasil sem Nordeste'] = [u for u in REG if REG[u] != 'Nordeste']
GROUPS['Sul + Sudeste + Centro-Oeste'] = [u for u in REG if REG[u] in ('Sul', 'Sudeste', 'Centro-Oeste')]
M = S['max2026Month']
K = PAR['ipea_parcela_mvci_homicidio']['valor']

def soma(metric, ufs, ano, meses=12):
    tot = 0
    for u in ufs:
        a = S['data'][metric].get(u, {}).get(str(ano))
        if a is None or any(v is None for v in a[:meses]):
            raise ValueError(f'lacuna {metric} {u} {ano}')
        tot += sum(a[:meses])
    return tot

def pop(ufs, ano, den='habitantes'):
    return sum(P[u][str(ano)][den] for u in ufs)

def taxa(n, p):
    return round(n / p * 1e5, 2)

def var(a, b):
    return round((b / a - 1) * 100, 1) if a else None

CVLI = ['homicidio', 'feminicidio', 'latrocinio', 'lesao_morte']
CENARIOS = [
    ('oficial', 'Homicídio doloso (oficial SINESP)', lambda g, y, m: soma('homicidio', g, y, m)),
    ('cvli', 'CVLI: homicídio + feminicídio + latrocínio + lesão seguida de morte', lambda g, y, m: sum(soma(x, g, y, m) for x in CVLI)),
    ('cvli_interv', 'CVLI + mortes por intervenção policial', lambda g, y, m: sum(soma(x, g, y, m) for x in CVLI + ['intervencao'])),
    ('ipea41', f'Cenário Ipea: + {round(K*100,1)}% das mortes a esclarecer', lambda g, y, m: sum(soma(x, g, y, m) for x in CVLI + ['intervencao']) + K * soma('morte_esclarecer', g, y, m)),
    ('teto', 'Teto: + 100% das mortes a esclarecer', lambda g, y, m: sum(soma(x, g, y, m) for x in CVLI + ['intervencao', 'morte_esclarecer'])),
]

out = {
    'geradoEm': datetime.date.today().isoformat(),
    'aviso': 'Camada de simulação derivada. Não substitui nem altera as bases brutas. Cenários são exploratórios e trazem a fonte de cada parâmetro.',
    'basesBrutasSha256': hashes,
    'parametros': PAR,
    'mesCorte2026': M,
}

# 1. Letalidade: cenários YTD (jan–mês de corte) e ano cheio 2024/2025
let = []
for g, ufs in list(GROUPS.items()) + [(f'{NAME[u]} ({u})', [u]) for u in NE]:
    row = {'grupo': g, 'ufs': ufs, 'cenarios': []}
    for cid, label, f in CENARIOS:
        n25, n26 = f(ufs, 2025, M), f(ufs, 2026, M)
        p25, p26 = pop(ufs, 2025), pop(ufs, 2026)
        a24, a25 = f(ufs, 2024, 12), f(ufs, 2025, 12)
        row['cenarios'].append({'id': cid, 'nome': label,
            'ytd2025': {'n': round(n25), 'taxa': taxa(n25, p25)}, 'ytd2026': {'n': round(n26), 'taxa': taxa(n26, p26)},
            'varYtd': var(n25 / p25, n26 / p26),
            'ano2024': {'n': round(a24), 'taxa': taxa(a24, pop(ufs, 2024))}, 'ano2025': {'n': round(a25), 'taxa': taxa(a25, p25)}})
    let.append(row)
out['letalidade'] = let

# 2. Decomposição da queda do Nordeste (YTD, homicídio oficial) — base para cascata
d25 = {u: soma('homicidio', [u], 2025, M) for u in NE}
d26 = {u: soma('homicidio', [u], 2026, M) for u in NE}
delta_ne = sum(d26.values()) - sum(d25.values())
dec = sorted(({'uf': u, 'nome': NAME[u], 'n2025': d25[u], 'n2026': d26[u], 'delta': d26[u] - d25[u],
               'pesoNaVariacao': round((d26[u] - d25[u]) / delta_ne * 100, 1), 'varPct': var(d25[u], d26[u])} for u in NE),
              key=lambda r: r['delta'])
out['decomposicaoNordeste'] = {'indicador': 'Homicídio doloso (SINESP)', 'periodo': f'jan–{M:02d}', 'total2025': sum(d25.values()), 'total2026': sum(d26.values()), 'delta': delta_ne, 'ufs': dec}

# 3. Alertas de quebra de série em 'mortes a esclarecer' e base pequena
lim = PAR['limiar_quebra_serie']
quebras = []
for u in REG:
    for y in range(2016, 2027):
        try:
            a, b = soma('morte_esclarecer', [u], y - 1, M), soma('morte_esclarecer', [u], y, M)
            h_a, h_b = soma('homicidio', [u], y - 1, M), soma('homicidio', [u], y, M)
        except ValueError:
            continue
        if b - a >= lim['minimo_absoluto'] and (a == 0 or b / a >= lim['multiplicador']):
            quebras.append({'uf': u, 'nome': NAME[u], 'ano': y, 'periodo': f'jan–{M:02d}', 'esclarecerAnterior': a, 'esclarecerAtual': b,
                            'homicidioAnterior': h_a, 'homicidioAtual': h_b,
                            'leitura': 'Crescimento atípico de mortes a esclarecer; quedas de homicídio no mesmo ano exigem checagem com a secretaria estadual.'})
out['alertasQuebraSerie'] = sorted(quebras, key=lambda q: (-q['ano'], -(q['esclarecerAtual'] - q['esclarecerAnterior'])))

# 4. Tendência longa relativa ao Brasil (homicídio oficial, ano cheio)
anos = list(range(2015, 2026))
longa = {}
for g in ['Brasil'] + REGIOES:
    ufs = GROUPS[g]
    serie = []
    for y in anos:
        try:
            serie.append(taxa(soma('homicidio', ufs, y), pop(ufs, y)))
        except ValueError:
            serie.append(None)
    longa[g] = serie
base = anos.index(2017)
out['tendenciaLonga'] = {'anos': anos, 'series': longa,
    'var2017a2025': {g: var(s[base], s[-1]) for g, s in longa.items() if s[base]},
    'razaoNordesteSul': [round(a / b, 2) if a and b else None for a, b in zip(longa['Nordeste'], longa['Sul'])],
    'nota': 'Sudeste e Brasil 2015 ficam vazios: o Espírito Santo não informou 2015 ao SINESP.'}

# 5. Mulheres: homicídio de mulheres × feminicídio (FBSP 2025) e cenário de classificação padronizada
share_br = PAR['fbsp_proporcao_feminicidio_brasil_2025']['valor']
fd = D['data']
def fb_group(metric, ufs, ano='25'):
    n = sum(fd[metric][u]['n' + ano] for u in ufs)
    p = sum(fd[metric][u]['n' + ano] / fd[metric][u]['t' + ano] * 1e5 for u in ufs if fd[metric][u]['t' + ano])
    return n, p
mul = []
for g in ['Brasil'] + REGIOES + ['Nordeste sem Ceará'] + [f'{NAME[u]} ({u})' for u in NE]:
    ufs = GROUPS.get(g) or [g[-3:-1]]
    hn, hp = fb_group('homicidio-mulheres', ufs)
    fn, _ = fb_group('feminicidio', ufs)
    mul.append({'grupo': g, 'homicidiosMulheres': hn, 'taxaHomicidioMulheres': taxa(hn, hp), 'feminicidios': fn, 'taxaFeminicidio': taxa(fn, hp),
                'proporcaoClassificada': round(fn / hn * 100, 1) if hn else None,
                'feminicidioPadronizado': round(hn * share_br), 'taxaFeminicidioPadronizada': taxa(hn * share_br, hp)})
out['mulheres'] = {'fonte': 'FBSP — 20º Anuário, Tabela 21 (ano-base 2025)', 'proporcaoNacional': share_br, 'linhas': mul,
    'leitura': 'O cenário padronizado aplica a todas as regiões a proporção nacional de classificação (44,39%). Ele equivale a comparar homicídios de mulheres, que não dependem da tipificação.'}
fem_ytd = []
for g in ['Brasil'] + REGIOES:
    ufs = GROUPS[g]
    a, b = soma('feminicidio', ufs, 2025, M), soma('feminicidio', ufs, 2026, M)
    fem_ytd.append({'grupo': g, 'n2025': a, 'n2026': b, 'diferenca': b - a, 'taxa2025': taxa(a, pop(ufs, 2025, 'mulheres')), 'taxa2026': taxa(b, pop(ufs, 2026, 'mulheres')),
                    'var': var(a / pop(ufs, 2025, 'mulheres'), b / pop(ufs, 2026, 'mulheres')), 'basePequena': max(a, b) < PAR['limiar_base_pequena']['valor']})
out['feminicidioYtd'] = fem_ytd

# 6. Violência doméstica: registro atípico e imputação conservadora
br_t = fd['lesao-domestica']['BR']['t25']
lim_r = PAR['limiar_registro_atipico']['valor']
atip = [u for u in REG if fd['lesao-domestica'][u]['t25'] < lim_r * br_t]
vd = []
for g in ['Brasil'] + REGIOES + ['Nordeste sem Ceará']:
    ufs = GROUPS[g]
    n, p = fb_group('lesao-domestica', ufs)
    row = {'grupo': g, 'registros': n, 'taxa': taxa(n, p)}
    if any(u in atip for u in ufs):
        n_adj = 0
        for u in ufs:
            pu = fd['lesao-domestica'][u]['n25'] / fd['lesao-domestica'][u]['t25'] * 1e5
            if u in atip:
                pares = [fd['lesao-domestica'][v]['t25'] for v in ufs if v not in atip]
                n_adj += statistics.median(pares) * pu / 1e5
            else:
                n_adj += fd['lesao-domestica'][u]['n25']
        row['taxaImputada'] = taxa(n_adj, p)
        row['imputacao'] = 'UF com registro atípico recebe a mediana das demais UFs da mesma região.'
    vd.append(row)
out['violenciaDomestica'] = {'fonte': 'FBSP — 20º Anuário, Tabela 24 (ano-base 2025), por 100 mil mulheres', 'taxaBrasil': round(br_t, 1),
    'ufsRegistroAtipico': [{'uf': u, 'nome': NAME[u], 'taxa': round(fd['lesao-domestica'][u]['t25'], 1)} for u in atip], 'linhas': vd,
    'leitura': 'A imputação NÃO estima a violência real; apenas mostra quanto o registro atípico de uma UF puxa a média regional.'}

# 7. Ordens de grandeza nacionais da subnotificação (parâmetros externos)
est_n = fd['estupro-total']['BR']['n25']
r_est = PAR['ipea_estupro_taxa_registro_policial']['valor']
vv = PAR['vv_agressao_fisica_mulheres_2025']['valor']
lvd_br = fd['lesao-domestica']['BR']['n25']
out['subnotificacaoNacional'] = [
    {'tema': 'Estupro', 'registrado2025': est_n, 'parametro': r_est, 'estimativaOrdemGrandeza': round(est_n / r_est, -3),
     'metodo': 'Registros policiais ÷ taxa de registro estimada pelo Ipea (PNS 2019 + Sinan).', 'ressalva': PAR['ipea_estupro_taxa_registro_policial']['ressalva']},
    {'tema': 'Agressão física contra mulheres', 'registrado2025': lvd_br, 'vitimasPesquisa': vv, 'razaoRegistroPorVitima': round(lvd_br / vv * 100, 1),
     'metodo': 'Registros de lesão em violência doméstica (FBSP) ÷ mulheres que relataram agressão física na pesquisa Visível e Invisível 2025.',
     'ressalva': 'Conceitos diferentes (registros × pessoas; violência doméstica × qualquer autor). Serve só para dimensionar a distância entre ocorrência e registro.'},
]
dst = os.path.join(DIST, 'simulacao.json')
json.dump(out, open(dst, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
assert {f: sha(os.path.join(DIST, f)) for f in RAW} == hashes, 'base bruta alterada!'
print('OK simulacao.json', os.path.getsize(dst), 'bytes; bases brutas intactas')
