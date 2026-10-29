# Bússola Política — metodologia (versão 3.0)

Criado por **@danielmelo_eu**. Ferramenta educativa, sem IA e sem coleta de dados.

## 1. Princípios

- **Isonomia:** nenhum lado é favorecido pela redação, pela ordem, pelas cores, pelas correntes de referência ou pelas explicações.
- **Três dimensões independentes:** economia (`eco`), costumes (`soc`) e instituições (`inst`).
- O eixo institucional **não** entra na régua esquerda–direita, porque defender ou limitar autoridade não é exclusividade de um lado.
- As notas são similaridades com perfis de referência editoriais. **Não são probabilidades.**
- Tudo roda localmente em JavaScript, sem IA e sem envio de dados.

## 2. Questionário: 24 pares de posições

Cada pergunta apresenta **duas posições (A e B)**, cada uma escrita com o melhor argumento de quem a defende. Quando uma posição tem um custo ("mesmo que..."), a outra também tem o seu. Esse formato, de escolha forçada entre duas afirmações, evita o viés de quem tende a concordar com qualquer frase. É o mesmo princípio usado em tipologias como a do Pew Research Center.

| Eixo | Polo − | Polo + | Itens |
|---|---|---|---|
| Economia | Estado | Mercado | impostos, estatais/concessões, trabalho, saúde e educação, gasto público, comércio exterior, meio ambiente × produção, preços e regulação |
| Costumes | Progressista | Conservador | famílias, aborto, drogas, armas, laicidade, escola e gênero, cotas, ritmo das mudanças |
| Instituições | Garantias | Autoridade | crises, poder da polícia, corrupção × garantias, remoção de conteúdo, protestos, regulação da mídia, presidente × instituições, vigilância |

**Balanceamento:** em cada eixo, a posição A aponta para o polo "+" em exatamente 4 perguntas e para o polo "−" nas outras 4. As perguntas são intercaladas entre os eixos.

**Eixo institucional não partidário:** algumas posições de autoridade são hoje mais associadas à direita (mais poder à polícia, vigilância, presidente enfrentando tribunais). Outras são mais associadas à esquerda (regular a mídia, remover conteúdos). A corrupção e os protestos foram formulados de modo que pessoas dos dois campos já defenderam cada lado em algum momento.

**Contextos:** cada pergunta traz um exemplo com fatos verificáveis (leis, decisões do STF, referendos), apresentando o debate sem tomar partido.

### Escala

| Resposta | Valor orientado |
|---|---:|
| Muito mais perto de A | +2 × polo de A |
| Um pouco mais perto de A | +1 × polo de A |
| No meio / concordo em parte com as duas | 0 |
| Um pouco mais perto de B | −1 × polo de A |
| Muito mais perto de B | −2 × polo de A |
| Não sei / prefiro não opinar | **fora do cálculo** |

"Não sei" é separado de "No meio". Na versão anterior, os dois casos viravam 0 e se confundiam.

`eixo = 50 × média(valores orientados)` → de −100 a +100. Com menos de 3 respostas válidas, o eixo é sinalizado como pouco informativo.

## 3. Padrão de cada eixo (moderação × combinação)

Para não confundir "centro" com "posições que se compensam":

- **Combinadas:** pelo menos 2 respostas para cada lado e |eixo| ≤ 40.
- **Moderadas:** média dos valores absolutos menor que 0,8.
- **Alinhadas:** os demais casos.

## 4. Régua esquerda–direita

`geral = peso × economia + (1 − peso) × costumes`

O peso padrão é **50%/50%** (antes era 65% para economia), sem privilegiar nenhuma dimensão. O visitante pode ajustar de 20% a 80%. O teste de sensibilidade mostra a faixa com pesos de 30%, 50% e 70%.

As faixas são simétricas: < −55 esquerda; −55 a −15 centro-esquerda; −15 a +15 centro; +15 a +55 centro-direita; > +55 direita.

## 5. Correntes de referência (19)

`distância² = 0,4 Δeco² + 0,4 Δsoc² + 0,2 Δinst²`
`nota = 10 × exp(−0,5 × distância² / 45²)`

Economia e costumes passam a ter o mesmo peso. O sigma caiu de 65 para 45 para que as notas diferenciem mais.

| Corrente | eco | soc | inst |
|---|---:|---:|---:|
| Socialismo autoritário | −90 | 0 | +85 |
| Anarquismo | −80 | −80 | −90 |
| Socialismo democrático | −75 | −45 | −45 |
| Esquerda nacional-popular | −70 | +10 | +45 |
| Trabalhismo e nacional-desenvolvimentismo | −60 | +35 | −15 |
| Social-democracia | −45 | −30 | −50 |
| Jacobinismo (progressismo autoritário) | −40 | −85 | +80 |
| Democracia cristã | −35 | +60 | −40 |
| Liberalismo social | −20 | −65 | −60 |
| Centrismo | 0 | −5 | −50 |
| Nacionalismo autoritário | +5 | +90 | +90 |
| Economia social de mercado | +25 | +10 | −50 |
| Direita nacional-conservadora | +25 | +85 | +45 |
| Conservadorismo | +30 | +70 | −30 |
| Liberalismo clássico | +65 | −35 | −50 |
| Liberal-conservadorismo | +70 | +50 | −30 |
| Autoritarismo de mercado | +85 | +40 | +85 |
| Libertarianismo | +90 | −50 | −85 |
| Paleolibertarianismo | +90 | +70 | −70 |

**Critério de cobertura:** todas as regiões do mapa têm referências, e há três correntes autoritárias de cada lado (esquerda: socialismo autoritário, esquerda nacional-popular, jacobinismo; direita: nacionalismo autoritário, direita nacional-conservadora, autoritarismo de mercado).

**Ficha de cada corrente (lupa 🔍):** mesmo formato para todas: ideias centrais, origem histórica, no Brasil, o que defensores argumentam, o que críticos apontam, confusão comum e leituras. As referências brasileiras contemporâneas evitam nomes de políticos em atividade, para não transformar o glossário em campanha.

## 6. Dilemas opcionais

São dois dilemas por eixo, e um de cada eixo é exibido. Todos têm 4 opções simétricas (−2, −1, +1, +2), apresentadas de um polo ao outro na mesma ordem. Cada dilema vale o mesmo que uma pergunta.

## 7. Explicações geradas pelas respostas

- **"Por que o resultado ficou assim?"** lista, em cada eixo, as respostas que puxaram para cada lado, usando o resumo da posição escolhida. A mesma regra vale para qualquer lado. Na versão anterior, 12 frases fixas cobriam sobretudo posições de um lado.
- **"Suas combinações"** usa modelos simétricos: eixos combinados, a combinação entre economia e costumes (com a corrente mais próxima no mesmo quadrante) e o eixo institucional (com uma corrente de cada campo).
- O texto da régua é o mesmo para esquerda e direita: "a régua não diz nada sobre democracia e instituições".

## 8. Teste de isonomia (regressão)

Usamos 125 perfis uniformes (cada eixo em −2…+2). Para cada perfil, comparamos a nota da corrente mais próxima com a do perfil espelhado (economia e costumes invertidos, instituições iguais):

| Versão (mesma fórmula, sigma 45) | Diferença média (todos) | Diferença média (perfis democráticos) |
|---|---:|---:|
| Anterior (v2) | 1,41 | 1,72 |
| Atual (v3) | 1,10 | 0,85 |

Exemplos (v3): esquerda máxima 9,2 × direita máxima 8,7; centro-esquerda moderada 9,6 × centro-direita moderada 9,4; autoritário de esquerda 6,7 × autoritário de direita 6,8.

Com 20.000 respostas aleatórias, as faixas ficam simétricas (centro-esquerda 21,6% × centro-direita 21,9%).

**Lacuna conhecida:** o perfil "muito estatista e muito conservador" (−100, +100) tem como referência mais próxima a democracia cristã, com nota 5,6. Seu espelho, o perfil libertário (+100, −100), tem 7,6. Não há tradição consolidada exatamente nesse canto.

## 9. Limitações

1. São 24 perguntas: faltam política externa, federalismo, previdência e outros temas.
2. Redação e coordenadas são escolhas editoriais. Recomenda-se pré-teste com pessoas de posições variadas.
3. Não há validação psicométrica nem amostral.
4. Correntes reais são heterogêneas e mudam com o tempo e o lugar.
5. A orientação do mapa (conservador em cima, mercado à direita) é uma convenção.

## 10. Referências

- Pew Research Center, Political Typology (metodologia de escolha forçada e tipologias): https://www.pewresearch.org/politics/2026/06/10/appendix-b-typology-group-creation-and-analysis/
- Norberto Bobbio, *Direita e Esquerda* (1994).
- Pesquisas de valores do Datafolha, que tratam armas, drogas, pena de morte e homossexualidade como temas de comportamento e valores.
