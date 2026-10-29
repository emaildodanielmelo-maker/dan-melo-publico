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

Tudo neste repositório é público, inclusive o histórico. Não coloque chaves, senhas ou dados pessoais.
