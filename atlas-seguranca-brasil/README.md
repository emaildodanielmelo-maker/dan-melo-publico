# Atlas da Segurança Pública — Brasil

Painel exploratório da segurança pública brasileira, com **abas exclusivas** e **séries criminais separadas por fonte**. O Anuário FBSP oferece 31 indicadores até 2025 e o SINESP-VDE oferece 30 naturezas nativas desde 2015, até setembro de 2026. O **seletor global de fonte** substitui a base em todas as abas — Panorama, Mapa, Regiões, Histórico e Comparar UFs — sem união de registros criminais das duas instituições.

Fonte principal: https://forumseguranca.org.br/wp-content/uploads/2026/07/anuario-2026.xlsx

Fontes históricas: Anuários Brasileiros de Segurança Pública de **2023, 2024, 2025 e 2026**. Para cada ano histórico, foi utilizada a edição mais recente selecionada para a extração. A série longa de MVI vem da Tabela 02 do Anuário 2026.

Fonte governamental independente: [Dados Nacionais de Segurança Pública (SINESP-VDE), MJSP](https://www.gov.br/mj/pt-br/assuntos/sua-seguranca/seguranca-publica/estatistica/download/dnsp-base-de-dados), planilhas **BancoVDE 2015–2026**, atualizadas em 19/10/2026. A série 2026 chega até setembro e está sujeita a retificações. O SINESP inclui tanto eventos criminais quanto atividades operacionais (p. ex., mandados, apreensões, buscas e atendimentos).

Denominadores oficiais da série SINESP: [IBGE, Projeções Populacionais, Revisão 2024](https://ftp.ibge.gov.br/Projecao_da_Populacao/Projecao_da_Populacao_2024/projecoes_2024_tab1_idade_simples.xlsx), para habitantes e mulheres (2015–2026), e [SENATRAN/RENAVAM — Frota por UF](https://www.gov.br/transportes/pt-br/assuntos/transito/conteudo-Senatran/estatisticas-frota-de-veiculos-senatran), para roubo e furto de veículo (2024, 2025 e 2026 parcial). As taxas somam registros e dividem pelo total da população exposta correspondente, nunca pela média simples das taxas estaduais. As bases IBGE e SENATRAN são denominadores, **não fontes adicionais de crimes**.

## Recortes disponíveis

- Navegação por seis abas exclusivas: Panorama, Mapa e ranking, Regiões, Histórico, Comparar UFs e Fontes e método. Hash URLs preservados; navegação acessível por teclado.
- Panorama, mapa, ranking, regiões e comparação entre UFs: fonte FBSP (31 indicadores, 2024–2025) **ou** SINESP-VDE (30 indicadores, 2024–2025 completos e 2026 janeiro–setembro). Seletor de ano sincronizado, filtros de UF/região e exportações independentes. A variação de 2026 é calculada apenas contra janeiro–setembro de 2025.
- Recorte especial: Nordeste (9 UFs) versus Sul + Sudeste + Centro-Oeste (11 UFs). O Norte (7 UFs) **não entra** no denominador ou numerador desse confronto.
- Matriz temática do confronto, com múltiplos tipos de crimes, e exportação CSV regional.
- Aba **Histórico & Tendências**, com seletor explícito de fonte:
  - **SINESP-VDE:** 30 naturezas governamentais com sua definição original, 2015–2025 em ano completo e 2015–2026 em YTD. Em anual, o acumulado parcial de 2026 fica em cartão separado da linha de anos fechados. O usuário ajusta o mês de corte de janeiro a setembro. Categorias como Homicídio doloso e Feminicídio permanecem separadas; não criamos uma MVI artificial.
  - **FBSP:** 31 indicadores, histórico 2021–2025 e MVI desde 2012, exclusivamente ano completo, sem qualquer enxerto de dados de outra fonte.
  - Ambas: Brasil, cinco regiões, 27 UFs e grupo especial Sul + Sudeste + Centro-Oeste, taxas e totais, linha comparativa, regressão descritiva, radar, CSV.

Na série FBSP, os denominadores de habitantes, mulheres e veículos registrados são reconstituídos de totais e taxas estaduais do próprio Anuário. Na série SINESP, usa-se IBGE e SENATRAN conforme o indicador. Para 2026, o denominador de frota é setembro/2026; para o YTD equivalente de 2025, setembro/2025. Estados sem dados são excluídos do numerador e denominador, com aviso de cobertura parcial; mudanças incompletas não recebem variação percentual nacional. Na série histórica de MVI do FBSP, os dados regionais oficiais da Tabela 02 têm prioridade.

**Indicadores sem taxa de risco:** apreensão de armas e drogas, mandados cumpridos, tráfico de drogas (fortemente dependente de fiscalização), pessoas localizadas, resgates, incêndios, alvarás e vistorias são apresentados como **volumes operacionais**, sem direção automática de desempenho. Mortes e suicídios de agentes exigiriam efetivo profissional; roubo de carga e roubo a bancos carecem de exposição setorial confiável. Para esses casos, a série SINESP mostra apenas o total, sem taxa inventada ou ranking de “mais violência”. A frota histórica de 2015–2023 ainda não está integrada: nesses anos, roubos/furtos de veículo têm total absoluto, mas não taxa por frota. São limites assumidos, não zeros.

O diagnóstico de tendência usa regressão linear das taxas anuais na **janela consecutiva final com cobertura territorial completa**, exigindo pelo menos quatro anos. Se um ano anterior tinha menos UFs, ele continua visível no gráfico e tabela, mas é excluído do cálculo da tendência. A interface identifica os anos efetivamente utilizados e a variação acumulada compara somente as extremidades dessa janela. Séries oscilantes ou sem cobertura comparável recebem classificações próprias. **Isso descreve o passado: não é previsão, nem prova de causalidade.** Subnotificação, mudança de definições legais e ampliação do registro são limitações relevantes.

Na comparação YTD, o diagnóstico de tendência usa **totais acumulados nos mesmos meses**, sempre dentro da própria série SINESP. As taxas mostradas como apoio usam as projeções IBGE do ano correspondente, inclusive 2026. Diferenças na cobertura territorial bloqueiam o cálculo de variação.

A classificação do SINESP separa `Feminicídio` de `Homicídio doloso` (confira as [notas metodológicas oficiais](https://www.gov.br/mj/pt-br/assuntos/sua-seguranca/seguranca-publica/estatistica/dados-nacionais-1/base-de-dados-e-notas-metodologicas-dos-gestores-estaduais-sinesp-vde-2022-e-2023)). A nova série SINESP nativa não recompõe os conceitos agregados do FBSP; seleciona os eventos conforme publicados pelo MJSP. Zeros reportados são mantidos, mas podem ser zeros estruturais de alimentação — a presença da linha não garante qualidade estatística.

Verificação rápida sem navegador: `node denominator-smoke.cjs`, `node regional-smoke.cjs` e `node history-smoke.cjs`.

Para regenerar `dist/historico.json`, salve as planilhas públicas como `/tmp/fbsp-anuario-2023.xlsx`, `/tmp/fbsp-anuario-2024.xlsx`, `/tmp/fbsp-anuario-2025.xlsx` e `/tmp/fbsp-anuario-2026.xlsx`, então execute `python scripts/extract_history.py`. O script valida totais nacionais de controle e a reconciliação do recorte 2024–2025 com `dist/dados.json`.

Para regenerar `dist/sinesp-oficial.json`, baixe as planilhas do MJSP `BancoVDE {ano}.xlsx` para `/tmp/atlas-vde-{ano}.xlsx` (2015 a 2026) e execute `python scripts/extract_sinesp_official.py`. A extração soma as parcelas de um mesmo evento/UF/mês e seleciona a abrangência `Estadual` (não soma fontes PF/PRF). Vazios permanecem nulos. Para a população, use a planilha IBGE como `/tmp/atlas-pop-projecoes-2024.xlsx` e execute `python scripts/extract_population_ibge.py`. Os arquivos antigos `dist/ytd-sinesp.json` e `scripts/extract_ytd.py` não são usados pela interface atual e permanecem apenas como registros do método anterior.

Para regenerar `dist/frota-senatran.json`, baixe as quatro planilhas públicas de frota por UF e tipo (dezembro/2024, dezembro/2025, setembro/2025, setembro/2026), salve-as como `/tmp/atlas-frota-2024.xlsx`, `/tmp/atlas-frota-2025.xlsx`, `/tmp/atlas-frota-2025sep.xlsx` e `/tmp/atlas-frota-2026.xlsx`, e execute `python scripts/extract_frota_senatran.py`. O extrator valida todas as 27 UFs, o total de cada planilha e preserva a URL original no JSON gerado.

A atualização das duas fontes requer executar os respectivos extratores e publicar a nova versão do Site (não há ingestão automática ao abrir a página).

## Camada de simulação (aba Simulações)

Gerada por `python scripts/build_simulation.py`, grava **somente** `dist/simulacao.json`. As bases brutas (`sinesp-oficial.json`, `pop-ibge.json`, `dados.json`, `historico.json`) são lidas em modo leitura; o hash SHA-256 de cada uma é gravado no resultado e conferido por `node sim-smoke.cjs`. Parâmetros externos ficam em `scripts/simulacao_parametros.json`, cada um com fonte e ressalva.

A aba é um **explorador interativo** (`dist/sim.js`), com quatro simulações calculadas no navegador a partir das bases brutas, sem gravar nada: (1) mortes que não entram na conta — base de mortes (homicídio, CVLI, CVLI + intervenção) e parcela das mortes a esclarecer (0–100%, referência Ipea 41%), anos completos ou mesmo período até o mês de corte, cascata por estado ou por tipo de morte e alertas de quebra de série; (2) feminicídio padronizado pela proporção nacional de cada ano ou por valor fixo; (3) violência doméstica com limiar de registro atípico e regra de ajuste; (4) ordens de grandeza nacionais de subnotificação. Todo valor simulado é marcado como estimativa e acompanhado de um quadro “O que este número significa” com método, ressalvas e fontes. A versão estática anterior da aba está em `_backup_v6_original/sim_v1/`.

Conteúdo do JSON: decomposição por UF da variação de homicídios do Nordeste (cascata); cinco definições de letalidade (homicídio, CVLI, CVLI + intervenção, + 41% e + 100% das mortes a esclarecer); alertas de quebra de série; tendência 2017–2025 comparada ao Brasil; homicídio de mulheres × feminicídio com classificação padronizada (44,39%); violência doméstica com registro atípico e imputação pela mediana regional; ordens de grandeza nacionais de subnotificação (Ipea TD 2880; Visível e Invisível 2025). Cenários são exploratórios e não substituem dados oficiais.

Cópia de segurança da versão anterior: `_backup_v6_original/` (com `raw_sha256.txt`). Planilha original do Anuário 2026: `fontes/FBSP_anuario-2026.xlsx`.

## Correções estimadas na aba Histórico

`dist/corrections.js` adiciona a tag **“Aplicar correção · estimativa”** à aba Histórico. Ela aparece só nos indicadores em que há ajuste com método publicado, que também ganham a marca “correção” no radar de tendências:

| Fonte | Indicador | Correção | Base do parâmetro |
| --- | --- | --- | --- |
| SINESP | Homicídio doloso | + 41% (ou 100%, teto) das mortes a esclarecer | Ipea/FBSP, Atlas da Violência 2026 |
| SINESP / FBSP | Estupro, estupro de vulnerável, total | registros ÷ 8,5% (somente Brasil) | Ipea, TD 2880 |
| FBSP | Feminicídio | homicídios de mulheres × proporção nacional do ano | FBSP, Tabelas 21 e 28 |
| FBSP | Lesão em violência doméstica | estado com taxa < 25% da nacional recebe a mediana regional | FBSP, Tabela 24 |

Feminicídio no SINESP e homicídio/MVI no FBSP mostram o motivo e um botão que abre a correção na outra fonte. A correção desenha uma linha pontilhada laranja e um quadro com o que o número significa, como é estimado, ressalvas e fontes; cartões, tabela e tendência continuam com o dado oficial.
