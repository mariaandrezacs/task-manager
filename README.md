# Task Manager

Um gerenciador de tarefas estilo Kanban, mais completo que um CRUD básico — **React + TypeScript + Vite** no frontend, **Express + Postgres** no backend, tudo orquestrado com **Docker Compose**.

## Funcionalidades

- **CRUD completo** de tarefas (criar, editar e excluir via modal)
- **Board Kanban** com 3 colunas de status: `todo`, `doing`, `done`
- **Prioridade**: `low`, `medium`, `high` (com badges coloridas)
- **Tags** com input de chips (Enter ou vírgula para adicionar)
- **Filtros e busca**: por texto, status, prioridade e tag — combináveis e removíveis individualmente
- **Drag & drop**: arraste cards entre colunas ou sobre outro card para reordenar (posição fracionária persistida no banco)
- **Persistência** em Postgres via API REST (tema dark/light fica em `localStorage`)
- **Dark/light mode** com detecção de `prefers-color-scheme`

## Rodando o projeto

### Backend (Docker)

```bash
docker compose up -d --build   # sobe Postgres + API em http://localhost:3001
docker compose logs -f api     # acompanhar logs
docker compose down            # parar (dados persistem no volume pgdata)
docker compose down -v         # parar e apagar o volume do banco
```

### Frontend

```bash
npm install
npm run dev      # http://localhost:5173 (proxy /api → localhost:3001)
npm run build    # typecheck (tsc -b) + build de produção
```

### API local sem Docker (opcional)

Com o Postgres do compose no ar:

```bash
cd server
npm install
npm run dev      # tsx watch em http://localhost:3001
```

`DATABASE_URL` tem fallback para `postgres://tasks:tasks@localhost:5432/tasks`.

## Endpoints da API

| Método | Rota                    | Descrição                          |
| ------ | ----------------------- | ---------------------------------- |
| GET    | `/api/tasks`            | Lista tarefas ordenadas por posição |
| POST   | `/api/tasks`            | Cria tarefa (valida payload)       |
| PATCH  | `/api/tasks/:id`        | Atualiza campos da tarefa          |
| POST   | `/api/tasks/:id/move`   | Move/reordena `{status, beforeId?}` |
| DELETE | `/api/tasks/:id`        | Remove tarefa                      |

## Estrutura

```
├── docker-compose.yml       # Postgres 16 + API
├── server/                  # API Express + pg
│   ├── Dockerfile           # build multi-stage (tsc → node dist)
│   └── src/
│       ├── index.ts         # rotas REST
│       ├── db.ts            # pool, schema (CREATE TABLE IF NOT EXISTS), seed
│       └── types.ts         # Task, TaskStatus, TaskPriority
└── src/                     # frontend React
    ├── types.ts             # Task, TaskFilter (união discriminada)
    ├── api.ts               # cliente fetch tipado
    ├── context/AppContext.tsx  # estado global: reducer + API + tema
    ├── components/
    │   ├── TaskForm.tsx     # modal de criar/editar
    │   ├── TaskCard.tsx     # card arrastável
    │   ├── TaskColumn.tsx   # coluna Kanban (drop zone)
    │   ├── FilterBar.tsx    # busca + filtros
    │   └── TagInput.tsx     # input de tags em chips
    ├── App.tsx
    ├── main.tsx
    └── styles.css           # variáveis CSS para dark/light
```

## Conceitos praticados

- React Hooks (`useState`, `useEffect`, `useReducer`, `useMemo`, `useCallback`, `useContext`)
- Interfaces e types do TypeScript (frontend e backend)
- Componentização e props
- Formulários controlados
- Estado global via Context API com ações assíncronas
- Eventos (drag & drop nativo do HTML5, teclado, formulário)
- API REST com Express, queries parametrizadas com `pg`
- Postgres em Docker com healthcheck e volume persistente
- Reordenação por posição fracionária (gaps de 1024, midpoint ao inserir)

## Desafio extra: filtros com tipos discriminados

Os filtros usam uma **união discriminada** — cada variante carrega só os dados de que precisa, e o campo `kind` é o discriminante:

```ts
type TaskFilter =
  | { kind: 'search'; query: string }
  | { kind: 'status'; status: TaskStatus }
  | { kind: 'priority'; priority: TaskPriority }
  | { kind: 'tag'; tag: string };
```

O `switch` em `matchesFilter` é **exaustivo em tempo de compilação**: o `never` no `default` quebra o build se uma nova variante for adicionada sem tratamento. Veja `src/types.ts`.
