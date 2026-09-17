import pg from 'pg';
import type { Task } from './types.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ??
    'postgres://tasks:tasks@localhost:5432/tasks',
});

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','doing','done')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
    tags TEXT[] NOT NULL DEFAULT '{}',
    position DOUBLE PRECISION NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
`;

interface TaskRow {
  id: string;
  title: string;
  description: string;
  status: Task['status'];
  priority: Task['priority'];
  tags: string[];
  position: number;
  created_at: Date;
  updated_at: Date;
}

export function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    tags: row.tags,
    position: row.position,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

export async function initDb(): Promise<void> {
  await pool.query(SCHEMA);

  const { rows } = await pool.query<{ count: string }>(
    'SELECT count(*) AS count FROM tasks',
  );
  if (Number(rows[0].count) === 0) {
    await pool.query(
      `INSERT INTO tasks (title, description, status, priority, tags, position)
       VALUES
        ('Explorar o Task Manager', 'Arraste este card entre as colunas.', 'todo', 'medium', '{demo}', 1024),
        ('Testar filtros e busca', 'Use a barra de filtros acima do board.', 'doing', 'high', '{demo,ui}', 1024)`,
    );
  }
}
