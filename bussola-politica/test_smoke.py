"""Teste automatizado da Bússola Política (opcional).
Requer: pip install playwright && playwright install chromium
Uso: python test_smoke.py
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

PAGE = (Path(__file__).parent / 'index.html').resolve().as_uri()

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width': 1280, 'height': 900})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(PAGE)

    # 1) Balanceamento: 8 itens por eixo, 4 com A no polo "+" e 4 no polo "−"
    bal = page.evaluate("""() => ['eco','soc','inst'].map(d => {
        const qs = QUESTIONS.filter(q => q.d === d);
        return [qs.length, qs.filter(q => q.aPole === 1).length];
    })""")
    assert bal == [[8, 4], [8, 4], [8, 4]], bal

    # 2) Dilemas simétricos
    sym = page.evaluate("Object.values(DILEMMAS).every(D => D.choices.map(c => c[1]).join() === '-2,-1,1,2')")
    assert sym

    # 3) Teste espelhado: esquerda máxima x direita máxima
    mirror = page.evaluate("""() => {
        const prof = (e,s,i) => QUESTIONS.map(q => 2 - ({eco:e,soc:s,inst:i}[q.d]) * q.aPole);
        const top = a => { state.answers = a; state.refined = false; return compare(vector())[0].score; };
        return [top(prof(-2,-2,-2)), top(prof(2,2,-2)), top(prof(-1,-1,-1)), top(prof(1,1,-1))];
    }""")
    print('espelho (esq. máx, dir. máx, esq. mod., dir. mod.):', [round(x, 1) for x in mirror])
    assert abs(mirror[0] - mirror[1]) < 1 and abs(mirror[2] - mirror[3]) < 1

    # 4) Fluxo completo pela interface
    page.evaluate("localStorage.clear()")
    page.reload()
    page.click('#start')
    for k in range(24):
        page.locator('#q-scale button').nth(k % 5).click()
        page.wait_for_timeout(320)
    page.wait_for_selector('#refinement:not(.hide)')
    page.click('#skip-dilemmas')
    print('faixa:', page.text_content('#result-band'))
    assert page.locator('.axis').count() == 3
    assert page.locator('#compass svg').count() == 1

    # 5) Lupa e card
    page.locator('.rank .lupa').first.click()
    assert page.locator('#info[open]').count() == 1
    page.locator('#info [data-close]').click()
    page.click('#export-story')
    src = page.get_attribute('#card-img', 'src')
    assert src and src.startswith('data:image/png')

    page.set_viewport_size({'width': 390, 'height': 844})
    assert page.evaluate('document.documentElement.scrollWidth') <= 390
    assert not errors, errors
    print('OK')
    browser.close()
