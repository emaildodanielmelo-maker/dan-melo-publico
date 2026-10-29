# dan-melo-publico

Soluções e painéis públicos de Daniel Melo. Cada solução fica em sua própria pasta, com README próprio, e funciona de forma independente das demais.

## Soluções

| Solução | Acessar online | Pasta |
| --- | --- | --- |
| Atlas da Segurança Pública — Brasil | [Abrir o painel](https://emaildodanielmelo-maker.github.io/dan-melo-publico/atlas-seguranca-brasil/) | [`atlas-seguranca-brasil/`](atlas-seguranca-brasil/) |
| Bússola Política | [Fazer o teste](https://emaildodanielmelo-maker.github.io/dan-melo-publico/bussola-politica/) | [`bussola-politica/`](bussola-politica/) |

O portfólio com busca e filtro por tema está em https://emaildodanielmelo-maker.github.io/dan-melo-publico/.

## Como usar

- **Só quer acessar?** Use o link "Acessar online" acima. Não precisa instalar nada.
- **Quer baixar e rodar no seu computador?** Clique em **Code → Download ZIP**, extraia e siga as instruções do README da pasta da solução. No Atlas, no Windows, basta dar dois cliques em `ABRIR_ATLAS_WINDOWS.bat` (precisa do Python 3).

## Adicionar uma nova solução

1. Crie uma pasta nova na raiz, com `index.html` (ou uma pasta de publicação) e um `README.md`.
2. Use caminhos relativos (`./arquivo.js`), nunca absolutos (`/arquivo.js`), para o site funcionar numa subpasta.
3. Adicione um cartão (`<article class="card" data-tags="...">`) na `index.html` da raiz e uma linha na tabela acima. Os filtros por tema do portfólio são montados a partir das `data-tags`.

## Arquivos compartilhados

`assets/` guarda a foto (`dan.webp`), o ícone (`icone-32.png`, `icone-180.png`), a imagem de prévia de compartilhamento do portfólio (`og-portfolio.png`) e as fontes do portfólio (`assets/fonts/`, todas sob SIL OFL, licenças em `LICENSES.txt`). As fontes ficam no repositório de propósito: a página não faz pedidos a servidores externos.

`assets/marca-dan.css` aplica a identidade (fontes e o bloco "Criado por Dan Melo") nas soluções. Para usar numa solução nova, inclua `<link rel="stylesheet" href="../assets/marca-dan.css">` e copie o `<aside class="dan-autor">` de uma solução existente.

## Área de assinantes

O conteúdo de assinantes **não** fica neste repositório. Ele vive em outro repositório, privado, e este portfólio só mostra a vitrine (título e descrição) na seção "Área de assinantes" da `index.html`. O modelo do cartão está em comentário nessa seção.

Tudo neste repositório é público, inclusive o histórico. Não coloque chaves, senhas ou dados pessoais. O único contato publicado de propósito é o e-mail profissional do portfólio.
