# Reel quadro desenhado

Um lápis (ou uma mão) escreve a copy em letra manuscrita e desenha, na hora em que cada palavra é falada, o que a narração está dizendo. O motor desenha cada quadro por código e mixa voz, trilha suave e som de escrita. O resultado é um mp4 de 30 segundos, pronto para o Reels.

## Quando usar

Pedidos de vídeo explicativo desenhado, de lousa, de quadro branco ou de giz, com narração. Serve para explicar um conceito em passos, mostrar antes e depois, apresentar um problema e uma solução, ou fazer um tutorial leve. Para animações de interface com legendas em blocos (sem desenho à mão), use a skill reel-motion-narrado.

## Fluxo

1. **Entender o pedido.** Tema, público (aqui, empreendedores), objetivo (atrair leads qualificados), tipo de quadro e ferramenta. Se faltar algo, declare a suposição em uma frase e siga. Padrões: papel com lápis (`"board": "paper"`, `"pen": "pencil"`). Alternativas: lousa de giz (`chalk_green` ou `chalk_black`) e mão ilustrada (`"pen": "hand"`).
2. **Escrever a narração.** Seis falas, uma por cena, de 50 a 80 caracteres cada, somando cerca de 20 a 22 segundos de voz. Uma ideia por fala. Gancho na primeira, chamada para salvar, comentar ou seguir na última.
3. **Entregar a narração primeiro quando a pessoa pedir em etapas** (ou sempre que o texto for novo e importante). Escreva o spec só com `narration` por cena e rode `python scripts/build_reel.py spec.json --work /tmp/q --out /mnt/user-data/outputs/narracao.mp3 --narration-only`. Apresente o mp3 com `present_files`, mostre o texto das falas e espere a aprovação antes de desenhar.
4. **Montar o storyboard no spec.** Para cada fala, de quatro a seis elementos, na ordem em que serão ditos, cada um com `when` (a palavra que dispara o desenho). Veja `references/elementos.md` e `assets/exemplo-lapis-papel.json`.
5. **Conferir antes de renderizar.** `python scripts/build_reel.py spec.json --work /tmp/q --sheet --sheet-times ...` com instantes a cerca de 1 s antes de cada apagada (fim de cada cena menos 1,0 s) e dois ou três instantes de meio de cena. Abra o `sheet.png` com `view`. Confira composição, texto cortado, sobreposição e se nada passa de y 1500. Se o motor imprimir "cena N apertada (fator abaixo de 0,7)", tire elementos ou aumente `min_len` da cena.
6. **Renderizar em segundo plano.** `python scripts/build_reel.py spec.json --work /tmp/q --out /mnt/user-data/outputs/<nome>.mp4 --detach`. Acompanhe com `tail /tmp/q/render.log` em chamadas separadas, com `sleep` de até 200 segundos (leva de 3 a 4 minutos), até aparecer "pronto". Sem `--detach` o processo morre com a chamada e deixa um mp4 corrompido.
7. **Validar e entregar.** `ffprobe` deve mostrar 1080x1920, h264, duração igual a `duration`. Gere uma tira de quadros e olhe. Entregue com `present_files`.

## Como pensar o storyboard

- **Uma ideia, um desenho.** O que a voz diz vira imagem: problema vira boneco confuso com ponto de interrogação, página poluída vira print com fita, saída do cliente vira seta e porta, solução vira boneco feliz, passo vira número grande e caixa.
- **Escreva só a copy que sustenta a imagem.** Títulos curtos (2 a 4 palavras, tamanho de 120 a 200), um destaque em cor `accent` por cena, no máximo.
- **Gatilhos por palavra.** `"when": "entende"` desenha quando a voz diz "entende". Escolha uma palavra que apareça uma vez na fala; use `palavra#2` para a segunda ocorrência.
- **Uma mão só.** Os elementos saem em sequência; os mais caros em tempo são bonecos (cerca de 1 s) e textos longos (0,04 s por letra).
- **Tamanho.** Bonecos com `s` entre 1,1 e 1,4, ícones com `s` de 90 a 150, textos de apoio de 80 a 130. Tudo que importa entre y 300 e y 1500.
- **Estrutura que funciona em 30 s.** Gancho (problema visível), promessa ("3 coisas"), três passos numerados, chamada final com ícone de salvar e o @ escrito à mão.

## Regras de conteúdo (marca da Jane)

- Escrever "Inteligência Artificial" por extenso, na fala e na tela, nunca "IA".
- Sem travessão longo, sem caixa alta para ênfase, sem emojis e sem perguntas retóricas.
- Nada de estatística ou exemplo inventado como se fosse dado real. Exemplos ilustrativos são aceitáveis, desde que pareçam exemplos.
- Fala de colega explicando, sem linguagem de coach.
- Fechar com o perfil escrito à mão (`@jane.iaexpert`) e o nome na fala.

## Voz

Narrador masculino pt-BR (Piper "faber"), baixado na primeira execução (cerca de 67 MB do GitHub) e guardado em cache. É sintético; avise a pessoa. Para mais naturalidade, grave a narração fora (por exemplo com o conector Higgsfield ou com voz humana), salve um wav por cena e aponte no spec: `"voice": {"wavs": ["l0.wav", "l1.wav"]}`. Se as falas passarem do tempo, o motor acelera a voz em até 18 por cento; o melhor é encurtar o texto.

## Entrega

Salve em `/mnt/user-data/outputs/`, chame `present_files` e responda em português, em tom de conversa. Diga o que o vídeo mostra, o que foi assumido (quadro, ferramenta, voz) e as limitações honestas: a mão e o lápis são ilustrações (não filmados), os traços têm cara de marcador mesmo com o lápis, e o áudio não foi ouvido, só conferido por volume (cerca de menos 15 LUFS) e por quadros.

## Armadilhas

Leia `references/licoes.md` se algo sair estranho (cores trocadas, arquivo grande, render interrompido, escrita acelerada). Para a lista completa de elementos e campos, `references/elementos.md`.

## Dependências

`pip install skia-python piper-tts scipy numpy pillow --break-system-packages` e `ffmpeg` no sistema. A rede só é necessária na primeira vez, para baixar a voz.