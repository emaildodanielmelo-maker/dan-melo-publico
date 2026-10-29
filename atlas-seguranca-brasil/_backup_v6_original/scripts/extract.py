"""Extrai indicadores e geometrias para o painel estático.

Fonte estatística: 20º Anuário Brasileiro de Segurança Pública, 2026 (dados 2024–2025).
Malha geográfica: click_that_hood, Brazil states, baseada em estados do Brasil.
"""

import json
import math
import re
from pathlib import Path

import pandas as pd

BASE = Path(__file__).resolve().parents[1]
XLSX = Path('/tmp/anuario-seguranca-2026.xlsx')
GEO = Path('/tmp/brasil-ufs-geografia.geojson')

STATES = {
    'AC': ('Acre', 'Norte'), 'AL': ('Alagoas', 'Nordeste'),
    'AP': ('Amapá', 'Norte'), 'AM': ('Amazonas', 'Norte'),
    'BA': ('Bahia', 'Nordeste'), 'CE': ('Ceará', 'Nordeste'),
    'DF': ('Distrito Federal', 'Centro-Oeste'), 'ES': ('Espírito Santo', 'Sudeste'),
    'GO': ('Goiás', 'Centro-Oeste'), 'MA': ('Maranhão', 'Nordeste'),
    'MT': ('Mato Grosso', 'Centro-Oeste'), 'MS': ('Mato Grosso do Sul', 'Centro-Oeste'),
    'MG': ('Minas Gerais', 'Sudeste'), 'PA': ('Pará', 'Norte'),
    'PB': ('Paraíba', 'Nordeste'), 'PR': ('Paraná', 'Sul'),
    'PE': ('Pernambuco', 'Nordeste'), 'PI': ('Piauí', 'Nordeste'),
    'RJ': ('Rio de Janeiro', 'Sudeste'), 'RN': ('Rio Grande do Norte', 'Nordeste'),
    'RS': ('Rio Grande do Sul', 'Sul'), 'RO': ('Rondônia', 'Norte'),
    'RR': ('Roraima', 'Norte'), 'SC': ('Santa Catarina', 'Sul'),
    'SP': ('São Paulo', 'Sudeste'), 'SE': ('Sergipe', 'Nordeste'),
    'TO': ('Tocantins', 'Norte'),
}

# id, título, tema, aba, primeiro índice de coluna, população de referência,
# natureza do número absoluto, observação opcional.
METRICS = [
    ('mvi','Mortes violentas intencionais','Letalidade','T01',11,'habitantes','vítimas','Soma de homicídio doloso, latrocínio, lesão seguida de morte e mortes por intervenção policial, sem duplicação.'),
    ('homicidio','Homicídio doloso','Letalidade','T03',1,'habitantes','vítimas','Inclui feminicídios; não somar ao indicador MVI.'),
    ('latrocinio','Latrocínio','Letalidade','T04',1,'habitantes','vítimas','Roubo seguido de morte.'),
    ('intervencao-policial','Mortes por intervenção policial','Letalidade','T08',9,'habitantes','vítimas','Contabiliza mortes por intervenções policiais; já compõem MVI.'),
    ('tentativa-homicidio','Tentativa de homicídio','Letalidade','T20',1,'habitantes','ocorrências',None),
    ('lesao-corporal','Lesão corporal dolosa','Letalidade','T20',6,'habitantes','ocorrências',None),
    ('roubo-total','Roubos — total','Patrimônio','T15',11,'habitantes','ocorrências','Soma oficial de registros de roubo; suas modalidades não devem ser adicionadas novamente.'),
    ('roubo-transeunte','Roubo a transeunte','Patrimônio','T14',11,'habitantes','ocorrências',None),
    ('roubo-residencia','Roubo a residência','Patrimônio','T14',6,'habitantes','ocorrências',None),
    ('roubo-comercio','Roubo a estabelecimento comercial','Patrimônio','T14',1,'habitantes','ocorrências',None),
    ('roubo-carga','Roubo de carga','Patrimônio','T15',6,'habitantes','ocorrências',None),
    ('roubo-veiculo','Roubo de veículo','Patrimônio','T11',1,'veículos registrados','ocorrências','Taxa relativa à frota de veículos, não à população residente.'),
    ('furto-veiculo','Furto de veículo','Patrimônio','T11',6,'veículos registrados','ocorrências','Taxa relativa à frota de veículos, não à população residente.'),
    ('roubo-furto-veiculo','Roubo e furto de veículos','Patrimônio','T11',11,'veículos registrados','ocorrências','Taxa relativa à frota de veículos; contém as duas modalidades anteriores.'),
    ('roubo-celular','Roubo de celular','Patrimônio','T12',1,'habitantes','ocorrências',None),
    ('furto-celular','Furto de celular','Patrimônio','T12',6,'habitantes','ocorrências',None),
    ('roubo-furto-celular','Roubo e furto de celular','Patrimônio','T12',11,'habitantes','ocorrências','Agregado dos registros de roubo e furto de celular.'),
    ('estelionato','Estelionato — total','Fraudes','T17',1,'habitantes','registros',None),
    ('estelionato-eletronico','Estelionato por meio eletrônico','Fraudes','T17',6,'habitantes','registros','Categoria específica de estelionato, com cobertura estadual incompleta; não somar ao total.'),
    ('estupro-total','Estupro e estupro de vulnerável','Violência sexual','T29',11,'habitantes','vítimas','Total das duas modalidades de estupro.'),
    ('estupro','Estupro','Violência sexual','T29',1,'habitantes','vítimas',None),
    ('estupro-vulneravel','Estupro de vulnerável','Violência sexual','T29',6,'habitantes','vítimas',None),
    ('assedio-sexual','Assédio sexual','Violência sexual','T31',1,'habitantes','registros',None),
    ('importunacao-sexual','Importunação sexual','Violência sexual','T31',6,'habitantes','registros',None),
    ('homicidio-mulheres','Homicídios de mulheres','Violência contra mulheres','T21',1,'mulheres','vítimas','Inclui feminicídios.'),
    ('feminicidio','Feminicídios','Violência contra mulheres','T21',6,'mulheres','vítimas','Taxa por 100 mil mulheres.'),
    ('lesao-domestica','Lesão corporal em violência doméstica','Violência contra mulheres','T24',1,'mulheres','vítimas','Vítimas mulheres; taxa por 100 mil mulheres.'),
    ('ameaca-mulheres','Ameaça contra mulheres','Violência contra mulheres','T25',1,'mulheres','vítimas','Vítimas mulheres; taxa por 100 mil mulheres.'),
    ('stalking','Perseguição (stalking)','Violência contra mulheres','T26',1,'mulheres','registros','Taxa por 100 mil mulheres.'),
    ('violencia-psicologica','Violência psicológica contra mulheres','Violência contra mulheres','T26',6,'mulheres','registros','Taxa por 100 mil mulheres.'),
    ('desaparecidos','Pessoas desaparecidas','Outros indicadores','T10',1,'habitantes','pessoas',None),
]


def to_number(value):
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    val = str(value).strip()
    if val in ('-', '–'):
        return 0.0
    if not val or val in ('...', '…', 'NI', 'N/I'):
        return None
    try:
        return float(val.replace('.', '').replace(',', '.'))
    except ValueError:
        return None


def clean_state(text):
    return re.sub(r'\s*\(\d+\)$', '', str(text).strip())


def point_dist(p, a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]
    if dx == 0 and dy == 0:
        return math.dist(p, a)
    t = max(0, min(1, ((p[0]-a[0])*dx + (p[1]-a[1])*dy) / (dx*dx + dy*dy)))
    return math.dist(p, (a[0]+t*dx, a[1]+t*dy))


def simplify(points, epsilon=0.025):
    if len(points) <= 3:
        return points
    start, end = points[0], points[-1]
    j, maximum = -1, -1
    for i in range(1, len(points)-1):
        d = point_dist(points[i], start, end)
        if d > maximum:
            j, maximum = i, d
    if maximum > epsilon:
        return simplify(points[:j+1], epsilon)[:-1] + simplify(points[j:], epsilon)
    return [start, end]


def extract():
    workbook = pd.ExcelFile(XLSX)
    sheet_cache = {sheet: workbook.parse(sheet, header=None) for _,_,_,sheet,*_ in METRICS}
    metric_defs = []
    records = []
    for mid, label, theme, sheet, col, denominator, number_type, note in METRICS:
        df = sheet_cache[sheet]
        by_name = {}
        for row in range(len(df)):
            raw = df.iat[row, 0]
            if pd.notna(raw):
                by_name[clean_state(raw)] = row
        vals = {}
        for sigla, (state_name, region) in [('BR', ('Brasil', 'Brasil'))] + list(STATES.items()):
            idx = by_name.get(state_name)
            if idx is None:
                raise ValueError(f'{sheet}: UF ausente: {state_name}')
            num24 = to_number(df.iat[idx, col])
            num25 = to_number(df.iat[idx, col+1])
            rate24 = to_number(df.iat[idx, col+2])
            rate25 = to_number(df.iat[idx, col+3])
            variation = to_number(df.iat[idx, col+4])
            vals[sigla] = {
                'n24': int(num24) if num24 is not None else None,
                'n25': int(num25) if num25 is not None else None,
                't24': round(rate24, 4) if rate24 is not None else None,
                't25': round(rate25, 4) if rate25 is not None else None,
                'var': round(variation, 2) if variation is not None else None,
            }
        available = sum(vals[uf]['n25'] is not None and vals[uf]['t25'] is not None for uf in STATES)
        metric_defs.append(dict(id=mid, name=label, theme=theme, sheet=sheet,
                                denominator=denominator, numberType=number_type,
                                note=note, coverage=available))
        records.append(dict(id=mid, vals=vals))

    # Checagens de controles publicados e leitura correta das colunas.
    lookup = {entry['id']: entry['vals']['BR'] for entry in records}
    assert lookup['mvi']['n25'] == 40775 and round(lookup['mvi']['t25'], 1) == 19.1
    assert lookup['roubo-total']['n25'] == 610959
    assert lookup['estelionato']['n25'] == 2261055
    assert lookup['estupro-total']['n25'] == 84388
    assert lookup['feminicidio']['n25'] == 1571
    assert lookup['roubo-furto-celular']['n25'] == 792284
    assert len(metric_defs) == 31

    features = json.loads(GEO.read_text(encoding='utf-8'))['features']
    assert len(features) == 27
    all_pts = []
    for feature in features:
        geom = feature['geometry']
        polygons = geom['coordinates'] if geom['type'] == 'MultiPolygon' else [geom['coordinates']]
        for polygon in polygons:
            for ring in polygon:
                all_pts.extend(ring)
    lon_min = min(p[0] for p in all_pts)
    lon_max = max(p[0] for p in all_pts)
    lat_min = min(p[1] for p in all_pts)
    lat_max = max(p[1] for p in all_pts)
    scale = min(650/(lon_max-lon_min), 550/(lat_max-lat_min))
    x_pad = (720-(lon_max-lon_min)*scale)/2
    y_pad = (610-(lat_max-lat_min)*scale)/2

    paths = {}
    for feature in features:
        sigla = feature['properties']['sigla']
        geom = feature['geometry']
        polygons = geom['coordinates'] if geom['type'] == 'MultiPolygon' else [geom['coordinates']]
        pieces = []
        for polygon in polygons:
            for ring in polygon:
                reduced = simplify(ring)
                if len(reduced) < 3:
                    continue
                projected = [(x_pad+(lon-lon_min)*scale, y_pad+(lat_max-lat)*scale) for lon,lat in reduced]
                pieces.append('M' + 'L'.join(f'{x:.1f},{y:.1f}' for x,y in projected) + 'Z')
        paths[sigla] = ''.join(pieces)
    assert set(paths) == set(STATES)

    out = dict(
        title='Atlas da Segurança Pública — Brasil', year=2025, comparisonYear=2024,
        sourceUrl='https://forumseguranca.org.br/wp-content/uploads/2026/07/anuario-2026.xlsx',
        sourcePdf='https://forumseguranca.org.br/wp-content/uploads/2026/07/anuario-2026.pdf',
        sourceName='Fórum Brasileiro de Segurança Pública · 20º Anuário (2026)',
        geographySource='https://github.com/codeforgermany/click_that_hood/blob/main/public/data/brazil-states.geojson',
        states=[dict(uf=sigla, name=name, region=region) for sigla,(name,region) in STATES.items()],
        metrics=metric_defs, data={entry['id']: entry['vals'] for entry in records}, paths=paths,
    )
    target = BASE / 'dist' / 'dados.json'
    target.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print('Arquivo:', target, 'bytes:', target.stat().st_size)
    print('Indicadores:', len(metric_defs), 'UFs:', len(STATES))
    for m in metric_defs:
        print(f"  {m['id']:<25} {m['coverage']:2d}/27  BR={lookup[m['id']]['n25']}")


if __name__ == '__main__':
    extract()
