# O que mudou da v2 para a v3

## 1. Assimetrias encontradas e como foram corrigidas

| # | Assimetria na v2 | Correção na v3 |
|---|---|---|
| 1 | De 11 correntes, 8 ficavam à esquerda na economia, só 2 do lado conservador e **nenhuma** do lado da autoridade. A direita máxima tinha nota 7,1; a esquerda máxima, 8,8. | 19 correntes cobrindo todo o mapa, com 3 autoritárias de cada lado. Novas: liberal-conservadorismo, paleolibertarianismo, direita nacional-conservadora, esquerda nacional-popular, trabalhismo, jacobinismo, nacionalismo autoritário e autoritarismo de mercado. Agora, esquerda máxima 9,2 × direita máxima 8,7. |
| 2 | "Por que o resultado ficou assim?" tinha 12 frases fixas, nenhuma sobre tradição, impostos menores ou costumes conservadores. | Explicações geradas pelas próprias respostas, eixo por eixo, mostrando o que puxou para cada lado, com a mesma regra para todos. |
| 3 | Afirmações conservadoras usavam palavras negativas ("restrições", "proibir"). Os exemplos traziam argumentos do outro lado. As afirmações autoritárias eram tão extremas que quase ninguém concordava. | Formato de duas posições (A × B), cada uma no seu melhor argumento. Os custos aparecem dos dois lados. Os exemplos trazem fatos verificáveis. |
| 4 | Dilema de costumes com 3 de 4 opções puxando para o lado progressista. | Todos os dilemas têm 4 opções simétricas (−2, −1, +1, +2). |
| 5 | A frase para a direita evocava democracia ("não informa sua posição sobre democracia"); a da esquerda tranquilizava ("não significa rejeitar o mercado"). | Texto único e simétrico para os dois lados. |
| 6 | Régua em vermelho (esquerda) e azul (direita), cores partidárias. | As duas pontas têm a mesma cor neutra. |
| 7 | A régua pesava a economia em 65%, uma escolha arbitrária. | O padrão é 50/50, ajustável de 20% a 80%. |
| 8 | Concordar ou discordar de frases soltas favorece quem tende a concordar com tudo. | Escolha entre A e B, com o polo alternado entre as duas posições (4 × 4 por eixo). |
| 9 | O eixo institucional só tinha posições de autoridade associadas a um campo. | Agora inclui regular a mídia e remover conteúdos (mais associadas à esquerda hoje) e mais poder à polícia e vigilância (mais associadas à direita hoje). |
| 10 | "Depende" valia 0 e se confundia com indecisão. | "No meio" e "Não sei" são separados; "Não sei" fica fora da conta. |
| 11 | "Centro" misturava moderação e respostas que se compensam. | Cada eixo mostra se as posições foram alinhadas, moderadas ou combinadas. |
| 12 | Com sigma 65, as notas ficavam todas parecidas (quatro correntes acima de 9). | Sigma 45 e pesos 40/40/20: as notas diferenciam mais. |

**Teste espelhado (mesma fórmula nas duas versões):** a diferença média entre um perfil e seu espelho, entre perfis democráticos, caiu de **1,72 para 0,85**. Detalhes em `METODOLOGIA.md`.

## 2. Temas brasileiros incluídos

Armas, aborto, drogas, cotas, escola e gênero, laicidade, gasto público, comércio exterior, meio ambiente × produção, preços de combustíveis, corrupção × garantias, remoção de conteúdo, regulação da mídia e vigilância.

## 3. Lupa didática 🔍

- 19 fichas de correntes, todas no mesmo formato: ideias centrais, origem histórica, no Brasil, o que defensores argumentam, o que críticos apontam, confusão comum e leituras.
- 19 conceitos explicados, entre eles esquerda e direita (origem em 1789), centro, cada eixo, progressividade, privatização × concessão, laicidade, ações afirmativas, separação de poderes, devido processo, dois modelos de liberdade de expressão e totalitarismo.
- A lupa aparece em cada pergunta (conceitos), nos eixos, na faixa do resultado, no ranking, no mapa e em uma seção "Glossário" acessível antes mesmo do teste.

## 4. Marca @danielmelo_eu

- No topo de todas as telas: ícone do Instagram + "criado por @danielmelo_eu", com link.
- No título da página, nos metadados, no rodapé, no relatório e no card.
- Removido o texto técnico do rodapé ("Para publicar: basta hospedar...") e a palavra "Protótipo".
- Link "Percebeu algum viés? Me conte no Instagram" no resultado.

## 5. Card dos Stories (PNG) refeito do zero

- Todo o conteúdo fica nas zonas seguras do Instagram (y 230–1620), sem nada embaixo do campo "Enviar mensagem".
- Um único sistema de alinhamento de texto, o que elimina sobreposições, notas flutuando e textos colados.
- Assinatura centralizada: "criado por" leve + ícone do Instagram alinhado + @danielmelo_eu.
- Mini-bússola 2D com "Você" e as 3 correntes numeradas. O rótulo "Você" procura sozinho uma posição livre.
- Linha "Faça o seu: [endereço]" (ou "link na bio").
- Textos longos encolhem para caber, em vez de encolher o card inteiro.
- Não depende do `roundRect`, que falhava em iPhones antigos.
- Abre uma prévia com o botão **Compartilhar**, que no celular envia direto ao Instagram, e o botão **Baixar PNG**.

## 6. Outras melhorias

- Bússola 2D interativa no resultado: toque em uma corrente para abrir a ficha.
- Uma pergunta por tela com avanço automático, teclas 1–5 e "continuar de onde parei".
- Prévia de link (og:image) para WhatsApp e redes.
- Relatório .txt com as duas posições de cada pergunta e a resposta dada.
