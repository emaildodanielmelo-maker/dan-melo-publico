# dan-melo-publico

Soluções e painéis públicos de Daniel Melo. Cada solução fica em sua própria pasta, com README próprio, e funciona de forma independente das demais.

## Soluções

| Solução | Acessar online | Pasta |
| --- | --- | --- |
| Atlas da Segurança Pública — Brasil | [Abrir o painel](https://danmelo.com.br/atlas-seguranca-brasil/) | [`atlas-seguranca-brasil/`](atlas-seguranca-brasil/) |
| Bússola Política | [Fazer o teste](https://danmelo.com.br/bussola-politica/) | [`bussola-politica/`](bussola-politica/) |

O portfólio com busca e filtro por tema está em https://danmelo.com.br/.

## Como usar

- **Só quer acessar?** Use o link "Acessar online" acima. Não precisa instalar nada.
- **Quer baixar e rodar no seu computador?** Clique em **Code → Download ZIP**, extraia e siga as instruções do README da pasta da solução. No Atlas, no Windows, basta dar dois cliques em `ABRIR_ATLAS_WINDOWS.bat` (precisa do Python 3).

## Adicionar uma nova solução

1. Crie uma pasta nova na raiz, com `index.html` (ou uma pasta de publicação) e um `README.md`.
2. Use caminhos relativos (`./arquivo.js`), nunca absolutos (`/arquivo.js`), para o site funcionar numa subpasta.
3. Adicione um cartão (`<article class="card" data-tags="...">`) na `index.html` da raiz e uma linha na tabela acima. Os filtros por tema do portfólio são montados a partir das `data-tags`.
4. Marque os links do cartão novo com `data-umami-event` (veja "Estatísticas"). Todo item novo do site precisa ser mapeado.

## Arquivos compartilhados

`assets/` guarda a foto (`dan.webp`), o ícone (`icone-32.png`, `icone-180.png`), a imagem de prévia de compartilhamento do portfólio (`og-portfolio.png`) e as fontes do portfólio (`assets/fonts/`, todas sob SIL OFL, licenças em `LICENSES.txt`). As fontes ficam no repositório de propósito: a página não faz pedidos a servidores externos.

`assets/marca-dan.css` aplica a identidade (fontes e o bloco "Criado por Dan Melo") nas soluções. Para usar numa solução nova, inclua `<link rel="stylesheet" href="../assets/marca-dan.css">` e copie o `<aside class="dan-autor">` de uma solução existente.

## Área de assinantes

O conteúdo de assinantes **não** fica neste repositório. Ele vive em outro repositório, privado, e este portfólio só mostra a vitrine (título e descrição) na seção "Área de assinantes" da `index.html`. O modelo do cartão está em comentário nessa seção.

A lista de espera (mentoria e comunidade) é um formulário do Tally, aberto pelo botão "Quero entrar na lista" da `index.html`. As respostas ficam na conta do Tally, não neste repositório.

Tudo neste repositório é público, inclusive o histórico. Não coloque chaves, senhas ou dados pessoais. O único contato publicado de propósito é o e-mail profissional do portfólio.

## Estatísticas

O portfólio usa o [Umami](https://cloud.umami.is) (sem cookies, visitas anônimas). O script está no `<head>` da `index.html`. As ferramentas (Atlas e Bússola) **não** têm o script, porque prometem não coletar dados: o que se mede delas são os cliques nos cartões do portfólio.

Para medir um clique, acrescente ao link `data-umami-event="nome"` e, se quiser separar por detalhe, `data-umami-event-chave="valor"`. Nomes em português, com hífens:

| Evento | Detalhes (`chave = valor`) |
| --- | --- |
| `clicou-ferramenta` | `ferramenta` (atlas, bussola), `acao` (abrir, codigo, metodologia) |
| `clicou-lista-de-espera` | `local` (clique que abre o formulário do Tally) |
| `clicou-ir-para-lista` | `local` (menu, hero, mentoria): clique que rola até a seção da lista |
| `clicou-whatsapp` | `local` (flutuante, lista) |
| `clicou-contato` | `canal` (instagram, linkedin, github, email), `local` |
| `clicou-menu`, `clicou-saber-mais`, `clicou-ver-ferramentas` | `destino` ou `local` |
| `filtrou-ferramentas`, `usou-busca` | `tema` (nunca o texto digitado) |
| `viu-secao` | `secao` (uma vez por seção vista) |

Ao criar uma solução nova, marque os links dela com `clicou-ferramenta` (`ferramenta` = nome da pasta) e adicione a seção nova em `viu-secao`, na lista de ids do script no fim da `index.html`.

Para saber de onde vem o público, use links com UTM nas redes, por exemplo `https://danmelo.com.br/?utm_source=instagram&utm_medium=bio`.
