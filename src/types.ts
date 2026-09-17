export type TaskStatus = 'todo' | 'doing' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  tags: string[];
  position: number;
  createdAt: number;
  updatedAt: number;
}

/** Payload de criação/edição — id, posição e timestamps são do servidor. */
export type TaskInput = Omit<Task, 'id' | 'position' | 'createdAt' | 'updatedAt'>;

export const STATUSES: TaskStatus[] = ['todo', 'doing', 'done'];
export const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  doing: 'Doing',
  done: 'Done',
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
};

// ---------------------------------------------------------------------------
// Desafio extra: sistema de filtros com união discriminada.
// Cada variante carrega apenas os dados que precisa — `kind` é o discriminante
// e o switch em `matchesFilter`/`describeFilter` é exaustivo em tempo de
// compilação (o `never` abaixo quebra o build se uma variante nova for
// adicionada sem tratamento).
// ---------------------------------------------------------------------------
export type TaskFilter =
  | { kind: 'search'; query: string }
  | { kind: 'status'; status: TaskStatus }
  | { kind: 'priority'; priority: TaskPriority }
  | { kind: 'tag'; tag: string };

export function matchesFilter(task: Task, filter: TaskFilter): boolean {
  switch (filter.kind) {
    case 'search': {
      const q = filter.query.trim().toLowerCase();
      if (!q) return true;
      return (
        task.title.toLowerCase().includes(q) ||
        task.description.toLowerCase().includes(q) ||
        task.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    case 'status':
      return task.status === filter.status;
    case 'priority':
      return task.priority === filter.priority;
    case 'tag':
      return task.tags.includes(filter.tag);
    default: {
      const _exhaustive: never = filter;
      return _exhaustive;
    }
  }
}

export function describeFilter(filter: TaskFilter): string {
  switch (filter.kind) {
    case 'search':
      return `busca: "${filter.query}"`;
    case 'status':
      return `status: ${STATUS_LABELS[filter.status]}`;
    case 'priority':
      return `prioridade: ${PRIORITY_LABELS[filter.priority]}`;
    case 'tag':
      return `tag: ${filter.tag}`;
    default: {
      const _exhaustive: never = filter;
      return _exhaustive;
    }
  }
}

export function applyFilters(tasks: Task[], filters: TaskFilter[]): Task[] {
  return tasks.filter((t) => filters.every((f) => matchesFilter(t, f)));
}
