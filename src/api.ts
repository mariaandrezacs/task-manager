import type { Task, TaskInput, TaskStatus } from './types';

const BASE = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Erro ${res.status} na API`);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export const api = {
  list: () => request<Task[]>('/tasks'),

  create: (input: TaskInput) =>
    request<Task>('/tasks', { method: 'POST', body: JSON.stringify(input) }),

  update: (task: TaskInput & { id: string }) =>
    request<Task>(`/tasks/${task.id}`, {
      method: 'PATCH',
      body: JSON.stringify(task),
    }),

  move: (id: string, status: TaskStatus, beforeId?: string) =>
    request<Task>(`/tasks/${id}/move`, {
      method: 'POST',
      body: JSON.stringify({ status, beforeId }),
    }),

  remove: (id: string) => request<void>(`/tasks/${id}`, { method: 'DELETE' }),
};
