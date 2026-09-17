# DECISIONS.md — Web

Decisões de frontend e o porquê de cada uma. As decisões de domínio, banco e API
vivem no [repositório da API](https://github.com/CaioCesarOliver/church-management-api/blob/main/DECISIONS.md)
— nada aqui é duplicado de lá, porque duas cópias divergem na primeira semana.

---

## 1. Código em inglês, interface em português

Identificadores, rotas, nomes de arquivo e comentários em inglês. Tudo que o
usuário lê, em português.

Quem usa o sistema é o secretário e o pastor de uma congregação brasileira; quem
mantém o código pode ser qualquer pessoa. A tradução dos enums vive **só** em
`src/lib/labels.ts` — é lá que se adiciona um segundo idioma, sem tocar em
componente nenhum.

---

## 2. Tipos escritos à mão, não gerados

`src/types/api.ts` espelha o contrato da API manualmente, em vez de ser gerado a
partir de um OpenAPI.

**Por quê.** O frontend e o backend foram construídos em paralelo. Um arquivo de
tipos escrito à mão dá um lugar óbvio para olhar, e faz a divergência de contrato
aparecer como **erro de compilação** em vez de surpresa em runtime.

**Custo assumido.** Mudou a API? Alguém precisa lembrar de atualizar aqui. Com os
dois lados em repositórios separados, esse é o ponto de acoplamento mais frágil
do projeto — e é consciente.

---

## 3. Nenhuma cor escrita à mão

Modo escuro está ativo. Todas as cores saem de tokens (`bg-card`,
`text-muted-foreground`, `bg-primary`, `var(--chart-1)`), definidos em
`globals.css` para `:root` e `.dark`.

Um `bg-white` ou `text-black` perdido num componente **é bug**, não estilo: ele
sobrevive à troca de tema e produz texto invisível.

**A exceção:** as cores dos tipos de culto são **dado** — a congregação as
escolhe em Configurações e a API as devolve. Essas são aplicadas inline, e o
fallback é `var(--chart-1)`.

A paleta veio da logo da congregação: branco, laranja e quase-preto. Laranja é
acento que carrega significado (ação primária, item ativo, série do gráfico),
nunca fundo.

---

## 4. Estado sem biblioteca de data fetching

Sem React Query, sem SWR. As telas usam `useEffect` + `useState` chamando as
funções tipadas de `src/lib/api/`.

**Por quê.** O app tem uma dúzia de telas, cada uma com uma ou duas consultas, e
nenhuma precisa de cache compartilhado, revalidação em foco ou mutação otimista
coordenada. Adicionar a biblioteca traria uma camada conceitual inteira para
resolver um problema que não temos.

**Onde isso vai doer.** Se aparecer uma tela que precisa invalidar dados de outra
(hoje só a chamada e o dashboard chegam perto), a decisão deve ser revista antes
de espalhar sincronização manual.

---

## 5. `DataTable` — quatro estados num lugar só

Seis telas de lista reimplementaram o mesmo cabeçalho, o mesmo esqueleto de
carregamento, o mesmo cartão de erro, o mesmo vazio e a mesma paginação. E
divergiram: paddings diferentes, alinhamentos diferentes, comportamentos
diferentes a 400px.

`src/components/data-table.tsx` concentra isso. As colunas são declaradas como
**dado**, não como JSX, então cada tela descreve *o que* mostra e o componente
decide *como*: alinhamento, quais colunas somem no celular (`hideBelow`), onde
fica o controle de ordenação.

**Ordenação sem conflito:** o select escolhe o campo e o clique no cabeçalho
inverte a direção, compartilhando **um** estado. Dois controles independentes
acabariam discordando.

**Exceção:** `meeting-types-tab` não usa o componente. Suas linhas são
arrastáveis (dnd-kit), e forçar isso no genérico deixaria os dois piores.

---

## 6. `DatePicker` — o dia que se perde

Substituiu todos os `<input type="date">`. Três decisões:

**Conversão em horário local, nunca via ISO.** `new Date("2026-09-17")` parseia
como meia-noite **UTC**, que no Brasil (UTC−3) é dia 16; e
`toISOString().slice(0,10)` desfaz para o outro lado. Esse ida-e-volta é
literalmente como um date picker perde um dia. Toda conversão aqui lê os campos
locais do `Date`.

**Drawer no celular, popover no desktop.** Um popover ancorado num campo perto do
rodapé de uma tela pequena termina metade fora da viewport ou atrás do teclado.

**Seletor de mês e ano.** Sem ele, chegar numa data de nascimento de 1962 exige
centenas de cliques em "anterior".

`min`/`max` existem para pares De/Até se restringirem mutuamente — o
`<input type="date">` dava isso de graça, e trocar a garantia por uma mensagem de
validação seria um downgrade.

---

## 7. Configurações como rotas aninhadas, não abas

Seis abas numa linha só não cabem num celular, e não dizem **que tipo** de coisa
cada uma é.

Cada seção é uma rota real (`/settings/users`, `/settings/meeting-types`…): o
botão voltar funciona, o link é compartilhável e o breadcrumb diz onde você está.

A navegação é agrupada em **Congregação**, **Acessos** e **Sistema** — o
agrupamento responde "estou configurando a congregação, um acesso ou a
instalação?" antes de você ler os rótulos. No celular vira um seletor, que não
estoura nem exige rolagem lateral.

---

## 8. Sem `next/font/google`

A tipografia usa a stack do sistema.

`next/font/google` baixa a fonte durante o `next build`, o que torna o build
dependente de acesso à CDN do Google — falha em CI sem rede externa e atrás de
proxy restritivo. Fonte de sistema deixa o build hermético.

---

## 9. Sessão em `localStorage`

O token JWT fica em `localStorage`, lido pelo `api-client` a cada requisição.

**Limitação assumida:** é vulnerável a XSS. A alternativa correta é cookie
`httpOnly` + `SameSite`, o que exige o frontend e a API compartilharem domínio ou
um proxy. Com a API em outro host, `localStorage` é o caminho que funciona sem
infraestrutura adicional. **Revisar antes de tratar dados sensíveis de verdade.**

Qualquer 401 vindo de qualquer lugar dispara um evento que derruba a sessão uma
única vez, em vez de cada tela tratar por conta.
