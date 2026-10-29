"""Extrai a frota total de veículos por UF dos arquivos oficiais da SENATRAN.

Uso: python scripts/extract_frota_senatran.py
As planilhas devem ser baixadas dos endereços citados em SOURCES para /tmp/.
O gerador deliberadamente NÃO preenche períodos ausentes com estimativas.
"""
import json
import unicodedata
from pathlib import Path
from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parents[1]
SOURCES = {
    "2024": ("/tmp/atlas-frota-2024.xlsx", "dezembro", "https://www.gov.br/transportes/pt-br/assuntos/transito/conteudo-Senatran/frota-de-veiculos-2024"),
    "2025": ("/tmp/atlas-frota-2025.xlsx", "dezembro", "https://www.gov.br/transportes/pt-br/assuntos/transito/conteudo-Senatran/frota-de-veiculos-2025"),
    "2025_ytd": ("/tmp/atlas-frota-2025sep.xlsx", "setembro", "https://www.gov.br/transportes/pt-br/assuntos/transito/conteudo-Senatran/frota-de-veiculos-2025"),
    "2026": ("/tmp/atlas-frota-2026.xlsx", "setembro", "https://www.gov.br/transportes/pt-br/assuntos/transito/conteudo-Senatran/frota-de-veiculos-2026"),
}
NAMES = {
    "acre": "AC", "alagoas": "AL", "amapa": "AP", "amazonas": "AM", "bahia": "BA",
    "ceara": "CE", "distrito federal": "DF", "espirito santo": "ES", "goias": "GO",
    "maranhao": "MA", "mato grosso": "MT", "mato grosso do sul": "MS", "minas gerais": "MG",
    "para": "PA", "paraiba": "PB", "parana": "PR", "pernambuco": "PE", "piaui": "PI",
    "rio de janeiro": "RJ", "rio grande do norte": "RN", "rio grande do sul": "RS",
    "rondonia": "RO", "roraima": "RR", "santa catarina": "SC", "sao paulo": "SP",
    "sergipe": "SE", "tocantins": "TO",
}


def norm(value):
    return "".join(c for c in unicodedata.normalize("NFKD", str(value or "").strip().lower()) if not unicodedata.combining(c))


def extract(path):
    book = load_workbook(path, read_only=True, data_only=True)
    sheet = book.worksheets[0]
    values = {}
    for row in sheet.values:
        name = NAMES.get(norm(row[0]))
        if name is None:
            continue
        total = row[1]
        assert isinstance(total, (int, float)) and total > 1000, (path, name, total)
        assert name not in values, (path, name)
        values[name] = int(total)
    book.close()
    assert len(values) == 27, (path, len(values), sorted(values))
    return values


def main():
    output = {"source": "SENATRAN / RENAVAM", "unit": "veículos registrados com placa",
              "note": "Estoque da frota no fim do período. Para ano fechado, dezembro; 2026 parcial, setembro. Não é frota exposta ao crime, e sim cadastrada.",
              "periods": {}, "data": {}}
    for year, (filepath, month, url) in SOURCES.items():
        assert Path(filepath).is_file(), filepath
        values = extract(filepath)
        output["periods"][year] = {"month": month, "source": url, "br": sum(values.values())}
        for uf, fleet in values.items():
            output["data"].setdefault(uf, {})[year] = fleet
        print(year, month, "27 UFs", f'{sum(values.values()):,}', flush=True)
    target = ROOT / "dist" / "frota-senatran.json"
    target.write_text(json.dumps(output, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("Gravado", target)


if __name__ == "__main__":
    main()
