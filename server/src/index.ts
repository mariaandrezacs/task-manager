import cors from 'cors';
import express from 'express';
import { initDb, pool, rowToTask } from './db.js';
import { PRIORITIES, STATUSES } from './types.js';
import type { MoveInput, TaskInput, TaskPriority, TaskStatus } from './types.js';

const app = express();
app.use(cors());
app.use(express.json());

const POSITION_GAP = 1024;

function isStatus(v: unknown): v is TaskStatus {
  return typeof v === 'string' && STATUSES.includes(v as TaskStatus);
}

function isPriority(v: unknown): v is TaskPriority {
  return typeof v === 'string' && PRIORITIES.includes(v as TaskPriority);
}

function parseTaskInput(body: unknown): TaskInput | null {
  if (typeof body !== 'object' || body === null) return null;
  const b = body as Record<string, unknown>;
  if (typeof b.title !== 'string' || !b.title.trim()) return null;
  if (!isStatus(b.status) || !isPriority(b.priority)) return null;
  if (!Array.isArray(b.tags) || !b.tags.every((t) => typeof t === 'string'))
    return null;
  return {
    title: b.title.trim(),
    description: typeof b.description === 'string' ? b.description : '',
    status: b.status,
    priority: b.priority,
    tags: b.tags,
  };
}

app.get('/api/tasks', async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM tasks ORDER BY position ASC');
  res.json(rows.map(rowToTask));
});

app.post('/api/tasks', async (req, res) => {
  const input = parseTaskInput(req.body);
  if (!input) {
    res.status(400).json({ error: 'payload inválido' });
    return;
  }
  const { rows } = await pool.query(
    `INSERT INTO tasks (title, description, status, priority, tags, position)
     VALUES ($1, $2, $3, $4, $5,
       COALESCE((SELECT max(position) FROM tasks WHERE status = $3), 0) + $6)
     RETURNING *`,
    [
      input.title,
      input.description,
      input.status,
      input.priority,
      input.tags,
      POSITION_GAP,
    ],
  );
  res.status(201).json(rowToTask(rows[0]));
});

app.patch('/api/tasks/:id', async (req, res) => {
  const input = parseTaskInput(req.body);
  if (!input) {
    res.status(400).json({ error: 'payload inválido' });
    return;
  }
  const { rows } = await pool.query(
    `UPDATE tasks
       SET title = $2, description = $3, status = $4, priority = $5,
           tags = $6, updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [
      req.params.id,
      input.title,
      input.description,
      input.status,
      input.priority,
      input.tags,
    ],
  );
  if (!rows.length) {
    res.status(404).json({ error: 'tarefa não encontrada' });
    return;
  }
  res.json(rowToTask(rows[0]));
});

app.post('/api/tasks/:id/move', async (req, res) => {
  const body = req.body as Partial<MoveInput>;
  if (!isStatus(body.status)) {
    res.status(400).json({ error: 'status inválido' });
    return;
  }

  // Posições ordenadas da coluna de destino, excluindo a tarefa movida.
  const { rows: siblings } = await pool.query<{ id: string; position: number }>(
    'SELECT id, position FROM tasks WHERE status = $1 AND id <> $2 ORDER BY position ASC',
    [body.status, req.params.id],
  );

  let position: number;
  const beforeIdx = body.beforeId
    ? siblings.findIndex((r) => r.id === body.beforeId)
    : -1;
  if (beforeIdx >= 0) {
    position =
      beforeIdx === 0
        ? siblings[0].position - POSITION_GAP
        : (siblings[beforeIdx - 1].position + siblings[beforeIdx].position) / 2;
  } else {
    position = siblings.length
      ? siblings[siblings.length - 1].position + POSITION_GAP
      : POSITION_GAP;
  }

  const { rows } = await pool.query(
    `UPDATE tasks SET status = $2, position = $3, updated_at = now()
     WHERE id = $1 RETURNING *`,
    [req.params.id, body.status, position],
  );
  if (!rows.length) {
    res.status(404).json({ error: 'tarefa não encontrada' });
    return;
  }
  res.json(rowToTask(rows[0]));
});

app.delete('/api/tasks/:id', async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM tasks WHERE id = $1', [
    req.params.id,
  ]);
  if (!rowCount) {
    res.status(404).json({ error: 'tarefa não encontrada' });
    return;
  }
  res.status(204).end();
});

const port = Number(process.env.PORT ?? 3001);

initDb()
  .then(() => {
    app.listen(port, () => console.log(`API ouvindo em http://localhost:${port}`));
  })
  .catch((err) => {
    console.error('Falha ao conectar no banco:', err);
    process.exit(1);
  });
