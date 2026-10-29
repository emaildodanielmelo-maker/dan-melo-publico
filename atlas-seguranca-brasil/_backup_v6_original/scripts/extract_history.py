"""Histórico auditável das 31 categorias do Atlas, 2012–2025.

Fonte: planilhas do FBSP (Anuários 2023, 2024, 2025, 2026).
Para cada ano usa a edição mais recente que o cobre (evita versões conflitantes).
MVI usa integralmente a série retrospectiva T02 da edição 2026.
Os demais indicadores são comparáveis no recorte de até cinco anos (2021–2025),
respeitando disponibilidade e as ressalvas de classificação da fonte.

Execute depois de obter os originais públicos em /tmp/fbsp-anuario-ANO.xlsx.
"""
from __future__ import annotations

import json
import math
import re
from pathlib import Path

import openpyxl

from extract import METRICS, STATES, to_number

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'dist/dados.json'
TARGET = ROOT / 'dist/historico.json'
YEARS_EDITION = {2021: 2023, 2022: 2024, 2023: 2025}
REGIONS = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul']
OTHER_REGIONS = {'Sul', 'Sudeste', 'Centro-Oeste'}

# A ordem das tabelas muda entre os anuários; os nomes dos indicadores se
# mantêm. Os índices de coluna vêm da inspeção dos cabeçalhos originais.
TAB_BY_EDITION = {
    2023: {
        'homicidio': 'T04', 'latrocinio': 'T05', 'intervencao-policial': 'T10',
        'tentativa-homicidio': 'T26', 'lesao-corporal': 'T26',
        'roubo-total': 'T17', 'roubo-transeunte': 'T16',
        'roubo-residencia': 'T16', 'roubo-comercio': 'T16', 'roubo-carga': 'T17',
        'roubo-veiculo': 'T13', 'furto-veiculo': 'T13',
        'roubo-furto-veiculo': 'T13', 'roubo-celular': 'T14',
        'furto-celular': 'T14', 'roubo-furto-celular': 'T14',
        'estelionato': 'T15', 'estelionato-eletronico': 'T15',
        'estupro-total': 'T34', 'estupro': 'T34',
        'estupro-vulneravel': 'T34', 'assedio-sexual': 'T37',
        'importunacao-sexual': 'T37', 'homicidio-mulheres': 'T27',
        'feminicidio': 'T27', 'lesao-domestica': 'T29',
        'ameaca-mulheres': 'T32', 'stalking': 'T33',
        'violencia-psicologica': 'T33', 'desaparecidos': 'T12',
    },
    2024: {
        'homicidio': 'T04', 'latrocinio': 'T05', 'intervencao-policial': 'T10',
        'tentativa-homicidio': 'T22', 'lesao-corporal': 'T22',
        'roubo-total': 'T17', 'roubo-transeunte': 'T16',
        'roubo-residencia': 'T16', 'roubo-comercio': 'T16', 'roubo-carga': 'T17',
        'roubo-veiculo': 'T13', 'furto-veiculo': 'T13',
        'roubo-furto-veiculo': 'T13', 'roubo-celular': 'T14',
        'furto-celular': 'T14', 'roubo-furto-celular': 'T14',
        'estelionato': 'T15', 'estelionato-eletronico': 'T15',
        'estupro-total': 'T30', 'estupro': 'T30',
        'estupro-vulneravel': 'T30', 'assedio-sexual': 'T33',
        'importunacao-sexual': 'T33', 'homicidio-mulheres': 'T23',
        'feminicidio': 'T23', 'lesao-domestica': 'T25',
        'ameaca-mulheres': 'T28', 'stalking': 'T29',
        'violencia-psicologica': 'T29', 'desaparecidos': 'T12',
    },
    2025: {
        'homicidio': 'T03', 'latrocinio': 'T04', 'intervencao-policial': 'T09',
        'tentativa-homicidio': 'T23', 'lesao-corporal': 'T23',
        'roubo-total': 'T17', 'roubo-transeunte': 'T16',
        'roubo-residencia': 'T16', 'roubo-comercio': 'T16', 'roubo-carga': 'T17',
        'roubo-veiculo': 'T12', 'furto-veiculo': 'T12',
        'roubo-furto-veiculo': 'T12', 'roubo-celular': 'T13',
        'furto-celular': 'T13', 'roubo-furto-celular': 'T13',
        'estelionato': 'T19', 'estelionato-eletronico': 'T19',
        'estupro-total': 'T34', 'estupro': 'T34',
        'estupro-vulneravel': 'T34', 'assedio-sexual': 'T37',
        'importunacao-sexual': 'T37', 'homicidio-mulheres': 'T24',
        'feminicidio': 'T24', 'lesao-domestica': 'T28',
        'ameaca-mulheres': 'T29', 'stalking': 'T30',
        'violencia-psicologica': 'T30', 'desaparecidos': 'T11',
    },
}

# Tabelas especiais que não seguem o padrão de cinco colunas por modalidade.
COLUMN_OVERRIDE = {
    (2023, 'intervencao-policial'): 9,
    (2024, 'homicidio'): 2,
    (2024, 'latrocinio'): 2,
    (2024, 'intervencao-policial'): 10,
    (2025, 'intervencao-policial'): 9,
    (2023, 'violencia-psicologica'): 5,
}


def build_sheet_index(ws) -> dict[str, tuple]:
    rows = list(ws.values)
    state_names = {name for name, _ in STATES.values()}
    index = {}
    for row in rows:
        for candidate in row[:2]:
            # Algumas edições exibem duas ou três notas: "Ceará (6) (7)".
            key = re.sub(r'(\s*\(\d+\))+\s*$', '', str(candidate).strip()) if candidate is not None else ''
            if key in state_names or key == 'Brasil':
                index[key] = row
                break
    return index


def record(count, rate, edition):
    n = to_number(count)
    t = to_number(rate)
    if n is None or t is None or n < 0 or t < 0:
        return None
    return {'n': round(n), 't': round(t, 5), 'src': edition}


def get_metric_older(wbs, mid, year, main_col):
    edition = YEARS_EDITION[year]
    sheet = TAB_BY_EDITION[edition][mid]
    col = COLUMN_OVERRIDE.get((edition, mid), main_col)
    values = build_sheet_index(wbs[edition][sheet])
    assert len(values) >= 25, (edition, mid, len(values))
    all_records = {}
    for uf, name in [('BR', 'Brasil')] + [(uf, x[0]) for uf, x in STATES.items()]:
        row = values.get(name)
        if row is None:
            raise ValueError(f'{edition} {sheet} {mid}: UF não encontrada: {name}')
        # Para 2021–2023 usamos a PRIMEIRA coluna de cada par anual.
        # Ex.: Anuário 2023 traz 2021 / 2022; Anuário 2025 traz 2023 / 2024.
        value = record(row[col], row[col + 2], edition)
        if value:
            all_records[uf] = value
    return all_records


def load_mvi_extended(ws):
    """Série oficial 2012-25 de T02, inclusive cinco linhas regionais."""
    rows = list(ws.values)
    row_years = rows[6]
    out = {}
    names = {'Brasil': 'BR', **{name: uf for uf, (name, _) in STATES.items()},
             **{f'Região {name}': f'REG:{name}' for name in REGIONS}}
    for row in rows[8:]:
        key = names.get(str(row[0]).strip())
        if not key:
            continue
        points = {}
        for idx in range(1, 15):
            y = int(row_years[idx])
            points[str(y)] = record(row[idx], row[idx + 14], 2026)
        out[key] = {y: rec for y, rec in points.items() if rec}
    assert len(out) == 33, f'Esperados Brasil + 27 UFs + 5 regiões; encontrados {len(out)}'
    return out


def aggregate(metrics, key, members, year):
    """Regiões: soma de ocorrências / soma de denominadores das UFs válidas."""
    mid = key
    denominator = next(item[5] for item in METRICS if item[0] == mid)
    baseline = {'habitantes': ('roubo-total', 'mvi'),
                'mulheres': ('ameaca-mulheres', 'lesao-domestica'),
                'veículos registrados': ('roubo-furto-veiculo', 'furto-veiculo')}[denominator]
    total_count = 0
    total_base = 0
    used = 0
    for uf in members:
        rec = metrics[mid].get(uf, {}).get(str(year))
        if not rec:
            continue
        base = None
        for base_mid in baseline:
            b = metrics[base_mid].get(uf, {}).get(str(year))
            if b and b['n'] is not None and b['t'] > 0:
                base = b['n'] * 100000 / b['t']
                break
        if base is None:
            continue
        total_count += rec['n']
        total_base += base
        used += 1
    if not used or total_base <= 0:
        return None
    return {'n': total_count, 't': round(100000 * total_count / total_base, 5),
            'c': used, 'total': len(members)}


def extract_history():
    current = json.loads(SOURCE.read_text(encoding='utf-8'))
    wbs = {y: openpyxl.load_workbook(f'/tmp/fbsp-anuario-{y}.xlsx', read_only=True, data_only=True)
           for y in (2023, 2024, 2025, 2026)}
    assert set(TAB_BY_EDITION[2023]) == {m[0] for m in METRICS} - {'mvi'}
    assert set(TAB_BY_EDITION[2024]) == set(TAB_BY_EDITION[2023])
    assert set(TAB_BY_EDITION[2025]) == set(TAB_BY_EDITION[2023])
    metrics = {'mvi': load_mvi_extended(wbs[2026]['T02'])}
    for mid, _, _, _, col, _, _, _ in METRICS:
        if mid == 'mvi':
            continue
        metrics[mid] = {uf: {} for uf in ['BR', *STATES]}
        for year in (2021, 2022, 2023):
            vals = get_metric_older(wbs, mid, year, col)
            for uf, entry in vals.items():
                metrics[mid][uf][str(year)] = entry
        for uf in ['BR', *STATES]:
            rec = current['data'][mid][uf]
            for year in (2024, 2025):
                suffix = str(year)[2:]
                if rec[f'n{suffix}'] is not None and rec[f't{suffix}'] is not None:
                    metrics[mid][uf][str(year)] = {'n': rec[f'n{suffix}'], 't': rec[f't{suffix}'], 'src': 2026}

    for mid in metrics:
        # MVI já tem séries regionais oficiais da T02; outras são agregadas.
        for region in REGIONS:
            geo = f'REG:{region}'
            if mid == 'mvi':
                for year, entry in metrics[mid][geo].items():
                    entry['c'] = sum(year in metrics[mid][uf] for uf, (_, r) in STATES.items() if r == region)
                    entry['total'] = sum(r == region for _, r in STATES.values())
            else:
                group = [uf for uf, (_, r) in STATES.items() if r == region]
                metrics[mid][geo] = {str(year): rec for year in range(2021, 2026)
                                     if (rec := aggregate(metrics, mid, group, year))}
        others = [uf for uf, (_, r) in STATES.items() if r in OTHER_REGIONS]
        if mid == 'mvi':
            # Não há uma média das taxas: bases regionais são somadas.
            result = {}
            for year in range(2012, 2026):
                entries = [metrics[mid][f'REG:{r}'].get(str(year)) for r in OTHER_REGIONS]
                if any(x is None or x['t'] <= 0 for x in entries):
                    continue
                count = sum(x['n'] for x in entries)
                denom = sum(x['n'] * 100000 / x['t'] for x in entries)
                result[str(year)] = {'n': count, 't': round(count * 100000 / denom, 5), 'c': 11, 'total': 11}
            metrics[mid]['GROUP:3REG'] = result
        else:
            metrics[mid]['GROUP:3REG'] = {str(year): rec for year in range(2021, 2026)
                                          if (rec := aggregate(metrics, mid, others, year))}

    # Registros nacionais: expor cobertura de UFs em cada ano.
    for mid in metrics:
        for year, rec in metrics[mid].get('BR', {}).items():
            rec['c'] = sum(year in metrics[mid].get(uf, {}) for uf in STATES)
            rec['total'] = len(STATES)
        for uf in STATES:
            for rec in metrics[mid].get(uf, {}).values():
                rec['c'] = 1
                rec['total'] = 1

    # Garantias: histórico mais recente = exatamente os indicadores já publicados.
    for mid in current['data']:
        for uf in ['BR', *STATES]:
            for year in (2024, 2025):
                r = current['data'][mid][uf]
                n = r[f'n{str(year)[2:]}']
                ours = metrics[mid].get(uf, {}).get(str(year))
                assert (ours['n'] if ours else None) == n, (mid, uf, year, n, ours)
    assert metrics['mvi']['BR']['2012']['n'] == 54694
    assert metrics['mvi']['BR']['2025']['n'] == 40775
    assert [metrics['estelionato']['BR'][str(y)]['n'] for y in (2021, 2022, 2023, 2024, 2025)] == [1312964, 1816438, 2000960, 2193122, 2261055]
    assert metrics['roubo-total']['BR']['2021']['n'] == 979644
    assert metrics['estupro-total']['BR']['2022']['n'] == 78887
    assert metrics['homicidio']['BR']['2022']['n'] == 39881
    assert metrics['latrocinio']['BR']['2022']['n'] == 1243

    out = {
        'years': list(range(2012, 2026)),
        'normalYears': [2021, 2022, 2023, 2024, 2025],
        'editionsByYear': {'2012–2020': 2026, '2021': 2023, '2022': 2024,
                           '2023': 2025, '2024': 2026, '2025': 2026},
        'source': 'Fórum Brasileiro de Segurança Pública · Anuários 2023–2026',
        'data': metrics,
    }
    TARGET.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print('Histórico salvo:', TARGET, TARGET.stat().st_size, 'bytes')
    for mid, geo in metrics.items():
        br = geo['BR']
        counts = [sum(str(y) in geo.get(uf, {}) for uf in STATES) for y in range(2021, 2026)]
        print(f'{mid:<26} anos BR: {min(map(int, br))}–{max(map(int, br))} · cobertura 2021–25: {counts}')


if __name__ == '__main__':
    extract_history()
