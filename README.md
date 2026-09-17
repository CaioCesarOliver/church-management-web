# Church Management — Web

Cliente web do sistema de gestão para igrejas: membros, cultos, chamada,
visitantes e métricas para o ofício pastoral.

> Código, rotas e identificadores em inglês. Interface em português.

---

## Stack

| Camada | Escolha |
| --- | --- |
| Framework | Next.js 16 (App Router) + TypeScript |
| Estilos | Tailwind CSS 4 |
| Componentes | shadcn/ui (new-york) |
| Gráficos | Recharts |
| Tema | next-themes — claro, escuro e sistema |
| Datas | react-day-picker + date-fns (pt-BR) |
| Drag and drop | dnd-kit |

## Setup

Pré-requisitos: **Node.js ≥ 20.9** e **pnpm 10**.

```bash
pnpm install
cp .env.example .env.local   # aponte NEXT_PUBLIC_API_URL para a API
pnpm dev                     # http://localhost:3000
```

A API vive em repositório separado:
[`church-management-api`](https://github.com/CaioCesarOliver/church-management-api).
Suba-a antes — sem ela as telas carregam mas não têm dados.

### Variáveis

| Variável | Para que serve |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Base da API. Precisa ser alcançável pelo **navegador**, por isso o prefixo `NEXT_PUBLIC_` |

Não há segredo aqui: o cliente autentica com JWT obtido no login e guardado no
navegador. Qualquer credencial de banco vive apenas na API.

## Telas

| Rota | Tela |
| --- | --- |
| `/login` | Entrada |
| `/` | Dashboard — membros ativos, presença média, alertas, gráfico de assiduidade |
| `/meetings` | Cultos, com filtro por tipo e período |
| `/meetings/[id]/attendance` | Chamada — contador ao vivo, busca, cadastro sem sair da tela |
| `/members` | Membros, com assiduidade e alertas |
| `/visitors` | Visitantes e conversão em membro |
| `/metrics` | Assiduidade, ranking de frequência e alertas de ausência |
| `/settings/*` | Configurações, em seções |
| `/setup` | Primeiro acesso: cria a congregação inicial e os acessos |

## Convenções

**Contrato antes do código.** Os tipos em `src/types/api.ts` espelham
`docs/api-contract.md` do repositório da API. Mudou um endpoint? Mude o contrato
primeiro, depois os dois lados. A divergência aparece como erro de tipo em vez de
surpresa em runtime.

**Nenhuma cor é escrita à mão.** O tema tem modo escuro ativo e todas as cores
saem de tokens (`bg-card`, `text-muted-foreground`, `var(--chart-1)`). Um
`bg-white` perdido num componente é bug, não estilo. A exceção são as cores dos
tipos de culto, que são **dado** vindo da API e aplicadas inline.

**Componentes compartilhados em vez de repetição.** `DataTable` concentra os
estados de carregando, erro, vazio, paginação e ordenação — cada tela descreve
*o que* mostra, não *como*. O mesmo vale para `DatePicker`, `ConfirmDialog`,
`EmptyState` e `ErrorState`.

**Português na tela, inglês no código.** A tradução dos enums vive só em
`src/lib/labels.ts`.

## Scripts

| Comando | O que faz |
| --- | --- |
| `pnpm dev` | Servidor de desenvolvimento em :3000 |
| `pnpm build` / `pnpm start` | Build e execução de produção |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint |

## Branches

| Branch | Ambiente |
| --- | --- |
| `main` | Produção |
| `hml` | Homologação |
| `dev` | Desenvolvimento |
