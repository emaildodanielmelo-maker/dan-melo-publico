# Bússola Política — por @danielmelo_eu

Teste educativo de posicionamento político em três eixos (economia, costumes e instituições), com 19 correntes de referência explicadas e um card para os Stories. Roda inteiro no navegador: **sem IA, sem servidor, sem cadastro e sem coleta de dados.**

**Acessar online:** https://danmelo.com.br/bussola-politica/

## Arquivos

- `index.html` — a aplicação completa (interface, perguntas, glossário, cálculo e card).
- `og-image.png` — imagem de prévia para links no WhatsApp e nas redes.
- `METODOLOGIA.md` — algoritmo, critérios de isonomia, testes e limitações.
- `MUDANCAS.md` — o que mudou da versão anterior e por quê.
- `test_smoke.py` — teste automatizado (opcional, para quem for manter o código).

## Rodar no seu computador

Baixe a pasta (**Code → Download ZIP** no repositório) e abra o `index.html` no navegador. Não precisa instalar nada. Aberto como arquivo local, o card dos Stories mostra "link na bio" no lugar do endereço.

Para rodar o teste automatizado: `pip install playwright && playwright install chromium`, depois `python test_smoke.py`.

## Privacidade

O progresso fica só no navegador de quem responde (`localStorage`). "Refazer teste" apaga tudo. O card e o relatório são gerados no próprio aparelho.

## Percebeu algum viés?

Conte no Instagram [@danielmelo_eu](https://www.instagram.com/danielmelo_eu/). A ferramenta é revisada com base nesses retornos.
